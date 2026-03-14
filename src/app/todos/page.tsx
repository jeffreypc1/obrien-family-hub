'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [tab, setTab] = useState<'mine' | 'assigned'>('mine');
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
    // Merge and deduplicate
    const all = [...myTodos];
    for (const t of assignedTodos) {
      if (!all.find((a: TodoItem) => a.id === t.id)) all.push(t);
    }
    setTodos(all);
  }, [currentMember]);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const handleCreate = async () => {
    if (!currentMember || !newTitle.trim()) return;
    const assignTo = newAssignTo || currentMember.name;
    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        assignedTo: assignTo,
        createdBy: currentMember.name,
        dueDate: newDue || null,
      }),
    });
    setNewTitle('');
    setNewDesc('');
    setNewDue('');
    setNewAssignTo('');
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

  const handleDelete = async (id: string) => {
    await fetch(`/api/todos?id=${id}`, { method: 'DELETE' });
    fetchTodos();
  };

  // Drag and drop
  const handleDragStart = (id: string) => setDragItem(id);
  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverCol(colId);
  };
  const handleDrop = (colId: string) => {
    if (dragItem) {
      const item = todos.find((t) => t.id === dragItem);
      if (item) {
        // Only allow drag if user owns it or created it
        const canDrag = item.assignedTo === currentMember?.name || item.createdBy === currentMember?.name;
        if (canDrag) handleStatusChange(dragItem, colId);
      }
    }
    setDragItem(null);
    setDragOverCol(null);
  };

  // Filter todos based on tab
  const filteredTodos = tab === 'mine'
    ? todos.filter((t) => t.assignedTo === currentMember?.name)
    : todos.filter((t) => t.createdBy === currentMember?.name && t.assignedTo !== currentMember?.name);

  const getColumnItems = (status: string) => filteredTodos.filter((t) => t.status === status);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isOverdue = (d: string | null) => d ? new Date(d) < new Date() : false;

  if (!currentMember) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
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
              {filteredTodos.length} tasks · {filteredTodos.filter((t) => t.status === 'done').length} done
            </p>
          </div>
          <button onClick={() => setShowNew(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium text-sm hover:scale-105 transition-transform">
            + New Task
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8 max-w-sm">
          <button onClick={() => setTab('mine')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'mine' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
            📋 My Tasks
          </button>
          <button onClick={() => setTab('assigned')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'assigned' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
            👥 Assigned by Me
          </button>
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

        {/* Kanban Board */}
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
                  isOver ? 'ring-2 ring-white/20 scale-[1.01]' : ''
                }`}>
                {/* Column header */}
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{col.icon}</span>
                    <h3 className="font-bold text-sm" style={{ color: col.color }}>{col.label}</h3>
                  </div>
                  <span className="text-xs text-white/20 bg-white/5 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>

                {/* Cards */}
                <div className="p-3 space-y-3">
                  {items.map((item) => {
                    const canDrag = item.assignedTo === currentMember.name || item.createdBy === currentMember.name;
                    const isAssignedByOther = item.createdBy !== currentMember.name && tab === 'mine';
                    const overdue = col.id !== 'done' && isOverdue(item.dueDate);

                    return (
                      <motion.div key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        draggable={canDrag}
                        onDragStart={() => handleDragStart(item.id)}
                        className={`glass rounded-xl p-4 cursor-grab active:cursor-grabbing group transition-all hover:bg-white/[0.06] ${
                          dragItem === item.id ? 'opacity-50 scale-95' : ''
                        } ${!canDrag ? 'cursor-default' : ''}`}>
                        {/* Title */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium leading-snug ${
                            col.id === 'done' ? 'line-through text-white/40' : 'text-white'
                          }`}>
                            {item.title}
                          </h4>
                          <button onClick={() => handleDelete(item.id)}
                            className="text-white/10 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                            ✕
                          </button>
                        </div>

                        {/* Description */}
                        {item.description && (
                          <p className="text-white/30 text-xs mt-1.5 line-clamp-2">{item.description}</p>
                        )}

                        {/* Meta row */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {/* Due date */}
                          {item.dueDate && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              overdue ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-white/30'
                            }`}>
                              {overdue ? '⚠️' : '📅'} {formatDate(item.dueDate)}
                            </span>
                          )}

                          {/* Assigned by badge */}
                          {isAssignedByOther && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                              from {item.createdBy}
                            </span>
                          )}

                          {/* Assigned to (on "assigned" tab) */}
                          {tab === 'assigned' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                              → {item.assignedTo}
                            </span>
                          )}

                          {/* Timestamps */}
                          {item.startedAt && col.id === 'in-progress' && (
                            <span className="text-[10px] text-white/15 ml-auto">
                              Started {formatDate(item.startedAt)}
                            </span>
                          )}
                          {item.completedAt && col.id === 'done' && (
                            <span className="text-[10px] text-white/15 ml-auto">
                              Done {formatDate(item.completedAt)}
                            </span>
                          )}
                        </div>

                        {/* Quick move buttons (mobile fallback) */}
                        <div className="flex gap-1.5 mt-3 md:hidden">
                          {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                            <button key={c.id}
                              onClick={() => canDrag && handleStatusChange(item.id, c.id)}
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
      </div>
    </div>
  );
}
