// components/tutors/SkeletonCard.tsx
import styles from "./Skeletoncard.module.css";

export default function SkeletonCard() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={`${styles.bone} ${styles.avatar}`} />
      <div className={`${styles.bone} ${styles.line} ${styles.lineWide}`} />
      <div className={`${styles.bone} ${styles.line} ${styles.lineMid}`} />
      <div className={`${styles.bone} ${styles.line} ${styles.lineWide}`} />
      <div className={`${styles.bone} ${styles.line} ${styles.lineShort}`} />
    </div>
  );
}