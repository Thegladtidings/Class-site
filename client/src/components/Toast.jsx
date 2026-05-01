import { useEffect } from "react";
import styles from "../css/Toast.module.css";

export default function Toast({ message, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  const icons = { success: "✓", error: "✕", info: "ℹ" };

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <span className={styles.icon}>{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}