"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SaleOption } from "@/types/pos";
import type { SaleParams } from "@/types/sale-workspace";

type FieldConfig = {
  id: keyof Pick<
    SaleParams,
    "organizationId" | "accountId" | "warehouseId" | "priceTypeId"
  >;
  label: string;
  htmlFor: string;
  placeholder: string;
  options: readonly SaleOption[];
};

type Props = {
  saleParams: SaleParams;
  onSaleParamsChange: (patch: Partial<SaleParams>) => void;
  fields: readonly FieldConfig[];
};

export function SaleParamsCard({
  saleParams,
  onSaleParamsChange,
  fields,
}: Props) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">3. Параметры продажи</CardTitle>
        <CardDescription>Счёт, организация, склад и тип цены</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {fields.map(
          ({ id, label, htmlFor, placeholder, options }) => (
            <div key={id} className="space-y-2">
              <Label htmlFor={htmlFor}>{label}</Label>
              <Select
                value={saleParams[id]}
                onValueChange={(value) => onSaleParamsChange({ [id]: value })}
              >
                <SelectTrigger
                  id={htmlFor}
                  className="w-full max-w-full"
                  size="default"
                >
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent position="popper">
                  {options.map((o) => (
                    <SelectItem key={`${id}-${o.id}`} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ),
        )}
      </CardContent>
    </Card>
  );
}
