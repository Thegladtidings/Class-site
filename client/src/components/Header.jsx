import { useNavigate } from "react-router-dom";
import styles from "../css/Header.module.css";

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Header({ profile, onMenuToggle }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const teacher = profile?.teacher || { name: "Teacher", subjects: [] };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.hamburger} onClick={onMenuToggle} aria-label="Open menu">
          <span /><span /><span />
        </button>
        <div>
          <h1 className={styles.greeting}>
            Good {getTimeOfDay()}, <span className={styles.greetingName}>{teacher.name.split(" ")[0]}</span> 👋
          </h1>
          <p className={styles.subline}>
            {teacher.subjects?.join(" · ") || "Mathematics"} &nbsp;·&nbsp; {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.notifBtn} title="Notifications">
          🔔
          <span className={styles.notifDot} />
        </div>

        <div className={styles.profileChip}>
          <div className={styles.avatar}>
            {teacher.avatar
              ? <img src={teacher.avatar} alt={teacher.name} />
              : <span>{initials(teacher.name)}</span>
            }
          </div>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{teacher.name}</span>
            <span className={styles.profileRole}>Teacher</span>
          </div>
        </div>

        <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}