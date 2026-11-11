import { useState, useEffect, useCallback } from "react";
import Modal from "../../components/Modal.jsx";
import Toast from "../../components/Toast.jsx";
import styles from "../../css/Sections.module.css";
import {
  createExam, deleteExam, togglePublishExam,
  getExams, getExamResults, updateExam, uploadQuestionImage,
  getStudentsByClass, resetStudentResult,
} from "../api/teacherApi.js";

const TERMS    = ["First Term", "Second Term", "Third Term"];
const SUBJECTS = ["Mathematics", "Further Mathematics", "English", "Physics", "Chemistry", "Biology", "Economics"];
const CLASSES  = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];

function emptyForm(selectedClass) {
  return {
    title:               "",
    subject:             SUBJECTS[0],
    className:           selectedClass || CLASSES[0],
    term:                TERMS[0],
    durationMins:        60,
    questionsPerStudent: "",
    startTime:           "",
    endTime:             "",
    allowedStudents:     [],   // NEW — empty = all students
    questions:           [{ question: "", options: ["", "", "", ""], correctAnswer: "", imageUrl: "" }],
  };
}

function cloneQuestion() {
  return { question: "", options: ["", "", "", ""], correctAnswer: "", imageUrl: "" };
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
    if (questionText && options.length >= 2)
      parsed.push({ question: questionText, options, correctAnswer });
  }
  return parsed;
}

function formatLocalDatetime(isoString, opts) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("en-US", opts);
}

function isoToLocalInput(isoString) {
  if (!isoString) return "";
  const date   = new Date(isoString);
  const offset = date.getTimezoneOffset();
  const local  = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

/* ── Class Tab pill ── */
function ClassTab({ label, count, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "7px 14px", borderRadius: 999, border: "none",
      cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.18s",
      background: active ? "#0f172a" : "#f1f5f9",
      color:      active ? "#fff"    : "#475569",
      boxShadow:  active ? "0 2px 8px rgba(15,23,42,0.18)" : "none",
    }}>
      {label}
      <span style={{
        fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
        background: active ? "rgba(255,255,255,0.15)" : "#e2e8f0",
        color:      active ? "#fff" : "#64748b",
      }}>{count}</span>
    </button>
  );
}

/* ── Student Selector ─────────────────────────────────────────
   Lets the teacher pick "All Students" or specific students.
   Also shows a "Reset Result" button per student in the results
   panel so they can retake.
──────────────────────────────────────────────────────────── */
function StudentSelector({ className, value, onChange }) {
  const [mode, setMode]         = useState(value.length === 0 ? "all" : "select");
  const [students, setStudents] = useState([]);
  const [loadingS, setLoadingS] = useState(false);
  const [search, setSearch]     = useState("");

  useEffect(() => {
    if (!className) return;
    setLoadingS(true);
    getStudentsByClass(className)
      .then((res) => setStudents(res?.data?.students ?? []))
      .catch(() => {})
      .finally(() => setLoadingS(false));
  }, [className]);

  function toggleStudent(id) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  function selectAll() { onChange(students.map((s) => s._id)); }
  function clearAll()  { onChange([]); }

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId?.toString().includes(search)
  );

  return (
    <div style={{ marginTop: 4 }}>
      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[
          { key: "all",    label: "All students in class" },
          { key: "select", label: "Select specific students" },
        ].map((m) => (
          <button key={m.key} type="button"
            onClick={() => {
              setMode(m.key);
              if (m.key === "all") onChange([]);
            }}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "none",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: mode === m.key ? "#0f172a" : "#f1f5f9",
              color:      mode === m.key ? "#fff"    : "#475569",
              transition: "all 0.18s",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "all" && (
        <div style={{
          padding: "12px 14px", borderRadius: 8,
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          fontSize: 13, color: "#15803d",
        }}>
          ✔ All students in <strong>{className}</strong> can take this exam.
        </div>
      )}

      {mode === "select" && (
        <div>
          {/* Search + bulk actions */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
            <input
              placeholder="Search students…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1, borderRadius: 8, border: "1.5px solid #e2e8f0",
                padding: "7px 12px", fontSize: 13, outline: "none",
              }}
            />
            <button type="button" onClick={selectAll} style={{
              padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
              background: "#fff", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
            }}>All</button>
            <button type="button" onClick={clearAll} style={{
              padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
              background: "#fff", fontSize: 12, fontWeight: 600, color: "#ef4444", cursor: "pointer",
            }}>Clear</button>
          </div>

          {/* Selected count */}
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
            {value.length === 0
              ? "No students selected — select at least one."
              : `${value.length} of ${students.length} student${students.length !== 1 ? "s" : ""} selected`}
          </p>

          {/* Student list */}
          {loadingS ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading students…</div>
          ) : (
            <div style={{
              maxHeight: 260, overflowY: "auto",
              border: "1.5px solid #e2e8f0", borderRadius: 10,
              display: "flex", flexDirection: "column",
            }}>
              {filtered.length === 0 && (
                <div style={{ padding: "20px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  {search ? `No students matching "${search}"` : "No students found in this class."}
                </div>
              )}
              {filtered.map((s, i) => {
                const checked = value.includes(s._id);
                return (
                  <div key={s._id}
                    onClick={() => toggleStudent(s._id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", cursor: "pointer",
                      borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none",
                      background: checked ? "#eff6ff" : "#fff",
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      background: checked ? "#1a6ef5" : "#f1f5f9",
                      border: checked ? "2px solid #1a6ef5" : "2px solid #cbd5e1",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}>
                      {checked && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✔</span>}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      background: "#1e293b", overflow: "hidden",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {s.profileImage ? (
                        <img src={s.profileImage} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6" }}>
                          {s.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: 0 }}>{s.name}</p>
                      {s.studentId && (
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>ID: {s.studentId}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Results Modal — now with Reset Result per student ── */
function ResultsModal({ exam, results, onClose, onResetResult }) {
  const avg    = results.length
    ? Math.round(results.reduce((s, r) => s + (r.percentage ?? 0), 0) / results.length) : 0;
  const passed = results.filter((r) => (r.percentage ?? 0) >= 50).length;
  const [resetting, setResetting] = useState(null);

  async function handleReset(studentId, studentName) {
    if (!window.confirm(`Reset ${studentName}'s result? They will be able to retake the exam.`)) return;
    setResetting(studentId);
    try {
      await onResetResult(exam._id, studentId);
    } finally {
      setResetting(null);
    }
  }

  return (
    <Modal title={`Results — ${exam.title}`} onClose={onClose} footer={
      <button className={styles.cancelBtn} onClick={onClose}>Close</button>
    }>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Submitted", value: results.length, color: "#1a6ef5", bg: "#eff6ff" },
          { label: "Average Score",   value: `${avg}%`,      color: "#10b981", bg: "#f0fdf4" },
          { label: "Passed (≥50%)",   value: passed,         color: "#f59e0b", bg: "#fffbeb" },
        ].map((s) => (
          <div key={s.label} style={{
            textAlign: "center", padding: "14px 10px",
            background: s.bg, borderRadius: 10, border: `1px solid ${s.color}22`,
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
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px",
            gap: 8, padding: "8px 12px",
            background: "#f1f5f9", borderRadius: 8,
            fontSize: 11, fontWeight: 700, color: "#64748b",
          }}>
            <span>Student</span>
            <span style={{ textAlign: "center" }}>Score</span>
            <span style={{ textAlign: "center" }}>%</span>
            <span style={{ textAlign: "center" }}>Time</span>
            <span style={{ textAlign: "center" }}>Grade</span>
            <span style={{ textAlign: "center" }}>Action</span>
          </div>

          {results.map((r, i) => {
            const pct   = r.percentage ?? 0;
            const grade = pct >= 70 ? { label: "A", color: "#10b981", bg: "#f0fdf4" }
                        : pct >= 60 ? { label: "B", color: "#1a6ef5", bg: "#eff6ff" }
                        : pct >= 50 ? { label: "C", color: "#f59e0b", bg: "#fffbeb" }
                        : pct >= 40 ? { label: "D", color: "#f97316", bg: "#fff7ed" }
                        :             { label: "F", color: "#ef4444", bg: "#fef2f2" };
            const studentId   = r.student?._id;
            const studentName = r.student?.name ?? "Unknown";
            const isResetting = resetting === studentId;

            return (
              <div key={r._id ?? i} style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px",
                gap: 8, padding: "10px 12px", background: "#fff",
                borderRadius: 8, border: "1.5px solid #e2e8f0", alignItems: "center",
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{studentName}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8" }}>
                    {r.student?.studentId ?? r.student?.email ?? ""}
                  </p>
                </div>
                <p style={{ textAlign: "center", fontWeight: 600, fontSize: 13 }}>
                  {r.score ?? 0}/{r.totalMarks ?? "—"}
                </p>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: grade.color, marginBottom: 3 }}>{pct}%</p>
                  <div style={{ height: 4, borderRadius: 99, background: "#e2e8f0", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: grade.color, borderRadius: 99 }} />
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
                {/* Reset button */}
                <div style={{ textAlign: "center" }}>
                  <button
                    onClick={() => handleReset(studentId, studentName)}
                    disabled={isResetting || !studentId}
                    title="Reset result so student can retake"
                    style={{
                      padding: "4px 10px", borderRadius: 6, border: "none",
                      background: isResetting ? "#e2e8f0" : "#fef2f2",
                      color: isResetting ? "#94a3b8" : "#ef4444",
                      fontSize: 11, fontWeight: 700, cursor: isResetting ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isResetting ? "…" : "🔄 Reset"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

/* ── Question Builder ── (unchanged from your version) ── */
function QuestionBuilder({ form, setForm, tab, setTab, bulkText, setBulkText, bulkError, setBulkErr }) {
  const [uploadState, setUploadState] = useState({});

  function setQuestion(qi, field, value) {
    setForm((p) => { const qs = [...p.questions]; qs[qi] = { ...qs[qi], [field]: value }; return { ...p, questions: qs }; });
  }
  function setOption(qi, oi, value) {
    setForm((p) => { const qs = [...p.questions]; const opts = [...qs[qi].options]; opts[oi] = value; qs[qi] = { ...qs[qi], options: opts }; return { ...p, questions: qs }; });
  }
  function addQuestion() { setForm((p) => ({ ...p, questions: [...p.questions, cloneQuestion()] })); }
  function removeQuestion(qi) {
    setForm((p) => ({ ...p, questions: p.questions.filter((_, i) => i !== qi) }));
    setUploadState((p) => { const n = { ...p }; delete n[qi]; return n; });
  }
  async function handleImageUpload(qi, file) {
    if (!file) return;
    setUploadState((p) => ({ ...p, [qi]: "uploading" }));
    try {
      const res = await uploadQuestionImage(file);
      setQuestion(qi, "imageUrl", res?.data?.url);
      setUploadState((p) => ({ ...p, [qi]: "idle" }));
    } catch { setUploadState((p) => ({ ...p, [qi]: "error" })); }
  }
  function removeImage(qi) { setQuestion(qi, "imageUrl", ""); setUploadState((p) => ({ ...p, [qi]: "idle" })); }
  function applyBulk() {
    const parsed = parseBulkText(bulkText);
    if (parsed.length === 0) { setBulkErr("Could not parse any questions. Check the format and try again."); return; }
    setBulkErr("");
    setForm((p) => ({ ...p, questions: parsed.map((q) => ({ ...q, imageUrl: "" })) }));
    setTab("manual");
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontWeight: 700, color: "#1e293b", fontSize: 15 }}>Questions ({form.questions.length})</p>
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 3, gap: 3 }}>
          {["manual", "bulk"].map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{
              padding: "5px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: tab === t ? "#fff" : "transparent", color: tab === t ? "#1a6ef5" : "#64748b",
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s",
            }}>
              {t === "manual" ? "✏️ Manual" : "📥 Bulk Upload"}
            </button>
          ))}
        </div>
      </div>

      {tab === "bulk" && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8, lineHeight: 1.6 }}>Paste questions in this format — separate each with a blank line:</p>
          <pre style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, fontSize: 11, color: "#475569", lineHeight: 1.8, marginBottom: 10, whiteSpace: "pre-wrap" }}>{`1. What is 2 + 2?\nA) 3\nB) 4\nC) 5\nD) 6\nAnswer: B`}</pre>
          <textarea rows={10} placeholder="Paste your questions here…" value={bulkText} onChange={(e) => setBulkText(e.target.value)}
            style={{ width: "100%", borderRadius: 8, border: "1.5px solid #e2e8f0", padding: 12, fontSize: 13, fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          {bulkError && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{bulkError}</p>}
          <button type="button" onClick={applyBulk} style={{ marginTop: 10, padding: "8px 20px", borderRadius: 8, background: "#1a6ef5", color: "#fff", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>Import Questions</button>
        </div>
      )}

      {tab === "manual" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {form.questions.map((q, qi) => {
            const imgStatus = uploadState[qi] ?? "idle";
            return (
              <div key={qi} style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>Question {qi + 1}</p>
                  {form.questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(qi)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>✕ Remove</button>
                  )}
                </div>
                <textarea rows={2} placeholder="Enter question…" value={q.question} onChange={(e) => setQuestion(qi, "question", e.target.value)}
                  style={{ width: "100%", borderRadius: 8, border: "1.5px solid #e2e8f0", padding: 10, fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
                <div style={{ marginBottom: 12 }}>
                  {q.imageUrl ? (
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <img src={q.imageUrl} alt={`Question ${qi + 1}`} style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, border: "1.5px solid #e2e8f0", display: "block" }} />
                      <button type="button" onClick={() => removeImage(qi)} style={{ position: "absolute", top: 6, right: 6, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                  ) : (
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1.5px dashed #cbd5e1", background: imgStatus === "uploading" ? "#f8fafc" : "#fff", color: imgStatus === "error" ? "#ef4444" : "#64748b", fontSize: 12, fontWeight: 600, cursor: imgStatus === "uploading" ? "not-allowed" : "pointer" }}>
                      {imgStatus === "uploading" ? <>⏳ Uploading…</> : imgStatus === "error" ? <>❌ Upload failed — try again</> : <>🖼️ Add Image (optional)</>}
                      <input type="file" accept="image/*" style={{ display: "none" }} disabled={imgStatus === "uploading"} onChange={(e) => handleImageUpload(qi, e.target.files[0])} />
                    </label>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  {["A", "B", "C", "D"].map((letter, oi) => (
                    <div key={oi} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#1a6ef5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{letter}</span>
                      <input placeholder={`Option ${letter}`} value={q.options[oi] || ""} onChange={(e) => setOption(qi, oi, e.target.value)}
                        style={{ flex: 1, borderRadius: 8, border: "1.5px solid #e2e8f0", padding: "7px 10px", fontSize: 13, outline: "none" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>✅ Correct Answer:</label>
                  <select value={q.correctAnswer} onChange={(e) => setQuestion(qi, "correctAnswer", e.target.value)}
                    style={{ borderRadius: 8, border: "1.5px solid #e2e8f0", padding: "6px 10px", fontSize: 13, outline: "none" }}>
                    <option value="">Select…</option>
                    {q.options.filter(Boolean).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
          <button type="button" onClick={addQuestion} style={{ padding: "9px 0", borderRadius: 8, border: "1.5px dashed #1a6ef5", background: "#eff6ff", color: "#1a6ef5", fontWeight: 600, fontSize: 13, cursor: "pointer", width: "100%" }}>+ Add Question</button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
export default function ExamsSection({ loading: externalLoading, selectedClass }) {
  const [list, setList]               = useState([]);
  const [fetching, setFetching]       = useState(true);
  const [activeClass, setActiveClass] = useState("all");

  const [showCreate, setCreate]           = useState(false);
  const [createForm, setCreateForm]       = useState(() => emptyForm(selectedClass));
  const [createTab, setCreateTab]         = useState("manual");
  const [createBulk, setCreateBulk]       = useState("");
  const [createBulkErr, setCreateBulkErr] = useState("");
  const [submitting, setSub]              = useState(false);

  const [editTarget, setEditTarget]       = useState(null);
  const [editForm, setEditForm]           = useState(null);
  const [editTab, setEditTab]             = useState("manual");
  const [editBulk, setEditBulk]           = useState("");
  const [editBulkErr, setEditBulkErr]     = useState("");
  const [saving, setSaving]               = useState(false);

  const [resultsExam, setResultsExam]     = useState(null);
  const [resultsData, setResultsData]     = useState([]);
  const [resultsLoading, setResultsLoad]  = useState(false);

  const [toast, setToast]     = useState(null);
  const [togglingId, setTogId] = useState(null);

  useEffect(() => {
    setCreateForm(emptyForm(selectedClass));
    setActiveClass(selectedClass || "all");
  }, [selectedClass]);

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

  const CLASS_ORDER = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];
  const classList = [...new Set(list.map((e) => e.className || e.class).filter(Boolean))].sort((a, b) => {
    const ia = CLASS_ORDER.indexOf(a), ib = CLASS_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  const visibleList = activeClass === "all"
    ? list
    : list.filter((e) => (e.className || e.class) === activeClass);

  function validateForm(form) {
    if (!form.title.trim()) { setToast({ msg: "Please enter an exam title.", type: "error" }); return false; }
    if (!form.startTime)    { setToast({ msg: "Please set a start time.", type: "error" }); return false; }
    if (!form.endTime)      { setToast({ msg: "Please set an end time.", type: "error" }); return false; }
    const qps = Number(form.questionsPerStudent);
    if (form.questionsPerStudent !== "" && (isNaN(qps) || qps < 1)) {
      setToast({ msg: "Questions per student must be a positive number.", type: "error" }); return false;
    }
    if (form.questionsPerStudent !== "" && qps > form.questions.length) {
      setToast({ msg: `Questions per student (${qps}) cannot exceed your pool size (${form.questions.length}).`, type: "error" }); return false;
    }
    if (form.questions.some((q) => !q.question.trim() || q.options.some((o) => !o.trim()) || !q.correctAnswer.trim())) {
      setToast({ msg: "Fill in all questions, options, and correct answers.", type: "error" }); return false;
    }
    return true;
  }

  function buildPayload(form) {
    return {
      ...form,
      durationMins:        Number(form.durationMins),
      questionsPerStudent: form.questionsPerStudent !== "" ? Number(form.questionsPerStudent) : null,
      startTime:           form.startTime ? new Date(form.startTime).toISOString() : null,
      endTime:             form.endTime   ? new Date(form.endTime).toISOString()   : null,
      // Send empty array for "all students", or the selected IDs
      allowedStudents:     form.allowedStudents ?? [],
      questions:           form.questions.map(({ question, options, correctAnswer, imageUrl }) =>
                             ({ question, options, correctAnswer, imageUrl: imageUrl || null })
                           ),
    };
  }

  async function handleCreate() {
    if (!validateForm(createForm)) return;
    setSub(true);
    try {
      const payload = buildPayload(createForm);
      const res     = await createExam(payload);
      const created = res?.data?.exam ?? { _id: `e${Date.now()}`, ...payload, isPublished: false };
      setList((p) => [created, ...p]);
      setToast({ msg: "Exam created successfully!", type: "success" });
      setCreate(false);
      setCreateForm(emptyForm(selectedClass));
      setCreateBulk("");
      setCreateTab("manual");
      if (created.className) setActiveClass(created.className);
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to create exam.", type: "error" });
    } finally {
      setSub(false);
    }
  }

  function openEdit(exam) {
    setEditTarget(exam);
    setEditForm({
      title:               exam.title,
      subject:             exam.subject,
      className:           exam.className,
      term:                exam.term,
      durationMins:        exam.durationMins,
      questionsPerStudent: exam.questionsPerStudent ?? "",
      startTime:           isoToLocalInput(exam.startTime),
      endTime:             isoToLocalInput(exam.endTime),
      allowedStudents:     exam.allowedStudents?.map((s) => s._id ?? s) ?? [],
      questions:           exam.questions?.map((q) => ({
        question:      q.question,
        options:       [...(q.options ?? ["", "", "", ""])],
        correctAnswer: q.correctAnswer ?? "",
        imageUrl:      q.imageUrl ?? "",
      })) ?? [cloneQuestion()],
    });
    setEditTab("manual");
    setEditBulk("");
    setEditBulkErr("");
  }

  async function handleSaveEdit() {
    if (!validateForm(editForm)) return;
    setSaving(true);
    try {
      if (editTarget.isPublished) {
        await togglePublishExam(editTarget._id);
        setList((p) => p.map((x) => x._id === editTarget._id ? { ...x, isPublished: false } : x));
      }
      const payload = buildPayload(editForm);
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

  async function handleRepost(exam) {
    openEdit(exam);
    setToast({ msg: "Update the dates then save to repost the exam.", type: "info" });
  }

  async function handleTogglePublish(exam) {
    setTogId(exam._id);
    try {
      const res     = await togglePublishExam(exam._id);
      const updated = res?.data?.exam;
      setList((p) => p.map((x) =>
        x._id === exam._id ? { ...x, isPublished: updated?.isPublished ?? !x.isPublished } : x
      ));
      setToast({ msg: updated?.isPublished ? "Exam published!" : "Exam unpublished.", type: updated?.isPublished ? "success" : "info" });
    } catch {
      setToast({ msg: "Could not update publish status.", type: "error" });
    } finally {
      setTogId(null);
    }
  }

  async function handleViewResults(exam) {
    setResultsExam(exam);
    setResultsData([]);
    setResultsLoad(true);
    try {
      const res = await getExamResults(exam._id);
      setResultsData(res?.data?.results ?? res?.results ?? []);
    } catch {
      setToast({ msg: "Could not load results.", type: "error" });
      setResultsExam(null);
    } finally {
      setResultsLoad(false);
    }
  }

  // Reset a student's result so they can retake
  async function handleResetResult(examId, studentId) {
    try {
      await resetStudentResult(examId, studentId);
      // Remove from local results list
      setResultsData((p) => p.filter((r) => String(r.student?._id) !== String(studentId)));
      setToast({ msg: "Result reset. Student can now retake the exam.", type: "success" });
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Could not reset result.", type: "error" });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this exam?")) return;
    try {
      await deleteExam(id);
      setList((p) => p.filter((x) => x._id !== id));
      setToast({ msg: "Exam deleted.", type: "info" });
    } catch (err) {
      setToast({
        msg: err.response?.data?.message || "Could not delete the exam.",
        type: "error",
      });
    }
  }

  const now = new Date();
  function examStatus(ex) {
    if (ex.status) return ex.status;
    const start = new Date(ex.startTime), end = new Date(ex.endTime);
    if (now < start)                return "Upcoming";
    if (now >= start && now <= end) return "Ongoing";
    return "Completed";
  }

  const upcomingCount = visibleList.filter((e) => examStatus(e) === "Upcoming").length;
  const ongoingCount  = visibleList.filter((e) => examStatus(e) === "Ongoing").length;
  const PILL = {
    Upcoming:  { color: "#1a6ef5", bg: "#eff6ff" },
    Ongoing:   { color: "#f59e0b", bg: "#fffbeb" },
    Completed: { color: "#6b7280", bg: "#f3f4f6" },
  };
  const isLoading = fetching || externalLoading;

  return (
    <div className={styles.section}>

      {/* Header */}
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Exams</h2>
          <p className={styles.sectionSub}>
            {isLoading ? "Loading…" : (
              <>
                {upcomingCount} upcoming
                {ongoingCount > 0 && <> · <span style={{ color: "#f59e0b", fontWeight: 700 }}>{ongoingCount} ongoing</span></>}
                {activeClass !== "all" && <> · {activeClass}</>}
              </>
            )}
          </p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setCreate(true)}>+ Schedule Exam</button>
      </div>

      {/* Class tabs */}
      {!isLoading && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <ClassTab label="All Classes" count={list.length} active={activeClass === "all"} onClick={() => setActiveClass("all")} />
          {classList.map((cls) => (
            <ClassTab key={cls} label={cls}
              count={list.filter((e) => (e.className || e.class) === cls).length}
              active={activeClass === cls} onClick={() => setActiveClass(cls)} />
          ))}
        </div>
      )}

      {/* Exam list */}
      {isLoading ? (
        <div className={styles.skeletonList}>
          {Array(3).fill(0).map((_, i) => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : (
        <div className={styles.cardList}>
          {visibleList.length === 0 && (
            <div className={styles.emptyState}>
              <span>📝</span>
              <p>{activeClass !== "all" ? `No exams for ${activeClass} yet.` : "No exams scheduled yet."}</p>
            </div>
          )}

          {visibleList.map((ex) => {
            const status   = examStatus(ex);
            const pill     = PILL[status] || PILL.Completed;
            const toggling = togglingId === ex._id;
            const restricted = ex.allowedStudents?.length > 0;

            return (
              <div key={ex._id} className={styles.itemCard}>
                <div className={styles.itemCardHead}>
                  <div style={{ flex: 1 }}>
                    <p className={styles.itemTitle}>{ex.title}</p>
                    <p className={styles.itemMeta}>
                      {ex.subject}&nbsp;·&nbsp;
                      <span style={{ padding: "1px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: activeClass === "all" ? "#eff6ff" : "transparent", color: activeClass === "all" ? "#1a6ef5" : "inherit" }}>
                        {ex.className || ex.class}
                      </span>
                      &nbsp;·&nbsp;{ex.term}
                      {/* Show restricted badge if specific students are selected */}
                      {restricted && (
                        <span style={{ marginLeft: 6, padding: "1px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }}>
                          👥 {ex.allowedStudents.length} student{ex.allowedStudents.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </p>
                    <p className={styles.itemMeta}>
                      {formatLocalDatetime(ex.startTime, { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      &nbsp;→&nbsp;
                      {formatLocalDatetime(ex.endTime, { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      &nbsp;·&nbsp;{ex.durationMins} mins
                      &nbsp;·&nbsp;{ex.questions?.length ?? 0} Qs in pool
                      {ex.questionsPerStudent ? <>&nbsp;·&nbsp;<strong style={{ color: "#1a6ef5" }}>{ex.questionsPerStudent} per student</strong></> : null}
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: pill.color, background: pill.bg }}>{status}</span>
                    <button onClick={() => handleTogglePublish(ex)} disabled={toggling} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999,
                      fontSize: 12, fontWeight: 600, border: "none",
                      cursor: toggling ? "not-allowed" : "pointer", transition: "all 0.25s",
                      background: ex.isPublished ? "#10b981" : "#e2e8f0",
                      color:      ex.isPublished ? "#fff"    : "#475569",
                      opacity:    toggling ? 0.6 : 1,
                    }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: ex.isPublished ? "#fff" : "#94a3b8", display: "inline-block" }} />
                      {toggling ? "Updating…" : ex.isPublished ? "Published" : "Unpublished"}
                    </button>
                  </div>
                </div>

                <div className={styles.itemActions}>
                  <button className={styles.actionBtn} onClick={() => handleViewResults(ex)} style={{ color: "#1a6ef5", borderColor: "#bfdbfe" }}>📊 Results</button>
                  <button className={styles.actionBtn} onClick={() => openEdit(ex)}>✏️ Edit</button>
                  {status === "Completed" && (
                    <button className={styles.actionBtn} onClick={() => handleRepost(ex)} style={{ color: "#10b981", borderColor: "#6ee7b7" }}>🔁 Repost</button>
                  )}
                  <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(ex._id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <Modal
          title={`Schedule Exam${activeClass !== "all" ? ` — ${activeClass}` : ""}`}
          onClose={() => { setCreate(false); setCreateForm(emptyForm(selectedClass)); setCreateBulk(""); setCreateTab("manual"); }}
          footer={
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className={styles.cancelBtn} onClick={() => setCreate(false)}>Cancel</button>
              <button className={styles.primaryBtn} disabled={submitting} onClick={handleCreate}>
                {submitting ? "Creating…" : "Create Exam"}
              </button>
            </div>
          }
        >
          <TopFields form={createForm} setForm={setCreateForm} lockedClass={selectedClass} />
          <QuestionBuilder
            form={createForm} setForm={setCreateForm}
            tab={createTab} setTab={setCreateTab}
            bulkText={createBulk} setBulkText={setCreateBulk}
            bulkError={createBulkErr} setBulkErr={setCreateBulkErr}
          />
        </Modal>
      )}

      {/* EDIT MODAL */}
      {editTarget && editForm && (
        <Modal
          title={`Edit Exam${editTarget.isPublished ? " (will unpublish to save)" : ""}`}
          onClose={() => { setEditTarget(null); setEditForm(null); }}
          footer={
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className={styles.cancelBtn} onClick={() => { setEditTarget(null); setEditForm(null); }}>Cancel</button>
              <button className={styles.primaryBtn} disabled={saving} onClick={handleSaveEdit}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          }
        >
          {editTarget.isPublished && (
            <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#92400e" }}>
              ⚠️ This exam is currently published. Saving will automatically unpublish it.
            </div>
          )}
          <TopFields form={editForm} setForm={setEditForm} lockedClass={selectedClass} />
          <QuestionBuilder
            form={editForm} setForm={setEditForm}
            tab={editTab} setTab={setEditTab}
            bulkText={editBulk} setBulkText={setEditBulk}
            bulkError={editBulkErr} setBulkErr={setEditBulkErr}
          />
        </Modal>
      )}

      {/* RESULTS MODAL */}
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
            onResetResult={handleResetResult}
          />
        )
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}

/* ── TopFields — now includes Student Selector ── */
function TopFields({ form, setForm, lockedClass }) {
  function setTop(field, value) { setForm((p) => ({ ...p, [field]: value })); }

  return (
    <>
      <div className={styles.formGroup}>
        <label>Exam Title</label>
        <input placeholder="e.g. JSS2 Mathematics Exam - Graph & Probability" value={form.title} onChange={(e) => setTop("title", e.target.value)} />
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
          {lockedClass ? (
            <div style={{ padding: "8px 14px", borderRadius: 8, background: "#f1f5f9", border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a6ef5" }} />
              {lockedClass}
              <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>(from class selector)</span>
            </div>
          ) : (
            <select value={form.className} onChange={(e) => setTop("className", e.target.value)}>
              {CLASSES.map((c) => <option key={c}>{c}</option>)}
            </select>
          )}
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
          <input type="number" min={10} max={300} value={form.durationMins} onChange={(e) => setTop("durationMins", e.target.value)} />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Questions Per Student</label>
        <input type="number" min={1} max={form.questions?.length || 999}
          placeholder={`Leave blank to give all ${form.questions?.length ?? 0} questions`}
          value={form.questionsPerStudent} onChange={(e) => setTop("questionsPerStudent", e.target.value)} />
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
          Each student gets this many questions randomly picked from your pool, with options shuffled.
          {form.questionsPerStudent && Number(form.questionsPerStudent) < form.questions?.length
            ? <strong style={{ color: "#1a6ef5" }}>{` Pool: ${form.questions.length} · Per student: ${form.questionsPerStudent}`}</strong>
            : null}
        </p>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Start Time</label>
          <input type="datetime-local" value={form.startTime} onChange={(e) => setTop("startTime", e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label>End Time</label>
          <input type="datetime-local" value={form.endTime} onChange={(e) => setTop("endTime", e.target.value)} />
        </div>
      </div>

      {/* ── NEW: Who can take this exam ── */}
      <div className={styles.formGroup}>
        <label>Who can take this exam?</label>
        <StudentSelector
          className={lockedClass || form.className}
          value={form.allowedStudents ?? []}
          onChange={(ids) => setTop("allowedStudents", ids)}
        />
      </div>
    </>
  );
}