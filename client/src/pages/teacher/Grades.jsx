import { useState } from "react";
import styles from "../../css/Sections.module.css";

function gradeColor(score) {
  if (score >= 80) return "green";
  if (score >= 65) return "blue";
  if (score >= 50) return "amber";
  return "red";
}

export default function GradesSection({ grades, loading }) {
  const [subject, setSubject]   = useState("All");
  const [sortBy, setSortBy]     = useState("score");

  const subjects = ["All", ...new Set((grades || []).map(g => g.subject))];

  const filtered = (grades || [])
    .filter(g => subject === "All" || g.subject === subject)
    .sort((a, b) => sortBy === "score" ? b.score - a.score : a.studentName.localeCompare(b.studentName));

  const top5    = [...(grades || [])].sort((a, b) => b.score - a.score).slice(0, 5);
  const atRisk  = (grades || []).filter(g => g.score < 50).length;
  const highP   = (grades || []).filter(g => g.score >= 80).length;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Grades & Results</h2>
          <p className={styles.sectionSub}>
            <span style={{ color: "#10b981" }}>{highP} high performers</span>
            &nbsp;·&nbsp;
            <span style={{ color: "#ef4444" }}>{atRisk} need attention</span>
          </p>
        </div>
        <div className={styles.controls}>
          <select className={styles.sortSelect} value={subject} onChange={e => setSubject(e.target.value)}>
            {subjects.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className={styles.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="score">Sort: Score</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
      </div>

      {/* Top 5 widget */}
      <div className={styles.top5Wrap}>
        <p className={styles.top5Label}>🏆 Top 5 Students</p>
        <div className={styles.top5Row}>
          {top5.map((g, i) => (
            <div key={g._id} className={styles.top5Card}>
              <div className={styles.top5Rank}>#{i + 1}</div>
              <div className={styles.top5Name}>{g.studentName}</div>
              <div className={`${styles.top5Score} ${styles[gradeColor(g.score)]}`}>{g.score}%</div>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.skeletonList}>{Array(8).fill(0).map((_, i) => <div key={i} className={styles.skeletonRow} />)}</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Subject</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => {
                const cls = gradeColor(g.score);
                return (
                  <tr key={g._id} className={g.score < 50 ? styles.atRiskRow : g.score >= 80 ? styles.topRow : ""}>
                    <td className={styles.rankCell}>{i + 1}</td>
                    <td className={styles.studentName}>{g.studentName}</td>
                    <td><span className={styles.classBadge}>{g.subject}</span></td>
                    <td>
                      <span className={`${styles.scoreNum} ${styles[cls]}`}>{g.score}%</span>
                    </td>
                    <td>
                      <span className={`${styles.gradePill} ${styles[cls]}`}>{g.grade}</span>
                    </td>
                    <td>
                      <div className={styles.progressBar}>
                        <div className={`${styles.progressFill} ${styles[cls]}`} style={{ width: `${g.score}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}