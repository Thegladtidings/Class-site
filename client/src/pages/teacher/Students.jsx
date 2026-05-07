import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { getExamResults, getExams } from "../api/teacherApi.js";
import styles from "../../css/Sections.module.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

/* ─── helpers ─────────────────────────────────────────────── */
function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function normalizeClass(raw) {
  if (!raw) return "—";
  const str = String(raw).trim();
  if (!str || str === "—") return "—";
  return str
    .replace(/^([A-Za-z]+)\s*(\d+)$/, (_, letters, digits) =>
      `${letters.toUpperCase()} ${digits}`
    )
    .trim();
}

function classField(s) {
  const raw =
    s.className  ||
    s.class      ||
    s.grade      ||
    s.classLevel ||
    s.level      ||
    "—";
  return normalizeClass(raw);
}

function gradeFromPct(pct) {
  if (pct >= 70) return { letter: "A", label: "Excellent",  color: "#10b981", bg: "#f0fdf4" };
  if (pct >= 60) return { letter: "B", label: "Good",       color: "#1a6ef5", bg: "#eff6ff" };
  if (pct >= 50) return { letter: "C", label: "Average",    color: "#f59e0b", bg: "#fffbeb" };
  if (pct >= 40) return { letter: "D", label: "Below Avg",  color: "#f97316", bg: "#fff7ed" };
  return           { letter: "F", label: "Needs Help",  color: "#ef4444", bg: "#fef2f2" };
}

/* ─── Ring ──────────────────────────────────────────────────── */
function Ring({ pct, size = 64, stroke = 5, color }) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

/* ─── helpers ────────────────────────────────────────────────── */
function generateStudentId() {
  const year    = new Date().getFullYear().toString().slice(-2); // e.g. "25"
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";                   // no I/O to avoid confusion
  const prefix  = letters[Math.floor(Math.random() * letters.length)] +
                  letters[Math.floor(Math.random() * letters.length)];
  const digits  = String(Math.floor(Math.random() * 9000) + 1000); // 1000–9999
  return `STU-${year}${prefix}${digits}`;                          // e.g. STU-25KR4372
}

/* ─── Register Student Modal ────────────────────────────────── */
function RegisterModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(() => ({
    name: "", email: "", password: "", confirm: "",
    className: "", gender: "",
    studentId: generateStudentId(),   // auto-generated on mount
  }));
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const { name, email, password, confirm, className, gender, studentId } = form;

    if (!name || !email || !password || !confirm || !className || !gender || !studentId)
      return setError("Please fill in all fields.");
    if (password !== confirm)
      return setError("Passwords do not match.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/students/register`, {
        name, email, password, className, gender, studentId,
      });
      setSuccess("Student account created successfully!");
      setTimeout(() => { onClose(); onSuccess?.(); }, 1800);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.request ? "Cannot reach server. Is it running?" : "An unexpected error occurred.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const field = (id, label, icon, inputProps) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span style={{
          position: "absolute", left: 12, fontSize: 15, userSelect: "none",
          color: "#94a3b8", pointerEvents: "none",
        }}>{icon}</span>
        <input
          id={id}
          {...inputProps}
          style={{
            width: "100%", paddingLeft: 38, paddingRight: inputProps.type === "password" ? 40 : 12,
            paddingTop: 10, paddingBottom: 10, borderRadius: 10,
            border: "1.5px solid #e2e8f0", background: "#f8fafc",
            fontSize: 13, color: "#1e293b", outline: "none",
            transition: "border-color 0.18s",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#0f172a")}
          onBlur={(e)  => (e.target.style.borderColor = "#e2e8f0")}
        />
        {inputProps.toggleBtn}
      </div>
    </div>
  );

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)", background: "#fff",
          borderRadius: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          overflow: "hidden", animation: "modalIn 0.25s cubic-bezier(0.22,1,0.36,1)",
          fontFamily: "'DM Sans', 'Sora', sans-serif",
        }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to   { opacity: 1; transform: scale(1)    translateY(0);    }
          }
        `}</style>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
          padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
              Teacher Portal
            </p>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "4px 0 0" }}>
              Register New Student
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: "50%", border: "none",
              background: "rgba(255,255,255,0.12)", color: "#fff",
              fontSize: 16, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              transition: "background 0.18s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "rgba(255,255,255,0.22)")}
            onMouseLeave={(e) => (e.target.style.background = "rgba(255,255,255,0.12)")}
            aria-label="Close"
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 10, padding: "10px 14px",
              color: "#dc2626", fontSize: 13, fontWeight: 600,
            }}>
              <span>⚠</span> {error}
            </div>
          )}
          {success && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 10, padding: "10px 14px",
              color: "#16a34a", fontSize: 13, fontWeight: 600,
            }}>
              <span>✔</span> {success}
            </div>
          )}

          {/* Name + Student ID row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {field("reg-name", "Full Name", "👤", {
              type: "text", placeholder: "e.g. Amara Obi",
              value: form.name, onChange: set("name"), required: true, autoComplete: "off",
            })}

            {/* Student ID — read-only, auto-generated */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Student ID{" "}
                <span style={{ fontWeight: 400, color: "#94a3b8", textTransform: "none", letterSpacing: 0, fontSize: 11 }}>
                  (auto)
                </span>
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: 12, fontSize: 14, color: "#94a3b8", pointerEvents: "none", userSelect: "none" }}>#</span>
                <input
                  readOnly
                  value={form.studentId}
                  style={{
                    width: "100%", paddingLeft: 34, paddingRight: 44,
                    paddingTop: 10, paddingBottom: 10, borderRadius: 10,
                    border: "1.5px solid #e2e8f0", background: "#f1f5f9",
                    fontSize: 12, fontWeight: 700, color: "#334155",
                    outline: "none", boxSizing: "border-box",
                    letterSpacing: "0.05em", cursor: "default",
                  }}
                />
                <button
                  type="button"
                  title="Regenerate ID"
                  onClick={() => setForm((f) => ({ ...f, studentId: generateStudentId() }))}
                  style={{
                    position: "absolute", right: 8,
                    background: "#e2e8f0", border: "none", borderRadius: 7,
                    width: 28, height: 28, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#cbd5e1")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                >🔄</button>
              </div>
            </div>
          </div>

          {/* Email */}
          {field("reg-email", "Email Address", "✉", {
            type: "email", placeholder: "student@school.edu",
            value: form.email, onChange: set("email"), required: true, autoComplete: "off",
          })}

          {/* Class + Gender row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="reg-class" style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Class
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#94a3b8", pointerEvents: "none" }}>🏫</span>
                <select
                  id="reg-class"
                  value={form.className}
                  onChange={set("className")}
                  required
                  style={{
                    width: "100%", paddingLeft: 38, paddingRight: 12,
                    paddingTop: 10, paddingBottom: 10, borderRadius: 10,
                    border: "1.5px solid #e2e8f0", background: "#f8fafc",
                    fontSize: 13, color: form.className ? "#1e293b" : "#94a3b8",
                    outline: "none", appearance: "none", boxSizing: "border-box",
                  }}
                >
                  <option value="">Select class…</option>
                  <optgroup label="Junior Secondary">
                    <option value="JSS 1">JSS 1</option>
                    <option value="JSS 2">JSS 2</option>
                    <option value="JSS 3">JSS 3</option>
                  </optgroup>
                  <optgroup label="Senior Secondary">
                    <option value="SS 1">SS 1</option>
                    <option value="SS 2">SS 2</option>
                    <option value="SS 3">SS 3</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="reg-gender" style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Gender
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#94a3b8", pointerEvents: "none" }}>⚥</span>
                <select
                  id="reg-gender"
                  value={form.gender}
                  onChange={set("gender")}
                  required
                  style={{
                    width: "100%", paddingLeft: 38, paddingRight: 12,
                    paddingTop: 10, paddingBottom: 10, borderRadius: 10,
                    border: "1.5px solid #e2e8f0", background: "#f8fafc",
                    fontSize: 13, color: form.gender ? "#1e293b" : "#94a3b8",
                    outline: "none", appearance: "none", boxSizing: "border-box",
                  }}
                >
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="reg-password" style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Password
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <span style={{ position: "absolute", left: 12, fontSize: 15, color: "#94a3b8", pointerEvents: "none" }}>🔒</span>
              <input
                id="reg-password"
                type={showPw ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={set("password")}
                required
                autoComplete="new-password"
                style={{
                  width: "100%", paddingLeft: 38, paddingRight: 44,
                  paddingTop: 10, paddingBottom: 10, borderRadius: 10,
                  border: "1.5px solid #e2e8f0", background: "#f8fafc",
                  fontSize: 13, color: "#1e293b", outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0f172a")}
                onBlur={(e)  => (e.target.style.borderColor = "#e2e8f0")}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: "absolute", right: 10, background: "none",
                  border: "none", cursor: "pointer", fontSize: 16, padding: 4,
                }}
                aria-label={showPw ? "Hide password" : "Show password"}
              >{showPw ? "🙈" : "👁"}</button>
            </div>
          </div>

          {/* Confirm Password */}
          {field("reg-confirm", "Confirm Password", "🔒", {
            type: "password", placeholder: "Re-enter password",
            value: form.confirm, onChange: set("confirm"),
            required: true, autoComplete: "new-password",
          })}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              marginTop: 6, padding: "13px 0", borderRadius: 12, border: "none",
              background: loading ? "#94a3b8" : "linear-gradient(135deg, #0f172a, #1e3a8a)",
              color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "opacity 0.18s",
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff", borderRadius: "50%",
                  display: "inline-block", animation: "spin 0.7s linear infinite",
                }} />
                Creating account…
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </>
            ) : (
              <><span>Register Student</span><span>→</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Student Profile Drawer ───────────────────────────────── */
function ProfileDrawer({ student, exams, onClose }) {
  const [examScores, setExamScores] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!student || !exams?.length) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      setLoading(true);
      const rows = [];
      for (const exam of exams) {
        try {
          const res     = await getExamResults(exam._id);
          const results = res?.data?.results ?? res?.results ?? [];
          const mine    = results.find(
            (r) =>
              String(r.student?._id)        === String(student._id) ||
              r.student?.email              === student.email        ||
              r.student?.name               === student.name         ||
              String(r.student?.studentId)  === String(student.studentId)
          );
          if (mine) {
            rows.push({
              examId:    exam._id,
              examTitle: exam.title,
              subject:   exam.subject,
              term:      exam.term,
              score:     mine.score      ?? 0,
              total:     mine.totalMarks ?? exam.questions?.length ?? 0,
              pct:       mine.percentage ?? 0,
              timeMins:  mine.timeTakenMins ?? null,
            });
          }
        } catch { /* skip silently */ }
      }
      if (!cancelled) { setExamScores(rows); setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [student, exams]);

  const overall = useMemo(() => {
    if (!examScores.length) return null;
    const avg = Math.round(examScores.reduce((s, r) => s + r.pct, 0) / examScores.length);
    return { avg, grade: gradeFromPct(avg) };
  }, [examScores]);

  const bySubject = useMemo(() => {
    const map = {};
    for (const r of examScores) {
      if (!map[r.subject]) map[r.subject] = [];
      map[r.subject].push(r.pct);
    }
    return Object.entries(map).map(([subject, pcts]) => ({
      subject,
      avg: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
    }));
  }, [examScores]);

  if (!student) return null;
  const cl = classField(student);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)",
      display: "flex", justifyContent: "flex-end",
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 100vw)", height: "100%", overflowY: "auto",
          background: "#fff", boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          display: "flex", flexDirection: "column",
          fontFamily: "'DM Sans', 'Sora', sans-serif",
          animation: "slideIn 0.28s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <style>{`
          @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
          @keyframes shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>

        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
          padding: "32px 28px 24px", position: "relative",
        }}>
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 16,
            background: "rgba(255,255,255,0.12)", border: "none",
            color: "#fff", width: 32, height: 32, borderRadius: "50%",
            fontSize: 16, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>✕</button>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg,#38bdf8,#818cf8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, color: "#fff",
              border: "3px solid rgba(255,255,255,0.25)", flexShrink: 0,
            }}>{initials(student.name)}</div>

            <div>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 18, margin: 0 }}>{student.name}</p>
              <p style={{ color: "#94a3b8", fontSize: 13, margin: "4px 0 0" }}>
                {cl}{student.gender ? ` · ${student.gender}` : ""}
              </p>
              {student.studentId && (
                <p style={{ color: "#64748b", fontSize: 11, marginTop: 3 }}>ID: {student.studentId}</p>
              )}
              {student.email && (
                <p style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{student.email}</p>
              )}
            </div>

            {overall && (
              <div style={{ marginLeft: "auto", textAlign: "center" }}>
                <div style={{ position: "relative", width: 64, height: 64 }}>
                  <Ring pct={overall.avg} size={64} stroke={5} color={overall.grade.color} />
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800, color: "#fff",
                  }}>{overall.avg}%</div>
                </div>
                <p style={{ color: "#94a3b8", fontSize: 10, marginTop: 4 }}>Overall</p>
              </div>
            )}
          </div>

          {overall && (
            <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                color: overall.grade.color, background: "rgba(255,255,255,0.1)",
                border: `1px solid ${overall.grade.color}66`,
              }}>Grade {overall.grade.letter} · {overall.grade.label}</span>
              <span style={{
                padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                color: "#94a3b8", background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}>{examScores.length} exam{examScores.length !== 1 ? "s" : ""} taken</span>
            </div>
          )}
        </div>

        <div style={{ padding: "24px 28px", flex: 1 }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array(4).fill(0).map((_, i) => (
                <div key={i} style={{
                  height: 52, borderRadius: 10,
                  background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.4s infinite",
                }} />
              ))}
            </div>
          ) : examScores.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8", fontSize: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ margin: 0, fontWeight: 600 }}>No exam results yet</p>
              <p style={{ margin: "6px 0 0", fontSize: 12 }}>This student hasn't submitted any exams.</p>
            </div>
          ) : (
            <>
              {bySubject.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontWeight: 700, color: "#1e293b", fontSize: 14, marginBottom: 12 }}>
                    Performance by Subject
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {bySubject.map(({ subject, avg }) => {
                      const g = gradeFromPct(avg);
                      return (
                        <div key={subject} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 130, fontSize: 12, fontWeight: 600, color: "#475569", flexShrink: 0, textAlign: "right" }}>{subject}</span>
                          <div style={{ flex: 1, height: 8, borderRadius: 99, background: "#e2e8f0", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${avg}%`, background: g.color, borderRadius: 99, transition: "width 0.5s ease" }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: g.color, width: 36, textAlign: "right" }}>{avg}%</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 999, color: g.color, background: g.bg, flexShrink: 0 }}>{g.letter}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <p style={{ fontWeight: 700, color: "#1e293b", fontSize: 14, marginBottom: 12 }}>Exam Results</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {examScores.map((r) => {
                  const g = gradeFromPct(r.pct);
                  return (
                    <div key={r.examId} style={{
                      border: "1.5px solid #e2e8f0", borderRadius: 12,
                      padding: "14px 16px", display: "flex", alignItems: "center", gap: 14,
                      background: "#fafafa",
                    }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <Ring pct={r.pct} size={48} stroke={4} color={g.color} />
                        <div style={{
                          position: "absolute", inset: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 800, color: g.color,
                        }}>{r.pct}%</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.examTitle}</p>
                        <p style={{ fontSize: 11, color: "#64748b", margin: "3px 0 0" }}>
                          {r.subject} · {r.term}{r.timeMins != null && ` · ${r.timeMins} min`}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 }}>{r.score}/{r.total}</p>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, color: g.color, background: g.bg, display: "inline-block", marginTop: 4 }}>
                          {g.letter} · {g.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function StudentsSection({ students, loading, onStudentRegistered }) {
  const [search, setSearch]           = useState("");
  const [sort, setSort]               = useState("name");
  const [activeClass, setClass]       = useState("all");
  const [profileStudent, setProfile]  = useState(null);
  const [allExams, setAllExams]       = useState([]);
  const [showRegister, setShowRegister] = useState(false);   // ← new

  const [studentAverages, setStudentAverages] = useState({});
  const [averagesLoading, setAvgLoading]      = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const examRes  = await getExams();
        const exams    = examRes?.data?.exams ?? examRes?.exams ?? [];
        setAllExams(exams);

        const allResults = [];
        await Promise.all(
          exams.map(async (exam) => {
            try {
              const res     = await getExamResults(exam._id);
              const results = res?.data?.results ?? res?.results ?? [];
              results.forEach((r) => {
                if (r.student?._id) {
                  allResults.push({ studentId: String(r.student._id), pct: r.percentage ?? 0 });
                }
              });
            } catch { /* skip */ }
          })
        );

        const map = {};
        allResults.forEach(({ studentId, pct }) => {
          if (!map[studentId]) map[studentId] = { total: 0, count: 0 };
          map[studentId].total += pct;
          map[studentId].count += 1;
        });
        const averages = {};
        Object.entries(map).forEach(([id, { total, count }]) => {
          averages[id] = { avg: Math.round(total / count), examCount: count };
        });
        setStudentAverages(averages);
      } catch { /* silent */ }
      finally { setAvgLoading(false); }
    }
    load();
  }, []);

  const classList = useMemo(() => {
    const seen = new Set();
    (students || []).forEach((s) => { const c = classField(s); if (c && c !== "—") seen.add(c); });
    return Array.from(seen).sort((a, b) => {
      const order = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];
      const ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [students]);

  function getAvg(s) { return studentAverages[String(s._id)]?.avg ?? null; }

  const filtered = useMemo(() => {
    return (students || [])
      .filter((s) => {
        const inClass = activeClass === "all" || classField(s) === activeClass;
        const q = search.toLowerCase();
        const matchSearch =
          s.name?.toLowerCase().includes(q)       ||
          classField(s).toLowerCase().includes(q) ||
          s.studentId?.toString().includes(q)     ||
          s.email?.toLowerCase().includes(q);
        return inClass && matchSearch;
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        return (getAvg(b) ?? -1) - (getAvg(a) ?? -1);
      });
  }, [students, activeClass, search, sort, studentAverages]);

  const scopedExams = useMemo(() => {
    if (activeClass === "all") return allExams;
    return allExams.filter((e) => normalizeClass(e.className || e.class || "") === activeClass);
  }, [allExams, activeClass]);

  const isLoading = loading || averagesLoading;

  return (
    <div className={styles.section}>

      {/* ── Header ── */}
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Students</h2>
          <p className={styles.sectionSub}>
            {activeClass === "all"
              ? `${students?.length ?? 0} students enrolled`
              : `${filtered.length} student${filtered.length !== 1 ? "s" : ""} in ${activeClass}`}
          </p>
        </div>
        <div className={styles.controls} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <input
            className={styles.searchInput}
            placeholder="Search by name, ID, class…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Sort: Name</option>
            <option value="avg">Sort: Performance</option>
          </select>

          {/* ── Register Student button ── */}
          <button
            onClick={() => setShowRegister(true)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
              boxShadow: "0 2px 10px rgba(15,23,42,0.25)",
              transition: "opacity 0.18s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <span style={{ fontSize: 16 }}>＋</span>
            Register Student
          </button>
        </div>
      </div>

      {/* ── Class tabs ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        <ClassTab
          label="All Classes" count={students?.length ?? 0}
          active={activeClass === "all"} onClick={() => setClass("all")}
        />
        {classList.map((cls) => (
          <ClassTab
            key={cls} label={cls}
            count={(students || []).filter((s) => classField(s) === cls).length}
            active={activeClass === cls} onClick={() => setClass(cls)}
          />
        ))}
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className={styles.skeletonList}>
          {Array(6).fill(0).map((_, i) => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Average</th>
                <th>Grade</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const avg       = getAvg(s);
                const examCount = studentAverages[String(s._id)]?.examCount ?? 0;
                const g         = gradeFromPct(avg ?? 0);
                return (
                  <tr key={s._id}>
                    <td>
                      <div className={styles.studentCell}>
                        <div className={styles.studentAvatar}>{initials(s.name)}</div>
                        <div>
                          <p className={styles.studentName}>{s.name}</p>
                          <p className={styles.studentMeta}>
                            {s.studentId ? `ID: ${s.studentId}` : s.gender ?? ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.classBadge}>{classField(s)}</span></td>
                    <td>
                      {avg === null ? (
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>No exams yet</span>
                      ) : (
                        <div className={styles.avgWrap}>
                          <span className={styles.avgScore} style={{ color: g.color }}>{avg}%</span>
                          <div className={styles.miniBar}>
                            <div className={styles.miniBarFill} style={{ width: `${avg}%`, background: g.color }} />
                          </div>
                          <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>
                            {examCount} exam{examCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      {avg === null ? (
                        <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: "#94a3b8", background: "#f1f5f9" }}>—</span>
                      ) : (
                        <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, color: g.color, background: g.bg }}>
                          {g.letter} · {g.label}
                        </span>
                      )}
                    </td>
                    <td>
                      <button className={styles.viewBtn} onClick={() => setProfile(s)}>
                        View Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className={styles.emptyState}>
              <span>🔍</span>
              <p>
                {search
                  ? `No students found matching "${search}"`
                  : `No students in ${activeClass}`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Profile drawer ── */}
      {profileStudent && (
        <ProfileDrawer
          student={profileStudent}
          exams={scopedExams}
          onClose={() => setProfile(null)}
        />
      )}

      {/* ── Register Student modal ── */}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => onStudentRegistered?.()}
        />
      )}
    </div>
  );
}

/* ── Class Tab pill ─────────────────────────────────────────── */
function ClassTab({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 999, border: "none",
        cursor: "pointer", fontSize: 13, fontWeight: 600,
        transition: "all 0.18s",
        background: active ? "#0f172a"                         : "#f1f5f9",
        color:      active ? "#fff"                            : "#475569",
        boxShadow:  active ? "0 2px 8px rgba(15,23,42,0.18)" : "none",
      }}
    >
      {label}
      <span style={{
        fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
        background: active ? "rgba(255,255,255,0.15)" : "#e2e8f0",
        color:      active ? "#fff"                   : "#64748b",
      }}>{count}</span>
    </button>
  );
}