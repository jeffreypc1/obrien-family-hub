import { NextResponse } from 'next/server';

export const maxDuration = 30;

const CANVAS_TOKEN = process.env.CANVAS_API_TOKEN;
const CANVAS_BASE = process.env.CANVAS_BASE_URL || 'https://acalanes.instructure.com/api/v1';

// Students to exclude
const EXCLUDED_STUDENTS = ['Corinna'];

async function canvasFetch(path: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${CANVAS_BASE}${path}`, {
      headers: { Authorization: `Bearer ${CANVAS_TOKEN}` },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return res.json();
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

interface Student { id: number; name: string; }
interface Enrollment {
  course_id: number; type: string;
  grades: { current_grade: string | null; current_score: number | null };
}
interface Course { id: number; name: string; }

export async function GET(request: Request) {
  if (!CANVAS_TOKEN) {
    return NextResponse.json({ error: 'Canvas API token not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const studentId = url.searchParams.get('studentId');
  const detail = url.searchParams.get('detail') === '1';

  try {
    const students: Student[] = await canvasFetch('/users/self/observees') || [];
    const filteredStudents = students.filter((s) => !EXCLUDED_STUDENTS.some((ex) => s.name.includes(ex)));

    const courses: Course[] = await canvasFetch('/courses?per_page=100&enrollment_state=active') || [];
    const courseMap: Record<number, string> = {};
    courses.forEach((c) => { courseMap[c.id] = c.name; });

    // If requesting detail for a specific student
    if (studentId && detail) {
      const sid = Number(studentId);
      const student = filteredStudents.find((s) => s.id === sid);
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

      const enrollments: Enrollment[] = await canvasFetch(
        `/users/${sid}/enrollments?per_page=50&include[]=current_grading_period_scores&state[]=active&state[]=completed`
      ) || [];

      const currentCourses = enrollments
        .filter((e) => e.type === 'StudentEnrollment' && courseMap[e.course_id]?.startsWith('25-26'))
        .map((e) => ({
          courseId: e.course_id,
          courseName: courseMap[e.course_id] || `Course ${e.course_id}`,
          grade: e.grades?.current_grade || null,
          score: e.grades?.current_score || null,
        }))
        .sort((a, b) => a.courseName.localeCompare(b.courseName));

      // Get submissions for each course
      const courseDetails = await Promise.all(currentCourses.filter((c) => c.grade).slice(0, 8).map(async (course) => {
        const submissions = await canvasFetch(
          `/courses/${course.courseId}/students/submissions?student_ids[]=${sid}&per_page=50&include[]=assignment&order_by=graded_at`
        ) || [];

        const assignments = submissions.map((s: Record<string, unknown>) => {
          const a = s.assignment as Record<string, unknown> || {};
          const score = s.score as number | null;
          const pts = a.points_possible as number || 0;
          return {
            name: a.name as string || '?',
            score,
            pointsPossible: pts,
            percentage: score !== null && pts > 0 ? Math.round((score / pts) * 1000) / 10 : null,
            grade: s.grade as string | null,
            late: s.late as boolean || false,
            missing: s.missing as boolean || false,
            submitted: s.workflow_state === 'graded' || s.workflow_state === 'submitted',
            dueAt: a.due_at as string | null,
            gradedAt: s.graded_at as string | null,
            submittedAt: s.submitted_at as string | null,
            assignmentGroup: (a.assignment_group_id as number) || null,
          };
        });

        return { ...course, assignments };
      }));

      // Past semesters
      const pastCourses = enrollments
        .filter((e) => e.type === 'StudentEnrollment' && !courseMap[e.course_id]?.startsWith('25-26') && courseMap[e.course_id])
        .map((e) => ({
          courseId: e.course_id,
          courseName: courseMap[e.course_id] || `Course ${e.course_id}`,
          grade: e.grades?.current_grade || null,
          score: e.grades?.current_score || null,
        }))
        .filter((c) => c.grade)
        .sort((a, b) => a.courseName.localeCompare(b.courseName));

      return NextResponse.json({
        student, courses: courseDetails, pastCourses, lastUpdated: new Date().toISOString(),
      });
    }

    // Overview for all students
    const studentData = await Promise.all(filteredStudents.map(async (student) => {
      const enrollments: Enrollment[] = await canvasFetch(
        `/users/${student.id}/enrollments?per_page=50&state[]=active`
      ) || [];

      const currentCourses = enrollments
        .filter((e) => e.type === 'StudentEnrollment' && courseMap[e.course_id]?.startsWith('25-26'))
        .map((e) => ({
          courseId: e.course_id,
          courseName: courseMap[e.course_id] || `Course ${e.course_id}`,
          grade: e.grades?.current_grade || null,
          score: e.grades?.current_score || null,
        }));

      const gradePoints: Record<string, number> = {
        'A+': 4.3, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0.0,
      };
      const gradedCourses = currentCourses.filter((c) => c.grade && gradePoints[c.grade] !== undefined);
      const gpa = gradedCourses.length > 0
        ? gradedCourses.reduce((s, c) => s + (gradePoints[c.grade!] || 0), 0) / gradedCourses.length : null;

      return { id: student.id, name: student.name, courses: currentCourses, gpa };
    }));

    return NextResponse.json({ students: studentData, lastUpdated: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: `Failed: ${error instanceof Error ? error.message : 'Unknown'}` }, { status: 500 });
  }
}
