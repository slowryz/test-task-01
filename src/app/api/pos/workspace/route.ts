import { getBearerTokenFromRequest } from "@/lib/server/bearer-token";
import { fetchTableCrmWorkspaceCatalog } from "@/lib/server/tablecrm-api";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ message: "Нет токена авторизации" }, { status: 401 });
    }
    const catalog = await fetchTableCrmWorkspaceCatalog(token);
    return NextResponse.json(catalog);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка загрузки данных";
    return NextResponse.json({ message }, { status: 502 });
  }
}
