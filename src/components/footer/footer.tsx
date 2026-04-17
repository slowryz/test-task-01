import { Button } from "@/components/ui/button";
import { formatRub } from "@/lib/format-money";

export type SaleSubmitMode = "create" | "create_and_post";

type FooterProps = {
  totalRub: number;
  canSubmit: boolean;
  submitLoading: SaleSubmitMode | null;
  onCreateSale: () => void;
  onCreateAndPost: () => void;
};

export function Footer({
  totalRub,
  canSubmit,
  submitLoading,
  onCreateSale,
  onCreateAndPost,
}: FooterProps) {
  const busy = submitLoading !== null;

  return (
    <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex max-w-lg flex-col gap-2 px-4 py-4 pointer-events-none">
        <div className="mb-3 flex items-center justify-between rounded-xl border border-border/80 bg-card px-3 py-2.5 shadow-xs pointer-events-auto">
          <span className="text-sm text-muted-foreground">Итого</span>
          <span className="text-lg font-semibold tabular-nums tracking-tight">
            {formatRub(totalRub)} ₽
          </span>
        </div>
        <div className="flex flex-col gap-2 pointer-events-auto">
          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={!canSubmit || busy}
            onClick={onCreateSale}
          >
            {submitLoading === "create" ? "Отправка…" : "Создать продажу"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            size="lg"
            disabled={!canSubmit || busy}
            onClick={onCreateAndPost}
          >
            {submitLoading === "create_and_post"
              ? "Отправка…"
              : "Создать и провести"}
          </Button>
        </div>
      </div>
    </footer>
  );
}
