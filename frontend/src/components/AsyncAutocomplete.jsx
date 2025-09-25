// frontend/src/components/AsyncAutocomplete.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, CircularProgress, IconButton, TextField } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

const DEFAULT_LIMIT = 20;

export default function AsyncAutocomplete({
  label = '',
  value,
  onChange,
  fetchPage, // async ({ q, page, limit }) => { items:[{id,label,...}], hasMore:boolean }
  getOptionLabel = (opt) => opt?.label ?? '',
  isOptionEqualToValue = (a, b) => String(a?.id ?? '') === String(b?.id ?? ''),
  placeholder = 'Buscar...',
  disabled = false,
  limit = DEFAULT_LIMIT,
  initialQuery = '',
  noOptionsText = 'Sin resultados',
  loadingText = 'Buscando…',
  popupMinWidth = 360,
  renderOption, // opcional: (props, option) => ReactNode
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(initialQuery); // <-- visible en la caja
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const resetAndLoad = async (query) => {
    setItems([]);
    setPage(1);
    await load({ q: query, page: 1 });
  };

  const load = async ({ q, page }) => {
    setLoading(true);
    try {
      const res = await fetchPage({ q, page, limit });
      const nextItems = Array.isArray(res?.items) ? res.items : [];
      setItems((prev) => (page === 1 ? nextItems : [...prev, ...nextItems]));
      setHasMore(Boolean(res?.hasMore));
    } finally {
      setLoading(false);
    }
  };

  // Al abrir: carga la lista inicial (q vacía)
  useEffect(() => {
    if (!open) return;
    resetAndLoad('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Debounce de búsqueda
  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => resetAndLoad(inputValue.trim()), 250);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const onListboxScroll = (e) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    if (nearBottom && !loading && hasMore) {
      const next = page + 1;
      setPage(next);
      load({ q: inputValue.trim(), page: next });
    }
  };

  const handleClear = (e) => {
    e?.stopPropagation?.();
    setInputValue('');
    // si estaba seleccionado algo, mantenemos el value; esto solo limpia la búsqueda
    resetAndLoad('');
  };

  const options = useMemo(() => items, [items]);

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value || null}
      onChange={(_, val) => onChange?.(val)}
      inputValue={inputValue}
      onInputChange={(_, val) => setInputValue(val)}
      isOptionEqualToValue={isOptionEqualToValue}
      getOptionLabel={getOptionLabel}
      options={options}
      loading={loading}
      disabled={disabled}
      noOptionsText={noOptionsText}
      loadingText={loadingText}
      disableClearable // usamos nuestro “clear” custom que también reinicia resultados
      slotProps={{
        paper: { sx: { minWidth: popupMinWidth } },
      }}
      ListboxProps={{
        onScroll: onListboxScroll,
        sx: { maxHeight: 280, overflow: 'auto' },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {inputValue ? (
                  <IconButton
                    size="small"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleClear}
                    aria-label="Limpiar"
                    sx={{ mr: 0.5 }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                ) : null}
                {loading ? <CircularProgress size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={
        renderOption
          ? renderOption
          : (props, opt) => (
              <li {...props} key={opt.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {opt.label}
                </span>
                {opt.precio_venta != null && (
                  <span style={{ opacity: 0.8, fontVariantNumeric: 'tabular-nums' }}>
                    ${Number(opt.precio_venta).toFixed(2)}
                  </span>
                )}
              </li>
            )
      }
    />
  );
}
