import { useState, useEffect }    from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Sidebar }                from "../../components/Sidebar.jsx";
import Header                     from "../../components/Header.jsx";
import Toast                      from "../../components/Toast.jsx";
import StudentAssignments         from "./Assignments.jsx";
import StudentExams               from "./Exams.jsx";
import StudentProfile             from "./Profile.jsx";
import StudentAnnouncements       from "./Announcements.jsx";
import Grades from "./Grades.jsx";
import ClassSchedule from "../ClassSchedule.jsx";
import { useStudentData }         from "./UseStudentData.js";

import styles from "../../css/Studentdashboard.module.css";

/* ══════════════════════════════════════════════
   STUDENT DASHBOARD SHELL
══════════════════════════════════════════════ */
export default function StudentDashboard({ initialSection = "dashboard" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive]       = useState(initialSection);
  const [sidebarOpen, setSidebar] = useState(false);
  const [toast, setToast]         = useState(null);
  const [profileOverride, setProfileOverride] = useState(null);

  const {
    profile,
    assignmentList,
    resultList,
    examList,
    gradeList,
    announcementList,
    announcements,
    submissionMap,
    stats,
    isLoading,
    hasError,
  } = useStudentData();

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    setActive(initialSection);
  }, [initialSection]);

  useEffect(() => {
    if (hasError) setToast({ msg: "Some data could not be loaded.", type: "error" });
  }, [hasError]);

  const profileData = profileOverride ?? profile.data?.student ?? profile.data ?? null;

  function navigateToSection(section) {
    setActive(section);
    const destination = `/student/${section}`;
    if (location.pathname !== destination) navigate(destination);
  }

  const NAV = [
    { id: "dashboard",     label: "Dashboard",     icon: "🏠" },
    { id: "exams",         label: "Exams",         icon: "📝" },
    { id: "assignments",   label: "Assignments",   icon: "📋" },
    { id: "schedule",      label: "Class Schedule", icon: "◷" },
    { id: "grades",        label: "Grades",        icon: "📊" },
    { id: "announcements", label: "Announcements", icon: "📢" },
    { id: "profile",       label: "Profile",       icon: "👤" },
  ];

  function renderContent() {
    switch (active) {
      case "exams":
        return <StudentExams />;
      case "assignments":
        return <StudentAssignments />;
      case "grades":
        return <Grades />;
      case "schedule":
        return <ClassSchedule role="student" />;
      case "announcements":
        return (
          <StudentAnnouncements
            announcements={announcementList}
            loading={announcements.loading}
            requestError={announcements.error}
          />
        );
      case "profile":
  return (
    <StudentProfile
      profile={profileData}
      onUpdate={(updated) => {
        setProfileOverride(updated);
        setToast({ msg: "Profile updated successfully!", type: "success" });
      }}
    />
  );
      default:
        return (
          <DashboardHome
            profile={profileData}
            assignmentList={assignmentList}
            resultList={resultList}
            examList={examList}
            announcementList={announcementList}
            submissionMap={submissionMap}
            stats={stats}
            loading={isLoading}
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
        navItems={NAV}
        brandSub={"Student Portal"}
      />
      <div className={styles.mainArea}>
        <Header
          profile={profileData}
          role="student"
          onMenuToggle={() => setSidebar((v) => !v)}
          onProfileClick={() => navigateToSection("profile")}
        />
        <main className={styles.content}>
          {renderContent()}
        </main>
      </div>
      {toast && (
        <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   DASHBOARD HOME
══════════════════════════════════════════════ */
function DashboardHome({
  profile,
  assignmentList,
  resultList,
  examList,
  announcementList,
  submissionMap,
  stats,
  loading,
  onNav,
}) {
  const { pendingAssignments, liveExams, avgExamScore, totalAnnouncements } = stats;

  const liveExamList = examList.filter((e) => {
    const now = new Date(), s = new Date(e.startTime), en = new Date(e.endTime);
    return now >= s && now <= en && !e.alreadyTaken;
  });

  const recentAnnouncements = [...announcementList]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const recentResults = [...resultList]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const pendingList = assignmentList.filter((a) => !submissionMap[String(a._id)]);

  const TYPE_META = {
    notice:       { icon: "📋", color: "#1a6ef5" },
    best_student: { icon: "🌟", color: "#f59e0b" },
    result:       { icon: "📊", color: "#10b981" },
    event:        { icon: "📅", color: "#8b5cf6" },
  };

  return (
    <div>
      {/* Greeting */}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>
          Welcome back{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}! 👋
        </h2>
        <p className={styles.pageSub}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric", year: "numeric",
          })}
        </p>
      </div>

      {/* Stats row */}
      <div className={styles.statsGrid}>
        {[
          {
            icon:  "📋",
            value: loading ? "—" : pendingAssignments,
            label: "Pending Assignments",
            color: pendingAssignments > 0 ? "#f59e0b" : "#10b981",
          },
          {
            icon:  "📝",
            value: loading ? "—" : liveExams,
            label: "Live Exams",
            color: liveExams > 0 ? "#10b981" : "#94a3b8",
          },
          {
            icon:  "📊",
            value: loading ? "—" : (avgExamScore != null ? `${avgExamScore}%` : "N/A"),
            label: "Avg Exam Score",
            color: avgExamScore >= 70 ? "#10b981" : avgExamScore >= 50 ? "#f59e0b" : "#ef4444",
          },
          {
            icon:  "📢",
            value: loading ? "—" : totalAnnouncements,
            label: "Announcements",
            color: "#1a6ef5",
          },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statIcon}>{s.icon}</span>
            <span className={styles.statValue} style={{ color: s.color }}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Live exam alert */}
      {liveExamList.length > 0 && (
        <div
          onClick={() => onNav("exams")}
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            borderRadius: 14, padding: "16px 22px",
            color: "#fff", cursor: "pointer", marginBottom: 20,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 2px" }}>
              🟢 {liveExamList.length} exam{liveExamList.length > 1 ? "s" : ""} live right now!
            </p>
            <p style={{ fontSize: 12, opacity: 0.85, margin: 0 }}>
              {liveExamList[0].title}
              {liveExamList.length > 1 ? ` and ${liveExamList.length - 1} more` : ""}
            </p>
          </div>
          <span style={{ fontSize: 20 }}>▶</span>
        </div>
      )}

      {/* Main grid */}
      <div className={styles.dashGrid}>

        {/* Pending assignments */}
        <div className={styles.dashCard}>
          <div className={styles.dashCardHead}>
            <h3 className={styles.dashCardTitle}>📋 Pending Assignments</h3>
            <button className={styles.dashLink} onClick={() => onNav("assignments")}>
              View All →
            </button>
          </div>
          {loading ? (
            <div style={{ height: 80, background: "#f1f5f9", borderRadius: 8 }} />
          ) : pendingList.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13, padding: "12px 0" }}>
              All caught up! 🎉
            </p>
          ) : (
            pendingList.slice(0, 4).map((a) => {
              const due  = a.dueDate && new Date(a.dueDate);
              const late = due && due < new Date();
              return (
                <div key={a._id} className={styles.assignRow}>
                  <div
                    className={styles.assignDot}
                    style={{ background: late ? "#ef4444" : "#f59e0b" }}
                  />
                  <div className={styles.assignInfo}>
                    <p className={styles.assignTitle}>{a.title}</p>
                    <p className={styles.assignMeta}>
                      {a.subject}
                      {due && (
                        <span style={{ color: late ? "#ef4444" : "#94a3b8", marginLeft: 6 }}>
                          · Due {due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Recent exam results */}
        <div className={styles.dashCard}>
          <div className={styles.dashCardHead}>
            <h3 className={styles.dashCardTitle}>📊 Recent Results</h3>
            <button className={styles.dashLink} onClick={() => onNav("exams")}>
              View All →
            </button>
          </div>
          {loading ? (
            <div style={{ height: 80, background: "#f1f5f9", borderRadius: 8 }} />
          ) : recentResults.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13, padding: "12px 0" }}>
              No exam results yet.
            </p>
          ) : (
            recentResults.map((r, i) => {
              const pct   = r.percentage ?? 0;
              const color = pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
              return (
                <div key={r._id ?? i} className={styles.resultRow}>
                  <div className={styles.resultInfo}>
                    <p className={styles.resultTitle}>{r.exam?.title ?? "Exam"}</p>
                    <p className={styles.resultSub}>{r.exam?.subject}</p>
                  </div>
                  <span className={styles.resultScore} style={{ color }}>
                    {pct}%
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Recent announcements */}
        <div className={styles.dashCard}>
          <div className={styles.dashCardHead}>
            <h3 className={styles.dashCardTitle}>📢 Announcements</h3>
            <button className={styles.dashLink} onClick={() => onNav("announcements")}>
              View All →
            </button>
          </div>
          {loading ? (
            <div style={{ height: 80, background: "#f1f5f9", borderRadius: 8 }} />
          ) : recentAnnouncements.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13, padding: "12px 0" }}>
              No announcements.
            </p>
          ) : (
            recentAnnouncements.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.notice;
              return (
                <div key={n._id} className={styles.announceItem}>
                  <span className={styles.announceIcon}>{meta.icon}</span>
                  <div>
                    <p className={styles.announceTitle}>{n.title}</p>
                    <p className={styles.announceTime}>
                      {new Date(n.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick actions */}
        <div className={styles.dashCard}>
          <div className={styles.dashCardHead}>
            <h3 className={styles.dashCardTitle}>⚡ Quick Actions</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Take Exam",         icon: "📝", nav: "exams"         },
              { label: "Submit Assignment",  icon: "📤", nav: "assignments"   },
              { label: "View Grades",       icon: "📊", nav: "grades"        },
              { label: "Announcements",     icon: "📢", nav: "announcements" },
            ].map((a) => (
              <button
                key={a.nav}
                onClick={() => onNav(a.nav)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 8, padding: "16px 10px", borderRadius: 12,
                  border: "1.5px solid #e2e8f0", background: "#f8fafc",
                  cursor: "pointer", transition: "all 0.15s", fontSize: 12,
                  fontWeight: 600, color: "#475569",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#1a6ef5";
                  e.currentTarget.style.background  = "#eff6ff";
                  e.currentTarget.style.color       = "#1a6ef5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.background  = "#f8fafc";
                  e.currentTarget.style.color       = "#475569";
                }}
              >
                <span style={{ fontSize: 24 }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   GRADES SECTION
══════════════════════════════════════════════ */
function GradesSection({ grades, loading }) {
  function gradeFromPct(pct) {
    if (pct >= 70) return { label: "A", color: "#10b981", bg: "#f0fdf4" };
    if (pct >= 60) return { label: "B", color: "#1a6ef5", bg: "#eff6ff" };
    if (pct >= 50) return { label: "C", color: "#f59e0b", bg: "#fffbeb" };
    if (pct >= 40) return { label: "D", color: "#f97316", bg: "#fff7ed" };
    return           { label: "F", color: "#ef4444", bg: "#fef2f2" };
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>My Grades</h2>
          <p className={styles.sectionSub}>{grades.length} records</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.skeletonList}>
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      ) : grades.length === 0 ? (
        <div className={styles.emptyState}>
          <span>📊</span>
          <p>No grades recorded yet.</p>
        </div>
      ) : (
        <div className={styles.cardList}>
          {grades.map((g, i) => {
            const pct   = g.percentage ?? g.score ?? 0;
            const grade = gradeFromPct(pct);
            return (
              <div key={g._id ?? i} className={styles.itemCard}>
                <div className={styles.itemCardHead}>
                  <div style={{ flex: 1 }}>
                    <p className={styles.itemTitle}>
                      {g.subject ?? g.exam?.subject ?? "Subject"}
                    </p>
                    <p className={styles.itemMeta}>
                      {g.term ?? g.exam?.term ?? ""}
                      {g.className && <>&nbsp;·&nbsp;{g.className}</>}
                    </p>
                    {g.feedback && (
                      <p className={styles.itemMeta} style={{ color: "#475569", marginTop: 4 }}>
                        💬 {g.feedback}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 26, fontWeight: 900, color: grade.color, margin: "0 0 4px" }}>
                      {pct}%
                    </p>
                    <span
                      className={styles.gradeBadge}
                      style={{ color: grade.color, background: grade.bg }}
                    >
                      {grade.label}
                    </span>
                  </div>
                </div>
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
      )}
    </div>
  );
}
