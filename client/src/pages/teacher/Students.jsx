import { useState } from "react";
import styles from "../../css/Sections.module.css";

function getGradeLabel(avg) {
  if (avg >= 80) return { label: "Excellent", cls: "green" };
  if (avg >= 65) return { label: "Good",      cls: "blue"  };
  if (avg >= 50) return { label: "Average",   cls: "amber" };
  return           { label: "Needs Help",  cls: "red"   };
}

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function StudentsSection({ students, loading }) {
  const [search, setSearch] = useState("");
  const [sort, setSort]     = useState("name");

  const filtered = (students || [])
    .filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.class.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : b.average - a.average
    );

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Students</h2>
          <p className={styles.sectionSub}>{students?.length ?? 0} students enrolled</p>
        </div>
        <div className={styles.controls}>
          <input
            className={styles.searchInput}
            placeholder="Search by name or class…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="name">Sort: Name</option>
            <option value="avg">Sort: Performance</option>
          </select>
        </div>
      </div>

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
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const g = getGradeLabel(s.average);
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
                    <td><span className={styles.classBadge}>{s.class}</span></td>
                    <td>
                      <div className={styles.avgWrap}>
                        <span className={`${styles.avgScore} ${styles[g.cls]}`}>{s.average}%</span>
                        <div className={styles.miniBar}>
                          <div
                            className={`${styles.miniBarFill} ${styles[g.cls]}`}
                            style={{ width: `${s.average}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[g.cls]}`}>
                        {g.label}
                      </span>
                    </td>
                    <td>
                      <button className={styles.viewBtn}>View Profile</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className={styles.emptyState}>
              <span>🔍</span>
              <p>No students found matching "{search}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}