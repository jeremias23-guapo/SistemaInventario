// frontend/src/components/DataTable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Paper,
  TableContainer,
  TableFooter,
  TablePagination
} from '@mui/material';
import { Visibility, Edit, Delete } from '@mui/icons-material';

/**
 * DataTable component:
 *  - rows: array de objetos
 *  - columns: [{ Header, accessor }]
 *  - onView, onEdit, onDelete: callbacks(row)
 *  - actionGuard: { isAdmin: bool, isLocked: fn(row) }
 *  - showActions: bool (default true)
 *  - pagination: { page (1-based), pageSize, total, onPageChange }
 */
export default function DataTable({
  rows,
  columns,
  onView,
  onEdit,
  onDelete,
  actionGuard,
  showActions = true,
  pagination
}) {
  const safeRows = Array.isArray(rows) ? rows : [];

  const derivedColumns = safeRows.length
    ? Object.keys(safeRows[0]).map(key => ({ Header: key, accessor: key }))
    : [];

  const cols = Array.isArray(columns) && columns.length ? columns : derivedColumns;

  const hasAnyAction = Boolean(onView || onEdit || onDelete);
  const showActionsCol = showActions && hasAnyAction;

  // Paginación (1-based externo -> 0-based para MUI)
  const hasPagination = Boolean(pagination && pagination.total != null);
  const page0 = hasPagination ? Math.max(0, (pagination.page || 1) - 1) : 0;
  const pageSize = hasPagination ? (pagination.pageSize || 50) : 50;
  const total = hasPagination ? (pagination.total || 0) : 0;

  const handleChangePage = (_evt, newPage0) => {
    pagination?.onPageChange?.(newPage0 + 1); // back a 1-based
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {cols.map(col => (
              <TableCell key={col.Header}>{col.Header}</TableCell>
            ))}
            {showActionsCol && <TableCell align="center"><strong>Acciones</strong></TableCell>}
          </TableRow>
        </TableHead>

        <TableBody>
          {safeRows.map(row => (
            <TableRow key={row.id ?? JSON.stringify(row)}>
              {cols.map(col => {
                const value = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
                return <TableCell key={col.Header}>{value ?? ''}</TableCell>;
              })}
              {showActionsCol && (
                <TableCell align="center">
                  {onView && (
                    <IconButton size="small" title="Ver detalle" onClick={() => onView(row)}>
                      <Visibility fontSize="inherit" />
                    </IconButton>
                  )}
                  {onEdit && (
                    <IconButton
                      size="small"
                      title="Editar"
                      disabled={actionGuard && !actionGuard.isAdmin && actionGuard.isLocked?.(row)}
                      onClick={() => onEdit(row)}
                    >
                      <Edit fontSize="inherit" />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton
                      size="small"
                      title="Eliminar"
                      disabled={actionGuard && !actionGuard.isAdmin && actionGuard.isLocked?.(row)}
                      onClick={() => onDelete(row)}
                    >
                      <Delete fontSize="inherit" />
                    </IconButton>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}

          {safeRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={cols.length + (showActionsCol ? 1 : 0)} align="center">
                No hay datos.
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
                labelRowsPerPage=""
                component="div"
              />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  );
}

DataTable.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object),
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      Header: PropTypes.string.isRequired,
      accessor: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired
    })
  ),
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  actionGuard: PropTypes.shape({
    isAdmin: PropTypes.bool,
    isLocked: PropTypes.func
  }),
  showActions: PropTypes.bool,
  pagination: PropTypes.shape({
    page: PropTypes.number.isRequired,   // 1-based
    pageSize: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired
  })
};

DataTable.defaultProps = {
  rows: [],
  columns: [],
  onView: null,
  onEdit: null,
  onDelete: null,
  actionGuard: null,
  showActions: true,
  pagination: null
};
