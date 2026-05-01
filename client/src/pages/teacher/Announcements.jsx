import { useState } from "react";
import Toast from "../../components/Toast.jsx";
import styles from "../../css/Sections.module.css";
import { postAnnouncement } from "../api/teacherApi";

const EMPTY = { title: "", message: "", type: "notice" };

const TYPE_META = {
  notice:       { label: "Notice",       color: "blue",  icon: "📋" },
  best_student: { label: "Best Student", color: "gold",  icon: "🌟" },
  result:       { label: "Result",       color: "green", icon: "📊" },
  event:        { label: "Event",        color: "amber", icon: "📅" },
};

export default function AnnouncementsSection({ announcements: initList, loading }) {
  const [list, setList]       = useState(initList || []);
  const [form, setForm]       = useState(EMPTY);
  const [submitting, setSub]  = useState(false);
  const [toast, setToast]     = useState(null);

  useState(() => { if (initList) setList(initList); }, [initList]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    setSub(true);
    try { await postAnnouncement(form); } catch { /* optimistic */ }
    const newA = { _id: `n${Date.now()}`, ...form, createdAt: new Date().toISOString().slice(0, 10) };
    setList(p => [newA, ...p]);
    setForm(EMPTY);
    setToast({ msg: "Announcement posted!", type: "success" });
    setSub(false);
  }

  function handleDelete(id) {
    setList(p => p.filter(a => a._id !== id));
    setToast({ msg: "Announcement removed.", type: "info" });
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Announcements</h2>
          <p className={styles.sectionSub}>{list.length} posted</p>
        </div>
      </div>

      {/* Post form */}
      <div className={styles.announceForm}>
        <h3 className={styles.announceFormTitle}>Post New Announcement</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup} style={{ flex: 2 }}>
              <label>Title</label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. 🌟 Best Student – Week 11" />
            </div>
            <div className={styles.formGroup}>
              <label>Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {Object.entries(TYPE_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Message</label>
            <textarea required rows={3} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Write your announcement here…" />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className={styles.primaryBtn} disabled={submitting}>
              {submitting ? "Posting…" : "📢 Post Announcement"}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      {loading ? (
        <div className={styles.skeletonList}>{Array(3).fill(0).map((_, i) => <div key={i} className={styles.skeletonRow} style={{ height: 80 }} />)}</div>
      ) : (
        <div className={styles.announceList}>
          {list.length === 0 && (
            <div className={styles.emptyState}><span>📢</span><p>No announcements yet.</p></div>
          )}
          {list.map(a => {
            const meta = TYPE_META[a.type] || TYPE_META.notice;
            return (
              <div key={a._id} className={`${styles.announceCard} ${styles["announce_" + meta.color]}`}>
                <div className={styles.announceCardHead}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={styles.announceTypeIcon}>{meta.icon}</span>
                    <div>
                      <p className={styles.announceTitle}>{a.title}</p>
                      <p className={styles.announceTime}>
                        {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        &nbsp;·&nbsp;
                        <span className={`${styles.typePill} ${styles["pill" + meta.color.charAt(0).toUpperCase() + meta.color.slice(1)]}`}>
                          {meta.label}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button className={styles.delAnnounce} onClick={() => handleDelete(a._id)} title="Delete">✕</button>
                </div>
                <p className={styles.announceBody}>{a.message}</p>
              </div>
            );
          })}
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}