import type { SaleOption } from "@/types/pos";

export type SaleParams = {
  organizationId: string;
  accountId: string;
  warehouseId: string;
  priceTypeId: string;
};

export type SaleParamOptions = {
  organizations: readonly SaleOption[];
  accounts: readonly SaleOption[];
  warehouses: readonly SaleOption[];
  priceTypes: readonly SaleOption[];
};
