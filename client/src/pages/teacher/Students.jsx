import { useState, useMemo, useEffect } from "react";
import { getExamResults, getExams } from "../api/teacherApi.js";
import styles from "../../css/Sections.module.css";

/* ─── helpers ─────────────────────────────────────────────── */
function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function classField(s) {
  return s.class || s.className || s.grade || "—";
}

function gradeFromPct(pct) {
  if (pct >= 70) return { letter: "A", label: "Excellent",  color: "#10b981", bg: "#f0fdf4" };
  if (pct >= 60) return { letter: "B", label: "Good",       color: "#1a6ef5", bg: "#eff6ff" };
  if (pct >= 50) return { letter: "C", label: "Average",    color: "#f59e0b", bg: "#fffbeb" };
  if (pct >= 40) return { letter: "D", label: "Below Avg",  color: "#f97316", bg: "#fff7ed" };
  return           { letter: "F", label: "Needs Help",  color: "#ef4444", bg: "#fef2f2" };
}

/* mini circular progress ring */
function Ring({ pct, size = 64, stroke = 5, color }) {
  const r   = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

/* ─── Student Profile Drawer ───────────────────────────────── */
function ProfileDrawer({ student, exams, onClose }) {
  const [examScores, setExamScores] = useState([]); // { examTitle, subject, pct, score, total }
  const [loading, setLoading]       = useState(true);

  /* fetch results for every exam, filter rows that match this student */
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
              r.student?._id === student._id ||
              r.student?.email === student.email ||
              r.student?.name === student.name
          );
          if (mine) {
            rows.push({
              examId:     exam._id,
              examTitle:  exam.title,
              subject:    exam.subject,
              term:       exam.term,
              score:      mine.score ?? 0,
              total:      mine.totalMarks ?? exam.questions?.length ?? 0,
              pct:        mine.percentage ?? 0,
              timeMins:   mine.timeTakenMins ?? null,
            });
          }
        } catch { /* skip silently */ }
      }
      if (!cancelled) { setExamScores(rows); setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [student, exams]);

  /* aggregate */
  const overall = useMemo(() => {
    if (!examScores.length) return null;
    const avg = Math.round(examScores.reduce((s, r) => s + r.pct, 0) / examScores.length);
    return { avg, grade: gradeFromPct(avg) };
  }, [examScores]);

  /* group by subject for subject averages */
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
    /* backdrop */
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)",
      display: "flex", justifyContent: "flex-end",
    }} onClick={onClose}>
      {/* drawer panel */}
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
        `}</style>

        {/* ── Hero header ── */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
          padding: "32px 28px 24px",
          position: "relative",
        }}>
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 16,
            background: "rgba(255,255,255,0.12)", border: "none",
            color: "#fff", width: 32, height: 32, borderRadius: "50%",
            fontSize: 16, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>✕</button>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* avatar */}
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg,#38bdf8,#818cf8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, color: "#fff",
              border: "3px solid rgba(255,255,255,0.25)",
              flexShrink: 0,
            }}>{initials(student.name)}</div>

            <div>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 18, margin: 0 }}>{student.name}</p>
              <p style={{ color: "#94a3b8", fontSize: 13, margin: "4px 0 0" }}>
                {cl} · {student.gender || ""}
              </p>
              {student.email && (
                <p style={{ color: "#64748b", fontSize: 11, marginTop: 3 }}>{student.email}</p>
              )}
            </div>

            {/* overall ring */}
            {overall && (
              <div style={{ marginLeft: "auto", textAlign: "center" }}>
                <div style={{ position: "relative", width: 64, height: 64 }}>
                  <Ring pct={overall.avg} size={64} stroke={5} color={overall.grade.color} />
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800, color: "#fff",
                    transform: "none",
                  }}>{overall.avg}%</div>
                </div>
                <p style={{ color: "#94a3b8", fontSize: 10, marginTop: 4 }}>Overall</p>
              </div>
            )}
          </div>

          {/* overall grade badge */}
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

        {/* ── Body ── */}
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
              <style>{`
                @keyframes shimmer {
                  0%   { background-position: 200% 0; }
                  100% { background-position: -200% 0; }
                }
              `}</style>
            </div>
          ) : examScores.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "48px 0",
              color: "#94a3b8", fontSize: 14,
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ margin: 0, fontWeight: 600 }}>No exam results yet</p>
              <p style={{ margin: "6px 0 0", fontSize: 12 }}>
                This student hasn't submitted any exams.
              </p>
            </div>
          ) : (
            <>
              {/* ── Subject averages ── */}
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
                          <span style={{
                            width: 120, fontSize: 12, fontWeight: 600,
                            color: "#475569", flexShrink: 0, textAlign: "right",
                          }}>{subject}</span>
                          <div style={{
                            flex: 1, height: 8, borderRadius: 99,
                            background: "#e2e8f0", overflow: "hidden",
                          }}>
                            <div style={{
                              height: "100%", width: `${avg}%`,
                              background: g.color, borderRadius: 99,
                              transition: "width 0.5s ease",
                            }} />
                          </div>
                          <span style={{
                            fontSize: 12, fontWeight: 700, color: g.color,
                            width: 36, textAlign: "right",
                          }}>{avg}%</span>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "2px 7px",
                            borderRadius: 999, color: g.color, background: g.bg,
                            flexShrink: 0,
                          }}>{g.letter}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Individual exam results ── */}
              <p style={{ fontWeight: 700, color: "#1e293b", fontSize: 14, marginBottom: 12 }}>
                Exam Results
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {examScores.map((r) => {
                  const g = gradeFromPct(r.pct);
                  return (
                    <div key={r.examId} style={{
                      border: "1.5px solid #e2e8f0", borderRadius: 12,
                      padding: "14px 16px",
                      display: "flex", alignItems: "center", gap: 14,
                      background: "#fafafa",
                    }}>
                      {/* mini ring */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <Ring pct={r.pct} size={48} stroke={4} color={g.color} />
                        <div style={{
                          position: "absolute", inset: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 800, color: g.color,
                        }}>{r.pct}%</div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontWeight: 700, fontSize: 13, color: "#1e293b",
                          margin: 0, whiteSpace: "nowrap", overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>{r.examTitle}</p>
                        <p style={{ fontSize: 11, color: "#64748b", margin: "3px 0 0" }}>
                          {r.subject} · {r.term}
                          {r.timeMins != null && ` · ${r.timeMins} min`}
                        </p>
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 }}>
                          {r.score}/{r.total}
                        </p>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 8px",
                          borderRadius: 999, color: g.color, background: g.bg,
                          display: "inline-block", marginTop: 4,
                        }}>{g.letter} · {g.label}</span>
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
export default function StudentsSection({ students, loading }) {
  const [search, setSearch]         = useState("");
  const [sort, setSort]             = useState("name");
  const [activeClass, setClass]     = useState("all");
  const [profileStudent, setProfile] = useState(null);
  const [allExams, setAllExams]     = useState([]);
  const [examsLoading, setExamsLoad] = useState(true);

  /* fetch all exams once so the drawer can query results */
  useEffect(() => {
    async function load() {
      try {
        const res  = await getExams();
        const data = res?.data?.exams ?? res?.exams ?? [];
        setAllExams(data);
      } catch { /* silent */ }
      finally { setExamsLoad(false); }
    }
    load();
  }, []);

  /* unique classes */
  const classList = useMemo(() => {
    const seen = new Set();
    (students || []).forEach((s) => {
      const c = classField(s);
      if (c && c !== "—") seen.add(c);
    });
    return Array.from(seen).sort();
  }, [students]);

  /* derived list */
  const filtered = useMemo(() => {
    return (students || [])
      .filter((s) => {
        const inClass = activeClass === "all" || classField(s) === activeClass;
        const matchSearch =
          s.name?.toLowerCase().includes(search.toLowerCase()) ||
          classField(s).toLowerCase().includes(search.toLowerCase());
        return inClass && matchSearch;
      })
      .sort((a, b) =>
        sort === "name" ? a.name.localeCompare(b.name) : b.average - a.average
      );
  }, [students, activeClass, search, sort]);

  /* exams scoped to the active class (for the drawer) */
  const scopedExams = useMemo(() => {
    if (activeClass === "all") return allExams;
    return allExams.filter(
      (e) => e.className === activeClass || e.class === activeClass
    );
  }, [allExams, activeClass]);

  return (
    <div className={styles.section}>

      {/* ── Header ── */}
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Students</h2>
          <p className={styles.sectionSub}>
            {activeClass === "all"
              ? `${students?.length ?? 0} students enrolled`
              : `${filtered.length} students in ${activeClass}`}
          </p>
        </div>
        <div className={styles.controls}>
          <input
            className={styles.searchInput}
            placeholder="Search by name…"
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
        </div>
      </div>

      {/* ── Class tabs ── */}
      <div style={{
        display: "flex", gap: 8, flexWrap: "wrap",
        marginBottom: 24,
      }}>
        <ClassTab
          label="All Classes"
          count={students?.length ?? 0}
          active={activeClass === "all"}
          onClick={() => setClass("all")}
        />
        {classList.map((cls) => (
          <ClassTab
            key={cls}
            label={cls}
            count={(students || []).filter((s) => classField(s) === cls).length}
            active={activeClass === cls}
            onClick={() => setClass(cls)}
          />
        ))}
      </div>

      {/* ── Table ── */}
      {loading ? (
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
                const g = gradeFromPct(s.average ?? 0);
                return (
                  <tr key={s._id}>
                    <td>
                      <div className={styles.studentCell}>
                        <div className={styles.studentAvatar}>{initials(s.name)}</div>
                        <div>
                          <p className={styles.studentName}>{s.name}</p>
                          <p className={styles.studentMeta}>{s.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.classBadge}>{classField(s)}</span>
                    </td>
                    <td>
                      <div className={styles.avgWrap}>
                        <span
                          className={styles.avgScore}
                          style={{ color: g.color }}
                        >
                          {s.average ?? 0}%
                        </span>
                        <div className={styles.miniBar}>
                          <div
                            className={styles.miniBarFill}
                            style={{
                              width: `${s.average ?? 0}%`,
                              background: g.color,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: "3px 10px", borderRadius: 999,
                        fontSize: 12, fontWeight: 700,
                        color: g.color, background: g.bg,
                      }}>
                        {g.letter} · {g.label}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.viewBtn}
                        onClick={() => setProfile(s)}
                      >
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
        background: active ? "#0f172a"        : "#f1f5f9",
        color:      active ? "#fff"           : "#475569",
        boxShadow:  active ? "0 2px 8px rgba(15,23,42,0.18)" : "none",
      }}
    >
      {label}
      <span style={{
        fontSize: 11, fontWeight: 700,
        padding: "1px 7px", borderRadius: 999,
        background: active ? "rgba(255,255,255,0.15)" : "#e2e8f0",
        color:      active ? "#fff" : "#64748b",
      }}>{count}</span>
    </button>
  );
}