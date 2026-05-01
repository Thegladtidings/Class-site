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
  const studentList       = Array.isArray(students.data?.students)      ? students.data.students           : Array.isArray(students.data)      ? students.data      : [];
  const assignmentList    = Array.isArray(assignments.data?.assignments) ? assignments.data.assignments     : Array.isArray(assignments.data)   ? assignments.data   : [];
  const examList          = Array.isArray(exams.data?.exams)            ? exams.data.exams                 : Array.isArray(exams.data)         ? exams.data         : [];
  const gradeList         = Array.isArray(grades.data?.grades)          ? grades.data.grades               : Array.isArray(grades.data)        ? grades.data        : [];
  const announcementList  = Array.isArray(announcements.data?.announcements) ? announcements.data.announcements : Array.isArray(announcements.data) ? announcements.data : [];

  // Stats
  const classAverage = studentList.length
    ? Math.round(
        studentList.reduce((sum, s) => sum + (s.average || 0), 0) / studentList.length
      )
    : 0;

const activeAssignments = assignmentList.filter((a) => a?.isActive !== false).length;

const now = new Date();
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

    stats: {
      totalStudents: studentList.length,
      activeAssignments,
      upcomingExams,
      classAverage,
    },
  };
}