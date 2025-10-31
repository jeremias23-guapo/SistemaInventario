import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  TableContainer,
  TableFooter,
  TablePagination,
  Skeleton,
} from '@mui/material';
import { Visibility, Edit, Delete } from '@mui/icons-material';

export default function DataTable({
  rows,
  columns,
  onView,
  onEdit,
  onDelete,
  actionGuard, // 👈 usado ahora
  showActions = true,
  pagination,
  loading = false,
  rowKey = (row) => row.id ?? JSON.stringify(row),
  maxHeight = 560,
  stickyActionsRight = true,
}) {
  const safeRows = Array.isArray(rows) ? rows : [];

  const derivedColumns = safeRows.length
    ? Object.keys(safeRows[0]).map((key) => ({ Header: key, accessor: key }))
    : [];

  const cols = Array.isArray(columns) && columns.length ? columns : derivedColumns;
  const hasAnyAction = Boolean(onView || onEdit || onDelete);
  const showActionsCol = showActions && hasAnyAction;

  const hasPagination = Boolean(pagination && pagination.total != null);
  const page0 = hasPagination ? Math.max(0, (pagination.page || 1) - 1) : 0;
  const pageSize = hasPagination ? (pagination.pageSize || 50) : 50;
  const total = hasPagination ? (pagination.total || 0) : 0;

  const handleChangePage = (_evt, newPage0) => {
    pagination?.onPageChange?.(newPage0 + 1);
  };

  const stickyCellSx = (col, side = 'left', isHeader = false) =>
    col?.sticky === side
      ? {
          position: 'sticky',
          [side]: col?.stickyOffset ?? 0,
          backgroundColor: (t) =>
            isHeader ? t.palette.background.default : t.palette.background.paper,
          zIndex: isHeader ? 6 : 5,
          borderRight:
            side === 'left' ? (t) => `1px solid ${t.palette.divider}` : undefined,
          borderLeft:
            side === 'right' ? (t) => `1px solid ${t.palette.divider}` : undefined,
          backdropFilter: 'blur(4px)',
        }
      : {};

  const actionsStickySx = stickyActionsRight
    ? {
        position: 'sticky',
        right: 0,
        backgroundColor: (t) => t.palette.background.paper,
        zIndex: 5,
        boxShadow: '-2px 0 2px -1px rgba(0,0,0,0.08)',
      }
    : {};

  return (
    <TableContainer
      sx={{
        position: 'relative',
        maxHeight,
        overflow: 'auto',
        borderRadius: 2,
        border: (t) => `1px solid ${t.palette.divider}`,
        scrollBehavior: 'smooth',
        '& thead': {
          backgroundColor: (t) => t.palette.background.default,
        },
      }}
    >
      <Table
        stickyHeader
        size="small"
        sx={{
          position: 'relative',
          minWidth: 'max-content',
          tableLayout: 'auto',
          '& thead th': {
            fontWeight: 700,
            whiteSpace: 'nowrap',
            zIndex: 6,
          },
          '& tbody tr:hover': { bgcolor: (t) => t.palette.action.hover },
        }}
      >
        <TableHead>
          <TableRow>
            {cols.map((col) => (
              <TableCell key={col.Header} align={col.align || 'left'}>
                {col.Header}
              </TableCell>
            ))}
            {showActionsCol && (
              <TableCell align="center" sx={{ fontWeight: 700, ...actionsStickySx }}>
                Acciones
              </TableCell>
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {loading &&
            Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {cols.map((col) => (
                  <TableCell key={`${col.Header}-${i}`}>
                    <Skeleton />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!loading &&
            safeRows.map((row) => {
              const can = actionGuard ? actionGuard(row) : { view: true, edit: true, delete: true };

              return (
                <TableRow key={rowKey(row)} hover>
                  {cols.map((col) => {
                    const value =
                      typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
                    return (
                      <TableCell key={col.Header} align={col.align || 'left'}>
                        {value ?? ''}
                      </TableCell>
                    );
                  })}

                  {showActionsCol && (
                    <TableCell align="center" sx={actionsStickySx}>
                      {onView && can.view && (
                        <IconButton size="small" onClick={() => onView(row)}>
                          <Visibility fontSize="inherit" />
                        </IconButton>
                      )}
                      {onEdit && can.edit && (
                        <IconButton size="small" onClick={() => onEdit(row)}>
                          <Edit fontSize="inherit" />
                        </IconButton>
                      )}
                      {onDelete && can.delete && (
                        <IconButton size="small" onClick={() => onDelete(row)}>
                          <Delete fontSize="inherit" />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}

          {!loading && safeRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={cols.length + (showActionsCol ? 1 : 0)} align="center">
                No hay datos para mostrar.
              </TableCell>
            </TableRow>
          )}
        </TableBody>

        {hasPagination && (
          <TableFooter>
            <TableRow>
              <TablePagination
                count={total}
                page={page0}
                onPageChange={handleChangePage}
                rowsPerPage={pageSize}
                rowsPerPageOptions={[pageSize]}
              />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  );
}

DataTable.propTypes = {
  actionGuard: PropTypes.func,
};
