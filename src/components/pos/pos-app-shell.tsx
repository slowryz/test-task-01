"use client";

import { ConnectShop } from "@/components/connect/connect-shop";
import type { SaleSubmitMode } from "@/components/footer/footer";
import { Footer } from "@/components/footer/footer";
import { Button } from "@/components/ui/button";
import { usePosWorkspaceCatalog } from "@/hooks/use-pos-workspace-catalog";
import {
  selectPosCanSubmit,
  selectPosTotalRub,
  usePosWorkspaceStore,
} from "@/stores/pos-workspace-store";
import type { PosConnectionResult } from "@/types/pos";
import { useCallback, useLayoutEffect } from "react";
import { SaleWorkspace } from "./sale-workspace";

export function PosAppShell() {
  const connection = usePosWorkspaceStore((s) => s.connection);
  const workspaceCatalog = usePosWorkspaceStore((s) => s.workspaceCatalog);
  const beginNewSession = usePosWorkspaceStore((s) => s.beginNewSession);
  const setConnection = usePosWorkspaceStore((s) => s.setConnection);
  const hydrateFromCatalog = usePosWorkspaceStore((s) => s.hydrateFromCatalog);

  const totalRub = usePosWorkspaceStore(selectPosTotalRub);
  const canSubmit = usePosWorkspaceStore(selectPosCanSubmit);
  const submitLoading = usePosWorkspaceStore((s) => s.submitLoading);
  const submitSale = usePosWorkspaceStore((s) => s.submitSale);

  const connected = connection !== null;
  const bearerToken = connection?.bearerToken ?? null;

  const {
    data: catalog,
    isPending: catalogLoading,
    isError: catalogError,
    error: catalogErrorObj,
    refetch: refetchCatalog,
  } = usePosWorkspaceCatalog(bearerToken);

  const handleConnection = useCallback(
    async (result: PosConnectionResult): Promise<void> => {
      beginNewSession();
      setConnection(result);
    },
    [beginNewSession, setConnection],
  );

  useLayoutEffect(() => {
    if (!catalog) {
      return;
    }
    hydrateFromCatalog(catalog);
  }, [catalog, hydrateFromCatalog]);

  const catalogSynced =
    Boolean(catalog) &&
    workspaceCatalog != null &&
    workspaceCatalog === catalog;

  const workspaceReady =
    Boolean(catalog) && Boolean(catalogSynced) && !catalogLoading;

  const runSubmit = useCallback(
    (mode: SaleSubmitMode) => void submitSale(mode),
    [submitSale],
  );

  return (
    <>
      {!connected ? (
        <ConnectShop onSession={handleConnection} />
      ) : catalogLoading ? (
        <p className="rounded-xl border border-border/80 bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Загрузка справочников…
        </p>
      ) : catalogError || !catalog ? (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-card px-4 py-6">
          <p className="text-sm font-medium text-destructive">
            {catalogErrorObj?.message ?? "Не удалось загрузить данные"}
          </p>
          <Button type="button" variant="secondary" onClick={() => refetchCatalog()}>
            Повторить
          </Button>
        </div>
      ) : !catalogSynced ? (
        <p className="rounded-xl border border-border/80 bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Подготовка формы…
        </p>
      ) : (
        <SaleWorkspace />
      )}

      {connected && workspaceReady ? (
        <Footer
          totalRub={totalRub}
          canSubmit={canSubmit}
          submitLoading={submitLoading}
          onCreateSale={() => runSubmit("create")}
          onCreateAndPost={() => runSubmit("create_and_post")}
        />
      ) : null}
    </>
  );
}
