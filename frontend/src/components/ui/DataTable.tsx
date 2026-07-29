/**
 * DataTable — themed MUI X DataGrid wrapper with sticky header, compact density,
 * and a built-in toolbar (CSV export + debounced quick filter).
 *
 * Pass `exportFileName` to name the exported CSV; callers no longer need to
 * define their own toolbar component per table.
 */

import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarQuickFilter,
  type DataGridProps,
} from "@mui/x-data-grid";

// Lets the export filename flow through slotProps.toolbar with full typing.
declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    csvFileName?: string;
  }
}

type DataTableToolbarProps = {
  csvFileName?: string;
};

function DataTableToolbar({ csvFileName }: DataTableToolbarProps) {
  return (
    <GridToolbarContainer>
      <GridToolbarExport {...(csvFileName ? { csvOptions: { fileName: csvFileName } } : {})} />
      <GridToolbarQuickFilter debounceMs={400} />
    </GridToolbarContainer>
  );
}

export type DataTableProps = DataGridProps & {
  /** Filename for the CSV export button, without extension. */
  exportFileName?: string;
};

export function DataTable({ slots, slotProps, sx, exportFileName, ...props }: DataTableProps) {
  const mergedSlots = { toolbar: DataTableToolbar, ...slots };
  const mergedSlotProps: DataGridProps["slotProps"] = {
    ...slotProps,
    toolbar: {
      ...(exportFileName ? { csvFileName: exportFileName } : {}),
      ...slotProps?.toolbar,
    },
  };
  const mergedSx = [{ minHeight: 360 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])];

  return (
    <DataGrid
      density="compact"
      disableRowSelectionOnClick
      slots={mergedSlots}
      slotProps={mergedSlotProps}
      sx={mergedSx}
      {...props}
    />
  );
}
