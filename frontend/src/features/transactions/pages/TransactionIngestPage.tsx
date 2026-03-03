import { useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { transactionsApi, type TransactionIngestItem } from "../api/transactionsApi";

import styles from "./TransactionIngestPage.module.css";

export function TransactionIngestPage() {
  const [ledgerId, setLedgerId] = useState("");
  const [jsonText, setJsonText] = useState("[]");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setTaskId(null);
    setSubmitting(true);
    try {
      const transactions = JSON.parse(jsonText) as TransactionIngestItem[];
      const res = await transactionsApi.ingest({ ledger_id: ledgerId, transactions });
      setTaskId(res.task_id);
    } catch {
      setError("Failed to submit ingestion job. Verify ledger id and JSON payload.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2>Ingest Transactions</h2>
      <p>
        Submit a batch of transactions for ingestion. The API validates inputs and processes
        ingestion asynchronously.
      </p>
      <div className={styles.grid}>
        <div className={styles.field}>
          <div>Ledger ID</div>
          <Input value={ledgerId} onChange={(e) => setLedgerId(e.target.value)} placeholder="UUID" />
        </div>
        <div className={styles.field}>
          <div>Transactions (JSON array)</div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={12}
            className={styles.textarea}
          />
        </div>
        {error && <div>{error}</div>}
        {taskId && <div>Submitted. Task ID: {taskId}</div>}
        <Button onClick={submit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit ingestion job"}
        </Button>
      </div>
    </div>
  );
}

