import { getBearerTokenFromRequest } from "@/lib/server/bearer-token";
import { searchContragentsByPhone } from "@/lib/server/tablecrm-api";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        {
          message: "Нет токена авторизации",
          hint: "Нужен заголовок Authorization: Bearer <интеграционный токен TableCRM> и query phone, например ?phone=79001234567. В адресной строке браузера заголовок не передать — используйте curl или вкладку Network в DevTools после входа в POS.",
        },
        { status: 401 },
      );
    }
    const url = new URL(req.url);
    const phone = (url.searchParams.get("phone") ?? "").trim();
    if (!phone) {
      return NextResponse.json([]);
    }
    const clients = await searchContragentsByPhone(token, { phone });
    return NextResponse.json(clients);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка поиска контрагентов";
    return NextResponse.json({ message }, { status: 502 });
  }
}
