'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFamilyMember } from './FamilyContext';

const EMOJIS = ['🎤', '🎵', '🎶', '🌟', '✨', '🎸', '💃', '🕺', '🦄', '🔥'];
const COLORS = ['#E91E8C', '#7B2FBE', '#1B8FE3', '#E8A317', '#2ECC71', '#E74C3C', '#F39C12', '#1ABC9C'];

export default function FamilyPicker() {
  const { members, currentMember, setCurrentMember, addMember, showPicker, setShowPicker } = useFamilyMember();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎤');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [pinPrompt, setPinPrompt] = useState<{ member: { id: string; name: string; emoji: string; color: string; pin?: string | null }; enteredPin: string } | null>(null);
  const [pinError, setPinError] = useState(false);
  const [requirePin, setRequirePin] = useState(false);

  // Load requirePin setting
  useEffect(() => {
    fetch('/api/admin').then((r) => r.json()).then((data) => {
      if (data.config?.requirePin) setRequirePin(true);
    }).catch(() => {});
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addMember(newName.trim(), newEmoji, newColor);
    setNewName('');
    setShowAdd(false);
  };

  return (
    <>
      {/* Current member indicator in top bar */}
      {currentMember && !showPicker && (
        <button
          onClick={() => setShowPicker(true)}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-2xl glass border border-white/10 hover:border-white/20 transition-all text-sm"
        >
          <span className="text-lg">{currentMember.emoji}</span>
          <span style={{ color: currentMember.color }} className="font-medium">{currentMember.name}</span>
          <span className="text-white/20 text-xs ml-1">▼</span>
        </button>
      )}

      {/* Full-screen picker overlay */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass rounded-3xl p-8 max-w-lg w-full border border-white/10"
            >
              <h2 className="text-2xl font-bold text-center mb-2">Who&apos;s here?</h2>
              <p className="text-white/40 text-sm text-center mb-8">Pick your profile to get started</p>

              {/* PIN entry prompt */}
              {pinPrompt && (
                <div className="mb-6 p-4 bg-white/5 rounded-2xl text-center space-y-3">
                  <p className="text-sm text-white/60">Enter PIN for <strong style={{ color: pinPrompt.member.color }}>{pinPrompt.member.emoji} {pinPrompt.member.name}</strong></p>
                  <input type="password" maxLength={4} value={pinPrompt.enteredPin}
                    onChange={(e) => { setPinPrompt({ ...pinPrompt, enteredPin: e.target.value }); setPinError(false); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (pinPrompt.enteredPin === (pinPrompt.member as unknown as Record<string, string>).pin) {
                          setCurrentMember(pinPrompt.member);
                          setPinPrompt(null);
                        } else { setPinError(true); }
                      }
                    }}
                    autoFocus placeholder="••••"
                    className={`w-24 mx-auto bg-white/5 border rounded-xl px-4 py-3 text-white text-center text-lg tracking-[0.3em] placeholder-white/15 focus:outline-none ${pinError ? 'border-red-500' : 'border-white/10'}`} />
                  {pinError && <p className="text-red-400 text-xs">Wrong PIN</p>}
                  <button onClick={() => setPinPrompt(null)} className="text-white/20 text-xs">Cancel</button>
                </div>
              )}

              {/* Existing members */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      const m = member as unknown as Record<string, unknown>;
                      if (requirePin && m.pin) {
                        setPinPrompt({ member, enteredPin: '' });
                        setPinError(false);
                      } else {
                        setCurrentMember(member);
                      }
                    }}
                    className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                      currentMember?.id === member.id
                        ? 'ring-2 scale-[1.02]'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                    style={{
                      backgroundColor: currentMember?.id === member.id ? `${member.color}15` : undefined,
                      border: `2px solid ${currentMember?.id === member.id ? member.color : 'transparent'}`,
                    }}
                  >
                    <span className="text-3xl">{member.emoji}</span>
                    <span className="font-medium" style={{ color: member.color }}>{member.name}</span>
                  </button>
                ))}
              </div>

              {/* Add new member */}
              {!showAdd ? (
                <button
                  onClick={() => setShowAdd(true)}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-white/15 text-white/30 hover:text-white/60 hover:border-white/30 transition-all text-sm"
                >
                  + Add Family Member
                </button>
              ) : (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Name..."
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                  />
                  <div>
                    <label className="text-xs text-white/30 block mb-2">Emoji</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {EMOJIS.map((e) => (
                        <button key={e} onClick={() => setNewEmoji(e)}
                          className={`text-xl p-1.5 rounded-lg ${newEmoji === e ? 'bg-white/15' : 'hover:bg-white/5'}`}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/30 block mb-2">Color</label>
                    <div className="flex gap-1.5">
                      {COLORS.map((c) => (
                        <button key={c} onClick={() => setNewColor(c)}
                          className={`w-8 h-8 rounded-full border-2 ${newColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAdd} disabled={!newName.trim()}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-30">
                      Add
                    </button>
                    <button onClick={() => setShowAdd(false)}
                      className="px-6 py-3 rounded-xl bg-white/5 text-white/50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Close if already has a selection */}
              {currentMember && (
                <button
                  onClick={() => setShowPicker(false)}
                  className="w-full mt-4 py-2 text-white/20 hover:text-white/50 text-xs transition-colors"
                >
                  Close
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
