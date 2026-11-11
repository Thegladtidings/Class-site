import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Sidebar }              from "../../components/Sidebar.jsx";
import Header                   from "../../components/Header.jsx";
import StatCards                from "../../components/Statcard.jsx";
import StudentsSection          from "./Students.jsx";
import AssignmentsSection       from "./Assignments.jsx";
import ExamsSection             from "./Exams.jsx";
import GradesSection            from "./Grades.jsx";
import AnnouncementsSection     from "./Announcements.jsx";
import ClassSchedule            from "../ClassSchedule.jsx";
import TeacherProfile           from "./Profile.jsx";

import { useTeacherData }       from "./Useteacherdata.js";
import styles                   from "../../css/Teacherdashboard.module.css";

export default function TeacherDashboard({ initialSection = "dashboard" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive]       = useState(initialSection);
  const [sidebarOpen, setSidebar] = useState(false);
  const [profileOverride, setProfileOverride] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    setActive(initialSection);
  }, [initialSection]);

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
    errors,
    refetchAll,
  } = useTeacherData();

  const teacherProfile = profileOverride ?? profile.data?.teacher ?? profile.data ?? null;

  function navigateToSection(section) {
    setActive(section);
    const destination = `/teacher/${section}`;
    if (location.pathname !== destination) navigate(destination);
  }

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

      case "schedule":
        return <ClassSchedule role="teacher" students={studentList} />;
      case "profile":
        return <TeacherProfile profile={teacherProfile} onUpdate={setProfileOverride} error={profile.error} />;

      default:
        return (
          <DashboardHome
            stats={stats}
            loading={students.loading || grades.loading}
            students={studentList}
            assignments={assignmentList}
            announcements={announcementList}
            onNav={navigateToSection}
          />
        );
    }
  }

  return (
    <div className={styles.shell}>
      <Sidebar
        active={active}
        onNav={navigateToSection}
        open={sidebarOpen}
        onClose={() => setSidebar(false)}
        brandSub={"Teacher Portal"}
      />
      <div className={styles.mainArea}>
        <Header
          profile={teacherProfile}
          role="teacher"
          onMenuToggle={() => setSidebar((v) => !v)}
          onProfileClick={() => navigateToSection("profile")}
        />
        <main className={styles.content}>
          {errors.length > 0 && (
            <div className={styles.dataAlert} role="alert">
              <span>Some portal data could not be loaded.</span>
              <button type="button" onClick={refetchAll}>Try again</button>
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

/* ── Dashboard Home ── */
function DashboardHome({ stats, loading, students, assignments, announcements, onNav }) {
  const topStudents = students
    .filter((student) => student.average != null)
    .sort((a, b) => b.average - a.average)
    .slice(0, 5);

  const recentActivity = [
    ...assignments.map((a) => {
  const overdue =
    a.isActive !== false &&
    a.dueDate &&
    new Date(a.dueDate) < new Date();

  const status =
    a.isActive === false
      ? "closed"
      : overdue
      ? "overdue"
      : "active";

  return {
    icon: "📋",
    text: `Assignment "${a.title}" is ${status}`,
    time: a.dueDate,
    type: "assignment",
  };
}),
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
          ) : students.length === 0 ? (
            <p style={{ color: "#94a3b8", padding: "16px 0" }}>No student data yet.</p>
          ) : topStudents.length === 0 ? (
            <p style={{ color: "#94a3b8", padding: "16px 0" }}>No grades recorded yet.</p>
          ) : (
            <div className={styles.topList}>
              {topStudents.map((s, i) => (
                <div key={s._id} className={styles.topRow}>
                  <div className={styles.topRank}>#{i + 1}</div>
                  <div className={styles.topAvatar}>{s.name?.[0]}</div>
                  <div className={styles.topInfo}>
                    <p className={styles.topName}>{s.name}</p>
                    <p className={styles.topClass}>{s.className}</p>
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
          ) : students.every((student) => student.average == null) ? (
            <p style={{ color: "#94a3b8", padding: "16px 0" }}>No grades recorded yet.</p>
          ) : (
            <div className={styles.perfList}>
              {students.filter((student) => student.average != null).map((s) => (
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
