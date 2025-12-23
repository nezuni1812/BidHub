"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"

interface DenyBidderDialogProps {
  isOpen: boolean
  onClose: () => void
  bidderName: string
  bidderId: number
  productId: number
  onDeny: (bidderId: number, reason: string) => Promise<void>
}

export function DenyBidderDialog({
  isOpen,
  onClose,
  bidderName,
  bidderId,
  productId,
  onDeny,
}: DenyBidderDialogProps) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleDeny = async () => {
    if (!reason.trim()) {
      alert("Vui lòng nhập lý do từ chối")
      return
    }

    try {
      setLoading(true)
      await onDeny(bidderId, reason)
      setReason("")
      onClose()
    } catch (error) {
      console.error("Error denying bidder:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setReason("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Từ chối người đấu giá
          </DialogTitle>
          <DialogDescription>
            Bạn sắp từ chối <span className="font-semibold text-foreground">{bidderName}</span> khỏi sản phẩm này.
            Người này sẽ không thể đấu giá sản phẩm này nữa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Lý do từ chối *</Label>
            <Textarea
              id="reason"
              placeholder="Vui lòng nhập lý do từ chối người đấu giá này..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Lý do này sẽ được gửi đến người dùng qua email.
            </p>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-destructive mb-2">⚠️ Lưu ý quan trọng:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Người này sẽ bị cấm đấu giá sản phẩm này</li>
              <li>• Nếu người này đang có giá cao nhất, sản phẩm sẽ chuyển cho người có giá cao thứ hai</li>
              <li>• Hành động này không thể hoàn tác</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeny}
            disabled={loading || !reason.trim()}
          >
            {loading ? "Đang xử lý..." : "Xác nhận từ chối"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
