/**
 * useLedgers — loads the ledger list used to populate job and ingest forms.
 */

import { useCallback, useEffect, useState } from "react";

import { ledgersApi } from "../api/ledgersApi";
import type { LedgerRead } from "../types/ledgers";

export function useLedgers() {
  const [ledgers, setLedgers] = useState<LedgerRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ledgersApi.listLedgers();
      setLedgers(data.items);
    } catch {
      setError("Failed to load ledgers. Check that the API is reachable and you are signed in.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ledgers, loading, error, refetch: load };
}
