import type { ApiResource } from '@/types';
import { DeleteDialog } from '@/components/ui/Dialog/DeleteDialog';
import { ScaleDialog } from '@/components/ui/Dialog/ScaleDialog';
import { CordonDialog } from '@/components/ui/Dialog/CordonDialog';
import { DrainDialog } from '@/components/ui/Dialog/DrainDialog';
import ResourceMenu from '@/components/ui/Table/ResourceMenu';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  SortingState,
  RowSelectionState,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useNavigate } from 'react-router';
import { extractGroupVersion } from '@/util';

declare module '@tanstack/react-table' {
  /* eslint-disable @typescript-eslint/no-unnecessary-type-constraint */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  interface ColumnMeta<TData extends unknown, TValue> {
    className?: string;
  }
}

interface HelmRelease {
  name: string;
  namespace: string;
}

interface ColumnData {
  kind: string;
  apiVersion: string;
  metadata?: any; // or a more specific type for metadata
}

interface DataTableProps<TData, TValue> {
  kind: string;
  columns: ColumnDef<TData, TValue>[];
  apiResource?: ApiResource | undefined;
  data: TData[];
  noResult?: boolean;
  doubleClickDisabled?: boolean;
  menuDisabled?: boolean;
}

export function DataTable<TData, TValue>({
  apiResource,
  kind,
  columns,
  data,
  noResult,
  doubleClickDisabled = false,
  menuDisabled = false,
}: DataTableProps<TData, TValue>) {
  let navigate = useNavigate();
  const [openCordonDialog, setOpenCordonDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openScaleDialog, setOpenScaleDialog] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [openDrainDialog, setOpenDrainDialog] = useState(false);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => (row as ColumnData).metadata?.uid,
    state: {
      sorting,
      rowSelection,
    },
  });
  const tableRows = table
    .getSelectedRowModel()
    .rows.filter((x) => (x.original as ColumnData)?.metadata);
  return (
    <Table>
      <TableHeader className="text-xs">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody className="text-xs">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
              {row.getVisibleCells().map((cell, i) =>
                menuDisabled ? (
                  <TableCell
                    className={cell.column.columnDef.meta?.className as string}
                    key={i}
                    onDoubleClick={() => openResource(doubleClickDisabled, cell, navigate)}
                    onClick={row.getToggleSelectedHandler()}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ) : (
                  <ResourceMenu
                    apiResource={apiResource}
                    key={i}
                    table={table}
                    setOpenDeleteDialog={setOpenDeleteDialog}
                    setOpenScaleDialog={setOpenScaleDialog}
                    setOpenDrainDialog={setOpenDrainDialog}
                    setOpenCordonDialog={setOpenCordonDialog}
                    obj={cell.row.original}
                    kind={kind}
                  >
                    <TableCell
                      className={cell.column.columnDef.meta?.className as string}
                      onDoubleClick={() => openResource(doubleClickDisabled, cell, navigate)}
                      onClick={row.getToggleSelectedHandler()}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  </ResourceMenu>
                ),
              )}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              {noResult ? 'No results' : <></>}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
      {tableRows.length > 0 && (
        <DeleteDialog
          apiResource={apiResource}
          kind={kind}
          rows={tableRows}
          open={openDeleteDialog}
          setOpenDialog={setOpenDeleteDialog}
        />
      )}
      {(kind === 'Deployment' || kind === 'ReplicaSet') && tableRows.length === 1 && (
        <ScaleDialog
          apiResource={apiResource}
          kind={kind}
          rows={tableRows}
          open={openScaleDialog}
          setOpenDialog={setOpenScaleDialog}
        />
      )}
      {kind === 'Node' && tableRows.length > 0 && (
        <>
          <DrainDialog rows={tableRows} open={openDrainDialog} setOpenDialog={setOpenDrainDialog} />
          <CordonDialog
            apiResource={apiResource}
            kind={kind}
            rows={tableRows}
            open={openCordonDialog}
            setOpenDialog={setOpenCordonDialog}
          />
        </>
      )}
    </Table>
  );
}

function openResource(doubleClickDisabled: boolean, cell: any, navigate: any) {
  if (doubleClickDisabled) return;
  if (cell.row.original?.hasOwnProperty('chart')) {
    navigate(
      `/helm/${(cell.row.original as HelmRelease)?.name}/${(cell.row.original as HelmRelease)?.namespace}`,
    );
    return;
  }

  const group_version = extractGroupVersion((cell.row.original as ColumnData)?.apiVersion);
  let group = group_version[0];
  if (group_version.length === 1) {
    group = '';
  }
  navigate(
    `/yaml/${(cell.row.original as ColumnData).kind}/${(cell.row.original as ColumnData).metadata?.name}/${(cell.row.original as ColumnData).metadata?.namespace ?? 'empty'}?group=${group}`,
  );
}
