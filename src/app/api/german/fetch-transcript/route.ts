import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { YoutubeTranscript } from 'youtube-transcript';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Translate text using Google Translate API
async function translateToEnglish(texts: string[]): Promise<string[]> {
  if (!GOOGLE_API_KEY) {
    return texts.map(() => '[Translation unavailable - no API key]');
  }

  // Batch translate in chunks of 50 to stay under API limits
  const results: string[] = [];
  const chunkSize = 50;

  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);
    const params = new URLSearchParams({
      key: GOOGLE_API_KEY,
      target: 'en',
      source: 'de',
      format: 'text',
    });
    chunk.forEach((t) => params.append('q', t));

    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?${params}`,
      { method: 'POST' }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('Translate API error:', err);
      results.push(...chunk.map(() => '[Translation error]'));
      continue;
    }

    const data = await res.json();
    const translations = data.data?.translations || [];
    results.push(...translations.map((t: { translatedText: string }) => t.translatedText));
  }

  return results;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { videoId } = body;

  if (!videoId) {
    return NextResponse.json({ error: 'videoId required' }, { status: 400 });
  }

  // Get the video from DB
  const video = await prisma.germanVideo.findUnique({ where: { id: videoId } });
  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  try {
    // Fetch transcript from YouTube (tries German first, falls back to auto-generated)
    let transcriptItems;
    try {
      transcriptItems = await YoutubeTranscript.fetchTranscript(video.youtubeId, { lang: 'de' });
    } catch {
      // Fallback: try without language specification (gets whatever is available)
      try {
        transcriptItems = await YoutubeTranscript.fetchTranscript(video.youtubeId);
      } catch (e2) {
        return NextResponse.json(
          { error: `No captions available for this video: ${e2 instanceof Error ? e2.message : 'Unknown error'}` },
          { status: 404 }
        );
      }
    }

    if (!transcriptItems || transcriptItems.length === 0) {
      return NextResponse.json({ error: 'No transcript content found' }, { status: 404 });
    }

    // Clean up transcript text (remove HTML tags, decode entities)
    const cleanText = (text: string) => {
      return text
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n/g, ' ')
        .trim();
    };

    // Merge very short segments (under 1 second) with the next one for readability
    interface MergedSegment {
      text: string;
      offset: number;
      duration: number;
    }
    const merged: MergedSegment[] = [];
    for (const item of transcriptItems) {
      const text = cleanText(item.text);
      if (!text) continue;

      const last = merged[merged.length - 1];
      if (last && (item.duration < 1 || text.length < 5) && last.text.length < 100) {
        last.text += ' ' + text;
        last.duration = (item.offset - last.offset) / 1000 + item.duration / 1000;
      } else {
        merged.push({
          text,
          offset: item.offset / 1000, // Convert ms to seconds
          duration: item.duration / 1000,
        });
      }
    }

    // Translate all German text to English
    const germanTexts = merged.map((s) => s.text);
    const englishTexts = await translateToEnglish(germanTexts);

    // Delete existing segments for this video
    await prisma.videoSegment.deleteMany({ where: { videoId } });

    // Insert new segments
    for (let i = 0; i < merged.length; i++) {
      const seg = merged[i];
      await prisma.videoSegment.create({
        data: {
          id: `${videoId}-seg-${i}`,
          videoId,
          startTime: seg.offset,
          endTime: seg.offset + seg.duration,
          germanText: seg.text,
          englishText: englishTexts[i] || seg.text,
          sortOrder: i,
        },
      });
    }

    return NextResponse.json({
      success: true,
      segmentCount: merged.length,
      message: `Fetched ${merged.length} transcript segments with translations`,
    });
  } catch (error) {
    console.error('Fetch transcript error:', error);
    return NextResponse.json(
      { error: `Failed to fetch transcript: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
