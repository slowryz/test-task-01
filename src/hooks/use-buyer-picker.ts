"use client";

import { useDebounce } from "@/lib/hooks/use-debounce";
import { normalizeRussiaPhoneDigits, phoneDigits } from "@/lib/phone-utils";
import { fetchPosContragentsSearch } from "@/services/pos-api";
import type { PosClient } from "@/types/pos";
import { useEffect, useMemo, useState } from "react";

const REMOTE_PHONE_MIN_DIGITS = 3;

type Args = {
  clients: PosClient[];
  selectedClientId: string | null;
  onSelectClient: (id: string | null) => void;
  searchAuthToken: string | null;
  debounceMs?: number;
};

export function useBuyerPicker({
  clients,
  selectedClientId,
  onSelectClient,
  searchAuthToken,
  debounceMs = 300,
}: Args) {
  const [clientPhoneSearch, setClientPhoneSearch] = useState("");
  const debouncedClientPhoneSearch = useDebounce({
    value: clientPhoneSearch,
    delay: debounceMs,
  });

  const [remoteClients, setRemoteClients] = useState<PosClient[] | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const debouncedTrim = debouncedClientPhoneSearch.trim();
  const digits = phoneDigits(debouncedClientPhoneSearch);
  const useRemote =
    digits.length >= REMOTE_PHONE_MIN_DIGITS &&
    Boolean(searchAuthToken?.trim());

  useEffect(() => {
    if (!useRemote || !searchAuthToken?.trim()) {
      queueMicrotask(() => {
        setRemoteClients(null);
        setRemoteLoading(false);
        setRemoteError(null);
      });
      return;
    }

    const ac = new AbortController();
    queueMicrotask(() => {
      setRemoteLoading(true);
      setRemoteError(null);
      setRemoteClients(null);
    });

    void (async () => {
      const digitsOnly = phoneDigits(debouncedClientPhoneSearch);
      const phoneQuery =
        digitsOnly.length > 0
          ? normalizeRussiaPhoneDigits(digitsOnly)
          : debouncedTrim;

      try {
        const rows = await fetchPosContragentsSearch(
          searchAuthToken.trim(),
          phoneQuery,
          { signal: ac.signal },
        );
        if (ac.signal.aborted) {
          return;
        }
        setRemoteClients(rows);
      } catch (e) {
        if (ac.signal.aborted) {
          return;
        }
        setRemoteClients(null);
        setRemoteError(e instanceof Error ? e.message : "Ошибка поиска");
      } finally {
        if (!ac.signal.aborted) {
          setRemoteLoading(false);
        }
      }
    })();

    return () => ac.abort();
  }, [
    debouncedClientPhoneSearch,
    debouncedTrim,
    searchAuthToken,
    useRemote,
  ]);

  const filteredClients = useMemo(() => {
    if (useRemote) {
      if (remoteClients !== null) {
        return remoteClients;
      }
      return [];
    }
    const d = phoneDigits(debouncedClientPhoneSearch);
    if (!d) {
      return [...clients];
    }
    return clients.filter((c) => phoneDigits(c.phone).includes(d));
  }, [
    clients,
    debouncedClientPhoneSearch,
    remoteClients,
    useRemote,
  ]);

  useEffect(() => {
    if (useRemote && remoteLoading) {
      return;
    }
    if (
      selectedClientId != null &&
      !filteredClients.some((c) => c.id === selectedClientId)
    ) {
      onSelectClient(null);
    }
  }, [
    filteredClients,
    onSelectClient,
    remoteLoading,
    selectedClientId,
    useRemote,
  ]);

  return {
    clientPhoneSearch,
    setClientPhoneSearch,
    debouncedClientPhoneSearch,
    filteredClients,
    buyerSearchLoading: useRemote && remoteLoading,
    buyerSearchError: useRemote ? remoteError : null,
  };
}
