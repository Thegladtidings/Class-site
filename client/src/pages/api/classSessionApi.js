import axiosInstance from "./Axiosinstance.js";

export const getClassSessions = () => axiosInstance.get("/api/class-sessions");
export const createClassSession = (data) => axiosInstance.post("/api/class-sessions", data);
export const updateClassSession = (id, data) => axiosInstance.patch(`/api/class-sessions/${id}`, data);
export const cancelClassSession = (id) => axiosInstance.delete(`/api/class-sessions/${id}`);
