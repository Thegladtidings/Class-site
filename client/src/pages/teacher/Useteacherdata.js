// import { useState, useEffect, useCallback } from "react";
// import {
//   getProfile,
//   getStudents,
//   getAssignments,
//   getExams,
//   getGrades,
//   getAnnouncements,
// } from "../api/teacherApi";

// /* ───────────────────────────────
//    MOCK DATA (fallback only)
// ─────────────────────────────── */
// const MOCK = {
//   profile: {
//     name: "Ustaz Ahmad Suleiman",
//     subjects: ["Mathematics", "Further Mathematics"],
//     avatar: null,
//     email: "ahmad@school.edu.ng",
//     employeeId: "TCH-001",
//   },
//   students: [
//     { _id: "s1", name: "Unaysah", class: "JSS 2", average: 88 },
//     { _id: "s2", name: "Ibrahim", class: "JSS 2", average: 72 },
//   ],
//   assignments: [],
//   exams: [
//     { _id: "e1", subject: "Math", date: "2025-07-07", status: "Upcoming" },
//   ],
//   grades: [],
//   announcements: [],
// };

// /* ───────────────────────────────
//    SAFE FETCH HOOK
// ─────────────────────────────── */
// function useFetch(apiFn, mockData) {
//   const [data, setData] = useState(
//     Array.isArray(mockData) ? mockData : mockData ?? null
//   );
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchData = useCallback(async () => {
//     setLoading(true);

//     try {
//       const res = await apiFn();

//       // 🔥 normalize ALL possible API shapes
//       let normalized = res?.data ?? res;

//       if (!Array.isArray(normalized)) {
//         normalized = Array.isArray(mockData) ? mockData : [];
//       }

//       setData(normalized);
//       setError(null);
//     } catch (err) {
//       setData(Array.isArray(mockData) ? mockData : []);
//       setError(err);
//     } finally {
//       setLoading(false);
//     }
//   }, [apiFn, mockData]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   return { data, loading, error, refetch: fetchData };
// }

// /* ───────────────────────────────
//    MAIN TEACHER HOOK
// ─────────────────────────────── */
// export function useTeacherData() {
//   const profile = useFetch(getProfile, MOCK.profile);
//   console.log("Profile data:", profile.data);
//   const students = useFetch(getStudents, MOCK.students);
//   const assignments = useFetch(getAssignments, MOCK.assignments);
//   const exams = useFetch(getExams, MOCK.exams);
//   const grades = useFetch(getGrades, MOCK.grades);
//   const announcements = useFetch(getAnnouncements, MOCK.announcements);

//   // ensure arrays ALWAYS
//   const studentList = Array.isArray(students.data) ? students.data : [];
//   const assignmentList = Array.isArray(assignments.data) ? assignments.data : [];
//   const examList = Array.isArray(exams.data) ? exams.data : [];

//   /* ───────────── STATS ───────────── */

//   const classAverage = studentList.length
//     ? Math.round(
//         studentList.reduce((s, st) => s + (st.average || 0), 0) /
//           studentList.length
//       )
//     : 0;

//   const activeAssignments = assignmentList.filter(
//     (a) => a.status === "Active"
//   ).length;

//   const upcomingExams = examList.filter(
//     (e) => e.status === "Upcoming"
//   ).length;

//   return {
//     profile,
//     students,
//     assignments,
//     exams,
//     grades,
//     announcements,
//     stats: {
//       totalStudents: studentList.length,
//       activeAssignments,
//       upcomingExams,
//       classAverage,
//     },
//   };
// }

import { useState, useEffect, useCallback } from "react";
import {
  getProfile,
  getStudents,
  getAssignments,
  getExams,
  getGrades,
  getAnnouncements,
} from "../api/teacherApi.js";

/* ───────────────────────────────
   SAFE FETCH HOOK (NO MOCKS)
─────────────────────────────── */
function useFetch(apiFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const res = await apiFn();

      // normalize API response safely
      let normalized = res?.data ?? res;

      // ensure arrays where expected
      if (Array.isArray(normalized)) {
        setData(normalized);
      } else if (normalized && typeof normalized === "object") {
        setData(normalized);
      } else {
        setData(null);
      }

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

/* ───────────────────────────────
   MAIN TEACHER HOOK
─────────────────────────────── */
export function useTeacherData() {
  const profile = useFetch(getProfile);
  console.log("Profile data:", profile);
  const students = useFetch(getStudents);
  const assignments = useFetch(getAssignments);
  const exams = useFetch(getExams);
  console.log("Exams data:", exams);
  const grades = useFetch(getGrades);
  const announcements = useFetch(getAnnouncements);

  /* ───────── SAFE NORMALIZATION ───────── */

  const studentList = Array.isArray(students.data) ? students.data : [];
  const assignmentList = Array.isArray(assignments.data) ? assignments.data : [];
  const examList = Array.isArray(exams.data) ? exams.data : [];

  /* ───────── STATS ───────── */

  const classAverage = studentList.length
    ? Math.round(
        studentList.reduce((sum, s) => sum + (s.average || 0), 0) /
          studentList.length
      )
    : 0;

  const activeAssignments = assignmentList.filter(
    (a) => a?.status === "Active"
  ).length;

  const upcomingExams = examList.filter(
    (e) => e?.status === "Upcoming"
  ).length;

  return {
    profile,
    students,
    assignments,
    exams,
    grades,
    announcements,
    stats: {
      totalStudents: studentList.length,
      activeAssignments,
      upcomingExams,
      classAverage,
    },
  };
}