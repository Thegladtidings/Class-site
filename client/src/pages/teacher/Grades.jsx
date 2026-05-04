import { useState, useEffect, useCallback } from "react";
import Modal  from "../../components/Modal.jsx";
import Toast  from "../../components/Toast.jsx";
import styles from "../../css/Sections.module.css";
import axiosInstance from "../api/Axiosinstance.js";

/* ── API helpers ───────────────────────────────── */
const api = {
  getStudentsByClass : (cls)         => axiosInstance.get(`/api/grades/students?className=${encodeURIComponent(cls)}`),
  getGrades          : (params = {}) => axiosInstance.get("/api/grades/teacher", { params }),
  createGrade        : (data)        => axiosInstance.post("/api/grades/teacher", data),
  updateGrade        : (id, data)    => axiosInstance.patch(`/api/grades/teacher/${id}`, data),
  deleteGrade        : (id)          => axiosInstance.delete(`/api/grades/teacher/${id}`),
};

/* ── Constants ─────────────────────────────────── */
const CLASSES  = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];
const SUBJECTS = ["Mathematics", "Further Mathematics", "English", "Physics", "Chemistry", "Biology"];
const TERMS    = ["First Term", "Second Term", "Third Term"];

const EMPTY_FORM = {
  student:    "",
  subject:    SUBJECTS[0],
  term:       TERMS[0],
  week:       "",
  score:      "",
  totalScore: "100",
  remarks:    "",
};

/* ── Grade letter from percentage ──────────────── */
function gradeFromPct(pct) {
  if (pct >= 70) return { label: "A", color: "#10b981", bg: "#f0fdf4" };
  if (pct >= 60) return { label: "B", color: "#1a6ef5", bg: "#eff6ff" };
  if (pct >= 50) return { label: "C", color: "#f59e0b", bg: "#fffbeb" };
  if (pct >= 40) return { label: "D", color: "#f97316", bg: "#fff7ed" };
  return           { label: "F", color: "#ef4444", bg: "#fef2f2" };
}

/* ════════════════════════════════════════════════
   GRADE FORM MODAL
   Used for both create and edit.
════════════════════════════════════════════════ */
function GradeFormModal({ students, initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const set = (k, v)   => setForm((p) => ({ ...p, [k]: v }));

  const pct = form.score && form.totalScore
    ? Math.round((Number(form.score) / Number(form.totalScore)) * 100)
    : null;
  const grade = pct != null ? gradeFromPct(pct) : null;

  return (
    <Modal
      title={initial?.isEdit ? "Edit Grade" : "Add Grade"}
      onClose={onClose}
      footer={
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            style={{
              padding: "9px 20px", borderRadius: 10,
              border: "1.5px solid #e2e8f0", background: "#fff",
              color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            style={{
              padding: "9px 20px", borderRadius: 10, border: "none",
              background: "#1a6ef5", color: "#fff",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              opacity: saving ? 0.6 : 1,
            }}
            disabled={saving}
            onClick={() => onSave(form)}
          >
            {saving ? "Saving…" : initial?.isEdit ? "Save Changes" : "Add Grade"}
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Student — only shown when creating */}
        {!initial?.isEdit && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Student</label>
            <select
              value={form.student}
              onChange={(e) => set("student", e.target.value)}
              style={{
                border: "1.5px solid #e2e8f0", borderRadius: 8,
                padding: "9px 12px", fontSize: 13, outline: "none",
              }}
            >
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}{s.studentId ? ` (${s.studentId})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Subject + Term */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Subject</label>
            <select
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }}
            >
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Term</label>
            <select
              value={form.term}
              onChange={(e) => set("term", e.target.value)}
              style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }}
            >
              {TERMS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Score + Total + Week */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Score</label>
            <input
              type="number" min={0} placeholder="e.g. 75"
              value={form.score}
              onChange={(e) => set("score", e.target.value)}
              style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Out of</label>
            <input
              type="number" min={1} placeholder="e.g. 100"
              value={form.totalScore}
              onChange={(e) => set("totalScore", e.target.value)}
              style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Week <span style={{ color: "#94a3b8", fontWeight: 400 }}>(opt)</span></label>
            <input
              type="number" min={1} max={15} placeholder="e.g. 3"
              value={form.week}
              onChange={(e) => set("week", e.target.value)}
              style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }}
            />
          </div>
        </div>

        {/* Live grade preview */}
        {grade && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px", borderRadius: 10,
            background: grade.bg, border: `1.5px solid ${grade.color}40`,
          }}>
            <span style={{
              width: 40, height: 40, borderRadius: "50%",
              background: grade.color, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 900, flexShrink: 0,
            }}>
              {grade.label}
            </span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: grade.color, margin: 0 }}>
                {pct}% — Grade {grade.label}
              </p>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                {form.score} out of {form.totalScore} marks
              </p>
            </div>
          </div>
        )}

        {/* Remarks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
            Remarks <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Excellent performance, needs to work on algebra…"
            value={form.remarks}
            onChange={(e) => set("remarks", e.target.value)}
            style={{
              border: "1.5px solid #e2e8f0", borderRadius: 8,
              padding: "9px 12px", fontSize: 13, outline: "none",
              fontFamily: "inherit", resize: "vertical",
            }}
          />
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════
   MAIN — GradesSection
════════════════════════════════════════════════ */
export default function GradesSection() {
  /* ── Class + student selection ── */
  const [selectedClass,    setSelectedClass]    = useState("");
  const [students,         setStudents]         = useState([]);
  const [studentsLoading,  setStudentsLoading]  = useState(false);

  /* ── Filters ── */
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterTerm,    setFilterTerm]    = useState("All");
  const [search,        setSearch]        = useState("");

  /* ── Grades data ── */
  const [grades,   setGrades]   = useState([]);
  const [loading,  setLoading]  = useState(false);

  /* ── Modals ── */
  const [showAdd,    setShowAdd]    = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving,     setSaving]     = useState(false);

  const [toast, setToast] = useState(null);

  /* ── Load students when class selected ── */
  useEffect(() => {
    if (!selectedClass) { setStudents([]); return; }
    setStudentsLoading(true);
    api.getStudentsByClass(selectedClass)
      .then((r) => setStudents(r?.data?.students ?? []))
      .catch(() => setToast({ msg: "Could not load students.", type: "error" }))
      .finally(() => setStudentsLoading(false));
  }, [selectedClass]);

  /* ── Load grades when class / filters change ── */
  const loadGrades = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const params = { className: selectedClass };
      if (filterSubject !== "All") params.subject = filterSubject;
      if (filterTerm    !== "All") params.term    = filterTerm;
      const r = await api.getGrades(params);
      setGrades(r?.data?.grades ?? []);
    } catch {
      setToast({ msg: "Could not load grades.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [selectedClass, filterSubject, filterTerm]);

  useEffect(() => { loadGrades(); }, [loadGrades]);

  /* ── Create grade ── */
  async function handleCreate(form) {
    if (!form.student)   return setToast({ msg: "Please select a student.", type: "error" });
    if (!form.score)     return setToast({ msg: "Please enter a score.",   type: "error" });
    if (!form.totalScore) return setToast({ msg: "Please enter the total score.", type: "error" });

    setSaving(true);
    try {
      const res = await api.createGrade({
        student:    form.student,
        subject:    form.subject,
        term:       form.term,
        week:       form.week    ? Number(form.week)       : undefined,
        score:      Number(form.score),
        totalScore: Number(form.totalScore),
        remarks:    form.remarks || undefined,
      });
      setGrades((p) => [res.data.grade, ...p]);
      setToast({ msg: "Grade added!", type: "success" });
      setShowAdd(false);
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to save grade.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  /* ── Update grade ── */
  async function handleUpdate(form) {
    setSaving(true);
    try {
      const res = await api.updateGrade(editTarget._id, {
        subject:    form.subject,
        term:       form.term,
        week:       form.week ? Number(form.week) : undefined,
        score:      Number(form.score),
        totalScore: Number(form.totalScore),
        remarks:    form.remarks || undefined,
      });
      setGrades((p) => p.map((g) => g._id === editTarget._id ? res.data.grade : g));
      setToast({ msg: "Grade updated!", type: "success" });
      setEditTarget(null);
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to update grade.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete grade ── */
  async function handleDelete(id) {
    if (!window.confirm("Delete this grade entry?")) return;
    try {
      await api.deleteGrade(id);
      setGrades((p) => p.filter((g) => g._id !== id));
      setToast({ msg: "Grade deleted.", type: "info" });
    } catch {
      setToast({ msg: "Could not delete grade.", type: "error" });
    }
  }

  /* ── Derived / filtered list ── */
  const filtered = grades.filter((g) => {
    if (!search.trim()) return true;
    const name = g.student?.name?.toLowerCase() ?? "";
    const id   = g.student?.studentId?.toLowerCase() ?? "";
    const q    = search.toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  /* ── Summary stats ── */
  const avg     = filtered.length
    ? Math.round(filtered.reduce((s, g) => s + Math.round((g.score / g.totalScore) * 100), 0) / filtered.length)
    : null;
  const passing = filtered.filter((g) => Math.round((g.score / g.totalScore) * 100) >= 50).length;
  const atRisk  = filtered.filter((g) => Math.round((g.score / g.totalScore) * 100) < 50).length;

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <div className={styles.section}>

      {/* ── Header ── */}
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Grades</h2>
          <p className={styles.sectionSub}>
            {selectedClass ? `${selectedClass} · ${grades.length} records` : "Select a class to begin"}
          </p>
        </div>
        {selectedClass && (
          <button
            className={styles.primaryBtn}
            onClick={() => setShowAdd(true)}
          >
            + Add Grade
          </button>
        )}
      </div>

      {/* ── Step 1: Class selector ── */}
      <div style={{
        background: "#fff", border: "1.5px solid #e2e8f0",
        borderRadius: 14, padding: "20px 24px", marginBottom: 20,
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#475569", margin: "0 0 12px" }}>
          1. Select Class
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CLASSES.map((cls) => (
            <button
              key={cls}
              onClick={() => {
                setSelectedClass(cls);
                setSearch("");
                setFilterSubject("All");
                setFilterTerm("All");
              }}
              style={{
                padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                border: "1.5px solid",
                borderColor:  selectedClass === cls ? "#1a6ef5" : "#e2e8f0",
                background:   selectedClass === cls ? "#1a6ef5" : "#f8fafc",
                color:        selectedClass === cls ? "#fff"    : "#475569",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* ── Step 2: Filters + search (shown after class selected) ── */}
      {selectedClass && (
        <div style={{
          display: "flex", gap: 10, flexWrap: "wrap",
          marginBottom: 20, alignItems: "center",
        }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 200px" }}>
            <span style={{
              position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)", fontSize: 14, color: "#94a3b8",
            }}>
              🔍
            </span>
            <input
              placeholder="Search student name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                border: "1.5px solid #e2e8f0", borderRadius: 10,
                padding: "9px 12px 9px 36px", fontSize: 13,
                outline: "none", background: "#fff",
              }}
            />
          </div>

          {/* Subject filter */}
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            style={{
              border: "1.5px solid #e2e8f0", borderRadius: 10,
              padding: "9px 12px", fontSize: 13, outline: "none",
              background: "#fff", color: "#374151",
            }}
          >
            <option value="All">All Subjects</option>
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>

          {/* Term filter */}
          <select
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            style={{
              border: "1.5px solid #e2e8f0", borderRadius: 10,
              padding: "9px 12px", fontSize: 13, outline: "none",
              background: "#fff", color: "#374151",
            }}
          >
            <option value="All">All Terms</option>
            {TERMS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      )}

      {/* ── Summary stats strip ── */}
      {selectedClass && !loading && filtered.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12, marginBottom: 20,
        }}>
          {[
            { label: "Class Average", value: avg != null ? `${avg}%` : "—", color: "#1a6ef5", bg: "#eff6ff" },
            { label: "Passing",       value: passing,                         color: "#10b981", bg: "#f0fdf4" },
            { label: "At Risk (<50%)", value: atRisk,                         color: "#ef4444", bg: "#fef2f2" },
          ].map((s) => (
            <div key={s.label} style={{
              textAlign: "center", padding: "14px 10px",
              background: s.bg, borderRadius: 12,
              border: `1px solid ${s.color}22`,
            }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: "0 0 2px" }}>
                {s.value}
              </p>
              <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Grade records ── */}
      {!selectedClass ? (
        <div className={styles.emptyState}>
          <span>📊</span>
          <p>Select a class above to view and manage grades.</p>
        </div>
      ) : loading ? (
        <div className={styles.skeletonList}>
          {Array(5).fill(0).map((_, i) => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <span>📋</span>
          <p>No grades found. Use "+ Add Grade" to get started.</p>
        </div>
      ) : (
        <div className={styles.cardList}>
          {filtered.map((g) => {
            const pct   = Math.round((g.score / g.totalScore) * 100);
            const grade = gradeFromPct(pct);

            return (
              <div key={g._id} className={styles.itemCard}>
                <div className={styles.itemCardHead}>

                  {/* Student + meta */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg,#1a6ef5,#0ea5e9)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 15, fontWeight: 700,
                    }}>
                      {(g.student?.name?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 2px" }}>
                        {g.student?.name ?? "Unknown"}
                      </p>
                      <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                        {g.subject}&nbsp;·&nbsp;{g.term}
                        {g.week   && <>&nbsp;·&nbsp;Week {g.week}</>}
                        {g.student?.studentId && <>&nbsp;·&nbsp;ID: {g.student.studentId}</>}
                      </p>
                      {g.remarks && (
                        <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0", fontStyle: "italic" }}>
                          💬 {g.remarks}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Score + grade badge */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 24, fontWeight: 900, color: grade.color, margin: "0 0 4px" }}>
                      {pct}%
                    </p>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 32, height: 32, borderRadius: "50%",
                      background: grade.bg, color: grade.color,
                      fontSize: 14, fontWeight: 800,
                    }}>
                      {grade.label}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{
                  height: 6, borderRadius: 99, background: "#e2e8f0",
                  overflow: "hidden", margin: "12px 0 4px",
                }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: grade.color, borderRadius: 99,
                    transition: "width 0.5s ease",
                  }} />
                </div>

                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginTop: 8,
                }}>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                    {g.score} / {g.totalScore} marks
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setEditTarget({
                        ...g,
                        isEdit:     true,
                        score:      String(g.score),
                        totalScore: String(g.totalScore),
                        week:       g.week ? String(g.week) : "",
                        remarks:    g.remarks ?? "",
                      })}
                      style={{
                        fontSize: 12, fontWeight: 600,
                        padding: "5px 12px", borderRadius: 7,
                        border: "1.5px solid #e2e8f0",
                        background: "#f8fafc", color: "#475569",
                        cursor: "pointer",
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(g._id)}
                      style={{
                        fontSize: 12, fontWeight: 600,
                        padding: "5px 12px", borderRadius: 7,
                        border: "1.5px solid #fecaca",
                        background: "#fef2f2", color: "#ef4444",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add modal ── */}
      {showAdd && (
        <GradeFormModal
          students={studentsLoading ? [] : students}
          initial={EMPTY_FORM}
          onSave={handleCreate}
          onClose={() => setShowAdd(false)}
          saving={saving}
        />
      )}

      {/* ── Edit modal ── */}
      {editTarget && (
        <GradeFormModal
          students={students}
          initial={editTarget}
          onSave={handleUpdate}
          onClose={() => setEditTarget(null)}
          saving={saving}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}