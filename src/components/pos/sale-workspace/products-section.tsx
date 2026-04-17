"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRub } from "@/lib/format-money";
import type { PosProduct } from "@/types/pos";
import { useMemo, useState } from "react";

type TabId = "catalog" | "cart";

type Props = {
  allProducts: PosProduct[];
  productSearch: string;
  onProductSearchChange: (value: string) => void;
  debouncedQueryForEmpty: string;
  filteredProducts: PosProduct[];
  quantities: Record<string, number>;
  onQuantityChange: (productId: string, delta: number) => void;
  productSearchLoading?: boolean;
  productSearchError?: string | null;
};

export function ProductsSection({
  allProducts,
  productSearch,
  onProductSearchChange,
  debouncedQueryForEmpty,
  filteredProducts,
  quantities,
  onQuantityChange,
  productSearchLoading = false,
  productSearchError = null,
}: Props) {
  const [tab, setTab] = useState<TabId>("catalog");

  const cartProducts = useMemo(
    () => allProducts.filter((p) => ((quantities[p.id]) ?? 0) > 0),
    [allProducts, quantities],
  );

  const cartPositionCount = cartProducts.length;

  const cartTotalQty = useMemo(() => {
    let s = 0;
    for (const p of cartProducts) {
      s += (quantities[p.id]) ?? 0;
    }
    return s;
  }, [cartProducts, quantities]);

  return (
    <section className="flex w-full flex-col gap-2">
      <div className="mb-0.5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Товары и корзина
          </p>
        </div>
        {cartPositionCount > 0 ? (
          <p className="shrink-0 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-primary">
            В корзине: {cartPositionCount}
            {cartTotalQty > cartPositionCount
              ? ` · ${cartTotalQty} шт.`
              : null}
          </p>
        ) : null}
      </div>

      <Tabs value={tab} onValueChange={(v: string) => setTab(v as TabId)}>
        <TabsList aria-label="Режим списка товаров" className="flex w-full">
          <TabsTrigger value="catalog">Товары</TabsTrigger>
          <TabsTrigger value="cart">
            Корзина
            {cartPositionCount > 0 ? (
              <span className="ml-1 tabular-nums text-xs text-primary">
                ({cartPositionCount})
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-0">
          <Input
            className="mb-1"
            placeholder="Поиск товара по названию"
            value={productSearch}
            onChange={(e) => onProductSearchChange(e.target.value)}
            aria-label="Поиск товара"
            aria-busy={productSearchLoading}
          />
          {productSearchError && (
            <p className="mb-1 text-xs text-destructive" role="alert">
              {productSearchError}
            </p>
          )}

          <div className="rounded-xl border border-border/80 bg-muted/20 p-1.5 shadow-inner">
            <ScrollArea
              className="h-[min(42dvh,18rem)] min-w-0 w-full overflow-x-hidden overscroll-y-contain [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]"
              aria-label="Каталог товаров"
            >
              <ul className="flex w-full min-w-0 flex-col gap-2 p-0.5">
                {productSearchError ? null : productSearchLoading ? (
                  <li className="rounded-lg border border-dashed border-border/80 px-3 py-6 text-center text-sm text-muted-foreground">
                    Загрузка…
                  </li>
                ) : filteredProducts.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-border/80 px-3 py-6 text-center text-sm text-muted-foreground">
                    Ничего не найдено по запросу «{debouncedQueryForEmpty}»
                  </li>
                ) : null}
                {filteredProducts.map((p) => {
                  const q = (quantities[p.id]) ?? 0;
                  return (
                    <li
                      key={`product-catalog-${p.id}`}
                      className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2.5 shadow-xs sm:gap-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {p.name.trim() !== "" ? p.name : `Товар ${p.sku}`}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.sku} · {formatRub(p.priceRub)} ₽
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-background p-0.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          className="size-8 shrink-0 p-0 text-base font-semibold leading-none tabular-nums"
                          disabled={q <= 0}
                          onClick={() => onQuantityChange(p.id, -1)}
                          aria-label="Меньше"
                        >
                          <span aria-hidden>−</span>
                        </Button>
                        <span className="min-w-7 px-0.5 text-center text-sm font-semibold tabular-nums">
                          {q}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          className="size-8 shrink-0 p-0 text-base font-semibold leading-none tabular-nums"
                          onClick={() => onQuantityChange(p.id, 1)}
                          aria-label="Больше"
                        >
                          <span aria-hidden>+</span>
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="cart" className="mt-0">
          <div className="rounded-xl border border-border/80 bg-muted/20 p-1.5 shadow-inner">
            <ScrollArea
              className="max-h-[min(42dvh,18rem)] min-w-0 w-full overflow-x-hidden overscroll-y-contain [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]"
              aria-label="Корзина"
            >
              <ul className="flex w-full min-w-0 flex-col gap-2 p-0.5">
                {cartProducts.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-border/80 px-3 py-6 text-center text-sm text-muted-foreground">
                    Корзина пуста — на вкладке «Товары» добавьте позиции
                  </li>
                ) : null}
                {cartProducts.map((p) => {
                  const q = (quantities[p.id]) ?? 0;
                  return (
                    <li
                      key={`product-cart-${p.id}`}
                      className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2.5 shadow-xs sm:gap-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {p.name.trim() !== "" ? p.name : `Товар ${p.sku}`}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.sku} · {formatRub(p.priceRub)} ₽
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-background p-0.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          className="size-8 shrink-0 p-0 text-base font-semibold leading-none tabular-nums"
                          disabled={q <= 0}
                          onClick={() => onQuantityChange(p.id, -1)}
                          aria-label="Меньше"
                        >
                          <span aria-hidden>−</span>
                        </Button>
                        <span className="min-w-7 px-0.5 text-center text-sm font-semibold tabular-nums">
                          {q}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          className="size-8 shrink-0 p-0 text-base font-semibold leading-none tabular-nums"
                          onClick={() => onQuantityChange(p.id, 1)}
                          aria-label="Больше"
                        >
                          <span aria-hidden>+</span>
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
