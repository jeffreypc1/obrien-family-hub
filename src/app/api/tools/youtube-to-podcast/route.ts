import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { prisma } from '@/lib/db';

const REPO_PATH = path.join(os.homedir(), 'Desktop/obrien-private-podcast');
const AUDIO_PATH = path.join(REPO_PATH, 'audio');
const RSS_PATH = path.join(REPO_PATH, 'rss.xml');

function extractVideoId(url: string): string {
  const match = url.match(/(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})/);
  if (!match) throw new Error('Invalid YouTube URL');
  return match[1];
}

async function fetchYoutubeInfo(url: string): Promise<{ title: string; channel: string }> {
  const params = new URLSearchParams({ format: 'json', url });
  const res = await fetch(`https://www.youtube.com/oembed?${params}`);
  const data = await res.json();
  return {
    title: data.title || 'YouTube Video',
    channel: data.author_name || 'Unknown Channel',
  };
}

async function getTranscript(videoId: string): Promise<string> {
  // Use yt-dlp to get auto-captions as a fallback-friendly method
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yt-transcript-'));
  try {
    execSync(
      `yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format vtt -o "${tmpDir}/sub" "${videoId}"`,
      { timeout: 30000, stdio: 'pipe' }
    );
    // Find the VTT file
    const files = fs.readdirSync(tmpDir).filter(f => f.endsWith('.vtt'));
    if (files.length === 0) {
      // Fallback: try youtube-transcript via a small python script
      const result = execSync(
        `python3 -c "from youtube_transcript_api import YouTubeTranscriptApi; api = YouTubeTranscriptApi(); t = api.fetch('${videoId}').to_raw_data(); print(' '.join([s['text'] for s in t]))"`,
        { timeout: 30000, encoding: 'utf-8' }
      );
      return result.trim();
    }
    const vttContent = fs.readFileSync(path.join(tmpDir, files[0]), 'utf-8');
    // Parse VTT: strip timestamps, deduplicate lines
    const lines = vttContent.split('\n')
      .filter(l => !l.match(/^(WEBVTT|Kind:|Language:|NOTE|\d{2}:\d{2})/))
      .filter(l => !l.match(/^$/))
      .map(l => l.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const unique = lines.filter(l => { if (seen.has(l)) return false; seen.add(l); return true; });
    return unique.join(' ');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function generateSummary(transcript: string, durationSeconds: number): Promise<string> {
  const wordsPerSecond = 2.5;
  const targetWords = Math.round(durationSeconds * wordsPerSecond);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional podcast briefing writer.' },
        { role: 'user', content: `Create a spoken-style audio briefing summarizing this content in approximately ${targetWords} words (about ${durationSeconds} seconds when read aloud).

Speak in a confident, informative, engaging podcast tone. Structure it clearly with the key points. Do NOT include any stage directions, headers, or markdown — just the spoken text.

Transcript:
${transcript.slice(0, 12000)}` },
      ],
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Summary generation failed.';
}

async function textToSpeech(text: string, outputFile: string): Promise<void> {
  // Use OpenAI TTS (same as ai_briefing.py)
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: 'alloy',
      input: text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS failed (${res.status}): ${err}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputFile, buffer);
}

function downloadOriginalAudio(url: string, outputFile: string): void {
  const base = outputFile.replace('.m4a', '');
  try {
    execSync(
      `yt-dlp -f "bestaudio[ext=m4a]/bestaudio" --extract-audio --audio-format m4a -o "${base}.%(ext)s" "${url}"`,
      { timeout: 300000, stdio: 'pipe' }
    );
  } catch {
    // Fallback: try without format filter
    execSync(
      `yt-dlp --extract-audio --audio-format m4a -o "${base}.%(ext)s" "${url}"`,
      { timeout: 300000, stdio: 'pipe' }
    );
  }
  // yt-dlp adds extension — find the file
  if (!fs.existsSync(outputFile)) {
    const dir = path.dirname(outputFile);
    const baseName = path.basename(base);
    const files = fs.readdirSync(dir).filter(f => f.startsWith(baseName));
    if (files.length > 0) {
      fs.renameSync(path.join(dir, files[0]), outputFile);
    }
  }
}

function stitchAudio(summaryFile: string, originalFile: string, finalFile: string): void {
  execSync(
    `ffmpeg -y -i "${summaryFile}" -i "${originalFile}" -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1[out]" -map "[out]" -c:a aac -b:a 192k "${finalFile}"`,
    { timeout: 300000, stdio: 'pipe' }
  );
}

function cleanFilename(text: string): string {
  return text.replace(/[\\/*?:"<>|]/g, '').replace(/\s+/g, '_').slice(0, 60);
}

async function downloadThumbnail(videoId: string): Promise<string> {
  // Try maxresdefault, then hqdefault
  const thumbDir = path.join(REPO_PATH, 'thumbs');
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });
  const filename = `${videoId}.jpg`;
  const thumbPath = path.join(thumbDir, filename);

  for (const quality of ['maxresdefault', 'hqdefault', 'mqdefault']) {
    try {
      const imgUrl = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
      const res = await fetch(imgUrl);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        // maxresdefault returns a tiny placeholder if not available
        if (buffer.length > 5000) {
          fs.writeFileSync(thumbPath, buffer);
          return `https://obrien-private-podcast.onrender.com/thumbs/${filename}`;
        }
      }
    } catch { /* try next quality */ }
  }
  // Fallback: no thumbnail
  return '';
}

function updateRss(title: string, filename: string, description: string, thumbnailUrl: string): void {
  const pubDate = new Date().toUTCString();
  const fileUrl = `https://obrien-private-podcast.onrender.com/audio/${encodeURIComponent(filename)}`;

  const thumbTag = thumbnailUrl ? `\n      <itunes:image href="${thumbnailUrl}"/>` : '';
  const newItem = `
    <item>
      <title>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>
      <description>${description.replace(/&/g, '&amp;').replace(/</g, '&lt;').slice(0, 4000)}</description>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${fileUrl}" type="audio/mp4" length="10000000"/>
      <guid>${fileUrl}</guid>${thumbTag}
    </item>
`;

  let rss = fs.readFileSync(RSS_PATH, 'utf-8');
  rss = rss.replace('</channel>', newItem + '\n</channel>');
  fs.writeFileSync(RSS_PATH, rss);
}

function gitPush(): void {
  execSync(`git -C "${REPO_PATH}" add .`, { stdio: 'pipe' });
  execSync(`git -C "${REPO_PATH}" commit -m "Add new AI briefing"`, { stdio: 'pipe' });
  execSync(`git -C "${REPO_PATH}" push`, { timeout: 60000, stdio: 'pipe' });
}

// GET: check status / health
export async function GET() {
  const hasRepo = fs.existsSync(REPO_PATH);
  const hasRss = fs.existsSync(RSS_PATH);
  return NextResponse.json({ ready: hasRepo && hasRss, repoPath: REPO_PATH });
}

// POST: process a YouTube video
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url, summarySeconds = 60, emailTo } = body;

  if (!url) return NextResponse.json({ error: 'Missing URL' }, { status: 400 });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yt-podcast-'));

  try {
    // Step 1: Get video info
    const videoId = extractVideoId(url);
    const { title: rawTitle, channel } = await fetchYoutubeInfo(url);
    const shortTitle = rawTitle.split('|')[0].trim().slice(0, 50);
    const episodeTitle = `AI Briefing: ${shortTitle} [${channel}]`;

    // Step 2: Get transcript
    const transcript = await getTranscript(videoId);
    if (!transcript || transcript.length < 50) {
      return NextResponse.json({ error: 'Could not extract transcript from this video' }, { status: 400 });
    }

    // Step 3: Generate AI summary
    const summaryText = await generateSummary(transcript, summarySeconds);

    // Step 4: Convert summary to speech
    const summaryFile = path.join(tmpDir, 'summary.mp3');
    await textToSpeech(summaryText, summaryFile);

    // Step 5: Download original audio
    const originalFile = path.join(tmpDir, 'original.m4a');
    downloadOriginalAudio(url, originalFile);

    // Step 6: Stitch audio
    const tempFinal = path.join(tmpDir, 'final.m4a');
    stitchAudio(summaryFile, originalFile, tempFinal);

    // Step 7: Move to podcast repo
    const cleanTitle = cleanFilename(shortTitle + '_' + videoId);
    const finalFilename = `${cleanTitle}.m4a`;
    const finalPath = path.join(AUDIO_PATH, finalFilename);
    fs.copyFileSync(tempFinal, finalPath);

    // Step 8: Download thumbnail
    const thumbnailUrl = await downloadThumbnail(videoId);

    // Step 9: Update RSS + push
    updateRss(episodeTitle, finalFilename, `AI Summary (by ${channel}):\n${summaryText}`, thumbnailUrl);
    gitPush();

    // Step 10: Save episode to database
    await prisma.podcastEpisode.create({
      data: {
        title: episodeTitle,
        videoId,
        videoUrl: url,
        channel,
        summary: summaryText,
        transcript: transcript.slice(0, 30000),
        filename: finalFilename,
        thumbnailUrl: thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        durationSec: summarySeconds,
      },
    });

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });

    return NextResponse.json({
      success: true,
      title: episodeTitle,
      channel,
      summary: summaryText,
      transcript: transcript.slice(0, 2000) + (transcript.length > 2000 ? '...' : ''),
      filename: finalFilename,
      thumbnailUrl: thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      emailTo: emailTo || null,
    });
  } catch (error: unknown) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
