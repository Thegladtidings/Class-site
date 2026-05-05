import { useState, useEffect, useCallback, useRef } from "react";
import Toast from "../../components/Toast.jsx";
import styles from "../../css/Studentdashboard.module.css";
import {
  getAvailableExams,
  getMyExamResults,
  startExam,
  submitExam,
} from "../api/studentApi";

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
function fmtTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function gradeFromPct(pct) {
  if (pct >= 70) return { label: "A", color: "#10b981", bg: "#f0fdf4" };
  if (pct >= 60) return { label: "B", color: "#1a6ef5", bg: "#eff6ff" };
  if (pct >= 50) return { label: "C", color: "#f59e0b", bg: "#fffbeb" };
  if (pct >= 40) return { label: "D", color: "#f97316", bg: "#fff7ed" };
  return { label: "F", color: "#ef4444", bg: "#fef2f2" };
}

/* ════════════════════════════════════════════
   MISSED QUESTIONS PANEL
════════════════════════════════════════════ */
function MissedQuestions({ answers, showAll, onToggleShowAll }) {
  const answerList = Array.isArray(answers) ? answers : [];

  if (answerList.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "#94a3b8", padding: "12px 0" }}>
        No answer data available for this result.
      </p>
    );
  }

  const missed = answerList.filter((a) => !a.isCorrect);
  const correct = answerList.filter((a) => a.isCorrect);
  const displayList = showAll ? answerList : missed;

  return (
    <div style={{ marginTop: 16 }}>
      {/* Summary bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: 99,
              background: "#fef2f2",
              color: "#ef4444",
            }}
          >
            ✘ {missed.length} missed
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: 99,
              background: "#f0fdf4",
              color: "#10b981",
            }}
          >
            ✔ {correct.length} correct
          </span>
        </div>
        <button
          onClick={onToggleShowAll}
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "5px 14px",
            borderRadius: 8,
            border: "1.5px solid #e2e8f0",
            background: "#f8fafc",
            color: "#475569",
            cursor: "pointer",
          }}
        >
          {showAll ? "Show missed only" : "Show all answers"}
        </button>
      </div>

      {/* Perfect score */}
      {missed.length === 0 && !showAll && (
        <div
          style={{
            textAlign: "center",
            padding: "32px 20px",
            background: "#f0fdf4",
            borderRadius: 14,
            border: "1.5px solid #bbf7d0",
          }}
        >
          <p style={{ fontSize: 28, margin: "0 0 8px" }}>🎯</p>
          <p style={{ fontWeight: 700, color: "#10b981", margin: "0 0 4px" }}>
            Perfect score!
          </p>
          <p style={{ fontSize: 13, color: "#059669", margin: 0 }}>
            You got every question right.
          </p>
        </div>
      )}

      {/* Answer cards */}
      {displayList.map((ans, idx) => {
        const isCorrect = ans.isCorrect;
        const skipped = !ans.selectedOption;
        const questionNum = answerList.findIndex((a) => a._id === ans._id) + 1;

        const cardBorder = isCorrect ? "#bbf7d0" : skipped ? "#e2e8f0" : "#fecaca";
        const cardBg = isCorrect ? "#f0fdf4" : skipped ? "#f8fafc" : "#fef2f2";
        const badgeColor = isCorrect ? "#10b981" : skipped ? "#94a3b8" : "#ef4444";
        const badgeBg = isCorrect ? "#dcfce7" : skipped ? "#f1f5f9" : "#fee2e2";
        const badgeLabel = isCorrect ? "✔ Correct" : skipped ? "— Skipped" : "✘ Missed";

        const optionBg = isCorrect ? "#dcfce7" : "#fee2e2";
        const optionBorder = isCorrect ? "#86efac" : "#fca5a5";
        const optionColor = isCorrect ? "#15803d" : "#b91c1c";
        const iconBg = isCorrect ? "#10b981" : "#ef4444";
        const answerLabel = isCorrect ? "Your answer (correct)" : "Your answer (wrong)";

        return (
          <div
            key={ans._id ?? idx}
            style={{
              border: `1.5px solid ${cardBorder}`,
              background: cardBg,
              borderRadius: 14,
              padding: "16px 18px",
              marginBottom: 14,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <p
                style={{ fontSize: 13, fontWeight: 600, color: "#64748b", margin: 0 }}
              >
                Question {questionNum}
              </p>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  padding: "3px 10px",
                  borderRadius: 99,
                  color: badgeColor,
                  background: badgeBg,
                }}
              >
                {badgeLabel}
              </span>
            </div>

            {/* Answer row */}
            {skipped ? (
              <p
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  fontStyle: "italic",
                  margin: 0,
                }}
              >
                You did not answer this question.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${optionBorder}`,
                  background: optionBg,
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    flexShrink: 0,
                    background: iconBg,
                    color: "#fff",
                  }}
                >
                  {isCorrect ? "✔" : "✘"}
                </span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      margin: "0 0 2px",
                      color: optionColor,
                    }}
                  >
                    {answerLabel}
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: optionColor,
                      margin: 0,
                    }}
                  >
                    {ans.selectedOption}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════
   RESULT DETAIL
════════════════════════════════════════════ */
function ResultDetail({ result, onBack }) {
  const pct = result.percentage ?? 0;
  const grade = gradeFromPct(pct);
  const [showAll, setShowAll] = useState(false);

  return (
    <div className={styles.examShell}>
      <div className={styles.examTopBar}>
        <div>
          <p className={styles.examTitle}>{result.exam?.title ?? "Exam"}</p>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
            {result.exam?.subject} · {result.exam?.className}
          </p>
        </div>
        <button className={styles.actionBtn} onClick={onBack}>
          ← Back to Results
        </button>
      </div>

      <div className={styles.examBody}>
        {/* Score strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "16px 20px",
            background: grade.bg,
            borderRadius: 14,
            border: `1.5px solid ${grade.color}30`,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: `3px solid ${grade.color}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#fff",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: grade.color,
                lineHeight: 1,
              }}
            >
              {pct}%
            </span>
          </div>
          <div>
            <p
              style={{
                fontWeight: 800,
                fontSize: 15,
                color: "#0f172a",
                margin: "0 0 2px",
              }}
            >
              {result.exam?.title ?? "Exam"}
            </p>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              {result.score ?? 0}/{result.totalMarks ?? "?"} marks · Grade{" "}
              {grade.label}
              {result.timeTakenMins != null && ` · ${result.timeTakenMins} min`}
            </p>
          </div>
        </div>

        <MissedQuestions
          answers={result.answers}
          showAll={showAll}
          onToggleShowAll={() => setShowAll((v) => !v)}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   SCORE SCREEN
════════════════════════════════════════════ */
function ScoreScreen({ result, onBack }) {
  const pct = result.percentage ?? 0;
  const grade = gradeFromPct(pct);
  const [showReview, setReview] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const answersArray = Array.isArray(result.result?.answers)
    ? result.result.answers
    : [];

  return (
    <div className={styles.examShell}>
      <div className={styles.examTopBar}>
        <p className={styles.examTitle}>{result.exam?.title}</p>
        <button className={styles.actionBtn} onClick={onBack}>
          ← Back to Exams
        </button>
      </div>

      <div className={styles.examBody}>
        <div className={styles.scoreScreen}>
          {/* Score circle */}
          <div
            className={styles.scoreCircle}
            style={{ borderColor: grade.color, background: grade.bg }}
          >
            <span
              className={styles.scoreValue}
              style={{ color: grade.color }}
            >
              {pct}%
            </span>
            <span className={styles.scoreLabel}>Score</span>
          </div>

          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#0f172a",
              margin: "0 0 6px",
            }}
          >
            {pct >= 50 ? "Well done! 🎉" : "Keep practising 💪"}
          </h2>
          <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 24px" }}>
            You scored&nbsp;
            <strong style={{ color: grade.color }}>
              {result.score ?? "?"}/{result.totalMarks ?? "?"}
            </strong>
            &nbsp;·&nbsp;Grade&nbsp;
            <strong style={{ color: grade.color }}>{grade.label}</strong>
          </p>

          {/* Stats strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              maxWidth: 400,
              margin: "0 auto 28px",
            }}
          >
            {[
              {
                label: "Score",
                value: `${result.score ?? 0}/${result.totalMarks ?? "?"}`,
                color: grade.color,
              },
              { label: "Grade", value: grade.label, color: grade.color },
              {
                label: "Time",
                value:
                  result.result?.timeTakenMins != null
                    ? `${result.result.timeTakenMins} min`
                    : "—",
                color: "#64748b",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "#fff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "14px 10px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: s.color,
                    margin: "0 0 4px",
                  }}
                >
                  {s.value}
                </p>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {answersArray.length > 0 && (
            <button
              className={styles.primaryBtn}
              style={{ background: "#f1f5f9", color: "#475569" }}
              onClick={() => setReview((v) => !v)}
            >
              {showReview ? "Hide Review" : "📋 Review Answers"}
            </button>
          )}
        </div>

        {showReview && answersArray.length > 0 && (
          <MissedQuestions
            answers={answersArray}
            showAll={showAll}
            onToggleShowAll={() => setShowAll((v) => !v)}
          />
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   INSTRUCTION SCREEN
════════════════════════════════════════════ */
function InstructionScreen({ exam, student, onBegin, onCancel }) {
  const [agreed, setAgreed] = useState(false);

  const totalQuestions =
    exam.questionsPerStudent ?? exam.questions?.length ?? 0;

  const rules = [
    {
      icon: "⏱️",
      title: "Timed Exam",
      desc: `You have ${exam.durationMins} minute${exam.durationMins !== 1 ? "s" : ""} to complete this exam. The timer starts the moment you click "Begin Exam".`,
    },
    {
      icon: "📋",
      title: `${totalQuestions} Question${totalQuestions !== 1 ? "s" : ""}`,
      desc: "Answer all questions before submitting. Unanswered questions will be marked as incorrect.",
    },
    {
      icon: "🔒",
      title: "No Going Back",
      desc: "Once you submit your exam, your answers are final and cannot be changed.",
    },
    {
      icon: "🚫",
      title: "No Switching Tabs",
      desc: "Do not leave this page or switch browser tabs during the exam. Stay focused.",
    },
    {
      icon: "📶",
      title: "Stay Connected",
      desc: "Ensure you have a stable internet connection before starting. A lost connection may affect your submission.",
    },
    {
      icon: "⚠️",
      title: "Auto-Submit",
      desc: "If time runs out before you submit, your answers will be automatically submitted.",
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f0f2f5",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "32px 16px 64px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* ── Header ── */}
        <div style={{
          background: "#0f172a",
          borderRadius: 24,
          padding: "32px 28px",
          marginBottom: 16,
          position: "relative",
          overflow: "hidden",
        }}>
          {/* dot grid */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(#ffffff08 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            pointerEvents: "none",
          }} />
          {/* blob */}
          <div style={{
            position: "absolute", top: -50, right: -50,
            width: 200, height: 200,
            background: "radial-gradient(circle, #3b82f618 0%, transparent 70%)",
            borderRadius: "50%", pointerEvents: "none",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Student chip */}
            {student && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#1e293b", border: "1px solid #334155",
                borderRadius: 99, padding: "5px 12px 5px 6px",
                marginBottom: 20,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  overflow: "hidden", background: "#1e293b",
                  border: "2px solid #3b82f6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {student.profileImage ? (
                    <img src={student.profileImage} alt={student.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#3b82f6" }}>
                      {(student.name || "").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                  {student.name}
                </span>
              </div>
            )}

            <p style={{
              fontSize: 11, fontWeight: 700, color: "#3b82f6",
              letterSpacing: "1px", textTransform: "uppercase",
              margin: "0 0 8px",
            }}>
              Exam Instructions
            </p>
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 24, fontWeight: 800,
              color: "#f8fafc", margin: "0 0 6px",
              letterSpacing: "-0.5px",
            }}>
              {exam.title}
            </h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>
              {exam.subject} · {exam.className}
            </p>

            {/* Quick stats row */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Duration",  value: `${exam.durationMins} mins` },
                { label: "Questions", value: totalQuestions },
                { label: "Marks",     value: exam.totalMarks ?? totalQuestions },
              ].map((s) => (
                <div key={s.label} style={{
                  background: "#1e293b", border: "1px solid #334155",
                  borderRadius: 12, padding: "10px 16px", textAlign: "center",
                  minWidth: 80, flex: 1,
                }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", margin: "0 0 2px" }}>
                    {s.value}
                  </p>
                  <p style={{ fontSize: 10, color: "#64748b", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Rules card ── */}
        <div style={{
          background: "#fff",
          borderRadius: 20,
          padding: "8px 0",
          marginBottom: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        }}>
          {rules.map((rule, i) => (
            <div key={i} style={{
              display: "flex", gap: 14, alignItems: "flex-start",
              padding: "16px 22px",
              borderBottom: i < rules.length - 1 ? "1px solid #f1f5f9" : "none",
            }}>
              <span style={{
                fontSize: 20, flexShrink: 0,
                width: 36, height: 36,
                background: "#f8fafc", borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {rule.icon}
              </span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 3px" }}>
                  {rule.title}
                </p>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                  {rule.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Agreement checkbox ── */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: "16px 20px",
          marginBottom: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          display: "flex", alignItems: "flex-start", gap: 12,
          cursor: "pointer",
          border: agreed ? "1.5px solid #3b82f6" : "1.5px solid #e2e8f0",
          transition: "border-color 0.2s",
        }}
          onClick={() => setAgreed(v => !v)}
        >
          <div style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
            background: agreed ? "#3b82f6" : "#f1f5f9",
            border: agreed ? "2px solid #3b82f6" : "2px solid #cbd5e1",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}>
            {agreed && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✔</span>}
          </div>
          <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.6 }}>
            I have read and understood all the instructions above. I agree to attempt this exam
            honestly and without any external help.
          </p>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, fontWeight: 600,
              padding: "13px 20px",
              borderRadius: 14, border: "1.5px solid #e2e8f0",
              background: "#fff", color: "#64748b",
              cursor: "pointer",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            ← Go Back
          </button>
          <button
            onClick={onBegin}
            disabled={!agreed}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, fontWeight: 700,
              padding: "13px 24px",
              borderRadius: 14, border: "none",
              background: agreed ? "#10b981" : "#e2e8f0",
              color: agreed ? "#fff" : "#94a3b8",
              cursor: agreed ? "pointer" : "not-allowed",
              flex: 1,
              boxShadow: agreed ? "0 4px 14px rgba(16,185,129,0.35)" : "none",
              transition: "all 0.25s ease",
              transform: agreed ? "translateY(0)" : "none",
            }}
          >
            {agreed ? "▶ Begin Exam" : "Please agree to the instructions first"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   STUDENT AVATAR (used in exam top bar)
════════════════════════════════════════════ */
function StudentAvatar({ student }) {
  if (!student) return null;

  const initials = (student.name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#f8fafc",
        border: "1.5px solid #e2e8f0",
        borderRadius: 99,
        padding: "5px 14px 5px 6px",
        flexShrink: 0,
      }}
    >
      {/* Avatar circle */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          overflow: "hidden",
          background: "#1e293b",
          border: "2px solid #3b82f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {student.profileImage ? (
          <img
            src={student.profileImage}
            alt={student.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#3b82f6",
              lineHeight: 1,
            }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Name */}
      <div style={{ lineHeight: 1.2 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: 0 }}>
          {student.name}
        </p>
        {student.className && (
          <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>
            {student.className}
          </p>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   EXAM TAKING SCREEN
════════════════════════════════════════════ */
function ExamScreen({ exam, serverTime, onFinish, student }) {
  const questions = exam?.questions ?? [];
  const totalSecs = (exam?.durationMins ?? 60) * 60;
  const elapsed = serverTime
    ? Math.floor((Date.now() - new Date(serverTime)) / 1000)
    : 0;
  const initSecs = Math.max(totalSecs - elapsed, 0);

  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(initSecs);
  const [submitting, setSub] = useState(false);
  const [toast, setToast] = useState(null);
  const intervalRef = useRef(null);
  const startRef = useRef(Date.now());
  const submittingRef = useRef(false);

  // ── handleSubmit defined before the timer effect so the ref captures it ──
  const handleSubmit = useCallback(
    async (auto = false) => {
      if (submittingRef.current) return;
      if (
        !auto &&
        !window.confirm("Submit exam? You cannot change answers after this.")
      )
        return;

      clearInterval(intervalRef.current);
      submittingRef.current = true;
      setSub(true);

      const timeTakenMins = Math.round(
        (Date.now() - startRef.current) / 60000
      );
      const payload = {
        answers: questions.map((q) => ({
          questionId: q._id,
          selectedOption: answers[q._id] ?? "",
        })),
        timeTakenMins,
        status: auto ? "timed_out" : "completed",
      };

      try {
        const res = await submitExam(exam._id, payload);
        onFinish({
          score: res?.data?.score,
          totalMarks: res?.data?.totalMarks,
          percentage: res?.data?.percentage,
          result: res?.data?.result,
          exam,
          answers,
        });
      } catch (err) {
        setToast({
          msg: err?.response?.data?.message || "Submission failed.",
          type: "error",
        });
        submittingRef.current = false;
        setSub(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answers, exam, questions, onFinish]
  );

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // handleSubmit intentionally omitted — we only want this to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Guard: no questions ──
  if (!questions.length) {
    return (
      <div className={styles.examShell}>
        <div className={styles.examTopBar}>
          <p className={styles.examTitle}>{exam?.title ?? "Exam"}</p>
        </div>
        <div className={styles.examBody}>
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#ef4444",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            ⚠️ This exam has no questions. Please contact your teacher.
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const warn = timeLeft <= 300;

  return (
    <div className={styles.examShell}>
      <div className={styles.examTopBar}>
        <div>
          <p className={styles.examTitle}>{exam.title}</p>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
            {exam.subject} · {exam.className} · {questions.length} questions
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            className={`${styles.examTimer} ${warn ? styles.examTimerWarn : ""}`}
          >
            {warn && "⏰ "}
            {fmtTime(timeLeft)}
          </span>
          <StudentAvatar student={student} />
          <button
            className={styles.primaryBtn}
            disabled={submitting}
            onClick={() => handleSubmit(false)}
          >
            {submitting ? "Submitting…" : "Submit Exam"}
          </button>
        </div>
      </div>

      <div className={styles.examBody}>
        {/* Progress dots */}
        <div className={styles.examProgress}>
          {questions.map((_, i) => (
            <button
              key={i}
              className={[
                styles.examProgressDot,
                answers[questions[i]._id] ? styles.answered : "",
                i === current ? styles.current : "",
              ].join(" ")}
              onClick={() => setCurrent(i)}
              title={`Question ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className={styles.questionCard}>
          <p className={styles.questionNumber}>
            Question {current + 1} of {questions.length}
          </p>

          {/* Question image */}
          {q.imageUrl && (
            <div style={{ marginBottom: 16, textAlign: "center" }}>
              <img
                src={q.imageUrl}
                alt={`Diagram for question ${current + 1}`}
                style={{
                  maxWidth: "100%",
                  maxHeight: 300,
                  borderRadius: 10,
                  border: "1.5px solid #e2e8f0",
                  objectFit: "contain",
                  background: "#f8fafc",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </div>
          )}

          <p className={styles.questionText}>{q.question}</p>

          <div className={styles.optionsList}>
            {(q.options ?? []).map((opt, oi) => {
              const letter = ["A", "B", "C", "D"][oi] ?? String(oi + 1);
              const selected = answers[q._id] === opt;
              return (
                <button
                  key={oi}
                  className={`${styles.optionBtn} ${selected ? styles.selected : ""}`}
                  onClick={() =>
                    setAnswers((p) => ({ ...p, [q._id]: opt }))
                  }
                >
                  <span className={styles.optionLetter}>{letter}</span>
                  <span className={styles.optionText}>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nav */}
        <div className={styles.examNav}>
          <button
            className={styles.actionBtn}
            disabled={current === 0}
            onClick={() => setCurrent((p) => p - 1)}
          >
            ← Previous
          </button>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            {Object.keys(answers).length} / {questions.length} answered
          </span>
          {current < questions.length - 1 ? (
            <button
              className={styles.primaryBtn}
              style={{ fontSize: 13 }}
              onClick={() => setCurrent((p) => p + 1)}
            >
              Next →
            </button>
          ) : (
            <button
              className={styles.primaryBtn}
              style={{ background: "#10b981", fontSize: 13 }}
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "✔ Finish"}
            </button>
          )}
        </div>
      </div>

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

/* ════════════════════════════════════════════
   MAIN — StudentExams
════════════════════════════════════════════ */
export default function StudentExams() {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("available");
  const [activeExam, setActive] = useState(null);
  const [instructionExam, setInstructionExam] = useState(null); // exam pending instructions
  const [scoreData, setScore] = useState(null);
  const [detailResult, setDetail] = useState(null);
  const [starting, setStarting] = useState(null);
  const [toast, setToast] = useState(null);

  // Read student profile from localStorage so we can show it during the exam
  const student = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  })();

  useEffect(() => {
    async function load() {
      try {
        const [eRes, rRes] = await Promise.all([
          getAvailableExams(),
          getMyExamResults(),
        ]);
        setExams(eRes?.data?.exams ?? []);
        setResults(rRes?.data?.results ?? []);
      } catch {
        setToast({ msg: "Could not load exams.", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Step 1 — called when student clicks "▶ Start Exam" on the list
  async function handleStart(exam) {
    setStarting(exam._id);
    try {
      const res = await startExam(exam._id);

      const serverExam = res?.data?.exam ?? res?.data ?? {};
      const questions =
        serverExam.questions ??
        res?.data?.questions ??
        exam.questions ??
        [];

      const mergedExam = {
        ...exam,
        ...serverExam,
        questions,
      };

      if (!mergedExam.questions.length) {
        setToast({
          msg: "This exam has no questions yet. Please contact your teacher.",
          type: "error",
        });
        return;
      }

      // Show instruction page instead of going straight to exam
      setInstructionExam({
        exam: mergedExam,
        serverTime: res?.data?.serverTime ?? new Date().toISOString(),
      });
    } catch (err) {
      setToast({
        msg: err?.response?.data?.message || "Could not start exam.",
        type: "error",
      });
    } finally {
      setStarting(null);
    }
  }

  // Step 2 — called when student clicks "▶ Begin Exam" on the instruction page
  function handleBeginExam() {
    if (!instructionExam) return;
    setActive(instructionExam);
    setInstructionExam(null);
  }

  function handleFinish(data) {
    setActive(null);
    setScore(data);
    getMyExamResults()
      .then((r) => setResults(r?.data?.results ?? []))
      .catch(() => {});
  }

  if (instructionExam) {
    return (
      <InstructionScreen
        exam={instructionExam.exam}
        student={student}
        onBegin={handleBeginExam}
        onCancel={() => setInstructionExam(null)}
      />
    );
  }

  if (activeExam) {
    return (
      <ExamScreen
        exam={activeExam.exam}
        serverTime={activeExam.serverTime}
        onFinish={handleFinish}
        student={student}
      />
    );
  }
  if (scoreData) return <ScoreScreen result={scoreData} onBack={() => setScore(null)} />;
  if (detailResult)
    return <ResultDetail result={detailResult} onBack={() => setDetail(null)} />;

  const takenIds = new Set(results.map((r) => String(r.exam?._id ?? r.exam)));

  function examTimeStatus(ex) {
    const now = new Date(),
      start = new Date(ex.startTime),
      end = new Date(ex.endTime);
    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "live";
    return "ended";
  }

  const STATUS = {
    upcoming: { label: "Upcoming", color: "#1a6ef5", bg: "#eff6ff" },
    live: { label: "Live Now", color: "#10b981", bg: "#f0fdf4" },
    ended: { label: "Ended", color: "#6b7280", bg: "#f3f4f6" },
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Exams</h2>
          <p className={styles.sectionSub}>
            {exams.filter((e) => examTimeStatus(e) === "live").length} live now
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "available" ? styles.active : ""}`}
          onClick={() => setTab("available")}
        >
          📝 Available
        </button>
        <button
          className={`${styles.tab} ${tab === "results" ? styles.active : ""}`}
          onClick={() => setTab("results")}
        >
          📊 My Results ({results.length})
        </button>
      </div>

      {/* ── Available tab ── */}
      {tab === "available" &&
        (loading ? (
          <div className={styles.skeletonList}>
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className={styles.skeletonRow} />
              ))}
          </div>
        ) : (
          <div className={styles.cardList}>
            {exams.length === 0 && (
              <div className={styles.emptyState}>
                <span>📝</span>
                <p>No exams available right now.</p>
              </div>
            )}
            {exams.map((ex) => {
              const timeStatus = examTimeStatus(ex);
              const meta = STATUS[timeStatus];
              const taken = takenIds.has(String(ex._id)) || ex.alreadyTaken;
              const isLive = timeStatus === "live";
              const isStarting = starting === ex._id;

              return (
                <div key={ex._id} className={styles.itemCard}>
                  <div className={styles.itemCardHead}>
                    <div style={{ flex: 1 }}>
                      <p className={styles.itemTitle}>{ex.title}</p>
                      <p className={styles.itemMeta}>
                        {ex.subject}&nbsp;·&nbsp;{ex.className}
                      </p>
                      <p className={styles.itemMeta}>
                        {ex.startTime
                          ? new Date(ex.startTime).toLocaleString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                        &nbsp;→&nbsp;
                        {ex.endTime
                          ? new Date(ex.endTime).toLocaleString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                        &nbsp;·&nbsp;{ex.durationMins} mins
                        {ex.questionsPerStudent ? (
                          <>&nbsp;·&nbsp;{ex.questionsPerStudent} questions</>
                        ) : ex.questions?.length ? (
                          <>&nbsp;·&nbsp;{ex.questions.length} questions</>
                        ) : null}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 8,
                      }}
                    >
                      <span
                        className={styles.pill}
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {isLive && (
                          <span style={{ marginRight: 4 }}>●</span>
                        )}
                        {meta.label}
                      </span>
                      {taken && (
                        <span
                          className={styles.pill}
                          style={{
                            color: "#10b981",
                            background: "#f0fdf4",
                          }}
                        >
                          ✔ Taken
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.itemActions}>
                    {!taken && isLive && (
                      <button
                        className={styles.primaryBtn}
                        style={{
                          background: "#10b981",
                          fontSize: 12,
                          padding: "7px 16px",
                        }}
                        disabled={isStarting}
                        onClick={() => handleStart(ex)}
                      >
                        {isStarting ? "Starting…" : "▶ Start Exam"}
                      </button>
                    )}
                    {!taken && timeStatus === "upcoming" && (
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        Starts&nbsp;
                        {new Date(ex.startTime).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                    {taken && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#10b981",
                          fontWeight: 600,
                        }}
                      >
                        ✔ Already submitted — check Results tab
                      </span>
                    )}
                    {!taken && timeStatus === "ended" && (
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        Exam has ended
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {/* ── Results tab ── */}
      {tab === "results" &&
        (loading ? (
          <div className={styles.skeletonList}>
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className={styles.skeletonRow} />
              ))}
          </div>
        ) : (
          <div className={styles.cardList}>
            {results.length === 0 && (
              <div className={styles.emptyState}>
                <span>📊</span>
                <p>No exam results yet.</p>
              </div>
            )}
            {results.map((r, i) => {
              const pct = r.percentage ?? 0;
              const grade = gradeFromPct(pct);
              const answersArr = Array.isArray(r.answers) ? r.answers : [];
              const missedCount = answersArr.filter((a) => !a.isCorrect).length;
              const hasAnswers = answersArr.length > 0;

              return (
                <div
                  key={r._id ?? i}
                  className={styles.itemCard}
                  style={{ cursor: hasAnswers ? "pointer" : "default" }}
                  onClick={() => hasAnswers && setDetail(r)}
                >
                  <div className={styles.itemCardHead}>
                    <div style={{ flex: 1 }}>
                      <p className={styles.itemTitle}>
                        {r.exam?.title ?? "Exam"}
                      </p>
                      <p className={styles.itemMeta}>
                        {r.exam?.subject}&nbsp;·&nbsp;{r.exam?.className}
                      </p>
                      <p className={styles.itemMeta}>
                        Submitted&nbsp;
                        {r.submittedAt ?? r.createdAt
                          ? new Date(
                              r.submittedAt ?? r.createdAt
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                        {r.timeTakenMins != null && (
                          <>&nbsp;·&nbsp;{r.timeTakenMins} min</>
                        )}
                      </p>

                      {hasAnswers && (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 6,
                            alignItems: "center",
                          }}
                        >
                          {missedCount > 0 ? (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 10px",
                                borderRadius: 99,
                                background: "#fef2f2",
                                color: "#ef4444",
                              }}
                            >
                              ✘ {missedCount} missed
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 10px",
                                borderRadius: 99,
                                background: "#f0fdf4",
                                color: "#10b981",
                              }}
                            >
                              🎯 All correct
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>
                            Tap to review →
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 26,
                          fontWeight: 900,
                          color: grade.color,
                        }}
                      >
                        {pct}%
                      </span>
                      <span
                        className={styles.gradeBadge}
                        style={{ color: grade.color, background: grade.bg }}
                      >
                        {grade.label}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: 6,
                      borderRadius: 99,
                      background: "#e2e8f0",
                      overflow: "hidden",
                      marginTop: 12,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: grade.color,
                        borderRadius: 99,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>

                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "6px 0 0" }}>
                    {r.score ?? 0} / {r.totalMarks ?? "?"} marks
                  </p>
                </div>
              );
            })}
          </div>
        ))}

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