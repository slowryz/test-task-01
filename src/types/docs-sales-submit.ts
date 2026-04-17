import type { SaleParams } from "@/types/sale-workspace";

export type PosSaleLineInput = {
  nomenclatureId: string;
  priceRub: number;
  quantity: number;
};

export type PosSalesCreateResponse = {
  ok: boolean;
  result: unknown;
  orderId?: number;
  orderSum?: number;
};

export type PosSalesSubmitBody = {
  generateOut: boolean;
  contragentId: string;
  saleParams: SaleParams;
  lines: PosSaleLineInput[];
  comment?: string;
  loyaltyCardId?: number | null;
};
