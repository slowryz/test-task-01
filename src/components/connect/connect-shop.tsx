"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { connectPos } from "@/services/pos-api";
import type { PosConnectionResult } from "@/types/pos";

type Props = {
  onSession: (result: PosConnectionResult) => void | Promise<void>;
};

export function ConnectShop({ onSession }: Props) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setError(null);
    setLoading(true);
    try {
      const result = await connectPos(token);
      await Promise.resolve(onSession(result));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось подключиться");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="relative overflow-hidden border-border/80 shadow-md ring-1 ring-border/60">
      <div
        className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/70 to-amber-500/90"
        aria-hidden
      />
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Подключение кассы</CardTitle>
        <CardDescription>
          Введите токен интеграции - загрузим справочники
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          placeholder="Введите токен кассы"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          disabled={loading}
          autoComplete="off"
        />
        {error ? (
          <p className="text-sm font-medium text-destructive">{error}</p>
        ) : null}
      </CardContent>
      <CardFooter className="flex-col gap-2 border-t border-border/60 pt-4 [.border-t]:pt-4">
        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={loading}
          onClick={handleConnect}
        >
          {loading ? "Подключение..." : "Подключить"}
        </Button>
      </CardFooter>
    </Card>
  );
}
