import { Outlet } from "react-router-dom";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

import styles from "./AppLayout.module.css";

export function AppLayout() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

