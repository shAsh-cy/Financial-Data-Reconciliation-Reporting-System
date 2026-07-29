/**
 * JobResultLink — renders a completed job's result id as a deep link to the
 * record the worker produced (a reconciliation run or a financial report).
 */

import { Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import { isValidUuid } from "../../../utils/uuid";

export type JobResultLinkProps = {
  result: unknown;
  /** Route prefix the produced id belongs to, e.g. "/reconciliations". */
  pathPrefix: string;
  /** Human label for the produced record, e.g. "reconciliation run". */
  recordLabel: string;
};

export function JobResultLink({ result, pathPrefix, recordLabel }: JobResultLinkProps) {
  if (typeof result !== "string" || !isValidUuid(result)) {
    return <Typography variant="body2">Completed.</Typography>;
  }

  return (
    <Typography variant="body2">
      Created {recordLabel}{" "}
      <Link component={RouterLink} to={`${pathPrefix}/${result}`} underline="hover">
        {result}
      </Link>
    </Typography>
  );
}
