'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ThemedBackground from '@/components/ThemedBackground';

interface CourseGrade {
  courseId: number; courseName: string; grade: string | null; score: number | null;
}
interface MissingAssignment {
  courseName: string; name: string; dueAt: string | null; pointsPossible: number;
}
interface UpcomingAssignment {
  courseName: string; name: string; dueAt: string; pointsPossible: number;
}
interface StudentData {
  id: number; name: string; courses: CourseGrade[];
  missingAssignments: MissingAssignment[]; upcomingAssignments: UpcomingAssignment[];
  gpa: number | null;
}

const GRADE_COLORS: Record<string, string> = {
  'A+': '#22C55E', 'A': '#22C55E', 'A-': '#4ADE80',
  'B+': '#60A5FA', 'B': '#60A5FA', 'B-': '#93C5FD',
  'C+': '#FBBF24', 'C': '#FBBF24', 'C-': '#FCD34D',
  'D+': '#F97316', 'D': '#F97316', 'D-': '#FB923C',
  'F': '#EF4444',
};

const GRADE_ORDER = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

type SortKey = 'name' | 'grade-high' | 'grade-low' | 'score';

export default function GradesPage() {
  const [data, setData] = useState<{ students: StudentData[]; lastUpdated: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [view, setView] = useState<'overview' | 'assignments' | 'visual'>('overview');
  const [sortBy, setSortBy] = useState<SortKey>('grade-high');

  useEffect(() => {
    fetch('/api/grades')
      .then(async (r) => {
        if (!r.ok) { setError(`API error ${r.status}`); setLoading(false); return; }
        const d = await r.json();
        if (d.error) setError(d.error); else setData(d);
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const getGradeColor = (grade: string | null) => grade ? (GRADE_COLORS[grade] || '#9CA3AF') : '#4B5563';
  const getScoreBar = (score: number | null) => score ? Math.min(score, 100) : 0;
  const cleanName = (name: string) => name.replace('25-26 ', '');

  const sortCourses = (courses: CourseGrade[]) => {
    const graded = courses.filter((c) => c.grade);
    switch (sortBy) {
      case 'name': return graded.sort((a, b) => cleanName(a.courseName).localeCompare(cleanName(b.courseName)));
      case 'grade-high': return graded.sort((a, b) => GRADE_ORDER.indexOf(a.grade!) - GRADE_ORDER.indexOf(b.grade!));
      case 'grade-low': return graded.sort((a, b) => GRADE_ORDER.indexOf(b.grade!) - GRADE_ORDER.indexOf(a.grade!));
      case 'score': return graded.sort((a, b) => (b.score || 0) - (a.score || 0));
      default: return graded;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center relative">
      <ThemedBackground theme="events" />
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">📚</div>
        <p className="text-white/40">Loading grades from Canvas...</p>
        <p className="text-white/20 text-xs mt-2">This may take a few seconds</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center relative">
      <ThemedBackground theme="events" />
      <div className="glass rounded-2xl p-8 max-w-md text-center">
        <div className="text-4xl mb-3">❌</div>
        <p className="text-red-400 mb-2">{error}</p>
        <button onClick={() => { setLoading(true); setError(''); window.location.reload(); }}
          className="px-4 py-2 rounded-xl bg-white/10 text-white/60 text-sm mt-2">Retry</button>
      </div>
    </div>
  );

  const students = data?.students || [];
  const selected = selectedStudent !== null ? students.find((s) => s.id === selectedStudent) : null;

  return (
    <div className="min-h-screen relative">
      <ThemedBackground theme="events" />

      <div className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-sm">← Back to Hub</Link>
          {data?.lastUpdated && <span className="text-white/20 text-xs">Updated {formatDate(data.lastUpdated)}</span>}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">📚 Grades Dashboard</h1>

        {!selected ? (
          /* ====== STUDENT CARDS ====== */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {students.map((student, i) => {
              const gradedCourses = student.courses.filter((c) => c.grade);
              const missingCount = student.missingAssignments.length;
              const lowGrades = gradedCourses.filter((c) => ['D+', 'D', 'D-', 'F'].includes(c.grade!));

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
                        <p className="text-2xl font-bold" style={{ color: student.gpa >= 3.0 ? '#22C55E' : student.gpa >= 2.0 ? '#FBBF24' : '#EF4444' }}>
                          {student.gpa.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {gradedCourses.sort((a, b) => GRADE_ORDER.indexOf(a.grade!) - GRADE_ORDER.indexOf(b.grade!)).slice(0, 7).map((c) => (
                      <div key={c.courseId} className="flex items-center gap-2">
                        <span className="text-[10px] text-white/30 w-20 truncate">{cleanName(c.courseName).split(' - ')[0]}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${getScoreBar(c.score)}%`, background: getGradeColor(c.grade) }} />
                        </div>
                        <span className="text-xs font-bold w-6" style={{ color: getGradeColor(c.grade) }}>{c.grade}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {missingCount > 0 && <span className="px-2 py-1 rounded-lg bg-red-500/15 text-red-400 text-[10px] font-bold">⚠️ {missingCount} missing</span>}
                    {lowGrades.length > 0 && <span className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-[10px] font-bold">📉 {lowGrades.length} low</span>}
                    {missingCount === 0 && lowGrades.length === 0 && <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">✅ On track</span>}
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          /* ====== STUDENT DETAIL ====== */
          <div>
            <button onClick={() => setSelectedStudent(null)} className="text-white/40 hover:text-white text-sm mb-6">← Back to all students</button>

            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-bold">{selected.name}</h2>
                <p className="text-white/40 text-sm">{selected.courses.filter((c) => c.grade).length} courses</p>
              </div>
              {selected.gpa && (
                <div className="glass rounded-2xl px-6 py-3 text-center">
                  <span className="text-xs text-white/30 block">GPA</span>
                  <span className="text-4xl font-bold" style={{ color: selected.gpa >= 3.0 ? '#22C55E' : selected.gpa >= 2.0 ? '#FBBF24' : '#EF4444' }}>
                    {selected.gpa.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Tabs + Sort */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                {([
                  { key: 'overview' as const, label: '📊 Grades' },
                  { key: 'visual' as const, label: '📈 Visual' },
                  { key: 'assignments' as const, label: '📋 Assignments' },
                ]).map((t) => (
                  <button key={t.key} onClick={() => setView(t.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === t.key ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              {(view === 'overview' || view === 'visual') && (
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white [&>option]:bg-gray-900">
                  <option value="grade-high">Best → Worst</option>
                  <option value="grade-low">Worst → Best</option>
                  <option value="score">By Score %</option>
                  <option value="name">By Name</option>
                </select>
              )}
            </div>

            {view === 'overview' && (
              /* Grade cards */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortCourses(selected.courses).map((course, i) => {
                  const [subject, teacher] = cleanName(course.courseName).split(' - ');
                  return (
                    <motion.div key={course.courseId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass rounded-xl p-5 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl flex-shrink-0"
                        style={{ background: `${getGradeColor(course.grade)}15`, color: getGradeColor(course.grade) }}>
                        {course.grade}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{subject}</h3>
                        {teacher && <p className="text-white/30 text-xs">{teacher}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${getScoreBar(course.score)}%`, background: getGradeColor(course.grade) }} />
                          </div>
                          <span className="text-sm font-bold text-white/50">{course.score?.toFixed(1)}%</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {view === 'visual' && (
              /* Visual chart view */
              <div className="space-y-6">
                {/* Bar chart */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-sm text-white/40 uppercase tracking-wider mb-6">Course Scores</h3>
                  <div className="space-y-3">
                    {sortCourses(selected.courses).map((course, i) => {
                      const [subject] = cleanName(course.courseName).split(' - ');
                      const score = course.score || 0;
                      return (
                        <motion.div key={course.courseId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="flex items-center gap-3">
                          <span className="text-xs text-white/40 w-28 truncate text-right">{subject.split(' ').slice(0, 2).join(' ')}</span>
                          <div className="flex-1 relative">
                            <div className="h-8 bg-white/5 rounded-lg overflow-hidden">
                              <motion.div className="h-full rounded-lg flex items-center justify-end pr-2"
                                initial={{ width: 0 }}
                                animate={{ width: `${score}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1 }}
                                style={{ background: `linear-gradient(90deg, ${getGradeColor(course.grade)}40, ${getGradeColor(course.grade)}80)` }}>
                                <span className="text-xs font-bold text-white">{score.toFixed(1)}%</span>
                              </motion.div>
                            </div>
                            {/* Grade thresholds */}
                            <div className="absolute top-0 h-full" style={{ left: '60%' }}>
                              <div className="w-px h-full bg-white/10" />
                            </div>
                            <div className="absolute top-0 h-full" style={{ left: '70%' }}>
                              <div className="w-px h-full bg-white/10" />
                            </div>
                            <div className="absolute top-0 h-full" style={{ left: '80%' }}>
                              <div className="w-px h-full bg-white/10" />
                            </div>
                            <div className="absolute top-0 h-full" style={{ left: '90%' }}>
                              <div className="w-px h-full bg-white/10" />
                            </div>
                          </div>
                          <span className="font-bold text-lg w-8" style={{ color: getGradeColor(course.grade) }}>{course.grade}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                  {/* Legend */}
                  <div className="flex justify-end gap-4 mt-4 text-[10px] text-white/20">
                    <span>60% D</span><span>70% C</span><span>80% B</span><span>90% A</span>
                  </div>
                </div>

                {/* Grade distribution */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-sm text-white/40 uppercase tracking-wider mb-4">Grade Distribution</h3>
                  <div className="flex gap-3 justify-center flex-wrap">
                    {['A', 'B', 'C', 'D', 'F'].map((letter) => {
                      const count = selected.courses.filter((c) => c.grade?.startsWith(letter)).length;
                      const maxCount = Math.max(...['A', 'B', 'C', 'D', 'F'].map((l) => selected.courses.filter((c) => c.grade?.startsWith(l)).length), 1);
                      return (
                        <div key={letter} className="text-center">
                          <div className="w-16 bg-white/5 rounded-lg overflow-hidden mx-auto" style={{ height: '120px' }}>
                            <div className="w-full rounded-lg flex items-end justify-center"
                              style={{ height: '100%' }}>
                              <motion.div className="w-full rounded-t-lg"
                                initial={{ height: 0 }}
                                animate={{ height: `${(count / maxCount) * 100}%` }}
                                transition={{ duration: 0.6 }}
                                style={{ background: GRADE_COLORS[letter] || '#6B7280' }} />
                            </div>
                          </div>
                          <span className="text-lg font-bold mt-2 block" style={{ color: GRADE_COLORS[letter] || '#6B7280' }}>{letter}</span>
                          <span className="text-xs text-white/30">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Highest', value: sortCourses(selected.courses)[0]?.score?.toFixed(1) + '%', sub: cleanName(sortCourses(selected.courses)[0]?.courseName || '').split(' - ')[0], color: '#22C55E' },
                    { label: 'Lowest', value: [...selected.courses.filter((c) => c.score)].sort((a, b) => (a.score || 0) - (b.score || 0))[0]?.score?.toFixed(1) + '%', sub: cleanName([...selected.courses.filter((c) => c.score)].sort((a, b) => (a.score || 0) - (b.score || 0))[0]?.courseName || '').split(' - ')[0], color: '#EF4444' },
                    { label: 'Average', value: (selected.courses.filter((c) => c.score).reduce((s, c) => s + (c.score || 0), 0) / (selected.courses.filter((c) => c.score).length || 1)).toFixed(1) + '%', sub: 'across all courses', color: '#60A5FA' },
                    { label: 'Missing', value: String(selected.missingAssignments.length), sub: 'assignments', color: selected.missingAssignments.length > 0 ? '#EF4444' : '#22C55E' },
                  ].map((stat) => (
                    <div key={stat.label} className="glass rounded-xl p-4 text-center">
                      <span className="text-xs text-white/30 block">{stat.label}</span>
                      <span className="text-2xl font-bold block mt-1" style={{ color: stat.color }}>{stat.value}</span>
                      <span className="text-[10px] text-white/20 truncate block">{stat.sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'assignments' && (
              <div className="space-y-6">
                {selected.missingAssignments.length > 0 && (
                  <div className="glass rounded-2xl p-5">
                    <h3 className="text-lg font-bold text-red-400 mb-4">⚠️ Missing ({selected.missingAssignments.length})</h3>
                    <div className="space-y-2">
                      {selected.missingAssignments.map((a, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-red-500/5 rounded-xl">
                          <span className="text-red-400">❌</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium">{a.name}</h4>
                            <p className="text-white/30 text-xs">{a.courseName}</p>
                          </div>
                          {a.dueAt && <span className="text-xs text-red-400/60">{formatDate(a.dueAt)}</span>}
                          <span className="text-xs text-white/20">{a.pointsPossible} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="glass rounded-2xl p-5">
                  <h3 className="text-lg font-bold mb-4">📅 Upcoming ({selected.upcomingAssignments.length})</h3>
                  {selected.upcomingAssignments.length > 0 ? (
                    <div className="space-y-2">
                      {selected.upcomingAssignments.map((a, i) => {
                        const dueDate = new Date(a.dueAt);
                        const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
                        return (
                          <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl">
                            <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${
                              daysUntil <= 1 ? 'bg-red-500/15' : daysUntil <= 3 ? 'bg-amber-500/15' : 'bg-white/5'}`}>
                              <span className="text-[8px] text-white/30">{dueDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                              <span className="text-sm font-bold">{dueDate.getDate()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate">{a.name}</h4>
                              <p className="text-white/30 text-xs">{a.courseName}</p>
                            </div>
                            <span className={`text-xs font-medium ${daysUntil <= 1 ? 'text-red-400' : daysUntil <= 3 ? 'text-amber-400' : 'text-white/30'}`}>
                              {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                            </span>
                            <span className="text-xs text-white/15">{a.pointsPossible} pts</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-white/20 text-sm">No upcoming assignments.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
