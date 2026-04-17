export type RegisterSession = {
  registerId: string;
  shopName: string;
  tokenHint: string;
};

export type PosConnectionResult = {
  session: RegisterSession;
  bearerToken: string;
};

export type PosClient = {
  id: string;
  name: string;
  phone: string;
};

export type PosProduct = {
  id: string;
  name: string;
  sku: string;
  priceRub: number;
};

export type SaleOption = {
  id: string;
  name: string;
};

export type PosWorkspaceCatalog = {
  clients: PosClient[];
  products: PosProduct[];
  organizations: SaleOption[];
  accounts: SaleOption[];
  warehouses: SaleOption[];
  priceTypes: SaleOption[];
};
