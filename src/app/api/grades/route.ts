import { NextResponse } from 'next/server';

const CANVAS_TOKEN = process.env.CANVAS_API_TOKEN;
const CANVAS_BASE = process.env.CANVAS_BASE_URL || 'https://acalanes.instructure.com/api/v1';

async function canvasFetch(path: string) {
  const res = await fetch(`${CANVAS_BASE}${path}`, {
    headers: { Authorization: `Bearer ${CANVAS_TOKEN}` },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  if (!res.ok) throw new Error(`Canvas API ${res.status}`);
  return res.json();
}

interface Student { id: number; name: string; }
interface Enrollment {
  course_id: number;
  type: string;
  grades: { current_grade: string | null; current_score: number | null };
}
interface Course { id: number; name: string; }
interface Assignment {
  id: number; name: string; due_at: string | null; points_possible: number;
  submission: { score: number | null; submitted_at: string | null; workflow_state: string; late: boolean; missing: boolean };
}

export async function GET() {
  if (!CANVAS_TOKEN) {
    return NextResponse.json({ error: 'Canvas API token not configured' }, { status: 500 });
  }

  try {
    // Get observed students
    const students: Student[] = await canvasFetch('/users/self/observees');

    // Get all courses
    const courses: Course[] = await canvasFetch('/courses?per_page=100&enrollment_state=active');
    const courseMap: Record<number, string> = {};
    courses.forEach((c) => { courseMap[c.id] = c.name; });

    // Get data for each student
    const studentData = await Promise.all(students.map(async (student) => {
      // Get enrollments with grades
      const enrollments: Enrollment[] = await canvasFetch(
        `/users/${student.id}/enrollments?per_page=50&include[]=current_grading_period_scores&state[]=active`
      );

      // Filter to current year courses only
      const currentCourses = enrollments
        .filter((e) => e.type === 'StudentEnrollment' && courseMap[e.course_id]?.startsWith('25-26'))
        .map((e) => ({
          courseId: e.course_id,
          courseName: courseMap[e.course_id] || `Course ${e.course_id}`,
          grade: e.grades?.current_grade || null,
          score: e.grades?.current_score || null,
        }))
        .sort((a, b) => (a.courseName || '').localeCompare(b.courseName || ''));

      // Get missing/upcoming assignments for current courses
      let missingAssignments: Array<{ courseName: string; name: string; dueAt: string | null; pointsPossible: number }> = [];
      let upcomingAssignments: Array<{ courseName: string; name: string; dueAt: string; pointsPossible: number }> = [];

      for (const course of currentCourses.slice(0, 8)) { // Limit API calls
        try {
          const assignments: Assignment[] = await canvasFetch(
            `/courses/${course.courseId}/assignments?per_page=50&include[]=submission&order_by=due_at&bucket=upcoming`
          );

          for (const a of assignments) {
            if (a.submission?.missing) {
              missingAssignments.push({
                courseName: course.courseName.replace('25-26 ', ''),
                name: a.name,
                dueAt: a.due_at,
                pointsPossible: a.points_possible,
              });
            }
            if (a.due_at && new Date(a.due_at) > new Date() && !a.submission?.submitted_at) {
              upcomingAssignments.push({
                courseName: course.courseName.replace('25-26 ', ''),
                name: a.name,
                dueAt: a.due_at,
                pointsPossible: a.points_possible,
              });
            }
          }
        } catch {}
      }

      // Sort upcoming by due date
      upcomingAssignments.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
      upcomingAssignments = upcomingAssignments.slice(0, 15);
      missingAssignments = missingAssignments.slice(0, 10);

      // Calculate GPA approximation
      const gradePoints: Record<string, number> = {
        'A+': 4.3, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0.0,
      };
      const gradedCourses = currentCourses.filter((c) => c.grade && gradePoints[c.grade] !== undefined);
      const gpa = gradedCourses.length > 0
        ? gradedCourses.reduce((s, c) => s + (gradePoints[c.grade!] || 0), 0) / gradedCourses.length
        : null;

      return {
        id: student.id,
        name: student.name,
        courses: currentCourses,
        missingAssignments,
        upcomingAssignments,
        gpa,
      };
    }));

    return NextResponse.json({ students: studentData, lastUpdated: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: `Failed: ${error instanceof Error ? error.message : 'Unknown'}` }, { status: 500 });
  }
}
