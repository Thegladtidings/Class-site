import { useState, useEffect } from "react";
import Modal from "../../components/Modal.jsx";
import Toast from "../../components/Toast.jsx";
import styles from "../../css/Sections.module.css";
import axiosInstance from "../api/Axiosinstance.js";

/* ── inline API call (add to teacherApi.js too if you prefer) ── */
const getSubmissionsForAssignment = (assignmentId) =>
  axiosInstance.get(`/api/assignments/${assignmentId}/submissions`);

const gradeSubmission = (submissionId, data) =>
  axiosInstance.patch(`/api/assignments/submissions/${submissionId}/grade`, data);

/* ─────────────────────────────────────────── */

const SUBJECTS = ["Mathematics", "Further Mathematics", "English", "Physics", "Chemistry", "Biology"];
const CLASSES  = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];

const EMPTY_FORM = {
  title: "", subject: SUBJECTS[0], className: CLASSES[0],
  dueDate: "", description: "", attachmentUrl: "", attachmentName: "",
};

const STATUS_META = {
  submitted: { label: "Submitted", color: "#1a6ef5", bg: "#eff6ff" },
  late:      { label: "Late",      color: "#f59e0b", bg: "#fffbeb" },
  graded:    { label: "Graded",    color: "#10b981", bg: "#f0fdf4" },
};

function isOverdue(dateStr) { return dateStr && new Date(dateStr) < new Date(); }
function formatDue(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

/* ════════════════════════════════════════════
   SUBMISSIONS PANEL
   Shown as a slide-in drawer when teacher
   clicks "View Submissions" on an assignment.
════════════════════════════════════════════ */
function SubmissionsPanel({ assignment, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [gradeTarget, setGradeTarget] = useState(null); // submission being graded
  const [gradeForm, setGradeForm]     = useState({ grade: "", teacherRemark: "" });
  const [grading, setGrading]         = useState(false);
  const [toast, setToast]             = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getSubmissionsForAssignment(assignment._id);
        setSubmissions(res?.data?.submissions ?? []);
      } catch {
        setToast({ msg: "Could not load submissions.", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [assignment._id]);

  async function handleGrade() {
    if (!gradeForm.grade.trim()) {
      setToast({ msg: "Please enter a grade.", type: "error" });
      return;
    }
    setGrading(true);
    try {
      const res = await gradeSubmission(gradeTarget._id, gradeForm);
      const updated = res?.data?.submission;
      setSubmissions((prev) =>
        prev.map((s) =>
          s._id === gradeTarget._id
            ? { ...s, grade: updated?.grade ?? gradeForm.grade,
                       teacherRemark: updated?.teacherRemark ?? gradeForm.teacherRemark,
                       status: "graded" }
            : s
        )
      );
      setToast({ msg: "Submission graded!", type: "success" });
      setGradeTarget(null);
      setGradeForm({ grade: "", teacherRemark: "" });
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Grading failed.", type: "error" });
    } finally {
      setGrading(false);
    }
  }

  const gradedCount = submissions.filter((s) => s.status === "graded").length;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.35)", zIndex: 300,
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0,
        width: "min(520px, 100vw)", height: "100vh",
        background: "#fff", zIndex: 301,
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 32px rgba(0,0,0,0.12)",
      }}>

        {/* Drawer header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1.5px solid #e2e8f0",
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 12,
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
              📋 Submissions
            </h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              {assignment.title}&nbsp;·&nbsp;{assignment.className}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", fontSize: 20,
              color: "#94a3b8", cursor: "pointer", lineHeight: 1,
              flexShrink: 0, padding: "2px 6px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Stats strip */}
        {!loading && (
          <div style={{
            display: "flex", gap: 0,
            borderBottom: "1.5px solid #e2e8f0",
          }}>
            {[
              { label: "Total",   value: submissions.length,                          color: "#1a6ef5" },
              { label: "Graded",  value: gradedCount,                                 color: "#10b981" },
              { label: "Pending", value: submissions.length - gradedCount,            color: "#f59e0b" },
            ].map((s) => (
              <div key={s.label} style={{
                flex: 1, padding: "12px 0", textAlign: "center",
                borderRight: "1px solid #e2e8f0",
              }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: "0 0 2px" }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Submission list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Array(3).fill(0).map((_, i) => (
                <div key={i} style={{
                  height: 90, borderRadius: 12,
                  background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.4s infinite",
                }} />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "#94a3b8" }}>
              <p style={{ fontSize: 36, margin: "0 0 10px" }}>📭</p>
              <p style={{ fontSize: 14, margin: 0 }}>No submissions yet.</p>
            </div>
          ) : (
            submissions.map((s) => {
              const meta   = STATUS_META[s.status] ?? STATUS_META.submitted;
              const isGraded = s.status === "graded";

              return (
                <div
                  key={s._id}
                  style={{
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "14px 16px",
                    marginBottom: 10,
                    background: "#fafbfc",
                  }}
                >
                  {/* Student info row */}
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", gap: 10, marginBottom: 10,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "linear-gradient(135deg,#1a6ef5,#0ea5e9)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0,
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
                      borderRadius: 99, color: meta.color, background: meta.bg,
                      whiteSpace: "nowrap",
                    }}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Submission content */}
                  <div style={{
                    background: "#fff", border: "1px solid #e2e8f0",
                    borderRadius: 8, padding: "10px 12px", marginBottom: 10,
                    fontSize: 12,
                  }}>
                    {s.fileName ? (
                      <a
                        href={s.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          color: "#1a6ef5", fontWeight: 600, textDecoration: "none",
                          marginBottom: s.note ? 6 : 0,
                        }}
                      >
                        📎 {s.fileName}
                      </a>
                    ) : (
                      <p style={{ color: "#94a3b8", fontStyle: "italic", margin: 0 }}>
                        No file attached
                      </p>
                    )}
                    {s.note && (
                      <p style={{ color: "#475569", margin: s.fileName ? "6px 0 0" : 0 }}>
                        💬 {s.note}
                      </p>
                    )}
                    <p style={{ color: "#94a3b8", margin: "6px 0 0" }}>
                      Submitted&nbsp;
                      {s.createdAt
                        ? new Date(s.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric",
                            year: "numeric", hour: "2-digit", minute: "2-digit",
                          })
                        : "—"}
                    </p>
                  </div>

                  {/* Grade display (if already graded) */}
                  {isGraded && (
                    <div style={{
                      background: "#f0fdf4", border: "1px solid #86efac",
                      borderRadius: 8, padding: "8px 12px",
                      fontSize: 12, marginBottom: 10,
                    }}>
                      <p style={{ fontWeight: 700, color: "#15803d", margin: "0 0 2px" }}>
                        ✔ Grade: {s.grade}
                      </p>
                      {s.teacherRemark && (
                        <p style={{ color: "#166534", margin: 0 }}>
                          💬 {s.teacherRemark}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Grade / re-grade button */}
                  <button
                    onClick={() => {
                      setGradeTarget(s);
                      setGradeForm({
                        grade:        s.grade        ?? "",
                        teacherRemark: s.teacherRemark ?? "",
                      });
                    }}
                    style={{
                      fontSize: 12, fontWeight: 600,
                      padding: "6px 14px", borderRadius: 8,
                      border: "1.5px solid #e2e8f0",
                      background: isGraded ? "#f8fafc" : "#1a6ef5",
                      color:      isGraded ? "#475569" : "#fff",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {isGraded ? "✏️ Edit Grade" : "✔ Grade"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Grade modal */}
      {gradeTarget && (
        <Modal
          title={`Grade — ${gradeTarget.student?.name ?? "Student"}`}
          onClose={() => setGradeTarget(null)}
          footer={
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                style={{
                  padding: "9px 20px", borderRadius: 10,
                  border: "1.5px solid #e2e8f0", background: "#fff",
                  color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
                onClick={() => setGradeTarget(null)}
              >
                Cancel
              </button>
              <button
                style={{
                  padding: "9px 20px", borderRadius: 10, border: "none",
                  background: "#1a6ef5", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  opacity: grading ? 0.6 : 1,
                }}
                disabled={grading}
                onClick={handleGrade}
              >
                {grading ? "Saving…" : "Save Grade"}
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                Grade
              </label>
              <input
                placeholder="e.g. A, B+, 85/100…"
                value={gradeForm.grade}
                onChange={(e) => setGradeForm((p) => ({ ...p, grade: e.target.value }))}
                style={{
                  border: "1.5px solid #e2e8f0", borderRadius: 8,
                  padding: "9px 12px", fontSize: 13, color: "#0f172a",
                  outline: "none", fontFamily: "inherit",
                }}
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
                style={{
                  border: "1.5px solid #e2e8f0", borderRadius: 8,
                  padding: "9px 12px", fontSize: 13, color: "#0f172a",
                  outline: "none", fontFamily: "inherit", resize: "vertical",
                }}
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
   MAIN — AssignmentsSection
════════════════════════════════════════════ */
export default function AssignmentsSection({ assignments: initList = [], loading }) {
  const [list, setList]             = useState([]);
  const [showModal, setModal]       = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSub]        = useState(false);
  const [toast, setToast]           = useState(null);
  const [viewingSubs, setViewingSubs] = useState(null); // assignment whose subs to show

  useEffect(() => {
    if (Array.isArray(initList)) setList(initList);
  }, [initList]);

  function setF(field, value) { setForm((p) => ({ ...p, [field]: value })); }

  function validate() {
    if (!form.title.trim()) { setToast({ msg: "Please enter a title.",  type: "error" }); return false; }
    if (!form.dueDate)      { setToast({ msg: "Please set a due date.", type: "error" }); return false; }
    if (!form.className)    { setToast({ msg: "Please select a class.", type: "error" }); return false; }
    return true;
  }

  async function handleCreate() {
    if (!validate()) return;
    setSub(true);
    try {
      const payload = {
        title: form.title, subject: form.subject, className: form.className,
        dueDate: form.dueDate, description: form.description,
        attachmentUrl:  form.attachmentUrl  || undefined,
        attachmentName: form.attachmentName || undefined,
      };
      const res     = await createAssignment(payload);
      const created = res?.data?.assignment ?? { _id: `a${Date.now()}`, ...payload, isActive: true };
      setList((p) => [created, ...p]);
      setToast({ msg: "Assignment created!", type: "success" });
      setModal(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to create assignment.", type: "error" });
    } finally {
      setSub(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this assignment?")) return;
    try { await deleteAssignment(id); } catch {}
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
            const overdue = a.isActive !== false && isOverdue(a.dueDate);
            const active  = a.isActive !== false;

            return (
              <div
                key={a._id}
                className={`${styles.itemCard} ${overdue ? styles.overdueCard : ""}`}
              >
                <div className={styles.itemCardHead}>
                  <div style={{ flex: 1 }}>
                    <p className={styles.itemTitle}>{a.title}</p>
                    <p className={styles.itemMeta}>
                      {a.subject}&nbsp;·&nbsp;{a.className}&nbsp;·&nbsp;Due: {formatDue(a.dueDate)}
                      {overdue && <span className={styles.overdueTag}> · Overdue</span>}
                    </p>
                    {a.description && (
                      <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 1.5 }}>
                        {a.description}
                      </p>
                    )}
                    {a.attachmentName && (
                      <a
                        href={a.attachmentUrl} target="_blank" rel="noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          marginTop: 6, fontSize: 12, color: "#1a6ef5", fontWeight: 500,
                        }}
                      >
                        📎 {a.attachmentName}
                      </a>
                    )}
                  </div>

                  <span className={`${styles.statusPill} ${active ? styles.pillGreen : styles.pillGray}`}>
                    {active ? "Active" : "Closed"}
                  </span>
                </div>

                <div className={styles.itemActions}>
                  {/* View Submissions */}
                  <button
                    className={styles.actionBtn}
                    onClick={() => setViewingSubs(a)}
                  >
                    👁 Submissions
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
        <SubmissionsPanel
          assignment={viewingSubs}
          onClose={() => setViewingSubs(null)}
        />
      )}

      {/* Create modal */}
      {showModal && (
        <Modal
          title="New Assignment"
          onClose={() => { setModal(false); setForm(EMPTY_FORM); }}
          footer={
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className={styles.cancelBtn}
                onClick={() => { setModal(false); setForm(EMPTY_FORM); }}
              >
                Cancel
              </button>
              <button className={styles.primaryBtn} disabled={submitting} onClick={handleCreate}>
                {submitting ? "Creating…" : "Create"}
              </button>
            </div>
          }
        >
          <div className={styles.form}>
            <div className={styles.formGroup}>
              <label>Title</label>
              <input
                placeholder="e.g. Pythagoras Word Problems"
                value={form.title}
                onChange={(e) => setF("title", e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Subject</label>
                <select value={form.subject} onChange={(e) => setF("subject", e.target.value)}>
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Class</label>
                <select value={form.className} onChange={(e) => setF("className", e.target.value)}>
                  {CLASSES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setF("dueDate", e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                Description&nbsp;
                <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Instructions for students…"
                value={form.description}
                onChange={(e) => setF("description", e.target.value)}
              />
            </div>

            <div style={{
              background: "#f8fafc", border: "1.5px dashed #cbd5e1",
              borderRadius: 10, padding: 14, marginTop: 4,
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 10 }}>
                📎 Attachment&nbsp;
                <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
              </p>
              <div className={styles.formGroup} style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12 }}>File URL</label>
                <input
                  placeholder="https://…"
                  value={form.attachmentUrl}
                  onChange={(e) => setF("attachmentUrl", e.target.value)}
                />
              </div>
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12 }}>Display Name</label>
                <input
                  placeholder="e.g. Week 3 Worksheet.pdf"
                  value={form.attachmentName}
                  onChange={(e) => setF("attachmentName", e.target.value)}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}