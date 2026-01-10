"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Check, ShoppingCart } from "lucide-react";

interface BuyNowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  buyNowPrice: number;
  onConfirm: () => Promise<void>;
}

export function BuyNowDialog({
  isOpen,
  onClose,
  productTitle,
  buyNowPrice,
  onConfirm,
}: BuyNowDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError("");

    try {
      await onConfirm();
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Không thể mua ngay. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError("");
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Xác nhận mua ngay
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn mua sản phẩm này?
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-600">
                Mua thành công!
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Đang chuyển đến trang thanh toán...
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Sản phẩm:</p>
                <p className="font-semibold">{productTitle}</p>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Giá mua ngay:</p>
                <p className="text-2xl font-bold text-primary">
                  {buyNowPrice.toLocaleString("vi-VN")} ₫
                </p>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Lưu ý:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Sau khi mua, đấu giá sẽ kết thúc ngay lập tức</li>
                    <li>Bạn sẽ được chuyển đến trang thanh toán</li>
                    <li>Vui lòng thanh toán trong vòng 24 giờ</li>
                  </ul>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-900">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? "Đang xử lý..." : "Xác nhận mua ngay"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
