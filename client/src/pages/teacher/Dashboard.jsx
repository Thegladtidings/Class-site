import { useState, useEffect } from "react";
import { useNavigate }         from "react-router-dom";

import { Sidebar }              from "../../components/Sidebar.jsx";
import Header                   from "../../components/Header.jsx";
import StatCards                from "../../components/Statcard.jsx";
import StudentsSection          from "./Students.jsx";
import AssignmentsSection       from "./Assignments.jsx";
import ExamsSection             from "./Exams.jsx";
import GradesSection            from "./Grades.jsx";
import AnnouncementsSection     from "./Announcements.jsx";

import { useTeacherData }       from "./Useteacherdata.js";
import styles                   from "../../css/Teacherdashboard.module.css";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [active, setActive]       = useState("dashboard");
  const [sidebarOpen, setSidebar] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login");
  }, [navigate]);

  const {
    profile,
    students,
    assignments,
    exams,
    grades,
    announcements,
    studentList,
    assignmentList,
    examList,
    gradeList,
    announcementList,
    stats,
  } = useTeacherData();

  function renderContent() {
    switch (active) {
      case "students":
        return <StudentsSection students={studentList} loading={students.loading} />;

      case "assignments":
        return <AssignmentsSection assignments={assignmentList} loading={assignments.loading} />;

      case "exams":
        return <ExamsSection exams={examList} loading={exams.loading} />;

      case "grades":
        return <GradesSection grades={gradeList} loading={grades.loading} />;

      case "announcements":
        return <AnnouncementsSection announcements={announcementList} loading={announcements.loading} />;

      case "settings":
        return <SettingsPlaceholder />;

      default:
        return (
          <DashboardHome
            stats={stats}
            loading={students.loading}
            students={studentList}
            assignments={assignmentList}
            announcements={announcementList}
            onNav={setActive}
          />
        );
    }
  }

  return (
    <div className={styles.shell}>
      <Sidebar
        active={active}
        onNav={setActive}
        open={sidebarOpen}
        onClose={() => setSidebar(false)}
      />
      <div className={styles.mainArea}>
        <Header
          profile={profile.data}
          onMenuToggle={() => setSidebar((v) => !v)}
        />
        <main className={styles.content}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

/* ── Dashboard Home ── */
function DashboardHome({ stats, loading, students, assignments, announcements, onNav }) {
  const topStudents = [...students]
    .sort((a, b) => b.average - a.average)
    .slice(0, 5);

  const recentActivity = [
    ...assignments.map((a) => ({
      icon: "📋",
      text: `Assignment "${a.title}" is ${a.status?.toLowerCase()}`,
      time: a.deadline,
      type: "assignment",
    })),
    ...announcements.map((n) => ({
      icon: "📢",
      text: n.title,
      time: n.createdAt,
      type: "announcement",
    })),
  ]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 6);

  return (
    <div>
      <StatCards stats={stats} loading={loading} />

      <div className={styles.dashGrid}>
        {/* Top performers */}
        <div className={styles.dashCard}>
          <div className={styles.dashCardHead}>
            <h3 className={styles.dashCardTitle}>🏆 Top Performers</h3>
            <button className={styles.dashLink} onClick={() => onNav("students")}>
              View All →
            </button>
          </div>
          {loading ? (
            <div className={styles.skeletonBlock} />
          ) : topStudents.length === 0 ? (
            <p style={{ color: "#94a3b8", padding: "16px 0" }}>No student data yet.</p>
          ) : (
            <div className={styles.topList}>
              {topStudents.map((s, i) => (
                <div key={s._id} className={styles.topRow}>
                  <div className={styles.topRank}>#{i + 1}</div>
                  <div className={styles.topAvatar}>{s.name?.[0]}</div>
                  <div className={styles.topInfo}>
                    <p className={styles.topName}>{s.name}</p>
                    <p className={styles.topClass}>{s.class}</p>
                  </div>
                  <div
                    className={styles.topScore}
                    style={{
                      color:
                        s.average >= 80 ? "#10b981"
                        : s.average >= 65 ? "#1a6ef5"
                        : "#f59e0b",
                    }}
                  >
                    {s.average}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className={styles.dashCard}>
          <div className={styles.dashCardHead}>
            <h3 className={styles.dashCardTitle}>🕐 Recent Activity</h3>
          </div>
          <div className={styles.activityList}>
            {recentActivity.length === 0 ? (
              <p style={{ color: "#94a3b8", padding: "16px 0" }}>No recent activity.</p>
            ) : (
              recentActivity.map((item, i) => (
                <div key={i} className={styles.activityItem}>
                  <div className={styles.activityIcon}>{item.icon}</div>
                  <div className={styles.activityInfo}>
                    <p className={styles.activityText}>{item.text}</p>
                    <p className={styles.activityTime}>
                      {item.time
                        ? new Date(item.time).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className={styles.dashCard}>
          <div className={styles.dashCardHead}>
            <h3 className={styles.dashCardTitle}>⚡ Quick Actions</h3>
          </div>
          <div className={styles.quickActions}>
            {[
              { label: "Create Exam",       icon: "📝", nav: "exams"         },
              { label: "New Assignment",    icon: "📋", nav: "assignments"   },
              { label: "Post Announcement", icon: "📢", nav: "announcements" },
              { label: "View Grades",       icon: "📊", nav: "grades"        },
            ].map((a) => (
              <button key={a.nav} className={styles.quickBtn} onClick={() => onNav(a.nav)}>
                <span className={styles.quickIcon}>{a.icon}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Class performance */}
        <div className={styles.dashCard}>
          <div className={styles.dashCardHead}>
            <h3 className={styles.dashCardTitle}>📊 Class Performance</h3>
            <button className={styles.dashLink} onClick={() => onNav("grades")}>
              Full Report →
            </button>
          </div>
          {loading ? (
            <div className={styles.skeletonBlock} />
          ) : students.length === 0 ? (
            <p style={{ color: "#94a3b8", padding: "16px 0" }}>No student data yet.</p>
          ) : (
            <div className={styles.perfList}>
              {students.map((s) => (
                <div key={s._id} className={styles.perfRow}>
                  <span className={styles.perfName}>{s.name}</span>
                  <div className={styles.perfBar}>
                    <div
                      className={styles.perfFill}
                      style={{
                        width: `${s.average}%`,
                        background:
                          s.average >= 80 ? "#10b981"
                          : s.average >= 65 ? "#1a6ef5"
                          : s.average >= 50 ? "#f59e0b"
                          : "#ef4444",
                      }}
                    />
                  </div>
                  <span
                    className={styles.perfScore}
                    style={{
                      color:
                        s.average >= 80 ? "#10b981"
                        : s.average >= 65 ? "#1a6ef5"
                        : s.average >= 50 ? "#f59e0b"
                        : "#ef4444",
                    }}
                  >
                    {s.average}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Settings placeholder ── */
function SettingsPlaceholder() {
  return (
    <div style={{ textAlign: "center", padding: "80px 24px", color: "#94a3b8" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
      <h2 style={{ fontFamily: "'Sora', sans-serif", color: "#334155", marginBottom: 8 }}>
        Settings
      </h2>
      <p>Account and system settings will appear here.</p>
    </div>
  );
}