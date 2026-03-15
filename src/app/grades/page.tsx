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

export default function GradesPage() {
  const [data, setData] = useState<{ students: StudentData[]; lastUpdated: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [view, setView] = useState<'overview' | 'detail'>('overview');

  useEffect(() => {
    fetch('/api/grades')
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const getGradeColor = (grade: string | null) => grade ? (GRADE_COLORS[grade] || '#9CA3AF') : '#4B5563';

  const getScoreBar = (score: number | null) => {
    if (!score) return 0;
    return Math.min(score, 100);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center relative">
      <ThemedBackground theme="events" />
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">📚</div>
        <p className="text-white/40">Loading grades from Canvas...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center relative">
      <ThemedBackground theme="events" />
      <div className="glass rounded-2xl p-8 max-w-md text-center">
        <div className="text-4xl mb-3">❌</div>
        <p className="text-red-400">{error}</p>
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
          {data?.lastUpdated && (
            <span className="text-white/20 text-xs">Updated {formatDate(data.lastUpdated)}</span>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">📚 Grades Dashboard</h1>

        {/* Student selector */}
        {!selected ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {students.map((student, i) => {
              const avgScore = student.courses.filter((c) => c.score).reduce((s, c) => s + (c.score || 0), 0) /
                (student.courses.filter((c) => c.score).length || 1);
              const missingCount = student.missingAssignments.length;
              const lowGrades = student.courses.filter((c) => c.grade && ['D+', 'D', 'D-', 'F'].includes(c.grade));

              return (
                <motion.button key={student.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedStudent(student.id)}
                  className="glass rounded-2xl p-6 text-left hover:border-white/15 transition-all group">

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

                  {/* Grade summary bars */}
                  <div className="space-y-1.5 mb-4">
                    {student.courses.filter((c) => c.grade).slice(0, 6).map((c) => (
                      <div key={c.courseId} className="flex items-center gap-2">
                        <span className="text-[10px] text-white/30 w-24 truncate">{c.courseName.replace('25-26 ', '').split(' - ')[0]}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${getScoreBar(c.score)}%`, background: getGradeColor(c.grade) }} />
                        </div>
                        <span className="text-xs font-bold w-6" style={{ color: getGradeColor(c.grade) }}>{c.grade}</span>
                      </div>
                    ))}
                  </div>

                  {/* Alerts */}
                  <div className="flex gap-2">
                    {missingCount > 0 && (
                      <span className="px-2 py-1 rounded-lg bg-red-500/15 text-red-400 text-[10px] font-bold">
                        ⚠️ {missingCount} missing
                      </span>
                    )}
                    {lowGrades.length > 0 && (
                      <span className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-[10px] font-bold">
                        📉 {lowGrades.length} low grade{lowGrades.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {missingCount === 0 && lowGrades.length === 0 && (
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                        ✅ On track
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          /* ====== STUDENT DETAIL VIEW ====== */
          <div>
            <button onClick={() => setSelectedStudent(null)}
              className="text-white/40 hover:text-white text-sm mb-6">← Back to all students</button>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold">{selected.name}</h2>
                <p className="text-white/40 text-sm">{selected.courses.filter((c) => c.grade).length} active courses</p>
              </div>
              {selected.gpa && (
                <div className="text-center glass rounded-2xl px-6 py-3">
                  <span className="text-xs text-white/30 block">GPA</span>
                  <span className="text-4xl font-bold" style={{ color: selected.gpa >= 3.0 ? '#22C55E' : selected.gpa >= 2.0 ? '#FBBF24' : '#EF4444' }}>
                    {selected.gpa.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* View toggle */}
            <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6 max-w-md">
              <button onClick={() => setView('overview')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${view === 'overview' ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                📊 Grades
              </button>
              <button onClick={() => setView('detail')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${view === 'detail' ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                📋 Assignments
              </button>
            </div>

            {view === 'overview' ? (
              /* Grade cards */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selected.courses.filter((c) => c.grade).map((course, i) => {
                  const cleanName = course.courseName.replace('25-26 ', '');
                  const [subject, teacher] = cleanName.split(' - ');
                  return (
                    <motion.div key={course.courseId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass rounded-xl p-5 flex items-center gap-4">
                      {/* Big grade */}
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl flex-shrink-0"
                        style={{ background: `${getGradeColor(course.grade)}15`, color: getGradeColor(course.grade) }}>
                        {course.grade}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{subject}</h3>
                        {teacher && <p className="text-white/30 text-xs">{teacher}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${getScoreBar(course.score)}%`, background: getGradeColor(course.grade) }} />
                          </div>
                          <span className="text-xs text-white/40">{course.score?.toFixed(1)}%</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Assignments view */
              <div className="space-y-6">
                {/* Missing assignments */}
                {selected.missingAssignments.length > 0 && (
                  <div className="glass rounded-2xl p-5">
                    <h3 className="text-lg font-bold text-red-400 mb-4">⚠️ Missing Assignments ({selected.missingAssignments.length})</h3>
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

                {/* Upcoming assignments */}
                <div className="glass rounded-2xl p-5">
                  <h3 className="text-lg font-bold mb-4">📅 Upcoming Assignments ({selected.upcomingAssignments.length})</h3>
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
