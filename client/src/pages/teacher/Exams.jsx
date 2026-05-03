import { useState, useEffect } from "react";
import Modal from "../../components/Modal.jsx";
import Toast from "../../components/Toast.jsx";
import styles from "../../css/Sections.module.css";
import {
  createExam, deleteExam, togglePublishExam,
  getExams, getExamResults, updateExam,
} from "../api/teacherApi.js";

const TERMS    = ["First Term", "Second Term", "Third Term"];
const SUBJECTS = ["Mathematics", "Further Mathematics", "English", "Physics", "Chemistry", "Biology"];
const CLASSES  = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];

const EMPTY_FORM = {
  title: "", subject: SUBJECTS[0], className: CLASSES[0],
  term: TERMS[0], durationMins: 60, startTime: "", endTime: "",
  questions: [{ question: "", options: ["", "", "", ""], correctAnswer: "" }],
};

function cloneQuestion() {
  return { question: "", options: ["", "", "", ""], correctAnswer: "" };
}

function parseBulkText(raw) {
  const blocks = raw.trim().split(/\n{2,}/);
  const parsed = [];
  for (const block of blocks) {
    const lines = block.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 3) continue;
    const questionText  = lines[0].replace(/^\d+[\.\)]\s*/, "").trim();
    const optionLines   = lines.filter((l) => /^[A-Da-d][\.\)]/i.test(l));
    const options       = optionLines.map((l) => l.replace(/^[A-Da-d][\.\)]\s*/i, "").trim());
    const answerLine    = lines.find((l) => /^answer\s*:/i.test(l)) || "";
    const answerLetter  = answerLine.replace(/^answer\s*:\s*/i, "").trim().toUpperCase();
    const answerIndex   = ["A", "B", "C", "D"].indexOf(answerLetter);
    const correctAnswer = options[answerIndex] ?? "";
    if (questionText && options.length >= 2)
      parsed.push({ question: questionText, options, correctAnswer });
  }
  return parsed;
}

/* ── Reusable question builder (shared by create + edit) ── */
function QuestionBuilder({ form, setForm, tab, setTab, bulkText, setBulkText, bulkError, setBulkErr }) {
  function setQuestion(qi, field, value) {
    setForm((p) => {
      const qs = [...p.questions];
      qs[qi] = { ...qs[qi], [field]: value };
      return { ...p, questions: qs };
    });
  }
  function setOption(qi, oi, value) {
    setForm((p) => {
      const qs = [...p.questions];
      const opts = [...qs[qi].options];
      opts[oi] = value;
      qs[qi] = { ...qs[qi], options: opts };
      return { ...p, questions: qs };
    });
  }
  function addQuestion() {
    setForm((p) => ({ ...p, questions: [...p.questions, cloneQuestion()] }));
  }
  function removeQuestion(qi) {
    setForm((p) => ({ ...p, questions: p.questions.filter((_, i) => i !== qi) }));
  }
  function applyBulk() {
    const parsed = parseBulkText(bulkText);
    if (parsed.length === 0) {
      setBulkErr("Could not parse any questions. Check the format and try again.");
      return;
    }
    setBulkErr("");
    setForm((p) => ({ ...p, questions: parsed }));
    setTab("manual");
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontWeight: 700, color: "#1e293b", fontSize: 15 }}>
          Questions ({form.questions.length})
        </p>
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 3, gap: 3 }}>
          {["manual", "bulk"].map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{
              padding: "5px 14px", borderRadius: 6, border: "none",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: tab === t ? "#fff" : "transparent",
              color: tab === t ? "#1a6ef5" : "#64748b",
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
            }}>
              {t === "manual" ? "✏️ Manual" : "📥 Bulk Upload"}
            </button>
          ))}
        </div>
      </div>

      {tab === "bulk" && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8, lineHeight: 1.6 }}>
            Paste questions in this format — separate each with a blank line:
          </p>
          <pre style={{
            background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8,
            padding: 12, fontSize: 11, color: "#475569", lineHeight: 1.8,
            marginBottom: 10, whiteSpace: "pre-wrap",
          }}>{`1. What is 2 + 2?\nA) 3\nB) 4\nC) 5\nD) 6\nAnswer: B\n\n2. Capital of Nigeria?\nA) Lagos\nB) Ibadan\nC) Abuja\nD) Kano\nAnswer: C`}</pre>
          <textarea
            rows={10} placeholder="Paste your questions here…" value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            style={{
              width: "100%", borderRadius: 8, border: "1.5px solid #e2e8f0",
              padding: 12, fontSize: 13, fontFamily: "monospace",
              resize: "vertical", outline: "none", boxSizing: "border-box",
            }}
          />
          {bulkError && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{bulkError}</p>}
          <button type="button" onClick={applyBulk} style={{
            marginTop: 10, padding: "8px 20px", borderRadius: 8,
            background: "#1a6ef5", color: "#fff", fontWeight: 600,
            fontSize: 13, border: "none", cursor: "pointer",
          }}>
            Import Questions
          </button>
        </div>
      )}

      {tab === "manual" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {form.questions.map((q, qi) => (
            <div key={qi} style={{
              background: "#f8fafc", border: "1.5px solid #e2e8f0",
              borderRadius: 10, padding: 14,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>Question {qi + 1}</p>
                {form.questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(qi)} style={{
                    background: "none", border: "none", color: "#ef4444",
                    fontSize: 12, cursor: "pointer", fontWeight: 600,
                  }}>✕ Remove</button>
                )}
              </div>
              <textarea rows={2} placeholder="Enter question…" value={q.question}
                onChange={(e) => setQuestion(qi, "question", e.target.value)}
                style={{
                  width: "100%", borderRadius: 8, border: "1.5px solid #e2e8f0",
                  padding: 10, fontSize: 13, resize: "vertical",
                  outline: "none", boxSizing: "border-box", marginBottom: 10,
                }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {["A", "B", "C", "D"].map((letter, oi) => (
                  <div key={oi} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: "#1a6ef5", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>{letter}</span>
                    <input placeholder={`Option ${letter}`} value={q.options[oi] || ""}
                      onChange={(e) => setOption(qi, oi, e.target.value)}
                      style={{
                        flex: 1, borderRadius: 8, border: "1.5px solid #e2e8f0",
                        padding: "7px 10px", fontSize: 13, outline: "none",
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>
                  ✅ Correct Answer:
                </label>
                <select value={q.correctAnswer}
                  onChange={(e) => setQuestion(qi, "correctAnswer", e.target.value)}
                  style={{ borderRadius: 8, border: "1.5px solid #e2e8f0", padding: "6px 10px", fontSize: 13, outline: "none" }}
                >
                  <option value="">Select…</option>
                  {q.options.filter(Boolean).map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          <button type="button" onClick={addQuestion} style={{
            padding: "9px 0", borderRadius: 8, border: "1.5px dashed #1a6ef5",
            background: "#eff6ff", color: "#1a6ef5", fontWeight: 600,
            fontSize: 13, cursor: "pointer", width: "100%",
          }}>+ Add Question</button>
        </div>
      )}
    </div>
  );
}

/* ── Results Modal ── */
function ResultsModal({ exam, results, onClose }) {
  const avg = results.length
    ? Math.round(results.reduce((s, r) => s + (r.percentage ?? 0), 0) / results.length)
    : 0;
  const passed = results.filter((r) => (r.percentage ?? 0) >= 50).length;

  return (
    <Modal title={`Results — ${exam.title}`} onClose={onClose} footer={
      <button className={styles.cancelBtn} onClick={onClose}>Close</button>
    }>
      {/* Summary strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12, marginBottom: 20,
      }}>
        {[
          { label: "Total Submitted", value: results.length, color: "#1a6ef5", bg: "#eff6ff" },
          { label: "Average Score",   value: `${avg}%`,      color: "#10b981", bg: "#f0fdf4" },
          { label: "Passed (≥50%)",   value: passed,         color: "#f59e0b", bg: "#fffbeb" },
        ].map((s) => (
          <div key={s.label} style={{
            textAlign: "center", padding: "14px 10px",
            background: s.bg, borderRadius: 10,
            border: `1px solid ${s.color}22`,
          }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {results.length === 0 ? (
        <div className={styles.emptyState}><span>📊</span><p>No submissions yet.</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Header row */}
          <div style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
            gap: 8, padding: "8px 12px",
            background: "#f1f5f9", borderRadius: 8,
            fontSize: 11, fontWeight: 700, color: "#64748b",
          }}>
            <span>Student</span>
            <span style={{ textAlign: "center" }}>Score</span>
            <span style={{ textAlign: "center" }}>Percentage</span>
            <span style={{ textAlign: "center" }}>Time</span>
            <span style={{ textAlign: "center" }}>Grade</span>
          </div>

          {results.map((r, i) => {
            const pct   = r.percentage ?? 0;
            const grade = pct >= 70 ? { label: "A", color: "#10b981", bg: "#f0fdf4" }
                        : pct >= 60 ? { label: "B", color: "#1a6ef5", bg: "#eff6ff" }
                        : pct >= 50 ? { label: "C", color: "#f59e0b", bg: "#fffbeb" }
                        : pct >= 40 ? { label: "D", color: "#f97316", bg: "#fff7ed" }
                        :             { label: "F", color: "#ef4444", bg: "#fef2f2" };
            return (
              <div key={r._id ?? i} style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                gap: 8, padding: "10px 12px",
                background: "#fff", borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                alignItems: "center",
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>
                    {r.student?.name ?? "Unknown"}
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8" }}>
                    {r.student?.studentId ?? r.student?.email ?? ""}
                  </p>
                </div>
                <p style={{ textAlign: "center", fontWeight: 600, fontSize: 13 }}>
                  {r.score ?? 0}/{r.totalMarks ?? "—"}
                </p>
                {/* Progress bar */}
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: grade.color, marginBottom: 3 }}>
                    {pct}%
                  </p>
                  <div style={{
                    height: 4, borderRadius: 99, background: "#e2e8f0", overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%", width: `${pct}%`,
                      background: grade.color, borderRadius: 99,
                      transition: "width 0.4s",
                    }} />
                  </div>
                </div>
                <p style={{ textAlign: "center", fontSize: 12, color: "#64748b" }}>
                  {r.timeTakenMins != null ? `${r.timeTakenMins} min` : "—"}
                </p>
                <div style={{ textAlign: "center" }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                    color: grade.color, background: grade.bg,
                  }}>{grade.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
export default function ExamsSection({ loading: externalLoading }) {
  const [list, setList]           = useState([]);
  const [fetching, setFetching]   = useState(true);

  // Create modal
  const [showCreate, setCreate]   = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createTab, setCreateTab] = useState("manual");
  const [createBulk, setCreateBulk] = useState("");
  const [createBulkErr, setCreateBulkErr] = useState("");
  const [submitting, setSub]      = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState(null);   // exam object being edited
  const [editForm, setEditForm]     = useState(null);
  const [editTab, setEditTab]       = useState("manual");
  const [editBulk, setEditBulk]     = useState("");
  const [editBulkErr, setEditBulkErr] = useState("");
  const [saving, setSaving]         = useState(false);

  // Results modal
  const [resultsExam, setResultsExam]     = useState(null);
  const [resultsData, setResultsData]     = useState([]);
  const [resultsLoading, setResultsLoad] = useState(false);

  const [toast, setToast]         = useState(null);
  const [togglingId, setTogId]    = useState(null);

  /* ── Fetch on mount ── */
  useEffect(() => {
    async function load() {
      try {
        const res  = await getExams();
        const data = res?.data?.exams ?? res?.exams ?? [];
        setList(data);
      } catch {
        setToast({ msg: "Could not load exams.", type: "error" });
      } finally {
        setFetching(false);
      }
    }
    load();
  }, []);

  /* ── Create ── */
  async function handleCreate() {
    if (!createForm.title.trim())  return setToast({ msg: "Please enter an exam title.", type: "error" });
    if (!createForm.startTime)     return setToast({ msg: "Please set a start time.", type: "error" });
    if (!createForm.endTime)       return setToast({ msg: "Please set an end time.", type: "error" });
    const emptyQ = createForm.questions.some(
      (q) => !q.question.trim() || q.options.some((o) => !o.trim()) || !q.correctAnswer.trim()
    );
    if (emptyQ) return setToast({ msg: "Fill in all questions, options, and correct answers.", type: "error" });

    setSub(true);
    try {
      const payload = {
        ...createForm,
        durationMins: Number(createForm.durationMins),
        questions: createForm.questions.map(({ question, options, correctAnswer }) =>
          ({ question, options, correctAnswer })
        ),
      };
      const res     = await createExam(payload);
      const created = res?.data?.exam ?? { _id: `e${Date.now()}`, ...payload, isPublished: false };
      setList((p) => [created, ...p]);
      setToast({ msg: "Exam created successfully!", type: "success" });
      setCreate(false);
      setCreateForm(EMPTY_FORM);
      setCreateBulk("");
      setCreateTab("manual");
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to create exam.", type: "error" });
    } finally {
      setSub(false);
    }
  }

  /* ── Open edit modal ── */
  function openEdit(exam) {
    // Normalise datetime-local format (strip seconds/Z)
    const toLocal = (iso) => iso ? iso.slice(0, 16) : "";
    setEditTarget(exam);
    setEditForm({
      title:       exam.title,
      subject:     exam.subject,
      className:   exam.className,
      term:        exam.term,
      durationMins: exam.durationMins,
      startTime:   toLocal(exam.startTime),
      endTime:     toLocal(exam.endTime),
      questions:   exam.questions?.map((q) => ({
        question:      q.question,
        options:       [...(q.options ?? ["", "", "", ""])],
        correctAnswer: q.correctAnswer ?? "",
      })) ?? [cloneQuestion()],
    });
    setEditTab("manual");
    setEditBulk("");
    setEditBulkErr("");
  }

  /* ── Save edit ── */
  async function handleSaveEdit() {
    if (!editForm.title.trim())  return setToast({ msg: "Please enter an exam title.", type: "error" });
    if (!editForm.startTime)     return setToast({ msg: "Please set a start time.", type: "error" });
    if (!editForm.endTime)       return setToast({ msg: "Please set an end time.", type: "error" });
    const emptyQ = editForm.questions.some(
      (q) => !q.question.trim() || q.options.some((o) => !o.trim()) || !q.correctAnswer.trim()
    );
    if (emptyQ) return setToast({ msg: "Fill in all questions, options, and correct answers.", type: "error" });

    setSaving(true);
    try {
      // If published, unpublish first so backend allows the edit
      if (editTarget.isPublished) {
        await togglePublishExam(editTarget._id);
        setList((p) => p.map((x) =>
          x._id === editTarget._id ? { ...x, isPublished: false } : x
        ));
      }

      const payload = {
        ...editForm,
        durationMins: Number(editForm.durationMins),
        questions: editForm.questions.map(({ question, options, correctAnswer }) =>
          ({ question, options, correctAnswer })
        ),
      };
      const res     = await updateExam(editTarget._id, payload);
      const updated = res?.data?.exam ?? { ...editTarget, ...payload, isPublished: false };
      setList((p) => p.map((x) => x._id === editTarget._id ? updated : x));
      setToast({ msg: "Exam updated! It has been unpublished — republish when ready.", type: "success" });
      setEditTarget(null);
      setEditForm(null);
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to save changes.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  /* ── Repost (reset times + unpublish) ── */
  async function handleRepost(exam) {
    openEdit(exam);
    setToast({ msg: "Update the dates then save to repost the exam.", type: "info" });
  }

  /* ── Publish toggle ── */
  async function handleTogglePublish(exam) {
    setTogId(exam._id);
    try {
      const res     = await togglePublishExam(exam._id);
      const updated = res?.data?.exam;
      setList((p) => p.map((x) =>
        x._id === exam._id
          ? { ...x, isPublished: updated?.isPublished ?? !x.isPublished }
          : x
      ));
      setToast({
        msg:  updated?.isPublished ? "Exam published!" : "Exam unpublished.",
        type: updated?.isPublished ? "success" : "info",
      });
    } catch {
      setToast({ msg: "Could not update publish status.", type: "error" });
    } finally {
      setTogId(null);
    }
  }

  /* ── View results ── */
  async function handleViewResults(exam) {
    setResultsExam(exam);
    setResultsData([]);
    setResultsLoad(true);
    try {
      const res  = await getExamResults(exam._id);
      setResultsData(res?.data?.results ?? res?.results ?? []);
    } catch {
      setToast({ msg: "Could not load results.", type: "error" });
      setResultsExam(null);
    } finally {
      setResultsLoad(false);
    }
  }

  /* ── Delete ── */
  async function handleDelete(id) {
    if (!window.confirm("Delete this exam?")) return;
    try { await deleteExam(id); } catch {}
    setList((p) => p.filter((x) => x._id !== id));
    setToast({ msg: "Exam deleted.", type: "info" });
  }

  /* ── Derived ── */
  const now = new Date();
  const upcomingCount = list.filter((e) => {
    if (e.status) return e.status === "Upcoming";
    return e.startTime && new Date(e.startTime) > now;
  }).length;

  function examStatus(ex) {
    if (ex.status) return ex.status;
    const start = new Date(ex.startTime);
    const end   = new Date(ex.endTime);
    if (now < start)               return "Upcoming";
    if (now >= start && now <= end) return "Ongoing";
    return "Completed";
  }

  const PILL = {
    Upcoming:  { color: "#1a6ef5", bg: "#eff6ff" },
    Ongoing:   { color: "#f59e0b", bg: "#fffbeb" },
    Completed: { color: "#6b7280", bg: "#f3f4f6" },
  };

  const isLoading = fetching || externalLoading;

  /* ════════════════════════════════
     RENDER
  ════════════════════════════════ */
  return (
    <div className={styles.section}>

      {/* ── Header ── */}
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Exams</h2>
          <p className={styles.sectionSub}>
            {isLoading ? "Loading…" : `${upcomingCount} upcoming`}
          </p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setCreate(true)}>
          + Schedule Exam
        </button>
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <div className={styles.skeletonList}>
          {Array(3).fill(0).map((_, i) => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : (
        <div className={styles.cardList}>
          {list.length === 0 && (
            <div className={styles.emptyState}><span>📝</span><p>No exams scheduled yet.</p></div>
          )}

          {list.map((ex) => {
            const status   = examStatus(ex);
            const pill     = PILL[status] || PILL.Completed;
            const toggling = togglingId === ex._id;

            return (
              <div key={ex._id} className={styles.itemCard}>
                <div className={styles.itemCardHead}>

                  {/* Left info */}
                  <div style={{ flex: 1 }}>
                    <p className={styles.itemTitle}>{ex.title}</p>
                    <p className={styles.itemMeta}>
                      {ex.subject}&nbsp;·&nbsp;{ex.className}&nbsp;·&nbsp;{ex.term}
                    </p>
                    <p className={styles.itemMeta}>
                      {ex.startTime
                        ? new Date(ex.startTime).toLocaleString("en-US", {
                            weekday: "short", month: "short", day: "numeric",
                            year: "numeric", hour: "2-digit", minute: "2-digit",
                          })
                        : "—"}
                      &nbsp;→&nbsp;
                      {ex.endTime
                        ? new Date(ex.endTime).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                      &nbsp;·&nbsp;{ex.durationMins} mins
                      &nbsp;·&nbsp;{ex.questions?.length ?? 0} questions
                    </p>
                  </div>

                  {/* Right — status + publish toggle */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                      color: pill.color, background: pill.bg,
                    }}>{status}</span>

                    <button
                      onClick={() => handleTogglePublish(ex)}
                      disabled={toggling}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "5px 12px", borderRadius: 999,
                        fontSize: 12, fontWeight: 600, border: "none",
                        cursor: toggling ? "not-allowed" : "pointer",
                        transition: "all 0.25s",
                        background: ex.isPublished ? "#10b981" : "#e2e8f0",
                        color:      ex.isPublished ? "#fff"    : "#475569",
                        opacity:    toggling ? 0.6 : 1,
                      }}
                    >
                      <span style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: ex.isPublished ? "#fff" : "#94a3b8",
                        display: "inline-block",
                      }} />
                      {toggling ? "Updating…" : ex.isPublished ? "Published" : "Unpublished"}
                    </button>
                  </div>
                </div>

                {/* ── Action row ── */}
                <div className={styles.itemActions}>
                  {/* View Results — always visible */}
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleViewResults(ex)}
                    style={{ color: "#1a6ef5", borderColor: "#bfdbfe" }}
                  >
                    📊 Results
                  </button>

                  {/* Edit */}
                  <button
                    className={styles.actionBtn}
                    onClick={() => openEdit(ex)}
                  >
                    ✏️ Edit
                  </button>

                  {/* Repost — only for Completed */}
                  {status === "Completed" && (
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleRepost(ex)}
                      style={{ color: "#10b981", borderColor: "#6ee7b7" }}
                    >
                      🔁 Repost
                    </button>
                  )}

                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => handleDelete(ex._id)}
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
      {showCreate && (
        <Modal
          title="Schedule Exam"
          onClose={() => { setCreate(false); setCreateForm(EMPTY_FORM); setCreateBulk(""); setCreateTab("manual"); }}
          footer={
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className={styles.cancelBtn} onClick={() => setCreate(false)}>Cancel</button>
              <button className={styles.primaryBtn} disabled={submitting} onClick={handleCreate}>
                {submitting ? "Creating…" : "Create Exam"}
              </button>
            </div>
          }
        >
          <TopFields form={createForm} setForm={setCreateForm} />
          <QuestionBuilder
            form={createForm} setForm={setCreateForm}
            tab={createTab} setTab={setCreateTab}
            bulkText={createBulk} setBulkText={setCreateBulk}
            bulkError={createBulkErr} setBulkErr={setCreateBulkErr}
          />
        </Modal>
      )}

      {/* ════════════════════════════════
          EDIT MODAL
      ════════════════════════════════ */}
      {editTarget && editForm && (
        <Modal
          title={`Edit Exam${editTarget.isPublished ? " (will unpublish to save)" : ""}`}
          onClose={() => { setEditTarget(null); setEditForm(null); }}
          footer={
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className={styles.cancelBtn} onClick={() => { setEditTarget(null); setEditForm(null); }}>
                Cancel
              </button>
              <button className={styles.primaryBtn} disabled={saving} onClick={handleSaveEdit}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          }
        >
          {editTarget.isPublished && (
            <div style={{
              background: "#fffbeb", border: "1.5px solid #fde68a",
              borderRadius: 8, padding: "10px 14px", marginBottom: 16,
              fontSize: 13, color: "#92400e",
            }}>
              ⚠️ This exam is currently published. Saving will automatically unpublish it — remember to republish when ready.
            </div>
          )}
          <TopFields form={editForm} setForm={setEditForm} />
          <QuestionBuilder
            form={editForm} setForm={setEditForm}
            tab={editTab} setTab={setEditTab}
            bulkText={editBulk} setBulkText={setEditBulk}
            bulkError={editBulkErr} setBulkErr={setEditBulkErr}
          />
        </Modal>
      )}

      {/* ════════════════════════════════
          RESULTS MODAL
      ════════════════════════════════ */}
      {resultsExam && (
        resultsLoading ? (
          <Modal title="Loading results…" onClose={() => setResultsExam(null)}>
            <div className={styles.skeletonList}>
              {Array(4).fill(0).map((_, i) => <div key={i} className={styles.skeletonRow} />)}
            </div>
          </Modal>
        ) : (
          <ResultsModal
            exam={resultsExam}
            results={resultsData}
            onClose={() => { setResultsExam(null); setResultsData([]); }}
          />
        )
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}

/* ── Shared top-fields block (avoids duplication in both modals) ── */
function TopFields({ form, setForm }) {
  function setTop(field, value) { setForm((p) => ({ ...p, [field]: value })); }
  return (
    <>
      <div className={styles.formGroup}>
        <label>Exam Title</label>
        <input
          placeholder="e.g. JSS2 Mathematics Exam - Graph & Probability"
          value={form.title} onChange={(e) => setTop("title", e.target.value)}
        />
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Subject</label>
          <select value={form.subject} onChange={(e) => setTop("subject", e.target.value)}>
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Class</label>
          <select value={form.className} onChange={(e) => setTop("className", e.target.value)}>
            {CLASSES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Term</label>
          <select value={form.term} onChange={(e) => setTop("term", e.target.value)}>
            {TERMS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Duration (mins)</label>
          <input type="number" min={10} max={300} value={form.durationMins}
            onChange={(e) => setTop("durationMins", e.target.value)} />
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Start Time</label>
          <input type="datetime-local" value={form.startTime}
            onChange={(e) => setTop("startTime", e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label>End Time</label>
          <input type="datetime-local" value={form.endTime}
            onChange={(e) => setTop("endTime", e.target.value)} />
        </div>
      </div>
    </>
  );
}