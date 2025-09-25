// para manejo global de estado de carga (loading)
import { createContext, useContext, useMemo, useState, useCallback } from "react";

const LoadingContext = createContext({ start: () => {}, stop: () => {}, active: false });

export const LoadingProvider = ({ children }) => {
  // contador para manejar cargas concurrentes (evita parpadeos)
  const [count, setCount] = useState(0);

  const start = useCallback(() => setCount(c => c + 1), []);
  const stop  = useCallback(() => setCount(c => Math.max(0, c - 1)), []);

  const value = useMemo(() => ({ start, stop, active: count > 0 }), [start, stop, count]);

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};

export const useLoading = () => useContext(LoadingContext);
