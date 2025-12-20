import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Edit } from "lucide-react"

interface AppendDescriptionDialogProps {
  productId: number
  onAppend: (newText: string) => Promise<void>
  isSeller: boolean
}

export function AppendDescriptionDialog({ onAppend, isSeller }: AppendDescriptionDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newText, setNewText] = useState("")
  const [error, setError] = useState("")

  if (!isSeller) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!newText.trim()) {
      setError("Vui lòng nhập nội dung bổ sung")
      return
    }

    try {
      setIsLoading(true)
      await onAppend(newText.trim())
      setNewText("")
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật mô tả")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="w-4 h-4" />
          Bổ sung mô tả
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bổ sung thông tin mô tả sản phẩm</DialogTitle>
          <DialogDescription>
            Thông tin mới sẽ được chèn (append) vào mô tả cũ, không thay thế mô tả hiện tại.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nội dung bổ sung</label>
            <Textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Nhập thông tin bổ sung cho mô tả sản phẩm..."
              className="mt-2 min-h-[150px]"
              disabled={isLoading}
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Nội dung này sẽ được thêm vào cuối mô tả hiện tại với dấu thời gian.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-primary">
              {isLoading ? "Đang lưu..." : "Lưu bổ sung"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
