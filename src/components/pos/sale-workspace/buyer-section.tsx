"use client";

import { Input } from "@/components/ui/input";
import type { PosClient } from "@/types/pos";
import { cn } from "@/lib/utils";

type Props = {
  clientPhoneSearch: string;
  onClientPhoneSearchChange: (value: string) => void;
  debouncedQueryForEmpty: string;
  filteredClients: PosClient[];
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  buyerSearchLoading?: boolean;
  buyerSearchError?: string | null;
};

export function BuyerSection({
  clientPhoneSearch,
  onClientPhoneSearchChange,
  debouncedQueryForEmpty,
  filteredClients,
  selectedClientId,
  onSelectClient,
  buyerSearchLoading = false,
  buyerSearchError = null,
}: Props) {
  return (
    <section>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Покупатель
      </p>
      <Input
        className="mb-2"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="Поиск по номеру телефона"
        value={clientPhoneSearch}
        onChange={(e) => onClientPhoneSearchChange(e.target.value)}
        aria-label="Поиск покупателя по телефону"
        aria-busy={buyerSearchLoading}
      />
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {buyerSearchError ? (
          <p
            className="w-full rounded-xl border border-dashed border-destructive/40 px-3 py-6 text-center text-sm text-destructive"
            role="alert"
          >
            {buyerSearchError}
          </p>
        ) : buyerSearchLoading ? (
          <p className="w-full rounded-xl border border-dashed border-border/80 px-3 py-6 text-center text-sm text-muted-foreground">
            Загрузка…
          </p>
        ) : filteredClients.length === 0 ? (
          <p className="w-full rounded-xl border border-dashed border-border/80 px-3 py-6 text-center text-sm text-muted-foreground">
            Нет покупателей по номеру «{debouncedQueryForEmpty}»
          </p>
        ) : (
          filteredClients.map((c) => (
            <button
              key={`buyer-${c.id}`}
              type="button"
              onClick={() => onSelectClient(c.id)}
              className={cn(
                "min-w-[9.5rem] shrink-0 rounded-xl border px-3 py-2.5 text-left transition-colors",
                selectedClientId === c.id
                  ? "border-primary bg-primary/10 ring-1 ring-primary/25"
                  : "border-border bg-card hover:bg-muted/60",
              )}
            >
              <span className="block text-sm font-medium leading-snug">
                {c.name}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">
                {c.phone}
              </span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
