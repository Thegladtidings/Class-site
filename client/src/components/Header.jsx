import { useNavigate } from "react-router-dom";
import styles from "../css/Header.module.css";

function initials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Header({ profile, onMenuToggle, role }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  /* 🔑 Normalize profile (works for both teacher & student) */
  const user = normalizeUser(profile, role);

  return (
    <header className={styles.header}>
      {/* LEFT */}
      <div className={styles.left}>
        <button
          className={styles.hamburger}
          onClick={onMenuToggle}
          aria-label="Open menu"
        >
          <span /><span /><span />
        </button>

        <div>
          <h1 className={styles.greeting}>
            Good {getTimeOfDay()},{" "}
            <span className={styles.greetingName}>
              {user.firstName}
            </span>{" "}
            👋
          </h1>

          <p className={styles.subline}>
            {user.subline}
            &nbsp;·&nbsp;
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className={styles.right}>
        <div className={styles.notifBtn} title="Notifications">
          🔔
          <span className={styles.notifDot} />
        </div>

        <div className={styles.profileChip}>
          <div className={styles.avatar}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <span>{initials(user.name)}</span>
            )}
          </div>

          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{user.name}</span>
            <span className={styles.profileRole}>{user.roleLabel}</span>
          </div>
        </div>

        <button
          className={styles.logoutBtn}
          onClick={handleLogout}
          title="Logout"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

/* 🔧 Normalize incoming data */
function normalizeUser(profile, explicitRole) {
  // Detect role automatically if not provided
  const isTeacher =
    explicitRole === "teacher" ||
    profile?.teacher ||
    profile?.subjects;

  const isStudent =
    explicitRole === "student" ||
    profile?.studentId ||
    profile?.className;

  if (isTeacher) {
    const teacher = profile?.teacher || profile || {};

    return {
      name: teacher.name || "Teacher",
      firstName: teacher.name?.split(" ")[0] || "Teacher",
      avatar: teacher.avatar || teacher.profileImage || "",
      roleLabel: "Teacher",
      subline:
        teacher.subjects?.join(" · ") ||
        teacher.subject ||
        "Teacher",
    };
  }

  if (isStudent) {
    const student = profile?.student || profile || {};

    return {
      name: student.name || "Student",
      firstName: student.name?.split(" ")[0] || "Student",
      avatar: student.profileImage || "",
      roleLabel: "Student",
      subline:
        student.className
          ? `${student.className} · ID: ${student.studentId || "—"}`
          : "Student",
    };
  }

  /* Fallback (defensive) */
  return {
    name: "User",
    firstName: "User",
    avatar: "",
    roleLabel: "User",
    subline: "Welcome",
  };
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}