/**
 * TransactionIngestPage — operator form for queueing a batch transaction
 * ingest: pick a ledger, paste/format/validate the JSON payload, submit, and
 * watch the Celery task run to completion.
 */

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CodeIcon from "@mui/icons-material/Code";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AlertTitle,
  Box,
  Button,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

import { apiErrorDetail } from "../../../api/errors";
import { GlassCard } from "../../../components/ui/GlassCard";
import { LedgerSelect } from "../../../components/ui/LedgerSelect";
import { PageHeader } from "../../../components/ui/PageHeader";
import { TaskStatusPoller } from "../../../components/ui/TaskStatusPoller";
import { useJobHistory } from "../../../hooks/useJobHistory";
import { useLedgers } from "../../../hooks/useLedgers";
import { transactionsApi } from "../api/transactionsApi";
import {
  EXAMPLE_PAYLOAD_TEXT,
  validateIngestPayload,
  type PayloadValidation,
} from "../payloadValidation";

const FIELD_REFERENCE: Array<{ field: string; detail: string }> = [
  { field: "external_id", detail: "string, unique per ledger — drives idempotent re-ingest" },
  { field: "transaction_date", detail: "ISO date, YYYY-MM-DD" },
  { field: "amount", detail: "numeric string, e.g. \"1250.00\"" },
  { field: "currency", detail: "3-letter ISO code, e.g. USD" },
  { field: "type", detail: '"debit" or "credit"' },
  { field: "description", detail: "optional string or null" },
  { field: "reference", detail: "optional string or null" },
];

export function TransactionIngestPage() {
  const { ledgers, loading: ledgersLoading, error: ledgersError, refetch } = useLedgers();
  const { record, syncStatus } = useJobHistory();

  const [ledgerId, setLedgerId] = useState("");
  const [jsonText, setJsonText] = useState(EXAMPLE_PAYLOAD_TEXT);
  const [validation, setValidation] = useState<PayloadValidation | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleTextChange = (value: string) => {
    setJsonText(value);
    setValidation(null);
    setFormatError(null);
  };

  const handleFormat = () => {
    setFormatError(null);
    try {
      setJsonText(JSON.stringify(JSON.parse(jsonText), null, 2));
      setValidation(null);
    } catch (e: unknown) {
      setFormatError(
        `Cannot format — the payload is not valid JSON: ${
          e instanceof Error ? e.message : "unknown parse error"
        }`,
      );
    }
  };

  const handleValidate = () => {
    setFormatError(null);
    setValidation(validateIngestPayload(jsonText));
  };

  const handleSubmit = async () => {
    setFormatError(null);
    setSubmitError(null);
    setTaskId(null);

    const result = validateIngestPayload(jsonText);
    setValidation(result);
    if (!result.ok) return;

    setSubmitting(true);
    try {
      const res = await transactionsApi.ingest({
        ledger_id: ledgerId,
        transactions: result.items,
      });
      setTaskId(res.task_id);
      record(res.task_id, "ingest");
    } catch (e: unknown) {
      setSubmitError(apiErrorDetail(e, "Failed to queue the ingestion job.").message);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = ledgerId !== "" && jsonText.trim() !== "" && !submitting;

  return (
    <Box>
      <PageHeader
        title="Ingest Transactions"
        subtitle="Queue a batch of ledger transactions. Ingestion runs asynchronously and is idempotent on (ledger, external_id)."
      />

      {ledgersError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          {ledgersError}
        </Alert>
      )}

      <GlassCard>
        <CardContent>
          <Stack spacing={2.5}>
            <LedgerSelect
              label="Target ledger"
              value={ledgerId}
              onChange={setLedgerId}
              ledgers={ledgers}
              loading={ledgersLoading}
            />

            <TextField
              label="Transactions (JSON array)"
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              multiline
              minRows={12}
              maxRows={24}
              fullWidth
              spellCheck={false}
              slotProps={{
                htmlInput: {
                  style: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
                },
              }}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button variant="outlined" startIcon={<CodeIcon />} onClick={handleFormat}>
                Format JSON
              </Button>
              <Button
                variant="outlined"
                startIcon={<CheckCircleOutlineIcon />}
                onClick={handleValidate}
              >
                Validate
              </Button>
              <Button
                variant="contained"
                onClick={() => void handleSubmit()}
                disabled={!canSubmit}
                startIcon={
                  submitting ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />
                }
              >
                {submitting ? "Submitting…" : "Submit ingestion job"}
              </Button>
            </Stack>

            {formatError && <Alert severity="warning">{formatError}</Alert>}

            {validation?.ok === true && (
              <Alert severity="success">
                Payload is valid — {validation.items.length} transaction
                {validation.items.length === 1 ? "" : "s"} ready to ingest.
              </Alert>
            )}

            {validation?.ok === false && (
              <Alert severity="error">
                <AlertTitle>Payload is not valid</AlertTitle>
                <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
                  {validation.errors.map((message) => (
                    <li key={message}>
                      <Typography variant="body2">{message}</Typography>
                    </li>
                  ))}
                </Box>
              </Alert>
            )}

            {submitError && <Alert severity="error">{submitError}</Alert>}
          </Stack>

          <TaskStatusPoller
            taskId={taskId}
            onStatusChange={(status, response) => syncStatus(response.task_id, status)}
            renderResult={(result) =>
              typeof result === "number"
                ? `Inserted ${result} new transaction${result === 1 ? "" : "s"} (duplicates are skipped).`
                : "Ingestion completed."
            }
          />

          <Accordion disableGutters elevation={0} sx={{ mt: 3, bgcolor: "transparent" }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
              <Typography variant="subtitle2">Payload format reference</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0 }}>
              <Box component="ul" sx={{ mt: 0, mb: 2, pl: 2.25 }}>
                {FIELD_REFERENCE.map(({ field, detail }) => (
                  <li key={field}>
                    <Typography variant="body2">
                      <Box component="code" sx={{ fontFamily: "monospace" }}>
                        {field}
                      </Box>{" "}
                      — {detail}
                    </Typography>
                  </li>
                ))}
              </Box>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 2,
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "action.hover",
                  overflowX: "auto",
                  fontSize: 12,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                }}
              >
                {EXAMPLE_PAYLOAD_TEXT}
              </Box>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </GlassCard>
    </Box>
  );
}
