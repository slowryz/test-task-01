import { getBearerTokenFromRequest } from "@/lib/server/bearer-token";
import { searchNomenclatureByQuery } from "@/lib/server/tablecrm-api";
import { NextResponse } from "next/server";

const MIN_QUERY_LEN = 2;

function looksLikeBarcode(q: string): boolean {
  return /^\d{8,}$/.test(q.trim());
}

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ message: "Нет токена авторизации" }, { status: 401 });
    }
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    if (q.length < MIN_QUERY_LEN) {
      return NextResponse.json([]);
    }
    const barcode = looksLikeBarcode(q) ? q : undefined;
    const name = barcode ? undefined : q;
    const products = await searchNomenclatureByQuery(token, {
      name,
      barcode,
    });
    return NextResponse.json(products);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка поиска номенклатуры";
    return NextResponse.json({ message }, { status: 502 });
  }
}
