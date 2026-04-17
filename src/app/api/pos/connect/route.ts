import { validateTableCrmToken } from "@/lib/server/tablecrm-api";
import type { PosConnectionResult } from "@/types/pos";
import { NextResponse } from "next/server";

function tokenHint(token: string): string {
  const t = token.trim();
  if (t.length <= 8) {
    return t ? "••••" : "";
  }
  return `${t.slice(0, 4)}…${t.slice(-2)}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { token?: unknown };
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json(
        { message: "Введите токен доступа" },
        { status: 400 },
      );
    }
    const { shopName } = await validateTableCrmToken(token);
    const result: PosConnectionResult = {
      session: {
        registerId: "tablecrm",
        shopName,
        tokenHint: tokenHint(token),
      },
      bearerToken: token,
    };
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка подключения";
    return NextResponse.json({ message }, { status: 502 });
  }
}
