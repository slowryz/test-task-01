"use client";

import { useDebounce } from "@/lib/hooks/use-debounce";
import { fetchPosNomenclatureSearch } from "@/services/pos-api";
import type { PosProduct } from "@/types/pos";
import { useEffect, useMemo, useState } from "react";

const REMOTE_QUERY_MIN_LEN = 2;

function matchesProductQuery(p: PosProduct, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return (
    p.name.toLowerCase().includes(needle) ||
    p.sku.toLowerCase().includes(needle)
  );
}

type Args = {
  products: PosProduct[];
  searchAuthToken: string | null;
  debounceMs?: number;
  remoteQueryMinLen?: number;
};

export function useProductPicker({
  products,
  searchAuthToken,
  debounceMs = 300,
  remoteQueryMinLen = REMOTE_QUERY_MIN_LEN,
}: Args) {
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounce({
    value: productSearch,
    delay: debounceMs,
  });

  const [remoteRows, setRemoteRows] = useState<PosProduct[] | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [extrasById, setExtrasById] = useState<Record<string, PosProduct>>({});

  const debouncedTrim = debouncedProductSearch.trim();
  const useRemote =
    debouncedTrim.length >= remoteQueryMinLen &&
    Boolean(searchAuthToken?.trim());

  useEffect(() => {
    queueMicrotask(() => {
      setExtrasById({});
    });
  }, [products, searchAuthToken]);

  useEffect(() => {
    if (!useRemote || !searchAuthToken?.trim()) {
      queueMicrotask(() => {
        setRemoteRows(null);
        setRemoteLoading(false);
        setRemoteError(null);
      });
      return;
    }

    const ac = new AbortController();
    queueMicrotask(() => {
      setRemoteLoading(true);
      setRemoteError(null);
      setRemoteRows(null);
    });

    void (async () => {
      try {
        const rows = await fetchPosNomenclatureSearch(
          searchAuthToken.trim(),
          debouncedTrim,
          { signal: ac.signal },
        );
        if (ac.signal.aborted) {
          return;
        }
        const refined = rows.filter((p) => matchesProductQuery(p, debouncedTrim));
        setRemoteRows(refined);
        setExtrasById((prev) => {
          const next = { ...prev };
          for (const p of rows) {
            next[p.id] = p;
          }
          return next;
        });
      } catch (e) {
        if (ac.signal.aborted) {
          return;
        }
        setRemoteRows(null);
        setRemoteError(e instanceof Error ? e.message : "Ошибка поиска");
      } finally {
        if (!ac.signal.aborted) {
          setRemoteLoading(false);
        }
      }
    })();

    return () => ac.abort();
  }, [debouncedTrim, searchAuthToken, useRemote]);

  const filteredProducts = useMemo(() => {
    if (!useRemote) {
      return products.filter((p) =>
        matchesProductQuery(p, debouncedProductSearch),
      );
    }
    if (remoteRows !== null) {
      return remoteRows;
    }
    return [];
  }, [
    debouncedProductSearch,
    products,
    remoteRows,
    useRemote,
  ]);

  const mergedProducts = useMemo(() => {
    const byId = new Map<string, PosProduct>();
    for (const p of products) {
      byId.set(p.id, p);
    }
    for (const p of Object.values(extrasById)) {
      byId.set(p.id, p);
    }
    return Array.from(byId.values());
  }, [extrasById, products]);

  return {
    productSearch,
    setProductSearch,
    debouncedProductSearch,
    filteredProducts,
    mergedProducts,
    productSearchLoading: useRemote && remoteLoading,
    productSearchError: useRemote ? remoteError : null,
  };
}
