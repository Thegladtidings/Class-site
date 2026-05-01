import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";
import styles from "../../css/Sections.module.css";
import { createExam, deleteExam } from "../api/teacherApi";

const EMPTY = {
  subject: "Mathematics",
  date: "",
  duration: "2 hrs",
  instructions: "",
};

export default function ExamsSection({ exams: initList = [], loading }) {
const [list, setList] = useState([]);
  const [showModal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSub] = useState(false);
  const [toast, setToast] = useState(null);

  /* FIXED: correct hook */
 useEffect(() => {
  if (Array.isArray(initList)) {
    setList(initList);
  } else if (Array.isArray(initList?.exams)) {
    setList(initList.exams);
  } else {
    setList([]);
  }
}, [initList]);

  async function handleCreate(e) {
    e.preventDefault();
    setSub(true);

    try {
      await createExam({ ...form, status: "Upcoming" });
    } catch {}

    setList((p) => [
      { _id: `e${Date.now()}`, ...form, status: "Upcoming" },
      ...p,
    ]);

    setModal(false);
    setForm(EMPTY);
    setToast({ msg: "Exam scheduled!", type: "success" });
    setSub(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this exam?")) return;

    try {
      await deleteExam(id);
    } catch {}

    setList((p) => p.filter((x) => x._id !== id));
    setToast({ msg: "Exam removed.", type: "info" });
  }

  const STATUS_COLOR = {
    Upcoming: "blue",
    Ongoing: "amber",
    Completed: "gray",
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Exams</h2>

          <p className={styles.sectionSub}>
            {(list ?? []).filter((e) => e.status === "Upcoming").length} upcoming
          </p>
        </div>

        <button
          className={styles.primaryBtn}
          onClick={() => setModal(true)}
        >
          + Schedule Exam
        </button>
      </div>

      {loading ? (
        <div className={styles.skeletonList}>
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
        </div>
      ) : (
        <div className={styles.cardList}>
          {list.length === 0 && (
            <div className={styles.emptyState}>
              <span>📝</span>
              <p>No exams scheduled yet.</p>
            </div>
          )}

          {list.map((ex) => (
            <div key={ex._id} className={styles.itemCard}>
              <div className={styles.itemCardHead}>
                <div>
                  <p className={styles.itemTitle}>{ex.subject}</p>
                  <p className={styles.itemMeta}>
                    {new Date(ex.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    &nbsp;·&nbsp; {ex.duration}
                  </p>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span
                    className={`${styles.statusPill} ${
                      styles[
                        "pill" +
                          (STATUS_COLOR[ex.status] || "gray")
                            .charAt(0)
                            .toUpperCase() +
                          (STATUS_COLOR[ex.status] || "gray").slice(1)
                      ]
                    }`}
                  >
                    {ex.status}
                  </span>

                  {ex.status === "Completed" && (
                    <button className={styles.viewResultsBtn}>
                      View Results
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.itemActions}>
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => handleDelete(ex._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal
          title="Schedule Exam"
          onClose={() => {
            setModal(false);
            setForm(EMPTY);
          }}
          footer={
            <>
              <button
                className={styles.cancelBtn}
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.primaryBtn}
                form="examForm"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Scheduling…" : "Schedule"}
              </button>
            </>
          }
        >
          <form
            id="examForm"
            onSubmit={handleCreate}
            className={styles.form}
          >
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Subject</label>
                <select
                  value={form.subject}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, subject: e.target.value }))
                  }
                >
                  <option>Mathematics</option>
                  <option>Further Mathematics</option>
                  <option>English</option>
                  <option>Physics</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Date</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Duration</label>
              <select
                value={form.duration}
                onChange={(e) =>
                  setForm((p) => ({ ...p, duration: e.target.value }))
                }
              >
                <option>1 hr</option>
                <option>1.5 hrs</option>
                <option>2 hrs</option>
                <option>2.5 hrs</option>
                <option>3 hrs</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Special Instructions (optional)</label>
              <textarea
                rows={2}
                value={form.instructions}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    instructions: e.target.value,
                  }))
                }
                placeholder="Any notes for students…"
              />
            </div>
          </form>
        </Modal>
      )}

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}