import styles from "../css/Statcard.module.css";

const CARDS = [
  {
    key: "totalStudents",
    label: "Total Students",
    icon: "👥",
    color: "#1a6ef5",
    bg: "#eff6ff",
    suffix: "enrolled",
  },
  {
    key: "activeAssignments",
    label: "Active Assignments",
    icon: "📋",
    color: "#f59e0b",
    bg: "#fffbeb",
    suffix: "open",
  },
  {
    key: "upcomingExams",
    label: "Upcoming Exams",
    icon: "📝",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    suffix: "scheduled",
  },
  {
    key: "classAverage",
    label: "Class Average",
    icon: "📊",
    color: "#10b981",
    bg: "#ecfdf5",
    suffix: "%",
    isPercent: true,
  },
];

export default function StatCards({ stats = {}, loading }) {
  return (
    <div className={styles.grid}>
      {CARDS.map((card, i) => {
        const rawValue = stats?.[card.key];

        // safe fallback
        const value =
          typeof rawValue === "number" || typeof rawValue === "string"
            ? rawValue
            : 0;

        return (
          <div
            key={card.key}
            className={styles.card}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={styles.iconWrap} style={{ background: card.bg }}>
              <span className={styles.icon}>{card.icon}</span>
            </div>

            <div className={styles.content}>
              <p className={styles.label}>{card.label}</p>

              {loading ? (
                <div className={styles.skeleton} />
              ) : (
                <p className={styles.value} style={{ color: card.color }}>
                  {card.isPercent ? `${value}%` : value}
                </p>
              )}

              <p className={styles.suffix}>{card.suffix}</p>
            </div>

            <div
              className={styles.accent}
              style={{ background: card.color }}
            />
          </div>
        );
      })}
    </div>
  );
}