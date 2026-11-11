import { useState, useEffect, useCallback } from "react";
import {
  getProfile,
  getStudents,
  getAssignments,
  getExams,
  getGrades,
  getAnnouncements,
} from "../api/teacherApi.js";

function useFetch(apiFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFn();
      const normalized = res?.data ?? null;
      setData(normalized);
      setError(null);
    } catch (err) {
      setData(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useTeacherData() {
  const profile       = useFetch(getProfile);
  const students      = useFetch(getStudents);
  const assignments   = useFetch(getAssignments);
  const exams         = useFetch(getExams);
  const grades        = useFetch(getGrades);
  const announcements = useFetch(getAnnouncements);
  
  // Normalize each list — handle whatever key the API wraps data in
  const rawStudentList    = Array.isArray(students.data?.students)      ? students.data.students           : Array.isArray(students.data)      ? students.data      : [];
  const assignmentList    = Array.isArray(assignments.data?.assignments) ? assignments.data.assignments     : Array.isArray(assignments.data)   ? assignments.data   : [];
  const examList          = Array.isArray(exams.data?.exams)            ? exams.data.exams                 : Array.isArray(exams.data)         ? exams.data         : [];
  const gradeList         = Array.isArray(grades.data?.grades)          ? grades.data.grades               : Array.isArray(grades.data)        ? grades.data        : [];
  const announcementList  = Array.isArray(announcements.data?.announcements) ? announcements.data.announcements : Array.isArray(announcements.data) ? announcements.data : [];
  const gradeTotals = new Map();
  for (const grade of gradeList) {
    const studentId = grade.student?._id;
    const totalScore = Number(grade.totalScore);
    if (!studentId || !Number.isFinite(totalScore) || totalScore <= 0) continue;

    const current = gradeTotals.get(studentId) ?? { score: 0, total: 0 };
    gradeTotals.set(studentId, {
      score: current.score + Number(grade.score || 0),
      total: current.total + totalScore,
    });
  }
  const studentList = rawStudentList.map((student) => {
    const totals = gradeTotals.get(student._id);
    return {
      ...student,
      average: totals ? Math.round((totals.score / totals.total) * 100) : null,
    };
  });
  const resources = [profile, students, assignments, exams, grades, announcements];
  const errors = resources.filter((resource) => resource.error);
  const refetchAll = () => Promise.all(resources.map((resource) => resource.refetch()));

  const now = new Date();
  // Stats
  const gradedStudents = studentList.filter((student) => student.average != null);
  const classAverage = gradedStudents.length
    ? Math.round(gradedStudents.reduce((sum, student) => sum + student.average, 0) / gradedStudents.length)
    : 0;
const activeAssignments = assignmentList.filter((a) => {
  const notManuallyClosed = a?.isActive !== false;
  const notOverdue = !a?.dueDate || new Date(a.dueDate) >= now;

  return notManuallyClosed && notOverdue;
}).length;
const upcomingExams = examList.filter((e) => {
  if (e?.status) return e.status === "Upcoming"; // fallback if status ever exists
  return e?.startTime && new Date(e.startTime) > now;
}).length;
  return {
    profile,
    students,
    assignments,
    exams,
    grades,
    announcements,

    // Clean arrays for components
    studentList,
    assignmentList,
    examList,
    gradeList,
    announcementList,
    errors,
    refetchAll,

    stats: {
      totalStudents: studentList.length,
      activeAssignments,
      upcomingExams,
      classAverage,
    },
  };
}