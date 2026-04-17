import type { SaleParams } from "@/types/sale-workspace";
import type { PosSaleLineInput } from "@/types/docs-sales-submit";

const DEFAULT_GOODS_UNIT = Number.parseInt(
  process.env.TABLECRM_DEFAULT_GOODS_UNIT ?? "116",
  10,
);

function requireInt(label: string, raw: string): number {
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n)) {
    throw new Error(`Укажите поле: ${label}`);
  }
  return n;
}

export function buildDocsSalesCreateMass(input: {
  saleParams: SaleParams;
  contragentId: string;
  lines: PosSaleLineInput[];
  paidRubles: number;
  comment?: string;
  loyaltyCardId?: number | null;
  dated?: number;
}): unknown[] {
  if (input.lines.length === 0) {
    throw new Error("Добавьте товары в корзину");
  }

  const organization = requireInt("организацию", input.saleParams.organizationId);
  const warehouse = requireInt("склад", input.saleParams.warehouseId);
  const paybox = requireInt("счёт (paybox)", input.saleParams.accountId);
  const contragent = requireInt("покупателя", input.contragentId);
  requireInt("тип цены", input.saleParams.priceTypeId);

  const unit = Number.isFinite(DEFAULT_GOODS_UNIT) ? DEFAULT_GOODS_UNIT : 116;

  let sumLines = 0;
  const goods = input.lines.map((line) => {
    const nom = Number.parseInt(String(line.nomenclatureId).trim(), 10);
    const qty = Math.floor(line.quantity);
    if (!Number.isFinite(nom) || qty <= 0) {
      throw new Error("Некорректная строка корзины");
    }
    const price = Math.round(line.priceRub);
    if (price < 0 || !Number.isFinite(price)) {
      throw new Error("Некорректная цена");
    }
    sumLines += price * qty;
    const row: Record<string, unknown> = {
      price,
      quantity: qty,
      unit,
      discount: 0,
      sum_discounted: 0,
      nomenclature: nom,
    };
    return row;
  });

  const paid = Math.round(input.paidRubles);
  if (Math.abs(sumLines - paid) > 1) {
    throw new Error("Сумма оплаты не совпадает с корзиной");
  }

  const entry: Record<string, unknown> = {
    priority: 0,
    dated: input.dated ?? Math.floor(Date.now() / 1000),
    operation: "Заказ",
    tax_included: true,
    tax_active: true,
    goods,
    settings: {},
    warehouse,
    contragent,
    paybox,
    organization,
    status: false,
    paid_rubles: paid,
    paid_lt: 0,
  };

  if (input.comment?.trim()) {
    entry.comment = input.comment.trim();
  }

  if (
    input.loyaltyCardId != null &&
    typeof input.loyaltyCardId === "number" &&
    Number.isFinite(input.loyaltyCardId)
  ) {
    entry.loyality_card_id = input.loyaltyCardId;
  }

  return [entry];
}
