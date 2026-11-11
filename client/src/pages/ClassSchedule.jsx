import { useCallback, useEffect, useState } from "react";
import {
  cancelClassSession,
  createClassSession,
  getClassSessions,
  updateClassSession,
} from "./api/classSessionApi.js";
import styles from "../css/ClassSchedule.module.css";

function localDateTimeValue(value) {
  const date = value ? new Date(value) : new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function formatSessionDate(value) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ClassSchedule({ role, students = [] }) {
  const isTeacher = role === "teacher";
  const activeStudents = students.filter((student) => student.isActive !== false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busySession, setBusySession] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(() => ({
    studentId: "",
    subject: "",
    startsAt: localDateTimeValue(),
    durationMinutes: "60",
    notes: "",
  }));

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getClassSessions();
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load the class schedule.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      studentId: "",
      subject: "",
      startsAt: localDateTimeValue(),
      durationMinutes: "60",
      notes: "",
    });
    setEditingId("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    const payload = {
      ...form,
      durationMinutes: Number(form.durationMinutes),
      startsAt: new Date(form.startsAt).toISOString(),
    };

    try {
      if (editingId) {
        await updateClassSession(editingId, payload);
        setNotice("Class schedule updated.");
      } else {
        await createClassSession(payload);
        setNotice("Class scheduled. Your student can now see it in their schedule.");
      }
      resetForm();
      await loadSessions();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not save this class. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (session) => {
    setEditingId(session._id);
    setForm({
      studentId: session.student?._id || "",
      subject: session.subject,
      startsAt: localDateTimeValue(session.startsAt),
      durationMinutes: String(session.durationMinutes),
      notes: session.notes || "",
    });
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = async (session) => {
    if (!window.confirm(`Cancel the ${session.subject} class?`)) return;
    setBusySession(session._id);
    setError("");
    setNotice("");
    try {
      await cancelClassSession(session._id);
      setNotice("Class cancelled.");
      await loadSessions();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not cancel this class.");
    } finally {
      setBusySession("");
    }
  };

  return (
    <section className={styles.schedule}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>CLASS PLANNER</p>
          <h2 className={styles.title}>{isTeacher ? "Class schedule" : "Your class schedule"}</h2>
          <p className={styles.subtitle}>
            {isTeacher
              ? "Plan one-to-one learning time and keep every student in the loop."
              : "See the upcoming lessons your teacher has planned for you."}
          </p>
        </div>
        {isTeacher && <span className={styles.headerBadge}>Upcoming sessions</span>}
      </header>

      {isTeacher && (
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.formHeading}>
            <div className={styles.formIcon} aria-hidden="true">＋</div>
            <div>
              <h3>{editingId ? "Update class" : "Schedule a class"}</h3>
              <p>Choose a student, set a time, and add any helpful details.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Student</span>
              <select name="studentId" value={form.studentId} onChange={updateForm} required disabled={Boolean(editingId)}>
                <option value="">Select a student</option>
                {activeStudents.map((student) => (
                  <option value={student._id} key={student._id}>
                    {student.name}{student.className ? ` · ${student.className}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Subject or class focus</span>
              <input
                name="subject"
                value={form.subject}
                onChange={updateForm}
                placeholder="e.g. Algebra revision"
                maxLength={120}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Date and time</span>
              <input
                type="datetime-local"
                name="startsAt"
                value={form.startsAt}
                onChange={updateForm}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Duration</span>
              <select name="durationMinutes" value={form.durationMinutes} onChange={updateForm}>
                {[30, 45, 60, 75, 90, 120, 150, 180, 240].map((minutes) => (
                  <option value={minutes} key={minutes}>{minutes} minutes</option>
                ))}
              </select>
            </label>

            <label className={`${styles.field} ${styles.notesField}`}>
              <span>Notes for the student <small>Optional</small></span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={updateForm}
                placeholder="What should they prepare?"
                maxLength={1000}
                rows={3}
              />
            </label>
          </div>

          {activeStudents.length === 0 && (
            <p className={styles.formHint}>Students will appear here once they have registered.</p>
          )}

          {error && <p className={styles.error} role="alert">{error}</p>}
          {notice && <p className={styles.notice} role="status">{notice}</p>}
          <div className={styles.formActions}>
            {editingId && (
              <button type="button" className={styles.secondaryButton} onClick={resetForm}>
                Stop editing
              </button>
            )}
            <button type="submit" className={styles.submitButton} disabled={saving || activeStudents.length === 0}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Schedule class"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      )}

      {!isTeacher && error && <p className={styles.error} role="alert">{error}</p>}
      {!isTeacher && notice && <p className={styles.notice} role="status">{notice}</p>}

      <div className={styles.listHeading}>
        <div>
          <h3>Upcoming classes</h3>
          <p>Your next sessions, all in one place.</p>
        </div>
        <span className={styles.countBadge}>{sessions.length}</span>
      </div>

      {loading ? (
        <div className={styles.loadingCard} role="status">Loading your schedule…</div>
      ) : sessions.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} aria-hidden="true">◷</span>
          <h3>No upcoming classes</h3>
          <p>
            {isTeacher
              ? "Schedule your first class above and it will appear here."
              : "When your teacher schedules a class, you’ll find the details here."}
          </p>
        </div>
      ) : (
        <div className={styles.sessionList}>
          {sessions.map((session) => {
            const cancelled = session.status === "cancelled";
            const studentName = session.student?.name || "Student";
            const teacherName = session.teacher?.name || "Your teacher";
            return (
              <article className={`${styles.sessionCard} ${cancelled ? styles.cancelledCard : ""}`} key={session._id}>
                <div className={styles.dateBlock}>
                  <span>{new Date(session.startsAt).toLocaleDateString(undefined, { month: "short" })}</span>
                  <strong>{new Date(session.startsAt).getDate()}</strong>
                </div>
                <div className={styles.sessionDetails}>
                  <div className={styles.sessionTitleRow}>
                    <h4>{session.subject}</h4>
                    <span className={`${styles.status} ${cancelled ? styles.cancelled : ""}`}>
                      {cancelled ? "Cancelled" : "Scheduled"}
                    </span>
                  </div>
                  <p className={styles.sessionMeta}>
                    {formatSessionDate(session.startsAt)} <span>·</span> {session.durationMinutes} min
                  </p>
                  <p className={styles.sessionPerson}>
                    {isTeacher ? `With ${studentName}` : `With ${teacherName}`}
                    {isTeacher && session.student?.className ? ` · ${session.student.className}` : ""}
                  </p>
                  {session.notes && <p className={styles.sessionNotes}>{session.notes}</p>}
                </div>
                {isTeacher && !cancelled && (
                  <div className={styles.sessionActions}>
                    <button type="button" onClick={() => handleEdit(session)}>Reschedule</button>
                    <button
                      type="button"
                      className={styles.cancelAction}
                      disabled={busySession === session._id}
                      onClick={() => handleCancel(session)}
                    >
                      {busySession === session._id ? "Cancelling…" : "Cancel"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
