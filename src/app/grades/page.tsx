'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ThemedBackground from '@/components/ThemedBackground';

interface CourseGrade { courseId: number; courseName: string; grade: string | null; score: number | null; finalGrade?: string | null; finalScore?: number | null; }
interface AssignmentDetail {
  name: string; score: number | null; pointsPossible: number; percentage: number | null; grade: string | null;
  late: boolean; missing: boolean; submitted: boolean; dueAt: string | null; gradedAt: string | null; submittedAt: string | null;
  assignmentGroupName: string | null; assignmentGroupWeight: number;
}
interface CourseDetail extends CourseGrade {
  assignments: AssignmentDetail[];
  assignmentGroups: Array<{ name: string; weight: number }>;
}
interface GradingPeriod { id: number; title: string; start_date: string; end_date: string; }
interface StudentOverview {
  id: number; name: string; courses: CourseGrade[]; yearGpa: number | null; semesterGpa: number | null; currentPeriod: string | null;
  gradingPeriods: GradingPeriod[];
}
interface StudentDetail { student: { id: number; name: string }; courses: CourseDetail[]; pastCourses: CourseGrade[]; gradingPeriods: GradingPeriod[]; lastUpdated: string; }

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
  const [view, setView] = useState<'overview' | 'analytics' | 'assignments' | 'visual' | 'history'>('overview');
  const [gpaPeriod, setGpaPeriod] = useState<'current' | 'withzeros'>('current');
  const [dateFilter, setDateFilter] = useState('sem-236'); // Default to Semester 2
  const [courseFilter, setCourseFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
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
            <span className="text-white/15 text-sm">{lastRefresh ? timeSince(lastRefresh) : ''}</span>
            <button onClick={() => { if (selectedStudent) fetchDetail(selectedStudent); else fetchOverview(); }}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-white/30 hover:text-white text-sm transition-all">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="text-3xl font-bold">📚 Grades Dashboard</h1>
          {!selectedStudent && (
            <div className="flex gap-1 bg-white/5 rounded-xl p-1">
              <button onClick={() => setGpaPeriod('current')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${gpaPeriod === 'current' ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                Current Grades
              </button>
              <button onClick={() => setGpaPeriod('withzeros')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${gpaPeriod === 'withzeros' ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                With Missing as 0
              </button>
            </div>
          )}
        </div>

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
                    {(() => {
                      const gpa = gpaPeriod === 'current' ? student.yearGpa : student.semesterGpa;
                      const label = gpaPeriod === 'current' ? 'GPA' : 'GPA (w/ zeros)';
                      return gpa ? (
                        <div className="text-right">
                          <span className="text-sm text-white/30">{label}</span>
                          <p className="text-3xl font-bold" style={{ color: gpa >= 3.0 ? '#22C55E' : gpa >= 2.0 ? '#FBBF24' : '#EF4444' }}>{gpa.toFixed(2)}</p>
                          {gpaPeriod === 'withzeros' && student.yearGpa && gpa < student.yearGpa && (
                            <p className="text-sm text-red-400">↓ {(student.yearGpa - gpa).toFixed(2)} from missing work</p>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <div className="space-y-1.5 mb-4">
                    {graded.sort((a, b) => GRADE_ORDER.indexOf(a.grade!) - GRADE_ORDER.indexOf(b.grade!)).map((c) => {
                      const displayGrade = gpaPeriod === 'withzeros' ? (c.finalGrade || c.grade) : c.grade;
                      const displayScore = gpaPeriod === 'withzeros' ? (c.finalScore || c.score) : c.score;
                      return (
                        <div key={c.courseId} className="flex items-center gap-2">
                          <span className="text-sm text-white/30 w-24 truncate">{cleanName(c.courseName).split(' - ')[0]}</span>
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(displayScore || 0, 100)}%`, background: getColor(displayGrade) }} />
                          </div>
                          <span className="text-sm font-bold w-6" style={{ color: getColor(displayGrade) }}>{displayGrade}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    {low.length > 0 && <span className="px-2 py-1 rounded-lg bg-red-500/15 text-red-400 text-sm font-bold">📉 {low.length} low</span>}
                    {low.length === 0 && <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-sm font-bold">✅ On track</span>}
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
                        <span className="text-sm text-white/30 block">GPA</span>
                        <span className="text-4xl font-bold" style={{ color: gpa >= 3.0 ? '#22C55E' : gpa >= 2.0 ? '#FBBF24' : '#EF4444' }}>{gpa.toFixed(2)}</span>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                    {(['overview', 'analytics', 'visual', 'assignments', 'history'] as const).map((t) => (
                      <button key={t} onClick={() => setView(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === t ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                        {t === 'overview' ? '📊 Grades' : t === 'analytics' ? '🔍 Analytics' : t === 'visual' ? '📈 Visual' : t === 'assignments' ? '📝 Missing' : '📜 History'}
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
                              {teacher && <p className="text-white/30 text-sm">{teacher}</p>}
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${Math.min(course.score || 0, 100)}%`, background: getColor(course.grade) }} />
                                </div>
                                <span className="text-sm text-white/40">{course.score?.toFixed(1)}%</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {missing.length > 0 && <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 text-sm">⚠️{missing.length}</span>}
                              {late.length > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-sm">🕐{late.length}</span>}
                            </div>
                            <span className={`text-white/20 text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                          </button>

                          {/* Expanded assignments — filtered to current semester */}
                          {isExpanded && (cd.assignments || []).length > 0 && (() => {
                            // Only show Semester 2 assignments (Jan 6, 2026+)
                            const sem2Start = new Date('2026-01-06T00:00:00');
                            const semesterAssignments = (cd.assignments || [])
                              .filter((a) => {
                                if (!a.submitted && !a.missing) return false;
                                const aDate = a.gradedAt || a.dueAt || a.submittedAt;
                                if (!aDate) return true; // Include if no date (might be current)
                                try { return new Date(aDate) >= sem2Start; } catch { return true; }
                              })
                              .sort((a, b) => {
                                if (a.missing && !b.missing) return -1;
                                if (!a.missing && b.missing) return 1;
                                return (b.gradedAt || '').localeCompare(a.gradedAt || '');
                              });
                            return semesterAssignments.length > 0 ? (
                            <div className="border-t border-white/5 px-5 py-3 max-h-[400px] overflow-y-auto">
                              <div className="text-sm text-white/20 mb-2 flex items-center justify-between">
                                <span>Semester 2 assignments ({semesterAssignments.length})</span>
                              </div>
                              <div className="space-y-1">
                                {semesterAssignments.map((a, j) => (
                                  <div key={j} className={`flex items-center gap-3 py-2 px-2 rounded-lg text-sm ${a.missing ? 'bg-red-500/5' : a.late ? 'bg-amber-500/5' : ''}`}>
                                    <span className="text-sm w-10 text-right font-mono" style={{ color: a.missing ? '#EF4444' : a.score !== null ? getColor(a.grade) : '#4B5563' }}>
                                      {a.missing ? 'MISS' : a.score !== null ? `${a.score}` : '—'}
                                    </span>
                                    <span className="text-white/15 text-sm">/</span>
                                    <span className="text-sm text-white/25 w-6">{a.pointsPossible}</span>
                                    <span className={`flex-1 text-sm truncate ${a.missing ? 'text-red-400' : 'text-white/60'}`}>{a.name || '?'}</span>
                                    {a.late && <span className="text-sm text-amber-400">LATE</span>}
                                    {a.dueAt && (() => { try { return <span className="text-sm text-white/15">{new Date(a.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>; } catch { return null; } })()}
                                  </div>
                                ))}
                              </div>
                            </div>
                            ) : (
                              <div className="border-t border-white/5 px-5 py-4 text-white/20 text-sm">No assignments this semester.</div>
                            );
                          })()}
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
                            <span className="text-sm text-white/40 w-28 truncate text-right">{cleanName(course.courseName).split(' - ')[0]}</span>
                            <div className="flex-1 relative">
                              <div className="h-8 bg-white/5 rounded-lg overflow-hidden">
                                <motion.div className="h-full rounded-lg flex items-center justify-end pr-2"
                                  initial={{ width: 0 }} animate={{ width: `${course.score || 0}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.1 }}
                                  style={{ background: `linear-gradient(90deg, ${getColor(course.grade)}40, ${getColor(course.grade)}80)` }}>
                                  <span className="text-sm font-bold text-white">{course.score?.toFixed(1)}%</span>
                                </motion.div>
                              </div>
                              {[60, 70, 80, 90].map((t) => <div key={t} className="absolute top-0 h-full" style={{ left: `${t}%` }}><div className="w-px h-full bg-white/10" /></div>)}
                            </div>
                            <span className="font-bold text-lg w-8" style={{ color: getColor(course.grade) }}>{course.grade}</span>
                          </motion.div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-4 mt-4 text-sm text-white/20"><span>60% D</span><span>70% C</span><span>80% B</span><span>90% A</span></div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(() => {
                        const graded = detail.courses.filter((c) => c.score);
                        const sorted = [...graded].sort((a, b) => (b.score || 0) - (a.score || 0));
                        const avg = graded.reduce((s, c) => s + (c.score || 0), 0) / (graded.length || 1);
                        const totalMissing = detail.courses.reduce((s, c) => s + (((c as CourseDetail).assignments || []).filter((a) => a.missing).length), 0);
                        return [
                          { label: 'Highest', value: sorted[0]?.score?.toFixed(1) + '%', sub: cleanName(sorted[0]?.courseName || '').split(' - ')[0], color: '#22C55E' },
                          { label: 'Lowest', value: sorted[sorted.length - 1]?.score?.toFixed(1) + '%', sub: cleanName(sorted[sorted.length - 1]?.courseName || '').split(' - ')[0], color: '#EF4444' },
                          { label: 'Average', value: avg.toFixed(1) + '%', sub: `${graded.length} courses`, color: '#60A5FA' },
                          { label: 'Missing', value: String(totalMissing), sub: 'assignments', color: totalMissing > 0 ? '#EF4444' : '#22C55E' },
                        ].map((stat) => (
                          <div key={stat.label} className="glass rounded-xl p-4 text-center">
                            <span className="text-sm text-white/30 block">{stat.label}</span>
                            <span className="text-2xl font-bold block mt-1" style={{ color: stat.color }}>{stat.value}</span>
                            <span className="text-sm text-white/20 truncate block">{stat.sub}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {view === 'analytics' && (() => {
                  // Build all assignments across all courses
                  const allAssignments = detail.courses.flatMap((c) => {
                    const cd = c as CourseDetail;
                    if (!cd.assignments) return [];
                    return cd.assignments.map((a) => ({ ...a, courseName: cleanName(c.courseName).split(' - ')[0], courseGrade: c.grade }));
                  });

                  // Get unique categories
                  const categories = [...new Set(allAssignments.map((a) => a.assignmentGroupName).filter(Boolean))] as string[];

                  // Get grading periods
                  const gPeriods = detail.gradingPeriods || [];

                  // Apply filters
                  const now = new Date();
                  const filtered = allAssignments.filter((a) => {
                    if (courseFilter !== 'all' && a.courseName !== courseFilter) return false;
                    if (categoryFilter !== 'all' && a.assignmentGroupName !== categoryFilter) return false;
                    if (gradeFilter === 'passing' && a.percentage !== null && a.percentage < 70) return false;
                    if (gradeFilter === 'failing' && (a.percentage === null || a.percentage >= 70)) return false;
                    if (gradeFilter === 'missing' && !a.missing) return false;
                    if (gradeFilter === 'late' && !a.late) return false;

                    // Date/semester filtering
                    if (dateFilter !== 'all') {
                      const aDate = a.gradedAt || a.dueAt || a.submittedAt;

                      // Semester filter — strict: exclude assignments outside the period
                      if (dateFilter.startsWith('sem-')) {
                        const semId = parseInt(dateFilter.split('-')[1]);
                        const period = gPeriods.find((p) => p.id === semId);
                        if (period) {
                          const start = new Date(period.start_date);
                          const end = new Date(period.end_date);
                          if (!aDate) return false; // No date = can't confirm it's in this semester
                          const d = new Date(aDate);
                          if (d < start || d > end) return false;
                        }
                      } else if (aDate) {
                        // Relative date filters
                        const d = new Date(aDate);
                        const daysAgo = (now.getTime() - d.getTime()) / 86400000;
                        if (dateFilter === '7d' && daysAgo > 7) return false;
                        if (dateFilter === '14d' && daysAgo > 14) return false;
                        if (dateFilter === '30d' && daysAgo > 30) return false;
                        if (dateFilter === '90d' && daysAgo > 90) return false;
                      }
                    }
                    return true;
                  });

                  // Stats
                  const graded = filtered.filter((a) => a.percentage !== null);
                  const avgPct = graded.length ? graded.reduce((s, a) => s + (a.percentage || 0), 0) / graded.length : 0;
                  const missingCount = filtered.filter((a) => a.missing).length;
                  const lateCount = filtered.filter((a) => a.late).length;
                  const perfectCount = graded.filter((a) => a.percentage === 100).length;
                  const failingCount = graded.filter((a) => (a.percentage || 0) < 60).length;

                  // Trend by week
                  const weeklyData: Record<string, { scores: number[]; count: number }> = {};
                  graded.forEach((a) => {
                    const d = a.gradedAt || a.dueAt;
                    if (!d) return;
                    const date = new Date(d);
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    const key = weekStart.toISOString().split('T')[0];
                    if (!weeklyData[key]) weeklyData[key] = { scores: [], count: 0 };
                    weeklyData[key].scores.push(a.percentage || 0);
                    weeklyData[key].count++;
                  });
                  const weeks = Object.entries(weeklyData).sort(([a], [b]) => a.localeCompare(b));
                  const maxWeekAvg = Math.max(...weeks.map(([, w]) => w.scores.reduce((s, v) => s + v, 0) / w.scores.length), 100);

                  // Per-course performance
                  const courseNames = [...new Set(allAssignments.map((a) => a.courseName))];
                  const coursePerf = courseNames.map((name) => {
                    const ca = graded.filter((a) => a.courseName === name);
                    return { name, avg: ca.length ? ca.reduce((s, a) => s + (a.percentage || 0), 0) / ca.length : 0, count: ca.length, missing: filtered.filter((a) => a.courseName === name && a.missing).length };
                  }).sort((a, b) => b.avg - a.avg);

                  // Strengths & weaknesses
                  const strengths = coursePerf.filter((c) => c.avg >= 85);
                  const concerns = coursePerf.filter((c) => c.avg < 75 || c.missing > 0);

                  return (
                    <div className="space-y-6">
                      {/* Filters */}
                      <div className="glass rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-white/40 font-medium">🔍 Filters</span>
                          {(dateFilter !== 'all' || courseFilter !== 'all' || gradeFilter !== 'all' || categoryFilter !== 'all') && (
                            <button onClick={() => { setDateFilter('all'); setCourseFilter('all'); setGradeFilter('all'); setCategoryFilter('all'); }}
                              className="text-sm text-red-400/60 hover:text-red-400">Clear all</button>
                          )}
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <div>
                            <label className="text-sm text-white/25 block mb-1">Time Period</label>
                            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [&>option]:bg-gray-900">
                              <option value="all">All Time</option>
                              <option value="7d">Last 7 Days</option>
                              <option value="14d">Last 2 Weeks</option>
                              <option value="30d">Last 30 Days</option>
                              <option value="90d">Last 90 Days</option>
                              {gPeriods.map((p) => (
                                <option key={p.id} value={`sem-${p.id}`}>📅 {p.title}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-sm text-white/25 block mb-1">Course</label>
                            <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [&>option]:bg-gray-900">
                              <option value="all">All Courses</option>
                              {courseNames.map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-sm text-white/25 block mb-1">Category</label>
                            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [&>option]:bg-gray-900">
                              <option value="all">All Categories</option>
                              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-sm text-white/25 block mb-1">Status</label>
                            <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [&>option]:bg-gray-900">
                              <option value="all">All</option>
                              <option value="passing">✅ Passing (70%+)</option>
                              <option value="failing">❌ Failing (&lt;70%)</option>
                              <option value="missing">⚠️ Missing</option>
                              <option value="late">🕐 Late</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Summary cards */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        {[
                          { label: 'Avg Score', value: avgPct.toFixed(1) + '%', color: avgPct >= 80 ? '#22C55E' : avgPct >= 70 ? '#FBBF24' : '#EF4444' },
                          { label: 'Total', value: String(filtered.length), color: '#60A5FA' },
                          { label: 'Perfect', value: String(perfectCount), color: '#22C55E' },
                          { label: 'Failing', value: String(failingCount), color: failingCount > 0 ? '#EF4444' : '#22C55E' },
                          { label: 'Missing', value: String(missingCount), color: missingCount > 0 ? '#EF4444' : '#22C55E' },
                          { label: 'Late', value: String(lateCount), color: lateCount > 0 ? '#F59E0B' : '#22C55E' },
                        ].map((s) => (
                          <div key={s.label} className="glass rounded-xl p-3 text-center">
                            <span className="text-sm text-white/30 block">{s.label}</span>
                            <span className="text-xl font-bold" style={{ color: s.color }}>{s.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Strengths & Concerns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="glass rounded-xl p-5">
                          <h3 className="text-sm font-bold text-emerald-400 mb-3">💪 Strengths</h3>
                          {strengths.length > 0 ? strengths.map((c) => (
                            <div key={c.name} className="flex items-center justify-between py-1.5">
                              <span className="text-sm text-white/60">{c.name}</span>
                              <span className="text-sm font-bold text-emerald-400">{c.avg.toFixed(1)}%</span>
                            </div>
                          )) : <p className="text-white/20 text-sm">Keep working!</p>}
                        </div>
                        <div className="glass rounded-xl p-5">
                          <h3 className="text-sm font-bold text-red-400 mb-3">⚠️ Areas of Concern</h3>
                          {concerns.length > 0 ? concerns.map((c) => (
                            <div key={c.name} className="flex items-center justify-between py-1.5">
                              <span className="text-sm text-white/60">{c.name}</span>
                              <div className="text-right">
                                <span className="text-sm font-bold" style={{ color: c.avg < 70 ? '#EF4444' : '#F59E0B' }}>{c.avg.toFixed(1)}%</span>
                                {c.missing > 0 && <span className="text-sm text-red-400 ml-2">{c.missing} missing</span>}
                              </div>
                            </div>
                          )) : <p className="text-emerald-400 text-sm">✅ All good!</p>}
                        </div>
                      </div>

                      {/* Weekly trend chart */}
                      {weeks.length > 1 && (
                        <div className="glass rounded-xl p-5">
                          <h3 className="text-sm font-bold text-white/50 mb-4">📈 Weekly Score Trend</h3>
                          <div className="flex items-end gap-1 h-40">
                            {weeks.slice(-12).map(([week, data]) => {
                              const avg = data.scores.reduce((s, v) => s + v, 0) / data.scores.length;
                              const height = (avg / maxWeekAvg) * 100;
                              return (
                                <div key={week} className="flex-1 flex flex-col items-center gap-1">
                                  <span className="text-sm text-white/30">{Math.round(avg)}%</span>
                                  <motion.div className="w-full rounded-t-lg min-h-[4px]"
                                    initial={{ height: 0 }} animate={{ height: `${height}%` }}
                                    transition={{ duration: 0.5 }}
                                    style={{ background: avg >= 80 ? '#22C55E' : avg >= 70 ? '#FBBF24' : '#EF4444' }} />
                                  <span className="text-sm text-white/15 -rotate-45 origin-top-left whitespace-nowrap">
                                    {new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Per-course breakdown */}
                      <div className="glass rounded-xl p-5">
                        <h3 className="text-sm font-bold text-white/50 mb-4">📊 Per-Course Breakdown</h3>
                        <div className="space-y-3">
                          {coursePerf.map((c) => (
                            <div key={c.name} className="flex items-center gap-3">
                              <span className="text-sm text-white/40 w-28 truncate text-right">{c.name}</span>
                              <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden relative">
                                <motion.div className="h-full rounded-lg"
                                  initial={{ width: 0 }} animate={{ width: `${c.avg}%` }}
                                  transition={{ duration: 0.6 }}
                                  style={{ background: c.avg >= 80 ? '#22C55E80' : c.avg >= 70 ? '#FBBF2480' : '#EF444480' }} />
                                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                                  {c.avg.toFixed(1)}%
                                </span>
                              </div>
                              <span className="text-sm text-white/20 w-12">{c.count} asgn</span>
                              {c.missing > 0 && <span className="text-sm text-red-400">⚠️{c.missing}</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Category performance */}
                      {categories.length > 1 && (
                        <div className="glass rounded-xl p-5">
                          <h3 className="text-sm font-bold text-white/50 mb-4">🏷️ Performance by Category</h3>
                          <div className="space-y-3">
                            {categories.map((cat) => {
                              const catAssignments = graded.filter((a) => a.assignmentGroupName === cat);
                              if (catAssignments.length === 0) return null;
                              const avg = catAssignments.reduce((s, a) => s + (a.percentage || 0), 0) / catAssignments.length;
                              const weight = catAssignments[0]?.assignmentGroupWeight || 0;
                              return (
                                <div key={cat} className="flex items-center gap-3">
                                  <span className="text-sm text-white/40 w-40 truncate text-right">{cat}{weight > 0 ? ` (${weight}%)` : ''}</span>
                                  <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden relative">
                                    <motion.div className="h-full rounded-lg"
                                      initial={{ width: 0 }} animate={{ width: `${avg}%` }}
                                      transition={{ duration: 0.6 }}
                                      style={{ background: avg >= 80 ? '#22C55E80' : avg >= 70 ? '#FBBF2480' : '#EF444480' }} />
                                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{avg.toFixed(1)}%</span>
                                  </div>
                                  <span className="text-sm text-white/20 w-8">{catAssignments.length}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Semester comparison */}
                      {gPeriods.length > 1 && (
                        <div className="glass rounded-xl p-5">
                          <h3 className="text-sm font-bold text-white/50 mb-4">📅 Semester Comparison</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {gPeriods.map((period) => {
                              const semAssignments = allAssignments.filter((a) => {
                                const d = a.gradedAt || a.dueAt;
                                if (!d) return false;
                                const date = new Date(d);
                                return date >= new Date(period.start_date) && date <= new Date(period.end_date);
                              });
                              const semGraded = semAssignments.filter((a) => a.percentage !== null);
                              const semAvg = semGraded.length ? semGraded.reduce((s, a) => s + (a.percentage || 0), 0) / semGraded.length : 0;
                              const semMissing = semAssignments.filter((a) => a.missing).length;
                              const semLate = semAssignments.filter((a) => a.late).length;
                              const semPerfect = semGraded.filter((a) => a.percentage === 100).length;

                              return (
                                <div key={period.id} className="p-4 bg-white/[0.02] rounded-xl">
                                  <h4 className="font-bold text-sm mb-1">{period.title}</h4>
                                  <p className="text-sm text-white/20 mb-3">
                                    {new Date(period.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(period.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </p>
                                  <div className="grid grid-cols-2 gap-2 text-center">
                                    <div>
                                      <span className="text-2xl font-bold" style={{ color: semAvg >= 80 ? '#22C55E' : semAvg >= 70 ? '#FBBF24' : '#EF4444' }}>
                                        {semAvg > 0 ? semAvg.toFixed(1) + '%' : '—'}
                                      </span>
                                      <span className="text-sm text-white/25 block">Average</span>
                                    </div>
                                    <div>
                                      <span className="text-2xl font-bold text-white/50">{semGraded.length}</span>
                                      <span className="text-sm text-white/25 block">Graded</span>
                                    </div>
                                    <div>
                                      <span className="text-lg font-bold" style={{ color: semMissing > 0 ? '#EF4444' : '#22C55E' }}>{semMissing}</span>
                                      <span className="text-sm text-white/25 block">Missing</span>
                                    </div>
                                    <div>
                                      <span className="text-lg font-bold text-emerald-400">{semPerfect}</span>
                                      <span className="text-sm text-white/25 block">Perfect</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Assignment score distribution */}
                      <div className="glass rounded-xl p-5">
                        <h3 className="text-sm font-bold text-white/50 mb-4">📊 Score Distribution</h3>
                        <div className="flex items-end gap-1 h-32">
                          {(() => {
                            const buckets = Array(10).fill(0);
                            graded.forEach((a) => {
                              const idx = Math.min(Math.floor((a.percentage || 0) / 10), 9);
                              buckets[idx]++;
                            });
                            const maxBucket = Math.max(...buckets, 1);
                            return buckets.map((count, i) => (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-sm text-white/20">{count}</span>
                                <motion.div className="w-full rounded-t-lg min-h-[2px]"
                                  initial={{ height: 0 }} animate={{ height: `${(count / maxBucket) * 100}%` }}
                                  transition={{ duration: 0.4, delay: i * 0.05 }}
                                  style={{ background: i >= 9 ? '#22C55E' : i >= 7 ? '#60A5FA' : i >= 6 ? '#FBBF24' : '#EF4444' }} />
                                <span className="text-sm text-white/20">{i * 10}-{i * 10 + 9}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Filtered assignment table */}
                      <div className="glass rounded-xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white/50">All Assignments ({filtered.length})</h3>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-[#0a0a1f]">
                              <tr className="text-white/30 border-b border-white/5">
                                <th className="text-left py-2 px-3">Course</th>
                                <th className="text-left py-2 px-3">Assignment</th>
                                <th className="text-right py-2 px-3">Score</th>
                                <th className="text-right py-2 px-3">%</th>
                                <th className="text-center py-2 px-3">Status</th>
                                <th className="text-right py-2 px-3">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.sort((a, b) => {
                                if (a.missing && !b.missing) return -1;
                                if (!a.missing && b.missing) return 1;
                                return (b.gradedAt || b.dueAt || '').localeCompare(a.gradedAt || a.dueAt || '');
                              }).slice(0, 100).map((a, i) => (
                                <tr key={i} className={`border-b border-white/[0.03] ${a.missing ? 'bg-red-500/5' : a.late ? 'bg-amber-500/5' : ''}`}>
                                  <td className="py-2 px-3 text-white/40">{a.courseName}</td>
                                  <td className="py-2 px-3 text-white/60 max-w-[200px] truncate">{a.name}</td>
                                  <td className="py-2 px-3 text-right font-mono" style={{ color: a.missing ? '#EF4444' : getColor(a.courseGrade) }}>
                                    {a.missing ? 'MISS' : a.score !== null ? `${a.score}/${a.pointsPossible}` : '—'}
                                  </td>
                                  <td className="py-2 px-3 text-right font-bold" style={{ color: a.percentage !== null ? (a.percentage >= 80 ? '#22C55E' : a.percentage >= 70 ? '#FBBF24' : '#EF4444') : '#4B5563' }}>
                                    {a.percentage !== null ? a.percentage + '%' : '—'}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    {a.missing ? <span className="text-red-400">⚠️</span> : a.late ? <span className="text-amber-400">🕐</span> : a.submitted ? <span className="text-emerald-400">✓</span> : '—'}
                                  </td>
                                  <td className="py-2 px-3 text-right text-white/20">
                                    {(() => { try { const d = a.gradedAt || a.dueAt; return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'; } catch { return '—'; } })()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {view === 'assignments' && (
                  <div className="space-y-4">
                    {detail.courses.filter((c) => (c as CourseDetail).assignments?.length).map((course) => {
                      const cd = course as CourseDetail;
                      const missing = (cd.assignments || []).filter((a) => a.missing);
                      if (missing.length === 0) return null;
                      return (
                        <div key={course.courseId} className="glass rounded-xl p-4">
                          <h3 className="font-bold text-sm mb-3 text-red-400">⚠️ {cleanName(course.courseName).split(' - ')[0]} — {missing.length} missing</h3>
                          {missing.map((a, i) => (
                            <div key={i} className="flex items-center gap-3 py-2">
                              <span className="text-red-400">❌</span>
                              <span className="text-sm flex-1">{a.name}</span>
                              <span className="text-sm text-white/20">{a.pointsPossible} pts</span>
                              {a.dueAt && <span className="text-sm text-red-400/50">{new Date(a.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    {detail.courses.every((c) => !((c as CourseDetail).assignments || []).some((a) => a.missing)) && (
                      <div className="text-center py-12 text-white/20"><div className="text-4xl mb-3">✅</div><p>No missing assignments!</p></div>
                    )}
                  </div>
                )}

                {view === 'history' && (
                  <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4">📜 Past Semesters</h3>
                    {(detail.pastCourses || []).length > 0 ? (
                      <div className="space-y-2">
                        {(detail.pastCourses || []).map((c, i) => (
                          <div key={i} className="flex items-center gap-3 py-2">
                            <span className="font-bold text-sm w-6" style={{ color: getColor(c.grade) }}>{c.grade || '?'}</span>
                            <span className="text-sm flex-1 text-white/60">{cleanName(c.courseName || '')}</span>
                            <span className="text-sm text-white/25">{c.score?.toFixed(1) || '?'}%</span>
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
