import axiosInstance from "./Axiosinstance.js";

export const getProfile = () => axiosInstance.get("/api/teachers/profile");
export const getStudents = () => axiosInstance.get("/api/students");
export const getAssignments = () => axiosInstance.get("/api/assignments/my");
export const getExams = () => axiosInstance.get("/api/exams/teacher/my");
export const getGrades = () => axiosInstance.get("/api/teacher/grades");
export const postAnnouncement = (data) => axiosInstance.post("/api/announcements", data);
export const deleteAnnouncement = (id) => axiosInstance.delete(`/api/announcements/${id}`);
export const getAnnouncements = () => axiosInstance.get("/api/announcements");
export const createAssignment = (data) => axiosInstance.post("/api/assignments/", data);
export const updateAssignment = (id, d) => axiosInstance.put(`/api/teacher/assignments/${id}`, d);
export const deleteAssignment = (id) => axiosInstance.delete(`/api/teacher/assignments/${id}`);
export const createExam = (data) => axiosInstance.post("/api/exams/teacher", data);
export const deleteExam = (id) => axiosInstance.delete(`/api/exams/teacher/${id}`);
export const togglePublishExam = (id) => axiosInstance.patch(`/api/exams/teacher/${id}/publish`);
export const updateExam = (id, d) => axiosInstance.patch(`/api/exams/teacher/${id}`, d);
export const getExamResults = (id) => axiosInstance.get(`/api/exams/teacher/${id}/results`);
export const uploadQuestionImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return axiosInstance.post("/api/exams/teacher/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  };
  // Add to teacherApi.js
export const getStudentsByClass = (className) =>  axiosInstance.get(`/api/exams/teacher/students/${encodeURIComponent(className)}`);

export const resetStudentResult = (examId, studentId) =>  axiosInstance.delete(`/api/exams/teacher/${examId}/results/${studentId}`);