import { useState, useEffect, useRef, useCallback } from "react";
import Modal from "../../components/Modal.jsx";
import Toast from "../../components/Toast.jsx";
import styles from "../../css/Sections.module.css";
import axiosInstance from "../api/Axiosinstance.js";

/* ─────────────────────────────────────────────────────────────
   🔧 CLOUDINARY CONFIG  ← replace these two values
───────────────────────────────────────────────────────────────*/
const CLOUDINARY_CLOUD_NAME = "dopfztz0p";
const CLOUDINARY_UPLOAD_PRESET = "jss_portal_docs";

/* ── inline API helpers ── */
const getSubmissionsForAssignment = (assignmentId) =>
  axiosInstance.get(`/api/assignments/${assignmentId}/submissions`);

const gradeSubmission = (submissionId, data) =>
  axiosInstance.patch(`/api/assignments/submissions/${submissionId}/grade`, data);

const createAssignment = (payload) =>
  axiosInstance.post("/api/assignments", payload);

const updateAssignment = (id, payload) =>
  axiosInstance.patch(`/api/assignments/${id}`, payload);

const deleteAssignment = (id) =>
  axiosInstance.delete(`/api/assignments/${id}`);

/* ── constants ── */
const SUBJECTS = ["Mathematics", "Further Mathematics", "English", "Physics", "Chemistry", "Biology"];
const CLASSES = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];

const EMPTY_FORM = {
  title: "", subject: SUBJECTS[0], className: CLASSES[0],
  dueDate: "", description: "",
  attachmentUrl: "", attachmentName: "", attachmentType: "",
};

const STATUS_META = {
  submitted: { label: "Submitted", color: "#1a6ef5", bg: "#eff6ff" },
  late: { label: "Late", color: "#f59e0b", bg: "#fffbeb" },
  graded: { label: "Graded", color: "#10b981", bg: "#f0fdf4" },
};

function isOverdue(dateStr) { return dateStr && new Date(dateStr) < new Date(); }

function formatDue(dateStr) {
  if (!dateStr) return "—";
  // FIX: treat the stored date as local to avoid UTC-midnight shift
  const local = dateStr.replace("Z", "").replace(/[+-]\d{2}:\d{2}$/, "");
  return new Date(local).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

/* ── Normalize a date string to YYYY-MM-DD for date inputs ── */
function toDateInputValue(dateStr) {
  if (!dateStr) return "";
  // Strip time portion and any timezone — keep just the date part
  const local = dateStr.replace("Z", "").replace(/[+-]\d{2}:\d{2}$/, "");
  return local.slice(0, 10);
}

/* ── Cloudinary upload ── */
async function uploadToCloudinary(file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("resource_type", "auto");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const isPDF = file.type === "application/pdf";
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        const isPDFResource = data.resource_type === "raw" || isPDF;
        let downloadUrl = data.secure_url;
        if (isPDFResource) downloadUrl = data.secure_url.replace("/upload/", "/upload/fl_attachment/");
        resolve({
          url: downloadUrl, originalUrl: data.secure_url,
          publicId: data.public_id, name: file.name,
          type: isPDFResource ? "pdf" : "image",
          resourceType: data.resource_type,
        });
      } else {
        try { reject(new Error(JSON.parse(xhr.responseText)?.error?.message || "Upload failed")); }
        catch { reject(new Error("Upload failed")); }
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

/* ── File Upload Zone ── */
function FileUploadZone({ onUploaded, currentFile, onClear }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const ACCEPTED = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
  const MAX_MB = 10;

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) { setError("Only images (JPG, PNG, GIF, WebP) and PDF files are accepted."); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setError(`File must be under ${MAX_MB} MB.`); return; }
    setError(""); setUploading(true); setProgress(0);
    try {
      const result = await uploadToCloudinary(file, setProgress);
      onUploaded(result);
    } catch (err) { setError(err.message || "Upload failed. Please try again."); }
    finally { setUploading(false); setProgress(0); }
  }, [onUploaded]);

  const onDrop = useCallback((e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }, [handleFile]);
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onPick = (e) => handleFile(e.target.files?.[0]);

  if (currentFile) {
    const isImage = currentFile.type === "image";
    return (
      <div style={{ border: "1.5px solid #86efac", borderRadius: 12, background: "#f0fdf4", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        {isImage ? (
          <img src={currentFile.originalUrl || currentFile.url} alt={currentFile.name}
            style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid #bbf7d0", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: 8, background: "linear-gradient(135deg,#ef4444,#b91c1c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📄</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: "#15803d", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>✔ {currentFile.name}</p>
          <p style={{ fontSize: 11, color: "#16a34a", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {currentFile.type === "pdf" ? "PDF Document" : "Image"} · Uploaded
          </p>
        </div>
        <button onClick={onClear} title="Remove attachment" style={{ background: "none", border: "1px solid #86efac", borderRadius: 8, color: "#16a34a", fontSize: 12, fontWeight: 600, padding: "5px 10px", cursor: "pointer", flexShrink: 0 }}>Remove</button>
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        style={{ border: `2px dashed ${dragging ? "#1a6ef5" : error ? "#ef4444" : "#cbd5e1"}`, borderRadius: 12, background: dragging ? "#eff6ff" : "#f8fafc", padding: "24px 16px", textAlign: "center", cursor: uploading ? "default" : "pointer", transition: "all 0.2s", userSelect: "none" }}
      >
        {uploading ? (
          <>
            <p style={{ fontSize: 28, margin: "0 0 8px" }}>⏳</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#475569", margin: "0 0 12px" }}>Uploading… {progress}%</p>
            <div style={{ height: 6, borderRadius: 99, background: "#e2e8f0", overflow: "hidden", maxWidth: 220, margin: "0 auto" }}>
              <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#1a6ef5,#0ea5e9)", width: `${progress}%`, transition: "width 0.2s ease" }} />
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 32, margin: "0 0 8px" }}>{dragging ? "📂" : "📎"}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#475569", margin: "0 0 4px" }}>{dragging ? "Drop to upload" : "Drag & drop or click to upload"}</p>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Images (JPG, PNG, GIF, WebP) or PDF · Max {MAX_MB} MB</p>
          </>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6, marginBottom: 0 }}>⚠ {error}</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" style={{ display: "none" }} onChange={onPick} />
    </div>
  );
}

/* ════════════════════════════════════════════
   SUBMISSIONS PANEL
════════════════════════════════════════════ */
function SubmissionsPanel({ assignment, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradeTarget, setGradeTarget] = useState(null); // null | submission object
  const [gradeForm, setGradeForm] = useState({ grade: "", teacherRemark: "" });
  const [grading, setGrading] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "pending" | "graded"
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getSubmissionsForAssignment(assignment._id);
        setSubmissions(res?.data?.submissions ?? []);
      } catch { setToast({ msg: "Could not load submissions.", type: "error" }); }
      finally { setLoading(false); }
    }
    load();
  }, [assignment._id]);

  async function handleGrade() {
    if (!gradeForm.grade.trim()) { setToast({ msg: "Please enter a grade.", type: "error" }); return; }
    setGrading(true);
    try {
      const res = await gradeSubmission(gradeTarget._id, gradeForm);
      const updated = res?.data?.submission;
      setSubmissions((prev) =>
        prev.map((s) => s._id === gradeTarget._id
          ? {
            ...s,
            grade: updated?.grade ?? gradeForm.grade,
            teacherRemark: updated?.teacherRemark ?? gradeForm.teacherRemark,
            status: "graded",
          }
          : s
        )
      );
      setToast({ msg: gradeTarget.status === "graded" ? "Grade updated!" : "Submission graded!", type: "success" });
      setGradeTarget(null);
      setGradeForm({ grade: "", teacherRemark: "" });
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Grading failed.", type: "error" });
    } finally { setGrading(false); }
  }

  function openGradeModal(s) {
    setGradeTarget(s);
    setGradeForm({ grade: s.grade ?? "", teacherRemark: s.teacherRemark ?? "" });
  }

  const gradedCount = submissions.filter((s) => s.status === "graded").length;
  const pendingCount = submissions.length - gradedCount;

  const visibleSubmissions = submissions.filter((s) => {
    if (filter === "graded") return s.status === "graded";
    if (filter === "pending") return s.status !== "graded";
    return true;
  });

  const isEditing = gradeTarget?.status === "graded";

  return (
    <>
      {/* ── Backdrop ── */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 300 }} />

      {/* ── Drawer ── */}
      <div style={{
        position: "fixed", top: 0, right: 0,
        width: "min(540px, 100vw)", height: "100vh",
        background: "#fff", zIndex: 301,
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 40px rgba(0,0,0,0.14)",
      }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1.5px solid #e2e8f0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 3px" }}>📋 Submissions</h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              {assignment.title}&nbsp;·&nbsp;{assignment.className}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#94a3b8", cursor: "pointer", lineHeight: 1, flexShrink: 0, padding: "2px 6px" }}>✕</button>
        </div>

        {/* Stats bar */}
        {!loading && (
          <div style={{ display: "flex", borderBottom: "1.5px solid #e2e8f0" }}>
            {[
              { key: "all", label: "All", value: submissions.length, color: "#1a6ef5" },
              { key: "graded", label: "Graded", value: gradedCount, color: "#10b981" },
              { key: "pending", label: "Pending", value: pendingCount, color: "#f59e0b" },
            ].map((s, i, arr) => (
              <button
                key={s.key}
                onClick={() => setFilter(s.key)}
                style={{
                  flex: 1, padding: "13px 0", textAlign: "center",
                  borderRight: i < arr.length - 1 ? "1px solid #e2e8f0" : "none",
                  border: "none",
                  borderBottom: filter === s.key ? `2.5px solid ${s.color}` : "2.5px solid transparent",
                  background: filter === s.key ? (
                    s.key === "graded" ? "#f0fdf4" :
                      s.key === "pending" ? "#fffbeb" : "#eff6ff"
                  ) : "#fff",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <p style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: "0 0 2px" }}>{s.value}</p>
                <p style={{ fontSize: 11, color: filter === s.key ? s.color : "#94a3b8", fontWeight: filter === s.key ? 700 : 400, margin: 0 }}>{s.label}</p>
              </button>
            ))}
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} style={{ height: 110, borderRadius: 12, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
            ))
          ) : visibleSubmissions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "#94a3b8" }}>
              <p style={{ fontSize: 36, margin: "0 0 10px" }}>
                {filter === "graded" ? "🎓" : filter === "pending" ? "⏳" : "📭"}
              </p>
              <p style={{ fontSize: 14, margin: 0 }}>
                {filter === "graded" ? "No graded submissions yet." :
                  filter === "pending" ? "No pending submissions — all graded!" :
                    "No submissions yet."}
              </p>
            </div>
          ) : (
            visibleSubmissions.map((s) => {
              const isGraded = s.status === "graded";
              const meta = STATUS_META[s.status] ?? STATUS_META.submitted;

              return (
                <div key={s._id} style={{
                  border: isGraded ? "1.5px solid #86efac" : "1.5px solid #e2e8f0",
                  borderRadius: 12, overflow: "hidden",
                  background: isGraded ? "#fafffe" : "#fafbfc",
                  transition: "border-color 0.2s",
                }}>

                  {/* ── Card header: avatar + name + status badge ── */}
                  <div style={{ padding: "14px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                        background: isGraded
                          ? "linear-gradient(135deg,#10b981,#059669)"
                          : "linear-gradient(135deg,#1a6ef5,#0ea5e9)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 15, fontWeight: 700,
                      }}>
                        {(s.student?.name?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 1px" }}>
                          {s.student?.name ?? "Unknown Student"}
                        </p>
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                          {s.student?.className ?? ""}
                          {s.student?.studentId && <>&nbsp;·&nbsp;ID: {s.student.studentId}</>}
                        </p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px",
                      borderRadius: 99, whiteSpace: "nowrap",
                      color: meta.color, background: meta.bg,
                    }}>
                      {isGraded ? "✔ Graded" : meta.label}
                    </span>
                  </div>

                  {/* ── Submission content ── */}
                  <div style={{ padding: "10px 16px", margin: "10px 16px 0", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}>
                    {s.fileName ? (
                      <a href={s.fileUrl} target="_blank" rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#1a6ef5", fontWeight: 600, textDecoration: "none" }}>
                        📎 {s.fileName}
                      </a>
                    ) : (
                      <p style={{ color: "#94a3b8", fontStyle: "italic", margin: 0 }}>No file attached</p>
                    )}
                    {s.note && (
                      <p style={{ color: "#475569", margin: "6px 0 0" }}>💬 {s.note}</p>
                    )}
                    <p style={{ color: "#94a3b8", margin: "6px 0 0" }}>
                      Submitted&nbsp;
                      {s.createdAt
                        ? new Date(s.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </p>
                  </div>

                  {/* ── Graded result block — only shown when graded ── */}
                  {isGraded && (
                    <div style={{
                      margin: "10px 16px 0",
                      background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
                      border: "1px solid #86efac", borderRadius: 8,
                      padding: "10px 14px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "#15803d", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Grade Awarded
                          </p>
                          <p style={{ fontSize: 22, fontWeight: 800, color: "#15803d", margin: 0, lineHeight: 1 }}>
                            {s.grade}
                          </p>
                        </div>
                        {s.teacherRemark && (
                          <div style={{ flex: 1, marginLeft: 16, borderLeft: "2px solid #86efac", paddingLeft: 12 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#166534", margin: "0 0 2px" }}>Teacher's Remark</p>
                            <p style={{ fontSize: 12, color: "#166534", margin: 0, lineHeight: 1.5 }}>{s.teacherRemark}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Action footer ── */}
                  <div style={{
                    padding: "12px 16px",
                    display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8,
                    borderTop: isGraded ? "1px solid #bbf7d0" : "1px solid #f1f5f9",
                    marginTop: 10,
                  }}>
                    {isGraded ? (
                      /* Already graded — show edit button clearly */
                      <button
                        onClick={() => openGradeModal(s)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "7px 16px", borderRadius: 8,
                          border: "1.5px solid #86efac",
                          background: "#fff", color: "#15803d",
                          fontSize: 12, fontWeight: 700, cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = "#f0fdf4"; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = "#fff"; }}
                      >
                        ✏️ Edit Grade
                      </button>
                    ) : (
                      /* Not yet graded — prominent grade button */
                      <button
                        onClick={() => openGradeModal(s)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "7px 18px", borderRadius: 8,
                          border: "none", background: "#1a6ef5", color: "#fff",
                          fontSize: 12, fontWeight: 700, cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = "#1558c0"; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = "#1a6ef5"; }}
                      >
                        ✔ Grade Submission
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Grade / Edit modal ── */}
      {gradeTarget && (
        <Modal
          title={isEditing
            ? `Edit Grade — ${gradeTarget.student?.name ?? "Student"}`
            : `Grade — ${gradeTarget.student?.name ?? "Student"}`}
          onClose={() => { setGradeTarget(null); setGradeForm({ grade: "", teacherRemark: "" }); }}
          footer={
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                style={{ padding: "9px 20px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                onClick={() => { setGradeTarget(null); setGradeForm({ grade: "", teacherRemark: "" }); }}
              >
                Cancel
              </button>
              <button
                style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: isEditing ? "#10b981" : "#1a6ef5", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: grading ? 0.6 : 1 }}
                disabled={grading}
                onClick={handleGrade}
              >
                {grading ? "Saving…" : isEditing ? "Update Grade" : "Save Grade"}
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Show current grade when editing */}
            {isEditing && (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#15803d", margin: "0 0 2px", textTransform: "uppercase" }}>Current Grade</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#15803d", margin: 0 }}>{gradeTarget.grade}</p>
                {gradeTarget.teacherRemark && (
                  <p style={{ fontSize: 12, color: "#166534", margin: "4px 0 0" }}>💬 {gradeTarget.teacherRemark}</p>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                {isEditing ? "New Grade" : "Grade"}
              </label>
              <input
                placeholder="e.g. A, B+, 85/100…"
                value={gradeForm.grade}
                onChange={(e) => setGradeForm((p) => ({ ...p, grade: e.target.value }))}
                autoFocus
                style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                Remark <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Feedback for the student…"
                value={gradeForm.teacherRemark}
                onChange={(e) => setGradeForm((p) => ({ ...p, teacherRemark: e.target.value }))}
                style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit", resize: "vertical" }}
              />
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}

/* ════════════════════════════════════════════
   ATTACHMENT PREVIEW
════════════════════════════════════════════ */
function AttachmentPreview({ url, name, type }) {
  if (!url || !name) return null;
  const isImage = type === "image";
  return (
    <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 8 }}>
      {isImage && (
        <img src={url} alt={name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid #e2e8f0", flexShrink: 0 }} />
      )}
      <a href={url} target="_blank" rel="noreferrer" download={name}
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#1a6ef5", fontWeight: 500, textDecoration: "none" }}>
        {isImage ? "🖼" : "📄"} {name}
        <span style={{ fontSize: 10, background: "#eff6ff", color: "#1a6ef5", padding: "1px 6px", borderRadius: 99, fontWeight: 600, marginLeft: 2, textTransform: "uppercase" }}>Download</span>
      </a>
    </div>
  );
}

/* ════════════════════════════════════════════
   ASSIGNMENT FORM MODAL — shared by Create & Edit
════════════════════════════════════════════ */
function AssignmentFormModal({ title, form, setF, uploadedFile, setUploadedFile, onClose, onSubmit, submitting }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            style={{ padding: "9px 20px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#1a6ef5", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}
            disabled={submitting}
            onClick={onSubmit}
          >
            {submitting ? "Saving…" : title.startsWith("Edit") ? "Save Changes" : "Create"}
          </button>
        </div>
      }
    >
      <div
        style={{
          display: "flex", flexDirection: "column", gap: 16,
          maxHeight: "70vh", overflowY: "auto", paddingRight: 4,
        }}
      >
        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Title</label>
          <input
            placeholder="e.g. Pythagoras Word Problems"
            value={form.title}
            onChange={(e) => setF("title", e.target.value)}
            style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit" }}
          />
        </div>

        {/* Subject + Class */}
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Subject</label>
            <select value={form.subject} onChange={(e) => setF("subject", e.target.value)}
              style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit", background: "#fff" }}>
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Class</label>
            <select value={form.className} onChange={(e) => setF("className", e.target.value)}
              style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit", background: "#fff" }}>
              {CLASSES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Due Date</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setF("dueDate", e.target.value)}
            style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit" }}
          />
        </div>

        {/* Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
            Description <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Instructions for students…"
            value={form.description}
            onChange={(e) => setF("description", e.target.value)}
            style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit", resize: "vertical" }}
          />
        </div>

        {/* Attachment */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
            Attachment <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
          </label>
          <FileUploadZone
            currentFile={uploadedFile}
            onUploaded={(result) => setUploadedFile(result)}
            onClear={() => setUploadedFile(null)}
          />
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, marginBottom: 0 }}>
            Students will see a download link for the uploaded file.
          </p>
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════
   MAIN — AssignmentsSection
════════════════════════════════════════════ */
export default function AssignmentsSection({ assignments: initList = [], loading }) {
  const [list, setList] = useState([]);
  const [showModal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submitting, setSub] = useState(false);
  const [toast, setToast] = useState(null);
  const [viewingSubs, setViewingSubs] = useState(null);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editFile, setEditFile] = useState(null);
  const [editSubmitting, setEditSub] = useState(false);

  useEffect(() => {
    if (Array.isArray(initList)) setList(initList);
  }, [initList]);

  /* ── Create helpers ── */
  function setF(field, value) { setForm((p) => ({ ...p, [field]: value })); }

  function handleModalClose() {
    setModal(false);
    setForm(EMPTY_FORM);
    setUploadedFile(null);
  }

  function validate(f) {
    if (!f.title.trim()) { setToast({ msg: "Please enter a title.", type: "error" }); return false; }
    if (!f.dueDate) { setToast({ msg: "Please set a due date.", type: "error" }); return false; }
    if (!f.className) { setToast({ msg: "Please select a class.", type: "error" }); return false; }
    return true;
  }

  async function handleCreate() {
    if (!validate(form)) return;
    setSub(true);
    try {
      const payload = {
        title: form.title,
        subject: form.subject,
        className: form.className,
        // FIX: send as a proper ISO string so the backend stores it correctly
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        description: form.description,
        attachmentUrl: uploadedFile?.url || undefined,
        attachmentName: uploadedFile?.name || undefined,
        attachmentType: uploadedFile?.type || undefined,
      };
      const res = await createAssignment(payload);
      const created = res?.data?.assignment ?? { _id: `a${Date.now()}`, ...payload, isActive: true };
      setList((p) => [created, ...p]);
      setToast({ msg: "Assignment created!", type: "success" });
      handleModalClose();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to create assignment.", type: "error" });
    } finally { setSub(false); }
  }

  /* ── Edit helpers ── */
  function openEdit(assignment) {
    setEditTarget(assignment);
    setEditForm({
      title: assignment.title ?? "",
      subject: assignment.subject ?? SUBJECTS[0],
      className: assignment.className ?? CLASSES[0],
      // FIX: use toDateInputValue so the date input shows the correct stored date
      dueDate: toDateInputValue(assignment.dueDate),
      description: assignment.description ?? "",
    });
    setEditFile(
      assignment.attachmentUrl
        ? {
          url: assignment.attachmentUrl,
          originalUrl: assignment.attachmentUrl,
          name: assignment.attachmentName || "Attachment",
          type: assignment.attachmentType || "pdf",
        }
        : null
    );
  }

  function closeEdit() {
    setEditTarget(null);
    setEditForm(EMPTY_FORM);
    setEditFile(null);
  }

  function setEF(field, value) { setEditForm((p) => ({ ...p, [field]: value })); }

  async function handleSaveEdit() {
    if (!validate(editForm)) return;
    setEditSub(true);
    try {
     const overdue = isOverdue(editForm.dueDate);

const payload = {
  title: editForm.title,
  subject: editForm.subject,
  className: editForm.className,
  dueDate: editForm.dueDate
    ? new Date(editForm.dueDate).toISOString()
    : null,
  description: editForm.description,

  // IMPORTANT
  isActive: overdue ? false : editTarget.isActive,

  attachmentUrl: editFile?.url || null,
  attachmentName: editFile?.name || null,
  attachmentType: editFile?.type || null,
};

      const res = await updateAssignment(editTarget._id, payload);
      const updated = res?.data?.assignment ?? { ...editTarget, ...payload };

      setList((prev) =>
        prev.map((a) => a._id === editTarget._id ? { ...a, ...updated } : a)
      );
      setToast({ msg: "Assignment updated!", type: "success" });
      closeEdit();
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to update assignment.", type: "error" });
    } finally { setEditSub(false); }
  }

  /* ── Delete ── */
  async function handleDelete(id) {
    if (!window.confirm("Delete this assignment?")) return;
    try { await deleteAssignment(id); } catch { }
    setList((p) => p.filter((a) => a._id !== id));
    setToast({ msg: "Assignment deleted.", type: "info" });
  }

  const activeCount = list.filter((a) => a.isActive !== false).length;
  const closedCount = list.length - activeCount;

  return (
    <div className={styles.section}>

      {/* Header */}
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Assignments</h2>
          <p className={styles.sectionSub}>
            {activeCount} active &nbsp;·&nbsp; {closedCount} closed
          </p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setModal(true)}>
          + New Assignment
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className={styles.skeletonList}>
          {Array(4).fill(0).map((_, i) => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : (
        <div className={styles.cardList}>
          {list.length === 0 && (
            <div className={styles.emptyState}>
              <span>📋</span><p>No assignments yet. Create one!</p>
            </div>
          )}

          {list.map((a) => {
            const overdue = isOverdue(a.dueDate);
            const active = a.isActive !== false && !overdue;
            return (
              <div key={a._id} className={`${styles.itemCard} ${overdue ? styles.overdueCard : ""}`}>
                <div className={styles.itemCardHead}>
                  <div style={{ flex: 1 }}>
                    <p className={styles.itemTitle}>{a.title}</p>
                    <p className={styles.itemMeta}>
                      {a.subject}&nbsp;·&nbsp;{a.className}&nbsp;·&nbsp;Due: {formatDue(a.dueDate)}
                      {overdue && <span className={styles.overdueTag}> · Overdue</span>}
                    </p>
                    {a.description && (
                      <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 1.5 }}>{a.description}</p>
                    )}
                    <AttachmentPreview url={a.attachmentUrl} name={a.attachmentName} type={a.attachmentType} />
                  </div>
                  <span className={`${styles.statusPill} ${overdue
                      ? styles.pillRed
                      : active
                        ? styles.pillGreen
                        : styles.pillGray
                    }`}>
                    {overdue ? "Overdue" : active ? "Active" : "Closed"}                  </span>
                </div>

                <div className={styles.itemActions}>
                  <button className={styles.actionBtn} onClick={() => setViewingSubs(a)}>
                    👁 Submissions
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={() => openEdit(a)}
                    style={{ color: "#1a6ef5", borderColor: "#bfdbfe" }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => handleDelete(a._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submissions drawer */}
      {viewingSubs && (
        <SubmissionsPanel assignment={viewingSubs} onClose={() => setViewingSubs(null)} />
      )}

      {/* ── Create modal ── */}
      {showModal && (
        <AssignmentFormModal
          title="New Assignment"
          form={form}
          setF={setF}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
          onClose={handleModalClose}
          onSubmit={handleCreate}
          submitting={submitting}
        />
      )}

      {/* ── Edit modal ── */}
      {editTarget && (
        <AssignmentFormModal
          title="Edit Assignment"
          form={editForm}
          setF={setEF}
          uploadedFile={editFile}
          setUploadedFile={setEditFile}
          onClose={closeEdit}
          onSubmit={handleSaveEdit}
          submitting={editSubmitting}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}