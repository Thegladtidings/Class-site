import { useNavigate } from "react-router-dom";
import styles from "../css/Sidebar.module.css";

/* Default nav — used only when no navItems prop is passed (teacher view) */
const DEFAULT_NAV = [
  { key: "dashboard",     label: "Dashboard",     icon: "⊞" },
  { key: "students",      label: "Students",      icon: "👥" },
  { key: "assignments",   label: "Assignments",   icon: "📋" },
  { key: "exams",         label: "Exams",         icon: "📝" },
  { key: "grades",        label: "Grades",        icon: "📊" },
  { key: "announcements", label: "Announcements", icon: "📢" },
  { key: "settings",      label: "Settings",      icon: "⚙"  },
  { key: "profile",       label: "Profile",       icon: "👤" },
];

export const Sidebar = ({
  active,
  onNav,
  open,
  onClose,
  navItems,          // optional — pass from student dashboard to override default nav
  brandName = "ClassSite",
  brandSub,
}) => {
  const navigate = useNavigate();

  /* Use passed navItems if provided, else fall back to teacher default.
     Normalise key/id so both { key } and { id } shapes work.          */
  const resolvedNav = (navItems ?? DEFAULT_NAV).map((item) => ({
    ...item,
    key: item.key ?? item.id,
  }));

  /* Safe close — only calls onClose when it exists (mobile) */
  const safeClose = () => onClose?.();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <>
      {/* Overlay — only rendered + visible on mobile when sidebar is open */}
      {open && (
        <div
          className={styles.overlay}
          onClick={safeClose}
          aria-hidden="true"
        />
      )}

      <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <span className={styles.brandIcon}>🎓</span>
            <div>
              <div className={styles.brandName}>{brandName}</div>
              <div className={styles.brandSub}>{brandSub}</div>
            </div>
          </div>

          {/* Mobile close button (× inside sidebar header) */}
          <button
            className={styles.closeBtn}
            onClick={safeClose}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          <p className={styles.navLabel}>Main Menu</p>
          {resolvedNav.map((item) => (
            <button
              key={item.key}
              className={`${styles.navItem} ${active === item.key ? styles.navActive : ""}`}
              onClick={() => {
                onNav(item.key);
                safeClose();   // close drawer on mobile after navigation
              }}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {active === item.key && <span className={styles.activeDot} />}
            </button>
          ))}
        </nav>

        {/* Bottom — logout */}
        <div className={styles.sidebarBottom}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};