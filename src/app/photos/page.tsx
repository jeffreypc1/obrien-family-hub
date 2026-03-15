'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useFamilyMember } from '@/components/FamilyContext';
import ThemedBackground from '@/components/ThemedBackground';

interface PhotoComment { id: string; authorName: string; authorEmoji: string | null; text: string; createdAt: string; }
interface Photo { id: string; imageUrl: string; caption: string | null; uploadedBy: string; albumId: string | null; dateTaken: string | null; location: string | null; camera: string | null; reactionsJson: string | null; comments: PhotoComment[]; createdAt: string; }
interface Album { id: string; title: string; description: string | null; coverUrl: string | null; photoCount: number; createdBy: string | null; }

const REACTION_EMOJIS = ['❤️', '🔥', '😍', '😂', '👏', '🤩', '💯', '🙌'];

export default function PhotosPage() {
  const { currentMember, setShowPicker } = useFamilyMember();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tab, setTab] = useState<'feed' | 'albums' | 'memories'>('feed');
  const [showUpload, setShowUpload] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [showAlbumCreate, setShowAlbumCreate] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [uploadLocation, setUploadLocation] = useState('');
  const [uploadAlbum, setUploadAlbum] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchPhotos = () => fetch('/api/photos').then((r) => r.json()).then(setPhotos);
  const fetchAlbums = () => fetch('/api/photo-albums').then((r) => r.json()).then(setAlbums);

  useEffect(() => { fetchPhotos(); fetchAlbums(); }, []);

  const handleUpload = async () => {
    if (!currentMember || !uploadUrl.trim()) return;
    setUploading(true);
    await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: uploadUrl.trim(), caption: uploadCaption.trim() || null,
        uploadedBy: currentMember.name, dateTaken: uploadDate || null,
        location: uploadLocation.trim() || null, albumId: uploadAlbum || null,
      }),
    });
    setUploadUrl(''); setUploadCaption(''); setUploadDate(''); setUploadLocation(''); setUploadAlbum('');
    setShowUpload(false); setUploading(false);
    fetchPhotos();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentMember) return;

    // Convert to base64 data URL (works for small-medium photos)
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;

      // Try to read EXIF date from filename or use today
      const dateMatch = file.name.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/);
      const dateTaken = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : new Date().toISOString().split('T')[0];

      await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: dataUrl, uploadedBy: currentMember.name,
          dateTaken, albumId: uploadAlbum || null,
        }),
      });
      fetchPhotos();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleReact = async (photoId: string, emoji: string) => {
    if (!currentMember) { setShowPicker(true); return; }
    await fetch('/api/photos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: photoId, action: 'react', userName: currentMember.name, emoji }),
    });
    fetchPhotos();
    if (lightboxPhoto?.id === photoId) {
      const updated = await fetch('/api/photos').then((r) => r.json());
      setLightboxPhoto(updated.find((p: Photo) => p.id === photoId) || null);
    }
  };

  const handleComment = async (photoId: string) => {
    if (!currentMember || !commentText.trim()) return;
    await fetch('/api/photo-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId, authorName: currentMember.name, authorEmoji: currentMember.emoji, text: commentText.trim() }),
    });
    setCommentText('');
    fetchPhotos();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/photos?id=${id}`, { method: 'DELETE' });
    setLightboxPhoto(null);
    fetchPhotos();
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) return;
    await fetch('/api/photo-albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newAlbumTitle.trim(), createdBy: currentMember?.name }),
    });
    setNewAlbumTitle(''); setShowAlbumCreate(false);
    fetchAlbums();
  };

  // Group photos by date
  const photosByDate: Record<string, Photo[]> = {};
  photos.forEach((p) => {
    const date = p.dateTaken || p.createdAt.split('T')[0];
    if (!photosByDate[date]) photosByDate[date] = [];
    photosByDate[date].push(p);
  });
  const sortedDates = Object.keys(photosByDate).sort((a, b) => b.localeCompare(a));

  // "On This Day" — photos from same month-day in other years
  const today = new Date();
  const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const thisYear = String(today.getFullYear());
  const onThisDay = photos.filter((p) => {
    const d = p.dateTaken || p.createdAt.split('T')[0];
    return d.slice(5) === todayMD && !d.startsWith(thisYear);
  });

  const getReactions = (p: Photo): Record<string, string[]> => {
    try { return p.reactionsJson ? JSON.parse(p.reactionsJson) : {}; } catch { return {}; }
  };

  const openLightbox = (photo: Photo) => {
    setLightboxPhoto(photo);
    setLightboxIndex(photos.findIndex((p) => p.id === photo.id));
  };

  const navigateLightbox = (dir: number) => {
    const newIdx = Math.max(0, Math.min(photos.length - 1, lightboxIndex + dir));
    setLightboxIndex(newIdx);
    setLightboxPhoto(photos[newIdx]);
  };

  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen relative">
      <ThemedBackground theme="photos" />

      <div className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Back to Hub</Link>
          <span className="text-white/30 text-sm">{currentMember?.emoji} {currentMember?.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">📸 Family Photos</h1>
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium text-sm hover:scale-105 transition-transform shadow-lg shadow-rose-500/20">
              📸 Upload Photo
            </button>
            <button onClick={() => setShowUpload(!showUpload)}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white text-sm transition-all">
              🔗 Paste URL
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8 max-w-lg">
          {([
            { key: 'feed' as const, label: '📷 Timeline', count: photos.length },
            { key: 'albums' as const, label: '📁 Albums', count: albums.length },
            { key: 'memories' as const, label: '💫 On This Day', count: onThisDay.length },
          ]).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? 'bg-white/10 text-white' : 'text-white/40'}`}>
              {t.label} {t.count > 0 && `(${t.count})`}
            </button>
          ))}
        </div>

        {/* URL upload form */}
        <AnimatePresence>
          {showUpload && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass rounded-2xl p-6 mb-8 space-y-4">
              <h3 className="text-sm font-medium text-white/60">Add photo by URL</h3>
              <input type="text" value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)}
                placeholder="Image URL..." autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-rose-500 text-sm" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Caption..."
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm" />
                <input type="date" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm [color-scheme:dark]" />
                <input type="text" value={uploadLocation} onChange={(e) => setUploadLocation(e.target.value)}
                  placeholder="Location..."
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm" />
              </div>
              {albums.length > 0 && (
                <select value={uploadAlbum} onChange={(e) => setUploadAlbum(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm [&>option]:bg-gray-900">
                  <option value="">No album</option>
                  {albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              )}
              <div className="flex gap-2">
                <button onClick={handleUpload} disabled={uploading || !uploadUrl.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium text-sm disabled:opacity-30">
                  {uploading ? 'Uploading...' : 'Add Photo'}
                </button>
                <button onClick={() => setShowUpload(false)} className="px-4 py-2.5 rounded-xl bg-white/5 text-white/40 text-sm">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ====== TIMELINE FEED ====== */}
        {tab === 'feed' && (
          sortedDates.length === 0 ? (
            <div className="text-center py-20 text-white/20">
              <div className="text-5xl mb-4">📸</div>
              <p>No photos yet. Upload your first one!</p>
            </div>
          ) : (
            <div className="space-y-10">
              {sortedDates.map((date) => (
                <div key={date}>
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-white/5" />
                    <h3 className="text-sm font-medium text-white/40 whitespace-nowrap">{formatDate(date)}</h3>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  {/* Photo grid for this date */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {photosByDate[date].map((photo, i) => {
                      const reactions = getReactions(photo);
                      const totalReactions = Object.values(reactions).reduce((s, arr) => s + arr.length, 0);

                      return (
                        <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="group relative cursor-pointer"
                          onClick={() => openLightbox(photo)}>
                          <div className="aspect-square rounded-xl overflow-hidden bg-white/5">
                            <img src={photo.imageUrl} alt={photo.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            {photo.caption && <p className="text-white text-xs font-medium line-clamp-2">{photo.caption}</p>}
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-white/50 text-[10px]">{photo.uploadedBy}</span>
                              <div className="flex gap-1">
                                {totalReactions > 0 && <span className="text-[10px] text-white/50">{Object.keys(reactions).join('')} {totalReactions}</span>}
                                {photo.comments.length > 0 && <span className="text-[10px] text-white/50">💬{photo.comments.length}</span>}
                              </div>
                            </div>
                          </div>
                          {/* Location badge */}
                          {photo.location && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/50 text-[9px] text-white/60 backdrop-blur-sm">
                              📍 {photo.location}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ====== ALBUMS ====== */}
        {tab === 'albums' && (
          <div>
            <div className="flex justify-end mb-6">
              {!showAlbumCreate ? (
                <button onClick={() => setShowAlbumCreate(true)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white text-sm transition-all">
                  + Create Album
                </button>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={newAlbumTitle} onChange={(e) => setNewAlbumTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateAlbum()}
                    placeholder="Album name..." autoFocus
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-white/25" />
                  <button onClick={handleCreateAlbum} className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 text-sm">Create</button>
                  <button onClick={() => setShowAlbumCreate(false)} className="text-white/30 text-sm">✕</button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {albums.map((album) => (
                <div key={album.id} className="glass rounded-2xl overflow-hidden group cursor-pointer hover:border-white/15 transition-all">
                  <div className="aspect-video bg-gradient-to-br from-rose-950/50 to-pink-950/50 overflow-hidden">
                    {album.coverUrl ? (
                      <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📁</div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm">{album.title}</h3>
                    <p className="text-white/30 text-[10px]">{album.photoCount} photos{album.createdBy ? ` · by ${album.createdBy}` : ''}</p>
                  </div>
                </div>
              ))}
              {albums.length === 0 && (
                <div className="col-span-full text-center py-16 text-white/20">
                  <div className="text-4xl mb-3">📁</div>
                  <p>No albums yet. Create one to organize your photos!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====== ON THIS DAY ====== */}
        {tab === 'memories' && (
          <div>
            <div className="text-center mb-8">
              <div className="text-4xl mb-2">💫</div>
              <h2 className="text-xl font-bold">On This Day</h2>
              <p className="text-white/30 text-sm">{today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} in previous years</p>
            </div>
            {onThisDay.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {onThisDay.map((photo) => (
                  <div key={photo.id} className="cursor-pointer group" onClick={() => openLightbox(photo)}>
                    <div className="aspect-square rounded-xl overflow-hidden bg-white/5">
                      <img src={photo.imageUrl} alt={photo.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <p className="text-white/30 text-xs mt-2 text-center">
                      {new Date((photo.dateTaken || photo.createdAt) + 'T00:00:00').getFullYear()} · {photo.uploadedBy}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-white/20">
                <p>No memories from this day yet.</p>
                <p className="text-xs mt-1">Upload photos with dates to build your memory collection!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ====== LIGHTBOX ====== */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex" onClick={() => setLightboxPhoto(null)}>

            {/* Photo */}
            <div className="flex-1 flex items-center justify-center p-4 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => navigateLightbox(-1)} className="absolute left-4 text-white/30 hover:text-white text-3xl z-10">←</button>
              <img src={lightboxPhoto.imageUrl} alt="" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
              <button onClick={() => navigateLightbox(1)} className="absolute right-4 text-white/30 hover:text-white text-3xl z-10">→</button>
            </div>

            {/* Sidebar */}
            <div className="w-80 bg-black/50 border-l border-white/5 flex flex-col overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-sm">Details</h3>
                <button onClick={() => setLightboxPhoto(null)} className="text-white/30 hover:text-white">✕</button>
              </div>

              <div className="p-5 space-y-4 flex-1">
                {/* Caption */}
                {lightboxPhoto.caption && <p className="text-sm text-white/70">{lightboxPhoto.caption}</p>}

                {/* Meta */}
                <div className="space-y-2 text-xs text-white/30">
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-center">👤</span>
                    <span>Uploaded by <strong className="text-white/50">{lightboxPhoto.uploadedBy}</strong></span>
                  </div>
                  {lightboxPhoto.dateTaken && (
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-center">📅</span>
                      <span>{formatDate(lightboxPhoto.dateTaken)}</span>
                    </div>
                  )}
                  {lightboxPhoto.location && (
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-center">📍</span>
                      <span>{lightboxPhoto.location}</span>
                    </div>
                  )}
                  {lightboxPhoto.camera && (
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-center">📷</span>
                      <span>{lightboxPhoto.camera}</span>
                    </div>
                  )}
                </div>

                {/* Reactions */}
                <div>
                  <p className="text-[10px] text-white/20 uppercase tracking-wider mb-2">React</p>
                  <div className="flex gap-1 flex-wrap">
                    {REACTION_EMOJIS.map((emoji) => {
                      const reactions = getReactions(lightboxPhoto);
                      const users = reactions[emoji] || [];
                      const iReacted = users.includes(currentMember?.name || '');
                      return (
                        <button key={emoji} onClick={() => handleReact(lightboxPhoto.id, emoji)}
                          className={`px-2 py-1 rounded-lg text-sm transition-all ${
                            iReacted ? 'bg-white/15 scale-110' : 'bg-white/5 hover:bg-white/10'}`}>
                          {emoji}{users.length > 0 && <span className="text-[10px] ml-0.5 text-white/40">{users.length}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <p className="text-[10px] text-white/20 uppercase tracking-wider mb-2">Comments</p>
                  <div className="space-y-2 mb-3">
                    {lightboxPhoto.comments.map((c) => (
                      <div key={c.id} className="flex gap-2">
                        <span className="text-sm">{c.authorEmoji || '💬'}</span>
                        <div>
                          <span className="text-[10px] font-medium text-white/40">{c.authorName}</span>
                          <p className="text-xs text-white/50">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleComment(lightboxPhoto.id)}
                      placeholder="Say something..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none" />
                    <button onClick={() => handleComment(lightboxPhoto.id)} disabled={!commentText.trim()}
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs disabled:opacity-20">Send</button>
                  </div>
                </div>

                {/* Delete */}
                {lightboxPhoto.uploadedBy === currentMember?.name && (
                  <button onClick={() => handleDelete(lightboxPhoto.id)}
                    className="w-full py-2 rounded-xl bg-red-500/10 text-red-400/60 text-xs hover:text-red-400 transition-colors">
                    Delete Photo
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating upload button (mobile-friendly) */}
      <button onClick={() => fileInputRef.current?.click()}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-2xl shadow-xl shadow-rose-500/30 hover:scale-110 transition-transform z-30 flex items-center justify-center md:hidden">
        📸
      </button>
    </div>
  );
}
