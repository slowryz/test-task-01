import type { SaleSubmitMode } from "@/components/footer/footer";
import { formatRub } from "@/lib/format-money";
import { submitPosSale } from "@/services/pos-api";
import { toast } from "sonner";
import type { SaleParams } from "@/types/sale-workspace";
import type {
  PosConnectionResult,
  PosProduct,
  PosWorkspaceCatalog,
} from "@/types/pos";
import { create } from "zustand";

const emptySaleParams: SaleParams = {
  organizationId: "",
  accountId: "",
  warehouseId: "",
  priceTypeId: "",
};

type PosWorkspaceState = {
  connection: PosConnectionResult | null;
  workspaceCatalog: PosWorkspaceCatalog | null;
  selectedClientId: string | null;
  saleParams: SaleParams;
  quantities: Record<string, number>;
  saleComment: string;
  mergedProducts: PosProduct[];
  submitLoading: SaleSubmitMode | null;
};

type PosWorkspaceActions = {
  beginNewSession: () => void;
  setConnection: (result: PosConnectionResult | null) => void;
  hydrateFromCatalog: (catalog: PosWorkspaceCatalog) => void;
  clearWorkspaceCatalog: () => void;
  setSelectedClientId: (id: string | null) => void;
  patchSaleParams: (patch: Partial<SaleParams>) => void;
  adjustQuantity: (productId: string, delta: number) => void;
  setSaleComment: (value: string) => void;
  setMergedProducts: (products: PosProduct[]) => void;
  submitSale: (mode: SaleSubmitMode) => Promise<void>;
};

export type PosWorkspaceStore = PosWorkspaceState & PosWorkspaceActions;

function computeTotalRub(
  mergedProducts: PosProduct[],
  quantities: Record<string, number>,
): number {
  const byId = new Map(mergedProducts.map((p) => [p.id, p]));
  let sum = 0;
  for (const [id, q] of Object.entries(quantities)) {
    if (q <= 0) {
      continue;
    }
    const p = byId.get(id);
    if (p) {
      sum += p.priceRub * q;
    }
  }
  return sum;
}

export function selectPosTotalRub(s: PosWorkspaceState): number {
  return computeTotalRub(s.mergedProducts, s.quantities);
}

export function selectPosCanSubmit(s: PosWorkspaceState): boolean {
  const total = selectPosTotalRub(s);
  if (!s.selectedClientId || total <= 0) {
    return false;
  }
  const p = s.saleParams;
  return Boolean(
    p.organizationId.trim() &&
      p.accountId.trim() &&
      p.warehouseId.trim() &&
      p.priceTypeId.trim(),
  );
}

export const usePosWorkspaceStore = create<PosWorkspaceStore>((set, get) => ({
  connection: null,
  workspaceCatalog: null,
  selectedClientId: null,
  saleParams: { ...emptySaleParams },
  quantities: {},
  saleComment: "",
  mergedProducts: [],
  submitLoading: null,

  beginNewSession: () =>
    set({
      workspaceCatalog: null,
      mergedProducts: [],
      saleParams: { ...emptySaleParams },
      quantities: {},
      saleComment: "",
      selectedClientId: null,
      submitLoading: null,
    }),

  setConnection: (result) => set({ connection: result }),

  hydrateFromCatalog: (catalog) =>
    set((s) => {
      const stillValid =
        s.selectedClientId != null &&
        catalog.clients.some((c) => c.id === s.selectedClientId);
      return {
        workspaceCatalog: catalog,
        mergedProducts: catalog.products,
        selectedClientId: stillValid
          ? s.selectedClientId
          : (catalog.clients[0]?.id ?? null),
      };
    }),

  clearWorkspaceCatalog: () =>
    set({ workspaceCatalog: null, mergedProducts: [] }),

  setSelectedClientId: (id) => set({ selectedClientId: id }),

  patchSaleParams: (patch) =>
    set((s) => ({
      saleParams: { ...s.saleParams, ...patch },
    })),

  adjustQuantity: (productId, delta) =>
    set((s) => {
      const next = Math.max(0, (s.quantities[productId] ?? 0) + delta);
      if (next === 0) {
        const rest = { ...s.quantities };
        delete rest[productId];
        return { quantities: rest };
      }
      return { quantities: { ...s.quantities, [productId]: next } };
    }),

  setSaleComment: (value) => set({ saleComment: value }),

  setMergedProducts: (products) => set({ mergedProducts: products }),

  submitSale: async (mode) => {
    const {
      connection,
      selectedClientId,
      saleParams,
      quantities,
      mergedProducts,
      saleComment,
    } = get();
    const token = connection?.bearerToken;
    const can = selectPosCanSubmit(get());
    if (!token || !selectedClientId || !can) {
      return;
    }
    set({ submitLoading: mode });
    try {
      const lines = Object.entries(quantities)
        .filter(([, q]) => q > 0)
        .map(([id, qty]) => {
          const pr = mergedProducts.find((p) => p.id === id);
          if (!pr) {
            throw new Error(
              "В корзине есть товар без данных — добавьте его из каталога или поиска",
            );
          }
          return {
            nomenclatureId: id,
            priceRub: pr.priceRub,
            quantity: qty,
          };
        });
      const saleResponse = await submitPosSale(token, {
        generateOut: mode === "create_and_post",
        contragentId: selectedClientId,
        saleParams,
        lines,
        comment: saleComment.trim() || undefined,
        loyaltyCardId: null,
      });
      const okMessage =
        mode === "create_and_post"
          ? "Заказ отправлен (проведение)"
          : "Заказ создан";
      const { orderId, orderSum } = saleResponse;
      const sonnerDescription =
        typeof orderId === "number" &&
        typeof orderSum === "number" &&
        Number.isFinite(orderId) &&
        Number.isFinite(orderSum)
          ? `Заказ №${orderId}, сумма ${formatRub(orderSum)} ₽`
          : undefined;
      toast.success(
        okMessage,
        sonnerDescription ? { description: sonnerDescription } : undefined,
      );
      set({ quantities: {} });
    } catch (e) {
      const errMessage =
        e instanceof Error ? e.message : "Не удалось создать заказ";
      toast.error(errMessage);
    } finally {
      set({ submitLoading: null });
    }
  },
}));
