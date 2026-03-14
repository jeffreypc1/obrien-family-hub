'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useFamilyMember } from '@/components/FamilyContext';
import ThemedBackground from '@/components/ThemedBackground';

interface TodoItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assignedTo: string;
  createdBy: string;
  dueDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

const COLUMNS = [
  { id: 'todo', label: 'To Do', icon: '📋', color: '#6366F1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  { id: 'in-progress', label: 'In Progress', icon: '⚡', color: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'done', label: 'Done', icon: '✅', color: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
];

export default function TodosPage() {
  const { currentMember, members, setShowPicker } = useFamilyMember();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [tab, setTab] = useState<'mine' | 'assigned' | 'archived'>('mine');
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDue, setNewDue] = useState('');
  const [newAssignTo, setNewAssignTo] = useState('');
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    if (!currentMember) return;
    const myRes = await fetch(`/api/todos?assignedTo=${encodeURIComponent(currentMember.name)}`);
    const myTodos = await myRes.json();
    const assignedRes = await fetch(`/api/todos?createdBy=${encodeURIComponent(currentMember.name)}`);
    const assignedTodos = await assignedRes.json();
    const all = [...myTodos];
    for (const t of assignedTodos) {
      if (!all.find((a: TodoItem) => a.id === t.id)) all.push(t);
    }
    setTodos(all);
  }, [currentMember]);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const handleCreate = async () => {
    if (!currentMember || !newTitle.trim()) return;
    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        assignedTo: newAssignTo || currentMember.name,
        createdBy: currentMember.name,
        dueDate: newDue || null,
      }),
    });
    setNewTitle(''); setNewDesc(''); setNewDue(''); setNewAssignTo('');
    setShowNew(false);
    fetchTodos();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch('/api/todos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });
    fetchTodos();
  };

  const handleArchiveDone = async () => {
    const doneTasks = todos.filter((t) => t.status === 'done' && (t.assignedTo === currentMember?.name || t.createdBy === currentMember?.name));
    for (const task of doneTasks) {
      await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: 'archived' }),
      });
    }
    fetchTodos();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/todos?id=${id}`, { method: 'DELETE' });
    fetchTodos();
  };

  const handleDragStart = (id: string) => setDragItem(id);
  const handleDragOver = (e: React.DragEvent, colId: string) => { e.preventDefault(); setDragOverCol(colId); };
  const handleDrop = (colId: string) => {
    if (dragItem) {
      const item = todos.find((t) => t.id === dragItem);
      if (item) {
        const canDrag = item.assignedTo === currentMember?.name || item.createdBy === currentMember?.name;
        if (canDrag) handleStatusChange(dragItem, colId);
      }
    }
    setDragItem(null); setDragOverCol(null);
  };

  // Filter based on tab
  const activeTodos = tab === 'mine'
    ? todos.filter((t) => t.assignedTo === currentMember?.name && t.status !== 'archived')
    : tab === 'assigned'
    ? todos.filter((t) => t.createdBy === currentMember?.name && t.assignedTo !== currentMember?.name && t.status !== 'archived')
    : [];

  const archivedTodos = todos
    .filter((t) => t.status === 'archived' && (t.assignedTo === currentMember?.name || t.createdBy === currentMember?.name))
    .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());

  const doneCount = todos.filter((t) => t.status === 'done' && (t.assignedTo === currentMember?.name || t.createdBy === currentMember?.name)).length;
  const getColumnItems = (status: string) => activeTodos.filter((t) => t.status === status);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formatDateLong = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const isOverdue = (d: string | null) => d ? new Date(d) < new Date() : false;

  if (!currentMember) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <ThemedBackground theme="todos" />
        <div className="glass rounded-3xl p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">To Do List</h1>
          <p className="text-white/40 text-sm mb-6">Pick your profile to see your tasks</p>
          <button onClick={() => setShowPicker(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium">
            Choose Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <ThemedBackground theme="todos" />

      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Back to Hub</Link>
          <span className="text-white/30 text-sm">{currentMember.emoji} {currentMember.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">✅ To Do List</h1>
            <p className="text-white/40 text-sm mt-1">
              {activeTodos.length} active · {archivedTodos.length} archived
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowNew(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium text-sm hover:scale-105 transition-transform">
              + New Task
            </button>
            {doneCount > 0 && (
              <button onClick={handleArchiveDone}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white text-sm transition-all">
                📦 Archive Done ({doneCount})
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8 max-w-md">
          {([
            { key: 'mine' as const, label: '📋 My Tasks' },
            { key: 'assigned' as const, label: '👥 Assigned by Me' },
            { key: 'archived' as const, label: `📦 Archived (${archivedTodos.length})` },
          ]).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* New task form */}
        <AnimatePresence>
          {showNew && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass rounded-2xl p-6 mb-8 space-y-4">
              <h3 className="text-sm font-medium text-white/60">New Task</h3>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="What needs to be done?" autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500 text-sm" />
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)" rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500 text-sm resize-none" />
              <div className="flex gap-4 flex-wrap">
                <div>
                  <label className="text-xs text-white/30 block mb-1">Due date</label>
                  <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-xs text-white/30 block mb-1">Assign to</label>
                  <select value={newAssignTo} onChange={(e) => setNewAssignTo(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none [&>option]:bg-gray-900">
                    <option value="">Myself</option>
                    {members.filter((m) => m.name !== currentMember.name).map((m) => (
                      <option key={m.id} value={m.name}>{m.emoji} {m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={!newTitle.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium text-sm disabled:opacity-30">
                  Create
                </button>
                <button onClick={() => setShowNew(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 text-white/40 text-sm">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ====== KANBAN BOARD (mine / assigned tabs) ====== */}
        {tab !== 'archived' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {COLUMNS.map((col) => {
              const items = getColumnItems(col.id);
              const isOver = dragOverCol === col.id;
              return (
                <div key={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={() => handleDrop(col.id)}
                  className={`rounded-2xl border transition-all min-h-[300px] ${col.border} ${col.bg} ${
                    isOver ? 'ring-2 ring-white/20 scale-[1.01]' : ''}`}>
                  <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{col.icon}</span>
                      <h3 className="font-bold text-sm" style={{ color: col.color }}>{col.label}</h3>
                    </div>
                    <span className="text-xs text-white/20 bg-white/5 px-2 py-0.5 rounded-full">{items.length}</span>
                  </div>
                  <div className="p-3 space-y-3">
                    {items.map((item) => {
                      const canDrag = item.assignedTo === currentMember.name || item.createdBy === currentMember.name;
                      const isAssignedByOther = item.createdBy !== currentMember.name && tab === 'mine';
                      const overdue = col.id !== 'done' && isOverdue(item.dueDate);
                      return (
                        <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          draggable={canDrag} onDragStart={() => handleDragStart(item.id)}
                          className={`glass rounded-xl p-4 cursor-grab active:cursor-grabbing group transition-all hover:bg-white/[0.06] ${
                            dragItem === item.id ? 'opacity-50 scale-95' : ''} ${!canDrag ? 'cursor-default' : ''}`}>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-medium leading-snug ${
                              col.id === 'done' ? 'line-through text-white/40' : 'text-white'}`}>
                              {item.title}
                            </h4>
                            <button onClick={() => handleDelete(item.id)}
                              className="text-white/10 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">✕</button>
                          </div>
                          {item.description && <p className="text-white/30 text-xs mt-1.5 line-clamp-2">{item.description}</p>}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {item.dueDate && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                overdue ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-white/30'}`}>
                                {overdue ? '⚠️' : '📅'} {formatDate(item.dueDate)}
                              </span>
                            )}
                            {isAssignedByOther && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">from {item.createdBy}</span>
                            )}
                            {tab === 'assigned' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">→ {item.assignedTo}</span>
                            )}
                            {item.startedAt && col.id === 'in-progress' && (
                              <span className="text-[10px] text-white/15 ml-auto">Started {formatDate(item.startedAt)}</span>
                            )}
                            {item.completedAt && col.id === 'done' && (
                              <span className="text-[10px] text-white/15 ml-auto">Done {formatDate(item.completedAt)}</span>
                            )}
                          </div>
                          <div className="flex gap-1.5 mt-3 md:hidden">
                            {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                              <button key={c.id} onClick={() => canDrag && handleStatusChange(item.id, c.id)}
                                disabled={!canDrag}
                                className="flex-1 py-1.5 rounded-lg text-[10px] font-medium text-white/30 hover:text-white/60 bg-white/5 transition-all disabled:opacity-20"
                                style={{ borderLeft: `2px solid ${c.color}` }}>
                                {c.icon} {c.label}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                    {items.length === 0 && (
                      <div className="text-center py-8 text-white/15 text-sm">
                        {col.id === 'todo' ? 'Nothing to do!' : col.id === 'in-progress' ? 'Nothing in progress' : 'Nothing done yet'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ====== ARCHIVED TAB ====== */}
        {tab === 'archived' && (
          <div>
            {archivedTodos.length === 0 ? (
              <div className="text-center py-20 text-white/20">
                <div className="text-5xl mb-4">📦</div>
                <p>No archived tasks yet.</p>
                <p className="text-xs mt-2 text-white/15">Complete tasks and click &ldquo;Archive Done&rdquo; to move them here.</p>
              </div>
            ) : (
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white/50">📦 Archived Tasks</h3>
                  <span className="text-xs text-white/20">{archivedTodos.length} tasks</span>
                </div>
                <div className="divide-y divide-white/5">
                  {archivedTodos.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 px-5 py-4 group hover:bg-white/[0.02] transition-colors">
                      <span className="text-lg mt-0.5 opacity-30">✅</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white/50 line-through">{item.title}</h4>
                        {item.description && <p className="text-white/20 text-xs mt-1">{item.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-white/15">
                          {item.completedAt && <span>Completed {formatDateLong(item.completedAt)}</span>}
                          {item.createdBy !== item.assignedTo && (
                            <span>Assigned by {item.createdBy} → {item.assignedTo}</span>
                          )}
                          {item.dueDate && <span>Due {formatDate(item.dueDate)}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleStatusChange(item.id, 'todo')}
                          className="text-[10px] text-white/25 hover:text-white/60 px-2 py-1 rounded bg-white/5">
                          ↩ Restore
                        </button>
                        <button onClick={() => handleDelete(item.id)}
                          className="text-[10px] text-white/15 hover:text-red-400 px-2 py-1 rounded bg-white/5">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
