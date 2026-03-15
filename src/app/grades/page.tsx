'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ThemedBackground from '@/components/ThemedBackground';

interface CourseGrade { courseId: number; courseName: string; grade: string | null; score: number | null; }
interface AssignmentDetail {
  name: string; score: number | null; pointsPossible: number; grade: string | null;
  late: boolean; missing: boolean; submitted: boolean; dueAt: string | null; gradedAt: string | null;
}
interface CourseDetail extends CourseGrade { assignments: AssignmentDetail[]; }
interface StudentOverview { id: number; name: string; courses: CourseGrade[]; gpa: number | null; }
interface StudentDetail { student: { id: number; name: string }; courses: CourseDetail[]; pastCourses: CourseGrade[]; lastUpdated: string; }

const GRADE_COLORS: Record<string, string> = {
  'A+': '#22C55E', 'A': '#22C55E', 'A-': '#4ADE80', 'B+': '#60A5FA', 'B': '#60A5FA', 'B-': '#93C5FD',
  'C+': '#FBBF24', 'C': '#FBBF24', 'C-': '#FCD34D', 'D+': '#F97316', 'D': '#F97316', 'D-': '#FB923C', 'F': '#EF4444',
};
const GRADE_ORDER = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
const GP: Record<string, number> = { 'A+': 4.3, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0.0 };

type SortKey = 'name' | 'grade-high' | 'grade-low' | 'score';

export default function GradesPage() {
  const [overview, setOverview] = useState<{ students: StudentOverview[]; lastUpdated: string } | null>(null);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [view, setView] = useState<'overview' | 'assignments' | 'visual' | 'history'>('overview');
  const [sortBy, setSortBy] = useState<SortKey>('grade-high');
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  const fetchOverview = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/grades');
      if (!r.ok) { setError(`Error ${r.status}`); setLoading(false); return; }
      const d = await r.json();
      if (d.error) setError(d.error); else { setOverview(d); setLastRefresh(d.lastUpdated); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Network error'); }
    setLoading(false);
  }, []);

  const fetchDetail = useCallback(async (studentId: number) => {
    setDetailLoading(true);
    try {
      const r = await fetch(`/api/grades?studentId=${studentId}&detail=1`);
      if (r.ok) { const d = await r.json(); setDetail(d); setLastRefresh(d.lastUpdated); }
    } catch {}
    setDetailLoading(false);
  }, []);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  useEffect(() => {
    if (selectedStudent) fetchDetail(selectedStudent);
    else setDetail(null);
  }, [selectedStudent, fetchDetail]);

  const cleanName = (n: string) => n.replace('25-26 ', '').replace('24-25 ', '');
  const getColor = (g: string | null) => g ? GRADE_COLORS[g] || '#9CA3AF' : '#4B5563';
  const sortCourses = (courses: CourseGrade[]) => {
    const g = courses.filter((c) => c.grade);
    switch (sortBy) {
      case 'name': return g.sort((a, b) => cleanName(a.courseName).localeCompare(cleanName(b.courseName)));
      case 'grade-high': return g.sort((a, b) => GRADE_ORDER.indexOf(a.grade!) - GRADE_ORDER.indexOf(b.grade!));
      case 'grade-low': return g.sort((a, b) => GRADE_ORDER.indexOf(b.grade!) - GRADE_ORDER.indexOf(a.grade!));
      case 'score': return g.sort((a, b) => (b.score || 0) - (a.score || 0));
      default: return g;
    }
  };
  const timeSince = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center relative">
      <ThemedBackground theme="events" />
      <div className="text-center"><div className="text-5xl mb-4 animate-pulse">📚</div><p className="text-white/40">Loading from Canvas...</p></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center relative">
      <ThemedBackground theme="events" />
      <div className="glass rounded-2xl p-8 max-w-md text-center">
        <div className="text-4xl mb-3">❌</div><p className="text-red-400 mb-3">{error}</p>
        <button onClick={fetchOverview} className="px-4 py-2 rounded-xl bg-white/10 text-white/60 text-sm">🔄 Retry</button>
      </div>
    </div>
  );

  const students = overview?.students || [];

  return (
    <div className="min-h-screen relative">
      <ThemedBackground theme="events" />
      <div className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Back to Hub</Link>
          <div className="flex items-center gap-3">
            <span className="text-white/15 text-xs">{lastRefresh ? timeSince(lastRefresh) : ''}</span>
            <button onClick={() => { if (selectedStudent) fetchDetail(selectedStudent); else fetchOverview(); }}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-white/30 hover:text-white text-xs transition-all">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">📚 Grades Dashboard</h1>

        {!selectedStudent ? (
          /* ====== OVERVIEW ====== */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {students.map((student, i) => {
              const graded = student.courses.filter((c) => c.grade);
              const low = graded.filter((c) => ['D+', 'D', 'D-', 'F'].includes(c.grade!));
              return (
                <motion.button key={student.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedStudent(student.id)}
                  className="glass rounded-2xl p-6 text-left hover:border-white/15 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">{student.name.split(' ')[0]}</h2>
                    {student.gpa && (
                      <div className="text-right">
                        <span className="text-xs text-white/30">GPA</span>
                        <p className="text-3xl font-bold" style={{ color: student.gpa >= 3.0 ? '#22C55E' : student.gpa >= 2.0 ? '#FBBF24' : '#EF4444' }}>{student.gpa.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 mb-4">
                    {graded.sort((a, b) => GRADE_ORDER.indexOf(a.grade!) - GRADE_ORDER.indexOf(b.grade!)).map((c) => (
                      <div key={c.courseId} className="flex items-center gap-2">
                        <span className="text-[10px] text-white/30 w-24 truncate">{cleanName(c.courseName).split(' - ')[0]}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(c.score || 0, 100)}%`, background: getColor(c.grade) }} />
                        </div>
                        <span className="text-xs font-bold w-6" style={{ color: getColor(c.grade) }}>{c.grade}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {low.length > 0 && <span className="px-2 py-1 rounded-lg bg-red-500/15 text-red-400 text-[10px] font-bold">📉 {low.length} low</span>}
                    {low.length === 0 && <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">✅ On track</span>}
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          /* ====== DETAIL ====== */
          <div>
            <button onClick={() => { setSelectedStudent(null); setDetail(null); }} className="text-white/40 hover:text-white text-sm mb-6">← All students</button>

            {detailLoading ? (
              <div className="text-center py-20"><div className="text-4xl animate-pulse">📚</div><p className="text-white/30 text-sm mt-3">Loading assignments...</p></div>
            ) : detail && (
              <>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <h2 className="text-3xl font-bold">{detail.student.name}</h2>
                  {(() => {
                    const graded = detail.courses.filter((c) => c.grade && GP[c.grade]);
                    const gpa = graded.length ? graded.reduce((s, c) => s + (GP[c.grade!] || 0), 0) / graded.length : null;
                    return gpa ? (
                      <div className="glass rounded-2xl px-6 py-3 text-center">
                        <span className="text-xs text-white/30 block">GPA</span>
                        <span className="text-4xl font-bold" style={{ color: gpa >= 3.0 ? '#22C55E' : gpa >= 2.0 ? '#FBBF24' : '#EF4444' }}>{gpa.toFixed(2)}</span>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                    {(['overview', 'visual', 'assignments', 'history'] as const).map((t) => (
                      <button key={t} onClick={() => setView(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === t ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                        {t === 'overview' ? '📊 Grades' : t === 'visual' ? '📈 Visual' : t === 'assignments' ? '📝 Assignments' : '📜 History'}
                      </button>
                    ))}
                  </div>
                  {(view === 'overview' || view === 'visual') && (
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white [&>option]:bg-gray-900">
                      <option value="grade-high">Best → Worst</option><option value="grade-low">Worst → Best</option>
                      <option value="score">By Score</option><option value="name">By Name</option>
                    </select>
                  )}
                </div>

                {view === 'overview' && (
                  <div className="space-y-3">
                    {sortCourses(detail.courses).map((course, i) => {
                      const [subject, teacher] = cleanName(course.courseName).split(' - ');
                      const cd = course as CourseDetail;
                      const isExpanded = expandedCourse === course.courseId;
                      const missing = cd.assignments?.filter((a) => a.missing) || [];
                      const late = cd.assignments?.filter((a) => a.late && !a.missing) || [];

                      return (
                        <motion.div key={course.courseId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }} className="glass rounded-xl overflow-hidden">
                          <button onClick={() => setExpandedCourse(isExpanded ? null : course.courseId)}
                            className="w-full p-5 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0"
                              style={{ background: `${getColor(course.grade)}15`, color: getColor(course.grade) }}>
                              {course.grade}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm">{subject}</h3>
                              {teacher && <p className="text-white/30 text-xs">{teacher}</p>}
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${Math.min(course.score || 0, 100)}%`, background: getColor(course.grade) }} />
                                </div>
                                <span className="text-xs text-white/40">{course.score?.toFixed(1)}%</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {missing.length > 0 && <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 text-[9px]">⚠️{missing.length}</span>}
                              {late.length > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[9px]">🕐{late.length}</span>}
                            </div>
                            <span className={`text-white/20 text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                          </button>

                          {/* Expanded assignments */}
                          {isExpanded && cd.assignments && (
                            <div className="border-t border-white/5 px-5 py-3 max-h-[400px] overflow-y-auto">
                              <div className="space-y-1">
                                {cd.assignments.filter((a) => a.submitted || a.missing).sort((a, b) => {
                                  if (a.missing && !b.missing) return -1;
                                  if (!a.missing && b.missing) return 1;
                                  return (b.gradedAt || '').localeCompare(a.gradedAt || '');
                                }).map((a, j) => (
                                  <div key={j} className={`flex items-center gap-3 py-2 px-2 rounded-lg text-sm ${a.missing ? 'bg-red-500/5' : a.late ? 'bg-amber-500/5' : ''}`}>
                                    <span className="text-xs w-10 text-right font-mono" style={{ color: a.missing ? '#EF4444' : a.score !== null ? getColor(a.grade) : '#4B5563' }}>
                                      {a.missing ? 'MISS' : a.score !== null ? a.score.toFixed(0) : '—'}
                                    </span>
                                    <span className="text-white/15 text-xs">/</span>
                                    <span className="text-xs text-white/25 w-6">{a.pointsPossible}</span>
                                    <span className={`flex-1 text-xs truncate ${a.missing ? 'text-red-400' : 'text-white/60'}`}>{a.name}</span>
                                    {a.late && <span className="text-[9px] text-amber-400">LATE</span>}
                                    {a.dueAt && <span className="text-[9px] text-white/15">{new Date(a.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {view === 'visual' && (
                  <div className="space-y-6">
                    <div className="glass rounded-2xl p-6">
                      <h3 className="text-sm text-white/40 uppercase tracking-wider mb-6">Course Scores</h3>
                      <div className="space-y-3">
                        {sortCourses(detail.courses).map((course, i) => (
                          <motion.div key={course.courseId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }} className="flex items-center gap-3">
                            <span className="text-xs text-white/40 w-28 truncate text-right">{cleanName(course.courseName).split(' - ')[0]}</span>
                            <div className="flex-1 relative">
                              <div className="h-8 bg-white/5 rounded-lg overflow-hidden">
                                <motion.div className="h-full rounded-lg flex items-center justify-end pr-2"
                                  initial={{ width: 0 }} animate={{ width: `${course.score || 0}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.1 }}
                                  style={{ background: `linear-gradient(90deg, ${getColor(course.grade)}40, ${getColor(course.grade)}80)` }}>
                                  <span className="text-xs font-bold text-white">{course.score?.toFixed(1)}%</span>
                                </motion.div>
                              </div>
                              {[60, 70, 80, 90].map((t) => <div key={t} className="absolute top-0 h-full" style={{ left: `${t}%` }}><div className="w-px h-full bg-white/10" /></div>)}
                            </div>
                            <span className="font-bold text-lg w-8" style={{ color: getColor(course.grade) }}>{course.grade}</span>
                          </motion.div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-4 mt-4 text-[10px] text-white/20"><span>60% D</span><span>70% C</span><span>80% B</span><span>90% A</span></div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(() => {
                        const graded = detail.courses.filter((c) => c.score);
                        const sorted = [...graded].sort((a, b) => (b.score || 0) - (a.score || 0));
                        const avg = graded.reduce((s, c) => s + (c.score || 0), 0) / (graded.length || 1);
                        const totalMissing = detail.courses.reduce((s, c) => s + ((c as CourseDetail).assignments?.filter((a) => a.missing).length || 0), 0);
                        return [
                          { label: 'Highest', value: sorted[0]?.score?.toFixed(1) + '%', sub: cleanName(sorted[0]?.courseName || '').split(' - ')[0], color: '#22C55E' },
                          { label: 'Lowest', value: sorted[sorted.length - 1]?.score?.toFixed(1) + '%', sub: cleanName(sorted[sorted.length - 1]?.courseName || '').split(' - ')[0], color: '#EF4444' },
                          { label: 'Average', value: avg.toFixed(1) + '%', sub: `${graded.length} courses`, color: '#60A5FA' },
                          { label: 'Missing', value: String(totalMissing), sub: 'assignments', color: totalMissing > 0 ? '#EF4444' : '#22C55E' },
                        ].map((stat) => (
                          <div key={stat.label} className="glass rounded-xl p-4 text-center">
                            <span className="text-xs text-white/30 block">{stat.label}</span>
                            <span className="text-2xl font-bold block mt-1" style={{ color: stat.color }}>{stat.value}</span>
                            <span className="text-[10px] text-white/20 truncate block">{stat.sub}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {view === 'assignments' && (
                  <div className="space-y-4">
                    {detail.courses.filter((c) => (c as CourseDetail).assignments?.length > 0).map((course) => {
                      const cd = course as CourseDetail;
                      const missing = cd.assignments.filter((a) => a.missing);
                      if (missing.length === 0) return null;
                      return (
                        <div key={course.courseId} className="glass rounded-xl p-4">
                          <h3 className="font-bold text-sm mb-3 text-red-400">⚠️ {cleanName(course.courseName).split(' - ')[0]} — {missing.length} missing</h3>
                          {missing.map((a, i) => (
                            <div key={i} className="flex items-center gap-3 py-2">
                              <span className="text-red-400">❌</span>
                              <span className="text-sm flex-1">{a.name}</span>
                              <span className="text-xs text-white/20">{a.pointsPossible} pts</span>
                              {a.dueAt && <span className="text-xs text-red-400/50">{new Date(a.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    {detail.courses.every((c) => !(c as CourseDetail).assignments?.some((a) => a.missing)) && (
                      <div className="text-center py-12 text-white/20"><div className="text-4xl mb-3">✅</div><p>No missing assignments!</p></div>
                    )}
                  </div>
                )}

                {view === 'history' && (
                  <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4">📜 Past Semesters</h3>
                    {detail.pastCourses.length > 0 ? (
                      <div className="space-y-2">
                        {detail.pastCourses.map((c, i) => (
                          <div key={i} className="flex items-center gap-3 py-2">
                            <span className="font-bold text-sm w-6" style={{ color: getColor(c.grade) }}>{c.grade}</span>
                            <span className="text-sm flex-1 text-white/60">{cleanName(c.courseName)}</span>
                            <span className="text-xs text-white/25">{c.score?.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/20 text-sm">No past semester data available.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
