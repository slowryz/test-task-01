export function resolveTableCrmBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_TABLECRM_BASE_URL?.trim();
  return fromEnv!.replace(/\/$/, "");
}

export const TABLECRM_API_PATHS = {
  contragents: "/contragents/",
  warehouses: "/warehouses/",
  payboxes: "/payboxes/",
  organizations: "/organizations/",
  priceTypes: "/price_types/",
  nomenclature: "/nomenclature/",
  docsSales: "/docs_sales/",
} as const;
