/**
 * DataTable — themed MUI X DataGrid wrapper with sticky header, compact density, and export toolbar.
 */

import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  type DataGridProps,
} from "@mui/x-data-grid";

function DataTableToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

export type DataTableProps = DataGridProps;

export function DataTable({ slots, slotProps, sx, ...props }: DataTableProps) {
  const mergedSlots = { toolbar: DataTableToolbar, ...slots };
  const mergedSx = [{ minHeight: 360 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])];

  return (
    <DataGrid
      density="compact"
      disableRowSelectionOnClick
      slots={mergedSlots}
      {...(slotProps ? { slotProps } : {})}
      sx={mergedSx}
      {...props}
    />
  );
}
