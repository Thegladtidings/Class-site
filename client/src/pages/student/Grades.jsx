import { useState, useEffect } from "react";
import axiosInstance from "../api/Axiosinstance.js";
import styles from "../../css/Studentdashboard.module.css";

const getMyGrades = () => axiosInstance.get("/api/grades/student/me");

function gradeFromPct(pct) {
  if (pct >= 70) return { label: "A", color: "#10b981", bg: "#f0fdf4" };
  if (pct >= 60) return { label: "B", color: "#1a6ef5", bg: "#eff6ff" };
  if (pct >= 50) return { label: "C", color: "#f59e0b", bg: "#fffbeb" };
  if (pct >= 40) return { label: "D", color: "#f97316", bg: "#fff7ed" };
  return           { label: "F", color: "#ef4444", bg: "#fef2f2" };
}

const TERMS = ["All", "First Term", "Second Term", "Third Term"];

export default function StudentGradesSection() {
  const [grades,  setGrades]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [term,    setTerm]    = useState("All");
  const [error,   setError]   = useState(false);

  useEffect(() => {
    getMyGrades()
      .then((r) => setGrades(r?.data?.grades ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  /* ── Filter by term ── */
  const filtered = term === "All"
    ? grades
    : grades.filter((g) => g.term === term);

  /* ── Group by subject for summary ── */
  const bySubject = filtered.reduce((acc, g) => {
    const key = g.subject;
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  /* ── Overall average ── */
  const avg = filtered.length
    ? Math.round(
        filtered.reduce((s, g) => s + Math.round((g.score / g.totalScore) * 100), 0)
        / filtered.length
      )
    : null;

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <div className={styles.section}>

      {/* Header */}
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>My Grades</h2>
          <p className={styles.sectionSub}>
            {loading ? "Loading…" : `${filtered.length} records`}
          </p>
        </div>

        {/* Term filter */}
        <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4 }}>
          {TERMS.map((t) => (
            <button
              key={t}
              onClick={() => setTerm(t)}
              style={{
                padding: "6px 12px", borderRadius: 7, border: "none",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: term === t ? "#fff" : "transparent",
                color:      term === t ? "#1a6ef5" : "#64748b",
                boxShadow:  term === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s", whiteSpace: "nowrap",
              }}
            >
              {t === "All" ? "All Terms" : t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overall average banner ── */}
      {!loading && avg != null && (() => {
        const g = gradeFromPct(avg);
        return (
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "16px 20px", borderRadius: 14,
            background: g.bg, border: `1.5px solid ${g.color}30`,
            marginBottom: 20,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              border: `3px solid ${g.color}`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: "#fff", flexShrink: 0,
            }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: g.color, lineHeight: 1 }}>
                {avg}%
              </span>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", margin: "0 0 2px" }}>
                Overall Average
              </p>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                Grade {g.label} across {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                {term !== "All" && ` · ${term}`}
              </p>
            </div>
          </div>
        );
      })()}

      {/* ── Content ── */}
      {loading ? (
        <div className={styles.skeletonList}>
          {Array(4).fill(0).map((_, i) => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : error ? (
        <div className={styles.emptyState}>
          <span>⚠️</span>
          <p>Could not load grades. Please try again later.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <span>📊</span>
          <p>No grades recorded yet.</p>
        </div>
      ) : (
        /* ── Subject groups ── */
        Object.entries(bySubject).map(([subject, subjectGrades]) => {
          const subAvg = Math.round(
            subjectGrades.reduce((s, g) => s + Math.round((g.score / g.totalScore) * 100), 0)
            / subjectGrades.length
          );
          const subGrade = gradeFromPct(subAvg);

          return (
            <div key={subject} style={{ marginBottom: 24 }}>

              {/* Subject header */}
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  {subject}
                </h3>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "3px 12px",
                  borderRadius: 99, color: subGrade.color, background: subGrade.bg,
                }}>
                  Avg {subAvg}% · {subGrade.label}
                </span>
              </div>

              <div className={styles.cardList}>
                {subjectGrades.map((g, i) => {
                  const pct   = Math.round((g.score / g.totalScore) * 100);
                  const grade = gradeFromPct(pct);

                  return (
                    <div key={g._id ?? i} className={styles.itemCard}>
                      <div className={styles.itemCardHead}>
                        <div style={{ flex: 1 }}>
                          <p className={styles.itemTitle}>
                            {g.term}
                            {g.week && <span style={{ fontWeight: 400, color: "#64748b" }}> · Week {g.week}</span>}
                          </p>
                          <p className={styles.itemMeta}>
                            {g.score} / {g.totalScore} marks
                            {g.gradedBy?.name && <>&nbsp;·&nbsp;{g.gradedBy.name}</>}
                          </p>
                          {g.remarks && (
                            <p style={{
                              fontSize: 12, color: "#475569",
                              marginTop: 6, lineHeight: 1.5,
                              fontStyle: "italic",
                            }}>
                              💬 {g.remarks}
                            </p>
                          )}
                        </div>

                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontSize: 26, fontWeight: 900, color: grade.color, margin: "0 0 4px" }}>
                            {pct}%
                          </p>
                          <span style={{
                            display: "inline-flex", alignItems: "center",
                            justifyContent: "center",
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
                        overflow: "hidden", marginTop: 12,
                      }}>
                        <div style={{
                          height: "100%", width: `${pct}%`,
                          background: grade.color, borderRadius: 99,
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}