import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  headers: { "Content-Type": "application/json" },
});

/* ── Attach JWT + auto-fix Content-Type for FormData ──────────────
   If the request body is a FormData instance we delete the hardcoded
   "application/json" header so the browser can set the correct:
     Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
   Without this, multer receives no parseable body → "No file uploaded".
─────────────────────────────────────────────────────────────────── */
axiosInstance.interceptors.request.use(
  (config) => {
    /* JWT */
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    /* FormData fix — let the browser set the boundary automatically */
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Redirect to /login on 401 ── */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;