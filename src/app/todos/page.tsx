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
  dollarAmount: number | null;
  paidStatus: string | null;
  paidAt: string | null;
  paidMethod: string | null;
  paidBy: string | null;
  paidNote: string | null;
  exemptFromCap: number | null;
  fixedDueDate: number | null;
  metDeadline: number | null;
}

const COLUMNS = [
  { id: 'todo', label: 'To Do', icon: '📋', color: '#6366F1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  { id: 'in-progress', label: 'In Progress', icon: '⚡', color: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'done', label: 'Done', icon: '✅', color: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { id: 'paid', label: 'Paid', icon: '💸', color: '#8B5CF6', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
];

export default function TodosPage() {
  const { currentMember, members, setShowPicker } = useFamilyMember();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [tab, setTab] = useState<'mine' | 'grab' | 'assigned' | 'manage' | 'archived'>('mine');
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDue, setNewDue] = useState('');
  const [newAssignTo, setNewAssignTo] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newExempt, setNewExempt] = useState(false);
  const [newFixedDue, setNewFixedDue] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [minPayout, setMinPayout] = useState(20);
  const [maxActive, setMaxActive] = useState(22);
  const [allTodos, setAllTodos] = useState<TodoItem[]>([]);
  const [templates, setTemplates] = useState<Array<{ id: string; title: string; description: string | null; dollarAmount: number | null; category: string }>>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [templateAmounts, setTemplateAmounts] = useState<Record<string, number>>({});
  const [bulkResult, setBulkResult] = useState('');
  const [isParent, setIsParent] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ taskId: string; amount: number } | null>(null);
  const [payMethod, setPayMethod] = useState('Step');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payBy, setPayBy] = useState('');
  const [payNote, setPayNote] = useState('');
  const [deadlineModal, setDeadlineModal] = useState<{ taskId: string; taskTitle: string; dueDate: string; dollarAmount: number } | null>(null);

  const fetchTodos = useCallback(async () => {
    if (!currentMember) return;
    const myRes = await fetch(`/api/todos?assignedTo=${encodeURIComponent(currentMember.name)}`);
    const myTodos = await myRes.json();
    const assignedRes = await fetch(`/api/todos?createdBy=${encodeURIComponent(currentMember.name)}`);
    const assignedTodos = await assignedRes.json();
    // Also fetch unclaimed tasks
    const unclaimedRes = await fetch('/api/todos?assignedTo=unclaimed');
    const unclaimedTodos = await unclaimedRes.json();
    // Also fetch ALL todos for earnings dashboard
    const allRes = await fetch('/api/todos');
    setAllTodos(await allRes.json());

    const combined = [...myTodos];
    for (const t of [...assignedTodos, ...unclaimedTodos]) {
      if (!combined.find((a: TodoItem) => a.id === t.id)) combined.push(t);
    }
    setTodos(combined);

    // Load config + templates
    fetch('/api/admin').then((r) => r.json()).then((data) => {
      if (data.config?.minPayout) setMinPayout(Number(data.config.minPayout) || 20);
      if (data.config?.maxActiveAmount) setMaxActive(Number(data.config.maxActiveAmount) || 20);
      // Check if current member is a parent (first two members are parents by default)
      const memberIdx = data.members?.findIndex((m: { name: string }) => m.name === currentMember?.name);
      setIsParent(memberIdx !== undefined && memberIdx < 2);
    }).catch(() => {});
    fetch('/api/grab-templates').then((r) => r.json()).then(setTemplates).catch(() => {});
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
        dollarAmount: newAmount ? parseFloat(newAmount) : null,
        exemptFromCap: newExempt ? 1 : 0,
        fixedDueDate: newFixedDue ? 1 : 0,
      }),
    });
    setNewTitle(''); setNewDesc(''); setNewDue(''); setNewAssignTo(''); setNewAmount(''); setNewExempt(false); setNewFixedDue(false);
    setShowNew(false);
    fetchTodos();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Check if moving to done and has a fixed due date
    if (newStatus === 'done') {
      const task = todos.find((t) => t.id === id);
      if (task?.fixedDueDate && task.dollarAmount && task.dueDate) {
        setDeadlineModal({ taskId: id, taskTitle: task.title, dueDate: task.dueDate, dollarAmount: task.dollarAmount });
        return; // Don't move yet — modal will handle it
      }
    }
    await fetch('/api/todos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });
    fetchTodos();
  };

  const handleDeadlineResponse = async (metDeadline: boolean) => {
    if (!deadlineModal) return;
    await fetch('/api/todos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: deadlineModal.taskId,
        status: 'done',
        metDeadline: metDeadline ? 1 : 0,
        // If didn't meet deadline, zero out the dollar amount
        ...(metDeadline ? {} : { dollarAmount: 0 }),
      }),
    });
    setDeadlineModal(null);
    fetchTodos();
  };

  const handleClaimTask = async (id: string) => {
    if (!currentMember) return;
    const task = todos.find((t) => t.id === id);
    const taskAmount = task?.dollarAmount || 0;
    const isExempt = task?.exemptFromCap;

    // Check if adding this task would exceed the cap (exempt tasks skip this)
    if (!isExempt && taskAmount > 0 && myActiveAmount + taskAmount > maxActive) {
      alert(`Adding this $${taskAmount.toFixed(2)} task would put you at $${(myActiveAmount + taskAmount).toFixed(2)}, which exceeds the $${maxActive.toFixed(2)} limit. Complete some tasks first!`);
      return;
    }
    await fetch('/api/todos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, assignedTo: currentMember.name }),
    });
    fetchTodos();
  };

  // Calculate active (unpaid) task amounts — exempt tasks don't count toward cap
  const myActiveAmount = todos.filter((t) =>
    t.assignedTo === currentMember?.name &&
    t.dollarAmount &&
    t.status !== 'archived' &&
    t.paidStatus !== 'paid' &&
    !t.exemptFromCap
  ).reduce((s, t) => s + (t.dollarAmount || 0), 0);

  // Calculate pending payout (done but unpaid)
  const myPendingPayout = todos.filter((t) =>
    t.assignedTo === currentMember?.name &&
    t.dollarAmount &&
    (t.status === 'done' || t.status === 'archived') &&
    t.paidStatus !== 'paid'
  ).reduce((s, t) => s + (t.dollarAmount || 0), 0);

  const payoutProgress = Math.min((myPendingPayout / minPayout) * 100, 100);
  const canGetPaid = myPendingPayout >= minPayout;

  // Total paid all time
  const myTotalPaid = todos.filter((t) =>
    t.assignedTo === currentMember?.name && t.dollarAmount && t.paidStatus === 'paid'
  ).reduce((s, t) => s + (t.dollarAmount || 0), 0);

  // This month paid
  const thisMonth = new Date().toISOString().slice(0, 7);
  const myMonthPaid = todos.filter((t) =>
    t.assignedTo === currentMember?.name && t.dollarAmount && t.paidStatus === 'paid' &&
    (t.paidAt || t.completedAt || t.createdAt).slice(0, 7) === thisMonth
  ).reduce((s, t) => s + (t.dollarAmount || 0), 0);

  // Unclaimed tasks
  const unclaimedTasks = todos.filter((t) => t.assignedTo === 'unclaimed' && t.status !== 'archived');

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
        if (canDrag) {
          if (colId === 'paid' && item.dollarAmount) {
            // Show payment modal
            setPaymentModal({ taskId: dragItem, amount: item.dollarAmount });
            setPayDate(new Date().toISOString().split('T')[0]);
            setPayBy(currentMember?.name || '');
            setPayMethod('Step');
            setPayNote('');
          } else if (colId === 'paid') {
            // No dollar amount, just mark as paid
            handleStatusChange(dragItem, 'done');
            fetch('/api/todos', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: dragItem, paidStatus: 'paid' }) }).then(() => fetchTodos());
          } else {
            handleStatusChange(dragItem, colId);
          }
        }
      }
    }
    setDragItem(null); setDragOverCol(null);
  };

  const handleConfirmPayment = async () => {
    if (!paymentModal) return;
    await fetch('/api/todos', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: paymentModal.taskId, paidStatus: 'paid',
        paidAt: payDate, paidMethod: payMethod, paidBy: payBy, paidNote: payNote,
      }),
    });
    // Also move to done if not already
    await fetch('/api/todos', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: paymentModal.taskId, status: 'done' }),
    });
    setPaymentModal(null);
    fetchTodos();
  };

  // Filter based on tab
  const activeTodos = tab === 'mine'
    ? todos.filter((t) => t.assignedTo === currentMember?.name && t.status !== 'archived')
    : tab === 'assigned'
    ? todos.filter((t) => t.createdBy === currentMember?.name && t.assignedTo !== currentMember?.name && t.status !== 'archived')
    : [];

  // For the paid column, show tasks where paidStatus is 'paid'
  const getColumnItems = (status: string) => {
    if (status === 'paid') return activeTodos.filter((t) => t.paidStatus === 'paid');
    if (status === 'done') return activeTodos.filter((t) => t.status === 'done' && t.paidStatus !== 'paid');
    return activeTodos.filter((t) => t.status === status && t.paidStatus !== 'paid');
  };

  const archivedTodos = todos
    .filter((t) => t.status === 'archived' && (t.assignedTo === currentMember?.name || t.createdBy === currentMember?.name))
    .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());

  const doneCount = todos.filter((t) => t.status === 'done' && t.paidStatus !== 'paid' && (t.assignedTo === currentMember?.name || t.createdBy === currentMember?.name)).length;

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
        <div className="flex items-center justify-between mb-6">
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
            <button onClick={() => setShowEarnings(!showEarnings)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                showEarnings ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white'}`}>
              💰 Earnings
            </button>
          </div>
        </div>

        {/* Earnings dashboard */}
        <AnimatePresence>
          {showEarnings && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mb-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">💰 Earnings Tracker</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((m) => {
                    const memberTasks = allTodos.filter((t) => t.assignedTo === m.name && t.dollarAmount);
                    const earned = memberTasks.filter((t) => t.status === 'done' || t.status === 'archived').reduce((s, t) => s + (t.dollarAmount || 0), 0);
                    const pending = memberTasks.filter((t) => (t.status === 'done' || t.status === 'archived') && t.paidStatus !== 'paid').reduce((s, t) => s + (t.dollarAmount || 0), 0);
                    const paid = memberTasks.filter((t) => t.paidStatus === 'paid').reduce((s, t) => s + (t.dollarAmount || 0), 0);
                    const inProgress = memberTasks.filter((t) => t.status === 'todo' || t.status === 'in-progress').reduce((s, t) => s + (t.dollarAmount || 0), 0);

                    if (memberTasks.length === 0) return null;
                    return (
                      <div key={m.id} className="p-4 bg-white/[0.02] rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">{m.emoji}</span>
                          <span className="font-medium text-sm" style={{ color: m.color }}>{m.name}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-white/30">Total earned</span>
                            <span className="text-emerald-400 font-bold">${earned.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-white/30">Pending payment</span>
                            <span className="text-amber-400">${pending.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-white/30">Already paid</span>
                            <span className="text-white/40">${paid.toFixed(2)}</span>
                          </div>
                          {inProgress > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-white/20">Still working on</span>
                              <span className="text-white/20">${inProgress.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                        {/* Payout progress */}
                        {pending > 0 && (
                          <div className="mt-3">
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-1">
                              <div className={`h-full rounded-full ${pending >= minPayout ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min((pending / minPayout) * 100, 100)}%` }} />
                            </div>
                            <span className="text-[9px] text-white/20">
                              {pending >= minPayout ? '✅ Ready for payout!' : `$${(minPayout - pending).toFixed(2)} until payout minimum`}
                            </span>
                          </div>
                        )}
                        {pending >= minPayout && currentMember?.name !== m.name && (
                          <button onClick={() => {
                            memberTasks.filter((t) => (t.status === 'done' || t.status === 'archived') && t.paidStatus !== 'paid')
                              .forEach((t) => {
                                fetch('/api/todos', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: t.id, paidStatus: 'paid' }) });
                              });
                            setTimeout(fetchTodos, 500);
                          }}
                            className="w-full mt-2 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-medium border border-emerald-500/20 hover:bg-emerald-500/25 transition-all">
                            💸 Pay ${pending.toFixed(2)} via Step
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        {/* Earnings display */}
        {(myPendingPayout > 0 || myTotalPaid > 0) && (
          <div className="glass rounded-2xl p-5 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Pending Payout</p>
                <p className={`text-3xl font-bold ${canGetPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                  ${myPendingPayout.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Total Paid</p>
                <p className="text-3xl font-bold text-violet-400">${myTotalPaid.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-white/30 text-xs uppercase tracking-wider mb-1">This Month</p>
                <p className="text-3xl font-bold text-white/60">${myMonthPaid.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Active Tasks</p>
                <p className="text-3xl font-bold text-white/40">${myActiveAmount.toFixed(2)}</p>
              </div>
            </div>

            {/* Payout progress bar */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white/30">Payout progress</span>
              <span className="text-[10px] text-white/30">${myPendingPayout.toFixed(2)} / ${minPayout.toFixed(2)}</span>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${canGetPaid ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'}`}
                initial={{ width: 0 }} animate={{ width: `${payoutProgress}%` }} transition={{ duration: 0.8 }}
              />
            </div>
            {canGetPaid && (
              <p className="text-emerald-400 text-xs mt-2 font-medium text-center">🎉 Ready for payout! Drag tasks to the Paid column.</p>
            )}
          </div>
        )}

        {/* Active cap warning */}
        {myActiveAmount > 0 && (
          <div className="flex items-center gap-3 mb-4 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-white/30">Active tasks: <strong className={myActiveAmount >= maxActive ? 'text-red-400' : 'text-white/50'}>${myActiveAmount.toFixed(2)}</strong> / ${maxActive.toFixed(2)} limit</span>
            {myActiveAmount >= maxActive && <span className="text-[10px] text-red-400/70">⚠️ Complete tasks before claiming more</span>}
          </div>
        )}

        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8 overflow-x-auto">
          {([
            { key: 'mine' as const, label: '📋 My Tasks', show: true },
            { key: 'grab' as const, label: `🏷️ Grab${unclaimedTasks.length > 0 ? ` (${unclaimedTasks.length})` : ''}`, show: true },
            { key: 'assigned' as const, label: '👥 Assigned', show: true },
            { key: 'manage' as const, label: '⚙️ Manage', show: isParent },
            { key: 'archived' as const, label: '📦 Archive', show: true },
          ]).filter((t) => t.show).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
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
                    <option value="unclaimed">🏷️ Unclaimed (anyone can grab)</option>
                    {members.filter((m) => m.name !== currentMember.name).map((m) => (
                      <option key={m.id} value={m.name}>{m.emoji} {m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/30 block mb-1">💰 Amount (optional)</label>
                  <input type="number" step="0.01" min="0" value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="$0.00"
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none [color-scheme:dark] w-28" />
                </div>
                {newAmount && parseFloat(newAmount) > 0 && (
                  <div className="flex items-center gap-4 self-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer" onClick={() => setNewExempt(!newExempt)}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs transition-all ${
                        newExempt ? 'bg-amber-500 border-amber-500 text-white' : 'border-white/15'}`}>
                        {newExempt && '✓'}
                      </div>
                      <span className="text-xs text-white/40">Exempt from cap</span>
                    </label>
                    {newDue && (
                      <label className="flex items-center gap-2 cursor-pointer" onClick={() => setNewFixedDue(!newFixedDue)}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs transition-all ${
                          newFixedDue ? 'bg-red-500 border-red-500 text-white' : 'border-white/15'}`}>
                          {newFixedDue && '✓'}
                        </div>
                        <span className="text-xs text-white/40">Fixed deadline (no pay if late)</span>
                      </label>
                    )}
                  </div>
                )}
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
        {tab !== 'archived' && tab !== 'grab' && tab !== 'manage' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            {item.createdBy === currentMember.name && (
                              <button onClick={() => handleDelete(item.id)}
                                className="text-white/10 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">✕</button>
                            )}
                          </div>
                          {item.description && <p className="text-white/30 text-xs mt-1.5 line-clamp-2">{item.description}</p>}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {item.dollarAmount && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                col.id === 'paid' ? 'bg-violet-500/15 text-violet-400' :
                                item.paidStatus === 'paid' ? 'bg-emerald-500/15 text-emerald-400 line-through' :
                                col.id === 'done' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                💰 ${item.dollarAmount.toFixed(2)}{col.id === 'paid' ? ` via ${item.paidMethod || 'Step'}` : ''}{item.exemptFromCap ? ' ⭐' : ''}
                              </span>
                            )}
                            {col.id === 'paid' && item.paidBy && (
                              <span className="text-[10px] text-white/20">by {item.paidBy}</span>
                            )}
                            {item.dueDate && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                overdue ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-white/30'}`}>
                                {overdue ? '⚠️' : '📅'} {formatDate(item.dueDate)}
                                {item.fixedDueDate ? ' ⏰' : ''}
                              </span>
                            )}
                            {item.metDeadline === 0 && item.fixedDueDate && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">❌ Late — no pay</span>
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

        {/* ====== GRAB TASKS TAB ====== */}
        {tab === 'grab' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold mb-1">🏷️ Available Tasks</h2>
              <p className="text-white/30 text-xs">Grab a task to add it to your to-do list and earn money!</p>
            </div>

            {unclaimedTasks.length === 0 ? (
              <div className="text-center py-16 text-white/20">
                <div className="text-5xl mb-4">🏷️</div>
                <p>No unclaimed tasks right now.</p>
                <p className="text-xs mt-1">Check back later or ask a parent to post some!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unclaimedTasks.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="glass rounded-2xl p-5 hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-sm">{item.title}</h3>
                      {item.dollarAmount && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-sm font-bold">
                          ${item.dollarAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {item.description && <p className="text-white/30 text-xs mb-3">{item.description}</p>}
                    <div className="flex items-center gap-2 mb-4">
                      {item.dueDate && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">
                          📅 {formatDate(item.dueDate)}
                        </span>
                      )}
                      <span className="text-[10px] text-white/15">Posted by {item.createdBy}</span>
                    </div>
                    <button onClick={() => handleClaimTask(item.id)}
                      disabled={!item.exemptFromCap && (item.dollarAmount || 0) > 0 && myActiveAmount + (item.dollarAmount || 0) > maxActive}
                      className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
                        !item.exemptFromCap && (item.dollarAmount || 0) > 0 && myActiveAmount + (item.dollarAmount || 0) > maxActive
                          ? 'bg-white/5 text-white/20 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/20 hover:from-emerald-500/30 hover:to-teal-500/30'
                      }`}>
                      {!item.exemptFromCap && (item.dollarAmount || 0) > 0 && myActiveAmount + (item.dollarAmount || 0) > maxActive
                        ? `🔒 Would exceed $${maxActive} limit`
                        : `🙋 Grab This Task${item.dollarAmount ? ` ($${item.dollarAmount.toFixed(2)})` : ''}`}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====== MANAGE TAB (parent only) ====== */}
        {tab === 'manage' && isParent && (
          <div className="space-y-8">
            {/* Bulk post grab tasks */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-1">🏷️ Post Grab Tasks</h3>
              <p className="text-white/30 text-xs mb-4">Select tasks and post them all at once for kids to grab</p>

              <div className="flex gap-2 mb-4 flex-wrap">
                <button onClick={() => setSelectedTemplates(new Set(templates.map((t) => t.id)))}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs hover:text-white">Select All</button>
                <button onClick={() => setSelectedTemplates(new Set())}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs hover:text-white">Clear</button>
                <button onClick={async () => {
                  if (selectedTemplates.size === 0) return;
                  const res = await fetch('/api/grab-templates', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'bulk-post', templateIds: [...selectedTemplates], createdBy: currentMember?.name, amountOverrides: templateAmounts }),
                  });
                  const data = await res.json();
                  setBulkResult(`✅ Posted ${data.count} grab tasks!`);
                  setSelectedTemplates(new Set());
                  setTimeout(() => setBulkResult(''), 4000);
                  fetchTodos();
                }} disabled={selectedTemplates.size === 0}
                  className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium disabled:opacity-30">
                  🏷️ Post {selectedTemplates.size} Tasks
                </button>
                {bulkResult && <span className="text-emerald-400 text-xs">{bulkResult}</span>}
              </div>

              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {templates.map((t) => {
                  const isSelected = selectedTemplates.has(t.id);
                  return (
                    <div key={t.id} onClick={() => {
                      setSelectedTemplates((prev) => { const n = new Set(prev); if (n.has(t.id)) n.delete(t.id); else n.add(t.id); return n; });
                    }} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/[0.01] border border-transparent hover:bg-white/[0.03]'}`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/15'}`}>
                        {isSelected && '✓'}
                      </div>
                      <span className="text-sm flex-1">{t.title}</span>
                      {t.description && <span className="text-[10px] text-white/15 hidden md:block max-w-[200px] truncate">{t.description}</span>}
                      <input type="number" step="0.5" min="0"
                        value={templateAmounts[t.id] ?? t.dollarAmount ?? ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { e.stopPropagation(); setTemplateAmounts((p) => ({ ...p, [t.id]: parseFloat(e.target.value) || 0 })); }}
                        placeholder="$"
                        className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-emerald-400 text-right focus:outline-none" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly totals / reconciliation */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-1">📊 Monthly Reconciliation</h3>
              <p className="text-white/30 text-xs mb-4">Summary of earnings and payments by month</p>

              {(() => {
                // Group all paid/earned tasks by month
                const months: Record<string, { earned: Record<string, number>; paid: Record<string, number>; pending: Record<string, number>; tasks: TodoItem[] }> = {};

                allTodos.filter((t) => t.dollarAmount && (t.status === 'done' || t.status === 'archived')).forEach((t) => {
                  const date = t.completedAt || t.createdAt;
                  const monthKey = date.slice(0, 7); // "2026-03"
                  if (!months[monthKey]) months[monthKey] = { earned: {}, paid: {}, pending: {}, tasks: [] };
                  const m = months[monthKey];
                  m.tasks.push(t);
                  m.earned[t.assignedTo] = (m.earned[t.assignedTo] || 0) + (t.dollarAmount || 0);
                  if (t.paidStatus === 'paid') {
                    m.paid[t.assignedTo] = (m.paid[t.assignedTo] || 0) + (t.dollarAmount || 0);
                  } else {
                    m.pending[t.assignedTo] = (m.pending[t.assignedTo] || 0) + (t.dollarAmount || 0);
                  }
                });

                const sortedMonths = Object.keys(months).sort((a, b) => b.localeCompare(a));

                if (sortedMonths.length === 0) return <p className="text-white/20 text-sm">No completed paid tasks yet.</p>;

                return (
                  <div className="space-y-4">
                    {sortedMonths.map((monthKey) => {
                      const m = months[monthKey];
                      const monthDate = new Date(monthKey + '-01T00:00:00');
                      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      const allPeople = [...new Set([...Object.keys(m.earned)])];
                      const totalEarned = Object.values(m.earned).reduce((s, v) => s + v, 0);
                      const totalPaid = Object.values(m.paid).reduce((s, v) => s + v, 0);
                      const totalPending = Object.values(m.pending).reduce((s, v) => s + v, 0);

                      return (
                        <div key={monthKey} className="p-4 bg-white/[0.02] rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-sm">{monthName}</h4>
                            <div className="flex gap-4 text-xs">
                              <span className="text-emerald-400">Earned: ${totalEarned.toFixed(2)}</span>
                              <span className="text-white/40">Paid: ${totalPaid.toFixed(2)}</span>
                              {totalPending > 0 && <span className="text-amber-400">Pending: ${totalPending.toFixed(2)}</span>}
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-white/25 border-b border-white/5">
                                  <th className="text-left py-2 pr-4 font-medium">Person</th>
                                  <th className="text-right py-2 px-2 font-medium">Tasks</th>
                                  <th className="text-right py-2 px-2 font-medium">Earned</th>
                                  <th className="text-right py-2 px-2 font-medium">Paid</th>
                                  <th className="text-right py-2 pl-2 font-medium">Owed</th>
                                </tr>
                              </thead>
                              <tbody>
                                {allPeople.map((person) => {
                                  const taskCount = m.tasks.filter((t) => t.assignedTo === person).length;
                                  return (
                                    <tr key={person} className="border-b border-white/[0.03]">
                                      <td className="py-2 pr-4">
                                        {members.find((mb) => mb.name === person)?.emoji} {person}
                                      </td>
                                      <td className="text-right py-2 px-2 text-white/30">{taskCount}</td>
                                      <td className="text-right py-2 px-2 text-emerald-400">${(m.earned[person] || 0).toFixed(2)}</td>
                                      <td className="text-right py-2 px-2 text-white/40">${(m.paid[person] || 0).toFixed(2)}</td>
                                      <td className={`text-right py-2 pl-2 font-bold ${(m.pending[person] || 0) > 0 ? 'text-amber-400' : 'text-white/20'}`}>
                                        ${(m.pending[person] || 0).toFixed(2)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
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
                        {item.createdBy === currentMember?.name && <button onClick={() => handleDelete(item.id)}
                          className="text-[10px] text-white/15 hover:text-red-400 px-2 py-1 rounded bg-white/5">
                          Delete
                        </button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deadline check modal */}
      <AnimatePresence>
        {deadlineModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl text-center">

              <div className="text-5xl mb-2">⏰</div>
              <h2 className="text-xl font-bold">Deadline Check</h2>
              <p className="text-white/50 text-sm">&ldquo;{deadlineModal.taskTitle}&rdquo;</p>

              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Due Date</p>
                <p className="text-lg font-bold">{new Date(deadlineModal.dueDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>

              <p className="text-white/60 text-sm">Was this task completed by the deadline?</p>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleDeadlineResponse(true)}
                  className="py-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-lg hover:bg-emerald-500/25 transition-all">
                  ✅ Yes
                  <span className="block text-xs font-normal text-emerald-400/60 mt-1">Earns ${deadlineModal.dollarAmount.toFixed(2)}</span>
                </button>
                <button onClick={() => handleDeadlineResponse(false)}
                  className="py-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-lg hover:bg-red-500/25 transition-all">
                  ❌ No
                  <span className="block text-xs font-normal text-red-400/60 mt-1">No payment</span>
                </button>
              </div>

              <button onClick={() => setDeadlineModal(null)}
                className="text-white/20 text-xs hover:text-white/40">Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment confirmation modal */}
      <AnimatePresence>
        {paymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setPaymentModal(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}>

              <div className="text-center">
                <div className="text-4xl mb-2">💸</div>
                <h2 className="text-xl font-bold">Confirm Payment</h2>
                <p className="text-3xl font-bold text-emerald-400 mt-2">${paymentModal.amount.toFixed(2)}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/50 block mb-1">Payment Method</label>
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm [&>option]:bg-gray-900">
                    <option value="Step">📱 Step</option>
                    <option value="Cash">💵 Cash</option>
                    <option value="Other">🔄 Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-white/50 block mb-1">Payment Date</label>
                  <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm [color-scheme:dark]" />
                </div>

                <div>
                  <label className="text-sm text-white/50 block mb-1">Paid By</label>
                  <select value={payBy} onChange={(e) => setPayBy(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm [&>option]:bg-gray-900">
                    <option value="">Select...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>{m.emoji} {m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-white/50 block mb-1">Note (optional)</label>
                  <input type="text" value={payNote} onChange={(e) => setPayNote(e.target.value)}
                    placeholder="e.g., Sent via Step March 15"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleConfirmPayment}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm">
                  ✅ Confirm Payment
                </button>
                <button onClick={() => setPaymentModal(null)}
                  className="px-6 py-3 rounded-xl bg-white/5 text-white/40 text-sm">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
