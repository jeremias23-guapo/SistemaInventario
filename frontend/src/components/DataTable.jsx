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
  TableContainer
} from '@mui/material';
import { Visibility, Edit, Delete } from '@mui/icons-material';

/**
 * DataTable component acepta:
 *  - rows: array de objetos con datos
 *  - columns: opcional array de { Header: string, accessor: string|function }
 *  - onView, onEdit, onDelete: callbacks(row)
 *  - actionGuard: { isAdmin: bool, isLocked: (row)=>bool } para habilitar/deshabilitar botones
 */
export default function DataTable({
  rows,
  columns,
  onView,
  onEdit,
  onDelete,
  actionGuard
}) {
  const safeRows = Array.isArray(rows) ? rows : [];

  const derivedColumns = safeRows.length
    ? Object.keys(safeRows[0]).map(key => ({ Header: key, accessor: key }))
    : [];

  const cols = Array.isArray(columns) && columns.length ? columns : derivedColumns;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {cols.map(col => (
              <TableCell key={col.Header}>{col.Header}</TableCell>
            ))}
            <TableCell align="center"><strong>Acciones</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {safeRows.map(row => (
            <TableRow key={row.id || JSON.stringify(row)}>
              {cols.map(col => {
                const value =
                  typeof col.accessor === 'function'
                    ? col.accessor(row)
                    : row[col.accessor];
                return <TableCell key={col.Header}>{value ?? ''}</TableCell>;
              })}
              <TableCell align="center">
                {/* Ver */}
                {onView && (
                  <IconButton
                    size="small"
                    title="Ver detalle"
                    onClick={() => onView(row)}
                  >
                    <Visibility fontSize="inherit" />
                  </IconButton>
                )}
                {/* Editar */}
                {onEdit && (
                  <IconButton
                    size="small"
                    title="Editar"
                    disabled={
                      actionGuard &&
                      !actionGuard.isAdmin &&
                      actionGuard.isLocked?.(row)
                    }
                    onClick={() => onEdit(row)}
                  >
                    <Edit fontSize="inherit" />
                  </IconButton>
                )}
                {/* Eliminar */}
                {onDelete && (
                  <IconButton
                    size="small"
                    title="Eliminar"
                    disabled={
                      actionGuard &&
                      !actionGuard.isAdmin &&
                      actionGuard.isLocked?.(row)
                    }
                    onClick={() => onDelete(row)}
                  >
                    <Delete fontSize="inherit" />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
          {safeRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={cols.length + 1} align="center">
                No hay datos.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
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
  })
};

DataTable.defaultProps = {
  rows: [],
  columns: [],
  onView: null,
  onEdit: null,
  onDelete: null,
  actionGuard: null
};
