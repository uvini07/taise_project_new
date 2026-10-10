import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Executa uma função assíncrona e devolve { data, error, loading, reload, setData }.
 * Ignora respostas antigas se as dependências mudarem no meio do caminho.
 */
export function useAsync(fn, deps = [], { immediate = true } = {}) {
  const [state, setState] = useState({ data: undefined, error: null, loading: immediate });
  const callId = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    const id = ++callId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (id === callId.current) setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      console.error(error);
      if (id === callId.current) setState((s) => ({ ...s, error, loading: false }));
      return undefined;
    }
  }, []);

  useEffect(() => { if (immediate) run(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, deps);

  const setData = useCallback((updater) => setState((s) => ({
    ...s, data: typeof updater === "function" ? updater(s.data) : updater,
  })), []);

  return { ...state, reload: run, setData };
}
