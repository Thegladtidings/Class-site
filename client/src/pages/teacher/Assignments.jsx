import { useState, useEffect } from "react";
import Modal from "../../components/Modal.jsx";
import Toast from "../../components/Toast.jsx";
import styles from "../../css/Sections.module.css";
import { createAssignment, deleteAssignment } from "../api/teacherApi.js";

const SUBJECTS = ["Mathematics", "Further Mathematics", "English", "Physics", "Chemistry", "Biology"];
const CLASSES  = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];

const EMPTY_FORM = {
  title:          "",
  subject:        SUBJECTS[0],
  className:      CLASSES[0],
  dueDate:        "",
  description:    "",
  attachmentUrl:  "",
  attachmentName: "",
};

function isOverdue(dateStr) {
  return dateStr && new Date(dateStr) < new Date();
}

function formatDue(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function AssignmentsSection({ assignments: initList = [], loading }) {
  const [list, setList]       = useState([]);
  const [showModal, setModal] = useState(false);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [submitting, setSub]  = useState(false);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    if (Array.isArray(initList)) setList(initList);
  }, [initList]);

  function setF(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  /* ── validate ── */
  function validate() {
    if (!form.title.trim())   { setToast({ msg: "Please enter a title.",    type: "error" }); return false; }
    if (!form.dueDate)        { setToast({ msg: "Please set a due date.",   type: "error" }); return false; }
    if (!form.className)      { setToast({ msg: "Please select a class.",   type: "error" }); return false; }
    return true;
  }

  /* ── create ── */
  async function handleCreate() {
    if (!validate()) return;
    setSub(true);
    try {
      const payload = {
        title:          form.title,
        subject:        form.subject,
        className:      form.className,
        dueDate:        form.dueDate,
        description:    form.description,
        attachmentUrl:  form.attachmentUrl  || undefined,
        attachmentName: form.attachmentName || undefined,
      };

      const res     = await createAssignment(payload);
      const created = res?.data?.assignment ?? {
        _id: `a${Date.now()}`, ...payload, isActive: true,
      };

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

  /* ── delete ── */
  async function handleDelete(id) {
    if (!window.confirm("Delete this assignment?")) return;
    try { await deleteAssignment(id); } catch {}
    setList((p) => p.filter((a) => a._id !== id));
    setToast({ msg: "Assignment deleted.", type: "info" });
  }

  /* ── derived ── */
  const activeCount  = list.filter((a) => a.isActive !== false).length;
  const closedCount  = list.length - activeCount;

  /* ════════════════════════════════
     RENDER
  ════════════════════════════════ */
  return (
    <div className={styles.section}>

      {/* ── Header ── */}
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

      {/* ── List ── */}
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
                      <p style={{
                        fontSize: 12, color: "#64748b",
                        marginTop: 4, lineHeight: 1.5,
                      }}>
                        {a.description}
                      </p>
                    )}
                    {a.attachmentName && (
                      <a
                        href={a.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          marginTop: 6, fontSize: 12, color: "#1a6ef5", fontWeight: 500,
                        }}
                      >
                        📎 {a.attachmentName}
                      </a>
                    )}
                  </div>

                  <span
                    className={`${styles.statusPill} ${
                      active ? styles.pillGreen : styles.pillGray
                    }`}
                  >
                    {active ? "Active" : "Closed"}
                  </span>
                </div>

                <div className={styles.itemActions}>
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

      {/* ════════════════════════════════
          CREATE MODAL
      ════════════════════════════════ */}
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
              <button
                className={styles.primaryBtn}
                disabled={submitting}
                onClick={handleCreate}
              >
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
              <label>Description <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></label>
              <textarea
                rows={3}
                placeholder="Instructions for students…"
                value={form.description}
                onChange={(e) => setF("description", e.target.value)}
              />
            </div>

            {/* Attachment — paste URL manually since file upload needs Cloudinary */}
            <div style={{
              background: "#f8fafc", border: "1.5px dashed #cbd5e1",
              borderRadius: 10, padding: 14, marginTop: 4,
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 10 }}>
                📎 Attachment <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
              </p>
              <div className={styles.formGroup} style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12 }}>File URL (from Cloudinary / Google Drive / etc.)</label>
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

      {toast && (
        <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  );
}