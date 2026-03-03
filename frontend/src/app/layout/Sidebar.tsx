import { NavLink } from "react-router-dom";

import { useAuth } from "../state/useAuth";

import styles from "./Sidebar.module.css";

export function Sidebar() {
  const { user } = useAuth();

  return (
    <div className={styles.wrap}>
      <div className={styles.brand}>Financial Dashboard</div>
      <nav className={styles.nav}>
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? `${styles.item} ${styles.itemActive}` : styles.item)}
          end
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/reconciliations"
          className={({ isActive }) => (isActive ? `${styles.item} ${styles.itemActive}` : styles.item)}
        >
          Reconciliations
        </NavLink>
        <NavLink
          to="/reports"
          className={({ isActive }) => (isActive ? `${styles.item} ${styles.itemActive}` : styles.item)}
        >
          Reports
        </NavLink>
        {(user?.role === "admin" || user?.role === "accountant") && (
          <NavLink
            to="/transactions/ingest"
            className={({ isActive }) => (isActive ? `${styles.item} ${styles.itemActive}` : styles.item)}
          >
            Ingest Transactions
          </NavLink>
        )}
      </nav>
    </div>
  );
}

