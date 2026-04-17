import { getBearerTokenFromRequest } from "@/lib/server/bearer-token";
import { buildDocsSalesCreateMass } from "@/lib/server/build-docs-sales";
import { postTableCrmDocsSales } from "@/lib/server/tablecrm-api";
import type { PosSalesCreateResponse, PosSalesSubmitBody } from "@/types/docs-sales-submit";
import type { SaleParams } from "@/types/sale-workspace";
import { NextResponse } from "next/server";

function isPosSalesBody(x: unknown): x is PosSalesSubmitBody {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (
    typeof o.generateOut !== "boolean" ||
    typeof o.contragentId !== "string" ||
    o.saleParams == null ||
    typeof o.saleParams !== "object" ||
    !Array.isArray(o.lines)
  ) {
    return false;
  }
  return o.lines.every((row) => {
    if (row == null || typeof row !== "object") return false;
    const r = row as Record<string, unknown>;
    return (
      typeof r.nomenclatureId === "string" &&
      typeof r.priceRub === "number" &&
      typeof r.quantity === "number"
    );
  });
}

export async function POST(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ message: "Нет токена авторизации" }, { status: 401 });
    }
    const raw = (await req.json()) as unknown;
    if (!isPosSalesBody(raw)) {
      return NextResponse.json({ message: "Некорректное тело запроса" }, { status: 400 });
    }

    const paidRubles = Math.round(
      raw.lines.reduce(
        (s, line) => s + Math.round(line.priceRub) * line.quantity,
        0,
      ),
    );

    const mass = buildDocsSalesCreateMass({
      saleParams: raw.saleParams as SaleParams,
      contragentId: raw.contragentId,
      lines: raw.lines,
      paidRubles,
      comment: typeof raw.comment === "string" ? raw.comment : undefined,
      loyaltyCardId:
        raw.loyaltyCardId === null || raw.loyaltyCardId === undefined
          ? null
          : typeof raw.loyaltyCardId === "number"
            ? raw.loyaltyCardId
            : null,
    });

    const upstream = await postTableCrmDocsSales(token, mass, raw.generateOut);

    let ok = true;
    let result: unknown = upstream;
    if (
      upstream !== null &&
      typeof upstream === "object" &&
      !Array.isArray(upstream) &&
      "result" in upstream
    ) {
      const u = upstream as Record<string, unknown>;
      ok = u.ok === true;
      result = u.result;
    }

    const list = Array.isArray(result) ? result : [];
    const head = list[0];
    let orderId: number | undefined;
    let orderSum: number | undefined;
    if (head && typeof head === "object") {
      const r = head as Record<string, unknown>;
      if (typeof r.id === "number") orderId = r.id;
      if (typeof r.sum === "number") orderSum = r.sum;
    }

    const payload: PosSalesCreateResponse = {
      ok,
      result,
      ...(orderId !== undefined && orderSum !== undefined
        ? { orderId, orderSum }
        : {}),
    };
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка создания продажи";
    return NextResponse.json({ message }, { status: 502 });
  }
}
