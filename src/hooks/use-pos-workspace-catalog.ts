"use client";

import { fetchPosWorkspaceCatalog } from "@/services/pos-api";
import type { PosWorkspaceCatalog } from "@/types/pos";
import { useQuery } from "@tanstack/react-query";

export function usePosWorkspaceCatalog(bearerToken: string | null) {
  return useQuery<PosWorkspaceCatalog, Error>({
    queryKey: ["pos-workspace", bearerToken],
    queryFn: () => fetchPosWorkspaceCatalog(bearerToken!),
    enabled: Boolean(bearerToken?.length),
  });
}
