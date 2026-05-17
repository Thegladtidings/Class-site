import axiosInstance from "./Axiosinstance.js";

/* ─── Auth / Profile ─────────────────────────────── */
export const getStudentProfile = () => axiosInstance.get("/api/students/profile");
export const updateStudentProfile = (data) => axiosInstance.patch("/api/students/profile-update", data);

/* ─── Dashboard Stats ────────────────────────────── */
export const getStudentStats = () => axiosInstance.get("/api/student/stats");

/* ─── Assignments ───────────────────────────────── */
export const getAssignments       = ()         => axiosInstance.get("/api/assignments/student");
export const submitAssignment = (id, formData) => axiosInstance.post(`/api/assignments/submit/${id}`, formData);
export const getMySubmissions     = ()         => axiosInstance.get("/api/assignments/my-submissions");

/* ─── Exams ─────────────────────────────────────── */
export const getAvailableExams    = ()         => axiosInstance.get("/api/exams");
export const getUpcomingExams      = ()         => axiosInstance.get("/api/exams/my-upcoming");
export const startExam            = (id)       => axiosInstance.get(`/api/exams/${id}/start`);
export const submitExam           = (id, data) => axiosInstance.post(`/api/exams/${id}/submit`, data);
export const getMyExamResults     = ()         => axiosInstance.get("/api/exams/my-results");

/* ─── Announcements ─────────────────────────────── */
export const getAnnouncements     = ()=> axiosInstance.get("/api/announcements");

/* ─── Grades ───────────────────────────────────── */
export const getMyGrades = () => axiosInstance.get("/api/grades/student/me");