// contexts/LoadingContext.jsx
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const Ctx = createContext({ active:false, start:()=>{}, stop:()=>{}, withLoader: async (fn)=>await fn() });

export function LoadingProvider({ children }) {
  const [count, setCount] = useState(0);
  const idRef = useRef(0); // sólo para depurar si quieres

  const start = useCallback(() => {
    idRef.current++;
    setCount(c => c + 1);
    return idRef.current;   // opcional: token de depuración
  }, []);

  const stop = useCallback(() => {
    setCount(c => Math.max(0, c - 1));  // nunca baja de 0
  }, []);

  // Helper: envuelve una promesa y balancea solo
  const withLoader = useCallback(async (thunkOrPromise) => {
    start();
    try {
      const p = typeof thunkOrPromise === "function" ? thunkOrPromise() : thunkOrPromise;
      return await p;
    } finally {
      stop();
    }
  }, [start, stop]);

  const value = useMemo(() => ({
    active: count > 0,
    start, stop, withLoader
  }), [count, start, stop, withLoader]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLoading = () => useContext(Ctx);
