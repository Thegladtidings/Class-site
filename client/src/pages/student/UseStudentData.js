import { useState, useEffect, useCallback } from "react";
import {
  getStudentProfile,
  getAssignments,
  getMySubmissions,
  getAvailableExams,
  getMyExamResults,
  getAnnouncements,
  getMyGrades,
} from "../api/studentApi";

/* ─────────────────────────────────────────────
   Generic fetch hook (same shape as teacher's)
───────────────────────────────────────────── */
function useFetch(apiFn) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res        = await apiFn();
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

/* ─────────────────────────────────────────────
   useStudentData — main export
───────────────────────────────────────────── */
export function useStudentData() {
  const profile     = useFetch(getStudentProfile);
  const assignments = useFetch(getAssignments);
  const submissions = useFetch(getMySubmissions);
  const exams       = useFetch(getAvailableExams);
  const results     = useFetch(getMyExamResults);
  const announcements = useFetch(getAnnouncements);
  const grades      = useFetch(getMyGrades);

  /* ── Normalize lists — handle any key the API wraps data in ── */
  const assignmentList = Array.isArray(assignments.data?.assignments)
    ? assignments.data.assignments
    : Array.isArray(assignments.data)
    ? assignments.data
    : [];

  const resultList = Array.isArray(results.data?.results)
    ? results.data.results
    : Array.isArray(results.data)
    ? results.data
    : [];

  const examList = Array.isArray(exams.data?.exams)
    ? exams.data.exams
    : Array.isArray(exams.data)
    ? exams.data
    : [];

  const gradeList = Array.isArray(grades.data?.grades)
    ? grades.data.grades
    : Array.isArray(grades.data)
    ? grades.data
    : [];

  const announcementList = Array.isArray(announcements.data?.announcements)
    ? announcements.data.announcements
    : Array.isArray(announcements.data)
    ? announcements.data
    : [];
  /* ── Build a submissions lookup map: assignmentId → submission ── */
  const submissionMap = {};
  const rawSubmissions =
    submissions.data?.submissions ?? submissions.data ?? [];
  (Array.isArray(rawSubmissions) ? rawSubmissions : []).forEach((s) => {
    const key = String(s.assignment?._id ?? s.assignment ?? "");
    if (key) submissionMap[key] = s;
  });

  /* ── Derived stats ── */
  const now = new Date();

  const pendingAssignments = assignmentList.filter(
    (a) => !submissionMap[String(a._id)]
  ).length;

  const liveExams = examList.filter((e) => {
    const start = new Date(e.startTime);
    const end   = new Date(e.endTime);
    return now >= start && now <= end && !e.alreadyTaken;
  }).length;

  const avgExamScore = resultList.length
    ? Math.round(
        resultList.reduce((sum, r) => sum + (r.percentage ?? 0), 0) /
          resultList.length
      )
    : null;

  // Overall grade average across grade records
  const avgGrade = gradeList.length
    ? Math.round(
        gradeList.reduce((sum, g) => sum + (g.percentage ?? g.score ?? 0), 0) /
          gradeList.length
      )
    : null;

  return {
    // Raw hook objects (expose .loading / .error / .refetch per resource)
    profile,
    assignments,
    submissions,
    exams,
    results,
    announcements,
    grades,

    // Clean arrays ready for components
    assignmentList,
    resultList,
    examList,
    gradeList,
    announcementList,
    submissionMap,

    // Computed stats
    stats: {
      pendingAssignments,
      liveExams,
      avgExamScore,
      avgGrade,
      totalAnnouncements: announcementList.length,
    },

    // Global loading / error helpers
    isLoading:
      profile.loading     ||
      assignments.loading ||
      exams.loading       ||
      results.loading     ||
      grades.loading,

    hasError:
      !!(profile.error || assignments.error || exams.error || results.error),
  };
}