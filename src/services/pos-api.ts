import { pickHttpErrorText } from "@/lib/http-error-text";
import type { PosSalesCreateResponse, PosSalesSubmitBody } from "@/types/docs-sales-submit";
import type {
  PosClient,
  PosConnectionResult,
  PosProduct,
  PosWorkspaceCatalog,
} from "@/types/pos";

async function readJsonError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as unknown;
    return pickHttpErrorText(j) ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function connectPos(integrationToken: string): Promise<PosConnectionResult> {
  const res = await fetch("/api/pos/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: integrationToken }),
  });
  if (!res.ok) {
    throw new Error(await readJsonError(res));
  }
  return res.json() as Promise<PosConnectionResult>;
}

export async function fetchPosWorkspaceCatalog(
  bearerToken: string,
): Promise<PosWorkspaceCatalog> {
  const res = await fetch("/api/pos/workspace", {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  if (!res.ok) {
    throw new Error(await readJsonError(res));
  }
  return res.json() as Promise<PosWorkspaceCatalog>;
}

export async function fetchPosNomenclatureSearch(
  bearerToken: string,
  query: string,
  init?: RequestInit,
): Promise<PosProduct[]> {
  const sp = new URLSearchParams();
  sp.set("q", query.trim());
  const res = await fetch(`/api/pos/nomenclature-search?${sp.toString()}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...Object.fromEntries(new Headers(init?.headers).entries()),
      Authorization: `Bearer ${bearerToken}`,
    },
  });
  if (!res.ok) {
    throw new Error(await readJsonError(res));
  }
  return res.json() as Promise<PosProduct[]>;
}

export async function fetchPosContragentsSearch(
  bearerToken: string,
  phone: string,
  init?: RequestInit,
): Promise<PosClient[]> {
  const sp = new URLSearchParams();
  sp.set("phone", phone.trim());
  const res = await fetch(`/api/pos/contragents-search?${sp.toString()}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...Object.fromEntries(new Headers(init?.headers).entries()),
      Authorization: `Bearer ${bearerToken}`,
    },
  });
  if (!res.ok) {
    throw new Error(await readJsonError(res));
  }
  return res.json() as Promise<PosClient[]>;
}

export async function submitPosSale(
  bearerToken: string,
  body: PosSalesSubmitBody,
): Promise<PosSalesCreateResponse> {
  const res = await fetch("/api/pos/sales", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readJsonError(res));
  }
  return res.json() as Promise<PosSalesCreateResponse>;
}
