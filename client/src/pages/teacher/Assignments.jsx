import { useState } from "react";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";
import styles from "../../css/Sections.module.css";
import { createAssignment, deleteAssignment, updateAssignment } from "../api/teacherApi";

const EMPTY_FORM = { title: "", subject: "Mathematics", deadline: "", description: "" };

function isOverdue(dateStr) {
  return new Date(dateStr) < new Date();
}

export default function AssignmentsSection({ assignments: initList, loading }) {
  const [list, setList]         = useState(initList || []);
  const [showModal, setModal]   = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [submitting, setSub]    = useState(false);
  const [toast, setToast]       = useState(null);

  // Sync when prop changes (refetch)
  useState(() => { if (initList) setList(initList); }, [initList]);

  async function handleCreate(e) {
    e.preventDefault();
    setSub(true);
    try {
      await createAssignment({ ...form, status: "Active" });
    } catch {
      // optimistic UI — add locally if backend unreachable
    }
    const newA = { _id: `a${Date.now()}`, ...form, status: "Active" };
    setList(p => [newA, ...p]);
    setModal(false);
    setForm(EMPTY_FORM);
    setToast({ msg: "Assignment created!", type: "success" });
    setSub(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this assignment?")) return;
    try { await deleteAssignment(id); } catch { /* optimistic */ }
    setList(p => p.filter(a => a._id !== id));
    setToast({ msg: "Assignment deleted.", type: "info" });
  }

  async function toggleStatus(a) {
    const next = a.status === "Active" ? "Closed" : "Active";
    try { await updateAssignment(a._id, { status: next }); } catch { /* optimistic */ }
    setList(p => p.map(x => x._id === a._id ? { ...x, status: next } : x));
  }

  const active = list.filter(a => a.status === "Active");
  const closed = list.filter(a => a.status !== "Active");

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Assignments</h2>
          <p className={styles.sectionSub}>{active.length} active · {closed.length} closed</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setModal(true)}>
          + New Assignment
        </button>
      </div>

      {loading ? (
        <div className={styles.skeletonList}>
          {Array(4).fill(0).map((_, i) => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : (
        <>
          {list.length === 0 && (
            <div className={styles.emptyState}><span>📋</span><p>No assignments yet. Create one!</p></div>
          )}
          <div className={styles.cardList}>
            {list.map(a => (
              <div
                key={a._id}
                className={`${styles.itemCard} ${a.status === "Active" && isOverdue(a.deadline) ? styles.overdueCard : ""}`}
              >
                <div className={styles.itemCardHead}>
                  <div>
                    <p className={styles.itemTitle}>{a.title}</p>
                    <p className={styles.itemMeta}>{a.subject} &nbsp;·&nbsp; Due: {new Date(a.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {a.status === "Active" && isOverdue(a.deadline) &&
                        <span className={styles.overdueTag}> · Overdue</span>
                      }
                    </p>
                  </div>
                  <span className={`${styles.statusPill} ${a.status === "Active" ? styles.pillGreen : styles.pillGray}`}>
                    {a.status}
                  </span>
                </div>
                <div className={styles.itemActions}>
                  <button className={styles.actionBtn} onClick={() => toggleStatus(a)}>
                    {a.status === "Active" ? "Close" : "Reopen"}
                  </button>
                  <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(a._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <Modal
          title="Create Assignment"
          onClose={() => { setModal(false); setForm(EMPTY_FORM); }}
          footer={
            <>
              <button className={styles.cancelBtn} onClick={() => setModal(false)}>Cancel</button>
              <button className={styles.primaryBtn} form="assignForm" type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create"}
              </button>
            </>
          }
        >
          <form id="assignForm" onSubmit={handleCreate} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Title</label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Pythagoras Word Problems" />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Subject</label>
                <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
                  <option>Mathematics</option>
                  <option>Further Mathematics</option>
                  <option>English</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Deadline</label>
                <input type="date" required value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Description (optional)</label>
              <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Instructions for students…" />
            </div>
          </form>
        </Modal>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}