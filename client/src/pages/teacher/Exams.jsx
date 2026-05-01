import { useState, useEffect } from "react";
import Modal from "../../components/Modal.jsx";
import Toast from "../../components/Toast.jsx";
import styles from "../../css/Sections.module.css";
import { createExam, deleteExam, togglePublishExam } from "../api/teacherApi.js";

const TERMS    = ["First Term", "Second Term", "Third Term"];
const SUBJECTS = ["Mathematics", "Further Mathematics", "English", "Physics", "Chemistry", "Biology"];
const CLASSES  = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];

const EMPTY_QUESTION = { question: "", options: ["", "", "", ""], correctAnswer: "" };

const EMPTY_FORM = {
  title: "",
  subject: SUBJECTS[0],
  className: CLASSES[0],
  term: TERMS[0],
  durationMins: 60,
  startTime: "",
  endTime: "",
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

    const questionText = lines[0].replace(/^\d+[\.\)]\s*/, "").trim();
    const optionLines  = lines.filter((l) => /^[A-Da-d][\.\)]/i.test(l));
    const options      = optionLines.map((l) => l.replace(/^[A-Da-d][\.\)]\s*/i, "").trim());
    const answerLine   = lines.find((l) => /^answer\s*:/i.test(l)) || "";
    const answerLetter = answerLine.replace(/^answer\s*:\s*/i, "").trim().toUpperCase();
    const answerIndex  = ["A", "B", "C", "D"].indexOf(answerLetter);
    const correctAnswer = options[answerIndex] ?? "";

    if (questionText && options.length >= 2) {
      parsed.push({ question: questionText, options, correctAnswer });
    }
  }

  return parsed;
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export default function ExamsSection({ exams: initList = [], loading }) {
  const [list, setList]         = useState([]);
  const [showModal, setModal]   = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [submitting, setSub]    = useState(false);
  const [toast, setToast]       = useState(null);
  const [tab, setTab]           = useState("manual");
  const [bulkText, setBulkText] = useState("");
  const [bulkError, setBulkErr] = useState("");
  const [togglingId, setTogId]  = useState(null);

  useEffect(() => {
    if (Array.isArray(initList))            setList(initList);
    else if (Array.isArray(initList?.exams)) setList(initList.exams);
    else                                    setList([]);
  }, [initList]);

  /* ── field helpers ── */
  function setTop(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function setQuestion(qi, field, value) {
    setForm((p) => {
      const qs = [...p.questions];
      qs[qi] = { ...qs[qi], [field]: value };
      return { ...p, questions: qs };
    });
  }

  function setOption(qi, oi, value) {
    setForm((p) => {
      const qs   = [...p.questions];
      const opts = [...qs[qi].options];
      opts[oi]   = value;
      qs[qi]     = { ...qs[qi], options: opts };
      return { ...p, questions: qs };
    });
  }

  function addQuestion() {
    setForm((p) => ({ ...p, questions: [...p.questions, cloneQuestion()] }));
  }

  function removeQuestion(qi) {
    setForm((p) => ({
      ...p,
      questions: p.questions.filter((_, i) => i !== qi),
    }));
  }

  /* ── bulk parse ── */
  function applyBulk() {
    const parsed = parseBulkText(bulkText);
    if (parsed.length === 0) {
      setBulkErr("Could not parse any questions. Check the format and try again.");
      return;
    }
    setBulkErr("");
    setForm((p) => ({ ...p, questions: parsed }));
    setTab("manual");
    setToast({ msg: `${parsed.length} questions imported!`, type: "success" });
  }

  /* ── submit ── */
  async function handleCreate() {
    // Validate top-level fields
    if (!form.title.trim()) {
      setToast({ msg: "Please enter an exam title.", type: "error" });
      return;
    }
    if (!form.startTime) {
      setToast({ msg: "Please set a start time.", type: "error" });
      return;
    }
    if (!form.endTime) {
      setToast({ msg: "Please set an end time.", type: "error" });
      return;
    }

    // Validate questions
    const emptyQ = form.questions.some(
      (q) =>
        !q.question.trim() ||
        q.options.some((o) => !o.trim()) ||
        !q.correctAnswer.trim()
    );
    if (emptyQ) {
      setToast({ msg: "Fill in all questions, options, and correct answers.", type: "error" });
      return;
    }

    setSub(true);
    try {
      const payload = {
        title:       form.title,
        subject:     form.subject,
        className:   form.className,
        term:        form.term,
        durationMins: Number(form.durationMins),
        startTime:   form.startTime,
        endTime:     form.endTime,
        questions:   form.questions.map((q) => ({
          question:      q.question,
          options:       q.options,
          correctAnswer: q.correctAnswer,
        })),
      };

      const res     = await createExam(payload);
      const created = res?.data?.exam ?? { _id: `e${Date.now()}`, ...payload, isPublished: false };
      setList((p) => [created, ...p]);
      setToast({ msg: "Exam created successfully!", type: "success" });
      setModal(false);
      setForm(EMPTY_FORM);
      setBulkText("");
      setTab("manual");
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to create exam.", type: "error" });
    } finally {
      setSub(false);
    }
  }

  /* ── publish toggle ── */
  async function handleTogglePublish(exam) {
    setTogId(exam._id);
    try {
      const res     = await togglePublishExam(exam._id);
      const updated = res?.data?.exam;
      setList((p) =>
        p.map((x) =>
          x._id === exam._id
            ? { ...x, isPublished: updated?.isPublished ?? !x.isPublished }
            : x
        )
      );
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

  /* ── delete ── */
  async function handleDelete(id) {
    if (!window.confirm("Delete this exam?")) return;
    try { await deleteExam(id); } catch {}
    setList((p) => p.filter((x) => x._id !== id));
    setToast({ msg: "Exam deleted.", type: "info" });
  }

  /* ── derived ── */
  const now = new Date();

  const upcomingCount = list.filter((e) => {
    if (e.status) return e.status === "Upcoming";
    return e.startTime && new Date(e.startTime) > now;
  }).length;

  function examStatus(ex) {
    if (ex.status) return ex.status;
    const start = new Date(ex.startTime);
    const end   = new Date(ex.endTime);
    if (now < start)              return "Upcoming";
    if (now >= start && now <= end) return "Ongoing";
    return "Completed";
  }

  const PILL = {
    Upcoming:  { color: "#1a6ef5", bg: "#eff6ff" },
    Ongoing:   { color: "#f59e0b", bg: "#fffbeb" },
    Completed: { color: "#6b7280", bg: "#f3f4f6" },
  };

  /* ════════════════════════════════
     RENDER
  ════════════════════════════════ */
  return (
    <div className={styles.section}>

      {/* ── Header ── */}
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Exams</h2>
          <p className={styles.sectionSub}>{upcomingCount} upcoming</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setModal(true)}>
          + Schedule Exam
        </button>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className={styles.skeletonList}>
          {Array(3).fill(0).map((_, i) => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : (
        <div className={styles.cardList}>
          {list.length === 0 && (
            <div className={styles.emptyState}>
              <span>📝</span><p>No exams scheduled yet.</p>
            </div>
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
                        ? new Date(ex.endTime).toLocaleString("en-US", {
                            hour: "2-digit", minute: "2-digit",
                          })
                        : "—"}
                      &nbsp;·&nbsp;{ex.durationMins} mins
                      &nbsp;·&nbsp;{ex.questions?.length ?? 0} questions
                    </p>
                  </div>

                  {/* Right — status + publish toggle */}
                  <div style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "flex-end", gap: 8,
                  }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 999,
                      fontSize: 12, fontWeight: 600,
                      color: pill.color, background: pill.bg,
                    }}>
                      {status}
                    </span>

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
                        display: "inline-block", transition: "background 0.25s",
                      }} />
                      {toggling ? "Updating…" : ex.isPublished ? "Published" : "Unpublished"}
                    </button>
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
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════
          CREATE MODAL
      ════════════════════════════════ */}
      {showModal && (
        <Modal
          title="Schedule Exam"
          onClose={() => {
            setModal(false);
            setForm(EMPTY_FORM);
            setBulkText("");
            setTab("manual");
          }}
          footer={
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className={styles.cancelBtn}
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.primaryBtn}
                disabled={submitting}
                onClick={handleCreate}
              >
                {submitting ? "Creating…" : "Create Exam"}
              </button>
            </div>
          }
        >
          <div className={styles.form}>

            {/* ── Top fields ── */}
            <div className={styles.formGroup}>
              <label>Exam Title</label>
              <input
                placeholder="e.g. JSS2 Mathematics Exam - Graph & Probability"
                value={form.title}
                onChange={(e) => setTop("title", e.target.value)}
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
                <input
                  type="number" min={10} max={300}
                  value={form.durationMins}
                  onChange={(e) => setTop("durationMins", e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => setTop("startTime", e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>End Time</label>
                <input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => setTop("endTime", e.target.value)}
                />
              </div>
            </div>

            {/* ── Questions ── */}
            <div style={{ marginTop: 20 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 12,
              }}>
                <p style={{ fontWeight: 700, color: "#1e293b", fontSize: 15 }}>
                  Questions ({form.questions.length})
                </p>

                {/* Manual / Bulk tabs */}
                <div style={{
                  display: "flex", background: "#f1f5f9",
                  borderRadius: 8, padding: 3, gap: 3,
                }}>
                  {["manual", "bulk"].map((t) => (
                    <button
                      key={t} type="button"
                      onClick={() => setTab(t)}
                      style={{
                        padding: "5px 14px", borderRadius: 6, border: "none",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        background: tab === t ? "#fff" : "transparent",
                        color:      tab === t ? "#1a6ef5" : "#64748b",
                        boxShadow:  tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                        transition: "all 0.2s",
                      }}
                    >
                      {t === "manual" ? "✏️ Manual" : "📥 Bulk Upload"}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Bulk tab ── */}
              {tab === "bulk" && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8, lineHeight: 1.6 }}>
                    Paste questions in this format — separate each with a blank line:
                  </p>
                  <pre style={{
                    background: "#f8fafc", border: "1px solid #e2e8f0",
                    borderRadius: 8, padding: 12, fontSize: 11,
                    color: "#475569", lineHeight: 1.8, marginBottom: 10,
                    whiteSpace: "pre-wrap",
                  }}>
{`1. What is 2 + 2?
A) 3
B) 4
C) 5
D) 6
Answer: B

2. What is the capital of Nigeria?
A) Lagos
B) Ibadan
C) Abuja
D) Kano
Answer: C`}
                  </pre>

                  <textarea
                    rows={10}
                    placeholder="Paste your questions here…"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    style={{
                      width: "100%", borderRadius: 8, border: "1.5px solid #e2e8f0",
                      padding: 12, fontSize: 13, fontFamily: "monospace",
                      resize: "vertical", outline: "none", boxSizing: "border-box",
                    }}
                  />

                  {bulkError && (
                    <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{bulkError}</p>
                  )}

                  <button
                    type="button"
                    onClick={applyBulk}
                    style={{
                      marginTop: 10, padding: "8px 20px", borderRadius: 8,
                      background: "#1a6ef5", color: "#fff", fontWeight: 600,
                      fontSize: 13, border: "none", cursor: "pointer",
                    }}
                  >
                    Import Questions
                  </button>
                </div>
              )}

              {/* ── Manual tab ── */}
              {tab === "manual" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {form.questions.map((q, qi) => (
                    <div key={qi} style={{
                      background: "#f8fafc", border: "1.5px solid #e2e8f0",
                      borderRadius: 10, padding: 14,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <p style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>
                          Question {qi + 1}
                        </p>
                        {form.questions.length > 1 && (
                          <button
                            type="button" onClick={() => removeQuestion(qi)}
                            style={{
                              background: "none", border: "none", color: "#ef4444",
                              fontSize: 12, cursor: "pointer", fontWeight: 600,
                            }}
                          >
                            ✕ Remove
                          </button>
                        )}
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Enter question…"
                        value={q.question}
                        onChange={(e) => setQuestion(qi, "question", e.target.value)}
                        style={{
                          width: "100%", borderRadius: 8, border: "1.5px solid #e2e8f0",
                          padding: 10, fontSize: 13, resize: "vertical",
                          outline: "none", boxSizing: "border-box", marginBottom: 10,
                        }}
                      />

                      <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr",
                        gap: 8, marginBottom: 10,
                      }}>
                        {["A", "B", "C", "D"].map((letter, oi) => (
                          <div key={oi} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{
                              width: 22, height: 22, borderRadius: "50%",
                              background: "#1a6ef5", color: "#fff",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 700, flexShrink: 0,
                            }}>
                              {letter}
                            </span>
                            <input
                              placeholder={`Option ${letter}`}
                              value={q.options[oi] || ""}
                              onChange={(e) => setOption(qi, oi, e.target.value)}
                              style={{
                                flex: 1, borderRadius: 8, border: "1.5px solid #e2e8f0",
                                padding: "7px 10px", fontSize: 13, outline: "none",
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Correct answer */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <label style={{
                          fontSize: 12, fontWeight: 600,
                          color: "#475569", whiteSpace: "nowrap",
                        }}>
                          ✅ Correct Answer:
                        </label>
                        <select
                          value={q.correctAnswer}
                          onChange={(e) => setQuestion(qi, "correctAnswer", e.target.value)}
                          style={{
                            borderRadius: 8, border: "1.5px solid #e2e8f0",
                            padding: "6px 10px", fontSize: 13, outline: "none",
                          }}
                        >
                          <option value="">Select…</option>
                          {q.options.filter(Boolean).map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button" onClick={addQuestion}
                    style={{
                      padding: "9px 0", borderRadius: 8,
                      border: "1.5px dashed #1a6ef5", background: "#eff6ff",
                      color: "#1a6ef5", fontWeight: 600, fontSize: 13,
                      cursor: "pointer", width: "100%",
                    }}
                  >
                    + Add Question
                  </button>
                </div>
              )}
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