"use client";

import { useBuyerPicker } from "@/hooks/use-buyer-picker";
import { useProductPicker } from "@/hooks/use-product-picker";
import { usePosWorkspaceStore } from "@/stores/pos-workspace-store";
import type { SaleParams, SaleParamOptions } from "@/types/sale-workspace";
import { useEffect, useMemo } from "react";
import { BuyerSection } from "./sale-workspace/buyer-section";
import { ProductsSection } from "./sale-workspace/products-section";
import { SaleCommentCard } from "./sale-workspace/sale-comment-card";
import { SaleParamsCard } from "./sale-workspace/sale-params-card";

export type { SaleParams, SaleParamOptions } from "@/types/sale-workspace";

const emptySaleParamOptions: SaleParamOptions = {
  organizations: [],
  accounts: [],
  warehouses: [],
  priceTypes: [],
};

export function SaleWorkspace() {
  const workspaceCatalog = usePosWorkspaceStore((s) => s.workspaceCatalog);
  const clients = workspaceCatalog?.clients ?? [];
  const products = workspaceCatalog?.products ?? [];
  const searchAuthToken = usePosWorkspaceStore(
    (s) => s.connection?.bearerToken ?? "",
  );
  const selectedClientId = usePosWorkspaceStore((s) => s.selectedClientId);
  const setSelectedClientId = usePosWorkspaceStore((s) => s.setSelectedClientId);
  const saleParams = usePosWorkspaceStore((s) => s.saleParams);
  const patchSaleParams = usePosWorkspaceStore((s) => s.patchSaleParams);
  const quantities = usePosWorkspaceStore((s) => s.quantities);
  const adjustQuantity = usePosWorkspaceStore((s) => s.adjustQuantity);
  const saleComment = usePosWorkspaceStore((s) => s.saleComment);
  const setSaleComment = usePosWorkspaceStore((s) => s.setSaleComment);
  const setMergedProducts = usePosWorkspaceStore((s) => s.setMergedProducts);

  const saleParamOptions = useMemo<SaleParamOptions>(() => {
    if (!workspaceCatalog) {
      return emptySaleParamOptions;
    }
    return {
      organizations: workspaceCatalog.organizations,
      accounts: workspaceCatalog.accounts,
      warehouses: workspaceCatalog.warehouses,
      priceTypes: workspaceCatalog.priceTypes,
    };
  }, [workspaceCatalog]);

  const {
    clientPhoneSearch,
    setClientPhoneSearch,
    debouncedClientPhoneSearch,
    filteredClients,
    buyerSearchLoading,
    buyerSearchError,
  } = useBuyerPicker({
    clients,
    selectedClientId,
    onSelectClient: setSelectedClientId,
    searchAuthToken,
  });

  const {
    productSearch,
    setProductSearch,
    debouncedProductSearch,
    filteredProducts,
    mergedProducts: mergedFromPicker,
    productSearchLoading,
    productSearchError,
  } = useProductPicker({ products, searchAuthToken });

  useEffect(() => {
    setMergedProducts(mergedFromPicker);
  }, [mergedFromPicker, setMergedProducts]);

  const saleParamFields = useMemo(
    () =>
      [
        {
          id: "organizationId" as const satisfies keyof SaleParams,
          label: "Организация",
          htmlFor: "sale-organization",
          placeholder: "Выберите организацию",
          options: saleParamOptions.organizations,
        },
        {
          id: "accountId" as const satisfies keyof SaleParams,
          label: "Счёт",
          htmlFor: "sale-account",
          placeholder: "Выберите счёт",
          options: saleParamOptions.accounts,
        },
        {
          id: "warehouseId" as const satisfies keyof SaleParams,
          label: "Склад",
          htmlFor: "sale-warehouse",
          placeholder: "Выберите склад",
          options: saleParamOptions.warehouses,
        },
        {
          id: "priceTypeId" as const satisfies keyof SaleParams,
          label: "Тип цены",
          htmlFor: "sale-price-type",
          placeholder: "Выберите тип цены",
          options: saleParamOptions.priceTypes,
        },
      ] as const,
    [saleParamOptions],
  );

  return (
    <div className="flex w-full flex-col gap-5">
      <BuyerSection
        clientPhoneSearch={clientPhoneSearch}
        onClientPhoneSearchChange={setClientPhoneSearch}
        debouncedQueryForEmpty={debouncedClientPhoneSearch.trim()}
        filteredClients={filteredClients}
        selectedClientId={selectedClientId}
        onSelectClient={(id) => setSelectedClientId(id)}
        buyerSearchLoading={buyerSearchLoading}
        buyerSearchError={buyerSearchError}
      />

      <SaleParamsCard
        saleParams={saleParams}
        onSaleParamsChange={patchSaleParams}
        fields={saleParamFields}
      />

      <ProductsSection
        allProducts={mergedFromPicker}
        productSearch={productSearch}
        onProductSearchChange={setProductSearch}
        debouncedQueryForEmpty={debouncedProductSearch.trim()}
        filteredProducts={filteredProducts}
        quantities={quantities}
        onQuantityChange={adjustQuantity}
        productSearchLoading={productSearchLoading}
        productSearchError={productSearchError}
      />

      <SaleCommentCard
        saleComment={saleComment}
        onSaleCommentChange={setSaleComment}
      />
    </div>
  );
}
