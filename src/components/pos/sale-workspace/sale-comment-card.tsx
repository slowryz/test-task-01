"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  saleComment: string;
  onSaleCommentChange: (value: string) => void;
};

export function SaleCommentCard({ saleComment, onSaleCommentChange }: Props) {
  return (
    <Card className="mt-2 border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Комментарий</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Label htmlFor="sale-order-comment" className="sr-only">
          Комментарий к заказу (не обязательно)
        </Label>
        <Textarea
          id="sale-order-comment"
          placeholder="Комментарий к заказу (необязательно)"
          value={saleComment}
          onChange={(e) => onSaleCommentChange(e.target.value)}
          rows={4}
          className="min-h-28 resize-y"
        />
      </CardContent>
    </Card>
  );
}
