"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export function useMediaQuery(query: string, serverDefault = false) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverDefault,
  );
}

export const useIsMobile = () => useMediaQuery("(max-width: 639px)");

export function useDebounced<T>(value: T, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return v;
}

const noopSubscribe = () => () => {};

export const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

export function useIsMac() {
  return useSyncExternalStore(
    () => () => {},
    () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
    () => false,
  );
}
