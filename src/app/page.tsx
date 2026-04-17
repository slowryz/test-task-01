import { PosAppShell } from "@/components/pos/pos-app-shell";
import { PosOrderPageHeader } from "@/components/pos/pos-order-page-header";

export default function Home() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,var(--color-primary)/0.18,transparent_55%),linear-gradient(180deg,var(--color-muted)/0.35,transparent_40%)]"
      />
      <main className="relative z-[1] mx-auto flex w-full max-w-lg flex-col px-4 pb-56 pt-8">
        <PosOrderPageHeader />
        <PosAppShell />
      </main>
    </div>
  );
}
