import type { ReactNode } from "react";
import styles from "./BlogLayout.module.css";

export default function BlogLayout({ main, sidebar }: { main: ReactNode; sidebar: ReactNode }) {
  return (
    <div className={styles.wrap}>
      <main className={styles.main}>{main}</main>
      <aside className={styles.sidebarSlot}>
        <div className={styles.sidebarSticky}>{sidebar}</div>
      </aside>
    </div>
  );
}
