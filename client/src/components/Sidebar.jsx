import { useNavigate } from "react-router-dom";
import styles from "../css/Sidebar.module.css";

const NAV = [
  { key: "dashboard",     label: "Dashboard",     icon: "⊞" },
  { key: "students",      label: "Students",       icon: "👥" },
  { key: "assignments",   label: "Assignments",    icon: "📋" },
  { key: "exams",         label: "Exams",          icon: "📝" },
  { key: "grades",        label: "Grades",         icon: "📊" },
  { key: "announcements", label: "Announcements",  icon: "📢" },
  { key: "settings",      label: "Settings",       icon: "⚙" },
  { key: "profile",       label: "Profile",        icon: "👤" },
];

export const Sidebar = ({ active, onNav, open, onClose }) => {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <>
      {open && <div className={styles.overlay} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <span className={styles.brandIcon}>🎓</span>
            <div>
              <div className={styles.brandName}>EduPortal</div>
              <div className={styles.brandSub}>Teacher Console</div>
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          <p className={styles.navLabel}>Main Menu</p>
          {NAV.map((item) => (
            <button
              key={item.key}
              className={`${styles.navItem} ${active === item.key ? styles.navActive : ""}`}
              onClick={() => { onNav(item.key); onClose(); }}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {active === item.key && <span className={styles.activeDot} />}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}