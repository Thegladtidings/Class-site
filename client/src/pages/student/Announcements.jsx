import { useEffect, useState } from "react";
import { getAnnouncements } from "../api/studentApi.js";
import styles from "../../css/StudentAnnouncements.module.css";

const TYPE_LABELS = {
  notice: "Notice",
  best_student: "Student spotlight",
  result: "Results",
  event: "Event",
};

function announcementDate(value) {
  if (!value) return "Recently posted";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently posted"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function StudentAnnouncements({
  announcements: providedAnnouncements,
  loading: parentLoading = false,
  requestError,
}) {
  const [loadedAnnouncements, setLoadedAnnouncements] = useState([]);
  const [loading, setLoading] = useState(!Array.isArray(providedAnnouncements));
  const [error, setError] = useState("");
  const hasProvidedAnnouncements = Array.isArray(providedAnnouncements);

  useEffect(() => {
    if (hasProvidedAnnouncements) {
      setLoading(false);
      setError("");
      return undefined;
    }

    let active = true;

    async function loadAnnouncements() {
      try {
        const { data } = await getAnnouncements();
        if (!Array.isArray(data?.announcements)) {
          throw new Error("The announcements response was invalid.");
        }
        if (active) setLoadedAnnouncements(data.announcements);
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || requestError.message || "Could not load announcements.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAnnouncements();
    return () => { active = false; };
  }, [hasProvidedAnnouncements]);

  const announcements = hasProvidedAnnouncements ? providedAnnouncements : loadedAnnouncements;
  const isLoading = hasProvidedAnnouncements ? parentLoading : loading;
  const visibleError = requestError
    ? requestError.response?.data?.message || "Could not load announcements. Please try again later."
    : error;

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>STAY IN THE LOOP</p>
          <h2>Announcements</h2>
          <p className={styles.description}>Updates and important notes from your teachers.</p>
        </div>
        {!isLoading && !visibleError && (
          <span className={styles.count}>{announcements.length} updates</span>
        )}
      </header>

      {isLoading ? (
        <div className={styles.state} role="status">Loading announcements…</div>
      ) : visibleError ? (
        <div className={`${styles.state} ${styles.error}`} role="alert">{visibleError}</div>
      ) : announcements.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">✦</span>
          <h3>You’re all caught up</h3>
          <p>New announcements from your teachers will appear here.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {announcements.map((announcement) => (
            <article className={styles.card} key={announcement._id}>
              <div className={styles.cardTop}>
                <span className={styles.type}>
                  {TYPE_LABELS[announcement.type] || "Update"}
                </span>
                <time className={styles.date} dateTime={announcement.createdAt || undefined}>
                  {announcementDate(announcement.createdAt)}
                </time>
              </div>
              <h3>{announcement.title}</h3>
              <p className={styles.message}>{announcement.message}</p>
              {announcement.type === "best_student" && announcement.studentName && (
                <div className={styles.spotlight}>
                  {announcement.studentPhoto && (
                    <img src={announcement.studentPhoto} alt="" className={styles.photo} />
                  )}
                  <span>Celebrating {announcement.studentName}</span>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
