import { resolveTableCrmBaseUrl, TABLECRM_API_PATHS } from "@/lib/tablecrm-base-url";
import { errorTextFromFetchJsonPayload } from "@/lib/http-error-text";
import { normalizeRussiaPhoneDigits, phoneDigits } from "@/lib/phone-utils";
import type {
  PosClient,
  PosProduct,
  PosWorkspaceCatalog,
  SaleOption,
} from "@/types/pos";

export function getTableCrmBaseUrl(): string {
  return resolveTableCrmBaseUrl();
}

const LIST_FETCH_PAGE_SIZE = 500;

function listPageSize(): number {
  return LIST_FETCH_PAGE_SIZE;
}

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  const fromBody = errorTextFromFetchJsonPayload(text);
  if (fromBody) {
    return fromBody;
  }
  return text.trim() || res.statusText;
}

function asRowArray(body: unknown): unknown[] {
  if (Array.isArray(body)) {
    return body;
  }
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    for (const key of ["result", "results", "data", "items"] as const) {
      if (!(key in o)) {
        continue;
      }
      const v = o[key];
      if (Array.isArray(v)) {
        return v;
      }
    }
  }
  throw new Error("Неожиданный формат ответа API (ожидался список)");
}

function listTotalCount(body: unknown): number | null {
  if (body && typeof body === "object" && "count" in body) {
    const c = (body as { count?: unknown }).count;
    if (typeof c === "number" && Number.isFinite(c)) {
      return c;
    }
  }
  return null;
}

async function tableCrmGetJson(
  path: string,
  integrationToken: string,
  extraParams: Record<string, string | number | boolean | undefined>,
): Promise<unknown> {
  const base = getTableCrmBaseUrl();
  const sp = new URLSearchParams();
  sp.set("token", integrationToken);
  for (const [k, v] of Object.entries(extraParams)) {
    if (v === undefined || v === null) {
      continue;
    }
    if (typeof v === "boolean") {
      sp.set(k, v ? "true" : "false");
    } else {
      sp.set(k, String(v));
    }
  }
  const url = `${base}${path}?${sp.toString()}`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return res.json() as Promise<unknown>;
}

async function fetchAllListRows(
  path: string,
  integrationToken: string,
  extra: Record<string, string | number | boolean | undefined> = {},
): Promise<unknown[]> {
  const limit = listPageSize();
  const all: unknown[] = [];
  let offset = 0;
  for (;;) {
    const body = await tableCrmGetJson(path, integrationToken, {
      ...extra,
      limit,
      offset,
    });
    const rows = asRowArray(body);
    const total = listTotalCount(body);
    all.push(...rows);
    if (rows.length === 0 || rows.length < limit) {
      break;
    }
    if (total !== null && all.length >= total) {
      break;
    }
    offset += limit;
  }
  return all;
}

type OrgRow = {
  id: number;
  short_name?: string;
  work_name?: string;
  full_name?: string;
};

type ContragentRow = {
  id: number;
  name?: string;
  phone?: string | null;
};

type WarehouseRow = { id: number; name?: string };
type PayboxRow = { id: number; name?: string };
type PriceTypeRow = { id: number; name?: string };

type PriceEntry = { price?: number; price_type?: string | number };
type NomenclatureRow = {
  id: number;
  name?: string;
  code?: string | null;
  prices?: PriceEntry[] | null;
};

function orgLabel(o: OrgRow): string {
  return (
    o.work_name?.trim() ||
    o.short_name?.trim() ||
    o.full_name?.trim() ||
    `Организация #${o.id}`
  );
}

function mapSaleOption(row: { id: number; name?: string }): SaleOption {
  return {
    id: String(row.id),
    name: row.name?.trim() || `#${row.id}`,
  };
}

function mapClient(row: ContragentRow): PosClient {
  return {
    id: String(row.id),
    name: row.name?.trim() || `Контрагент #${row.id}`,
    phone: typeof row.phone === "string" ? row.phone : "",
  };
}

function pickPriceRub(n: NomenclatureRow): number {
  const prices = n.prices;
  if (!Array.isArray(prices) || prices.length === 0) {
    return 0;
  }
  const first = prices[0];
  const p = first?.price;
  if (typeof p !== "number" || !Number.isFinite(p)) {
    return 0;
  }
  return Math.round(p);
}

function mapProduct(row: NomenclatureRow): PosProduct {
  const code = typeof row.code === "string" && row.code.trim() !== ""
    ? row.code.trim()
    : String(row.id);
  return {
    id: String(row.id),
    name: row.name?.trim() || `Товар #${row.id}`,
    sku: code,
    priceRub: pickPriceRub(row),
  };
}

function dedupeById<T extends { id: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

export async function validateTableCrmToken(
  integrationToken: string,
): Promise<{ shopName: string }> {
  const body = await tableCrmGetJson(
    TABLECRM_API_PATHS.organizations,
    integrationToken,
    {
      limit: 20,
      offset: 0,
    },
  );
  const rows = asRowArray(body) as OrgRow[];
  const first = rows[0];
  const shopName = first ? orgLabel(first) : "TableCRM";
  return { shopName };
}

export async function fetchTableCrmWorkspaceCatalog(
  integrationToken: string,
): Promise<PosWorkspaceCatalog> {
  const [
    contragentRows,
    warehouseRows,
    payboxRows,
    organizationRows,
    priceTypeRows,
    nomenclatureRows,
  ] = await Promise.all([
    fetchAllListRows(TABLECRM_API_PATHS.contragents, integrationToken),
    fetchAllListRows(TABLECRM_API_PATHS.warehouses, integrationToken),
    fetchAllListRows(TABLECRM_API_PATHS.payboxes, integrationToken),
    fetchAllListRows(TABLECRM_API_PATHS.organizations, integrationToken),
    fetchAllListRows(TABLECRM_API_PATHS.priceTypes, integrationToken),
    fetchAllListRows(TABLECRM_API_PATHS.nomenclature, integrationToken, {
      with_prices: true,
    }),
  ]);

  const clients = dedupeById(
    (contragentRows as ContragentRow[]).map(mapClient),
  );
  const warehouses = dedupeById(
    (warehouseRows as WarehouseRow[]).map(mapSaleOption),
  );
  const accounts = dedupeById(
    (payboxRows as PayboxRow[]).map(mapSaleOption),
  );
  const organizations = dedupeById(
    (organizationRows as OrgRow[]).map((o) => ({
      id: String(o.id),
      name: orgLabel(o),
    })),
  );
  const priceTypes = dedupeById(
    (priceTypeRows as PriceTypeRow[]).map(mapSaleOption),
  );
  const products = dedupeById(
    (nomenclatureRows as NomenclatureRow[]).map(mapProduct),
  );

  return {
    clients,
    products,
    organizations,
    accounts,
    warehouses,
    priceTypes,
  };
}

const SEARCH_PAGE_DEFAULT_LIMIT = 100;

export async function searchNomenclatureByQuery(
  integrationToken: string,
  opts: {
    name?: string;
    barcode?: string;
    limit?: number;
  },
): Promise<PosProduct[]> {
  const trimmed = integrationToken.trim();
  if (!trimmed) {
    throw new Error("Нет токена доступа");
  }
  const limit = opts.limit ?? SEARCH_PAGE_DEFAULT_LIMIT;
  const body = await tableCrmGetJson(
    TABLECRM_API_PATHS.nomenclature,
    trimmed,
    {
      name: opts.name?.trim() || undefined,
      barcode: opts.barcode?.trim() || undefined,
      with_prices: true,
      limit,
      offset: 0,
    },
  );
  const rows = asRowArray(body) as NomenclatureRow[];
  return dedupeById(rows.map(mapProduct));
}

export async function searchContragentsByPhone(
  integrationToken: string,
  opts: { phone: string; limit?: number },
): Promise<PosClient[]> {
  const trimmed = integrationToken.trim();
  if (!trimmed) {
    throw new Error("Нет токена доступа");
  }
  const raw = opts.phone.trim();
  let digits = phoneDigits(raw);
  if (digits.length > 0) {
    digits = normalizeRussiaPhoneDigits(digits);
  }
  /** TableCRM обычно ищет по цифрам; «+7 (916)…» и «8 916…» приводим к цифрам и 8→7. */
  const phone = digits.length > 0 ? digits : raw;
  if (!phone) {
    return [];
  }
  const limit = opts.limit ?? SEARCH_PAGE_DEFAULT_LIMIT;
  const body = await tableCrmGetJson(
    TABLECRM_API_PATHS.contragents,
    trimmed,
    {
      phone,
      limit,
      offset: 0,
    },
  );
  const rows = asRowArray(body) as ContragentRow[];
  return dedupeById(rows.map(mapClient));
}

async function tableCrmPostJson(
  path: string,
  integrationToken: string,
  queryParams: Record<string, string | number | boolean | undefined>,
  jsonBody: unknown,
): Promise<unknown> {
  const base = getTableCrmBaseUrl();
  const sp = new URLSearchParams();
  sp.set("token", integrationToken.trim());
  for (const [k, v] of Object.entries(queryParams)) {
    if (v === undefined || v === null) {
      continue;
    }
    if (typeof v === "boolean") {
      sp.set(k, v ? "true" : "false");
    } else {
      sp.set(k, String(v));
    }
  }
  const url = `${base}${path}?${sp.toString()}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jsonBody),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  const text = await res.text();
  if (!text.trim()) {
    return null;
  }
  return JSON.parse(text) as unknown;
}

export async function postTableCrmDocsSales(
  integrationToken: string,
  createMass: unknown[],
  generateOut: boolean,
): Promise<unknown> {
  const trimmed = integrationToken.trim();
  if (!trimmed) {
    throw new Error("Нет токена доступа");
  }
  if (!Array.isArray(createMass) || createMass.length === 0) {
    throw new Error("Пустой заказ");
  }
  return tableCrmPostJson(
    TABLECRM_API_PATHS.docsSales,
    trimmed,
    { generate_out: generateOut },
    createMass,
  );
}
