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
import { Input } from "@/components/ui/input"
import { KeyRound } from "lucide-react"

interface ChangePasswordDialogProps {
  onSave: (data: { oldPassword: string; newPassword: string }) => Promise<void>
  onBeforeOpen?: () => boolean
}

export function ChangePasswordDialog({ onSave, onBeforeOpen }: ChangePasswordDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.oldPassword) {
      newErrors.oldPassword = "Vui lòng nhập mật khẩu cũ"
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới"
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự"
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới"
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp"
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setIsLoading(true)
    try {
      await onSave({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      })
      
      // Reset form và đóng dialog
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setOpen(false)
    } catch (error) {
      // Error đã được xử lý trong onSave
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && onBeforeOpen) {
      // Gọi callback trước khi mở dialog
      const canOpen = onBeforeOpen()
      if (!canOpen) {
        return // Không mở dialog nếu callback trả về false
      }
    }
    
    setOpen(newOpen)
    if (!newOpen) {
      // Reset form khi đóng dialog
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setErrors({})
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 bg-transparent"
          onClick={(e) => {
            if (onBeforeOpen) {
              const canOpen = onBeforeOpen()
              if (!canOpen) {
                e.preventDefault()
              }
            }
          }}
        >
          <KeyRound className="w-4 h-4" />
          Đổi mật khẩu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu</DialogTitle>
          <DialogDescription>Nhập mật khẩu cũ và mật khẩu mới của bạn</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium">Mật khẩu cũ</label>
            <Input
              type="password"
              value={formData.oldPassword}
              onChange={(e) => {
                setFormData({ ...formData, oldPassword: e.target.value })
                if (errors.oldPassword) setErrors({ ...errors, oldPassword: '' })
              }}
              placeholder="Nhập mật khẩu hiện tại"
              className={errors.oldPassword ? "border-destructive focus-visible:ring-destructive mt-2" : "mt-2"}
            />
            {errors.oldPassword && <p className="text-xs text-destructive mt-1">{errors.oldPassword}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Mật khẩu mới</label>
            <Input
              type="password"
              value={formData.newPassword}
              onChange={(e) => {
                setFormData({ ...formData, newPassword: e.target.value })
                if (errors.newPassword) setErrors({ ...errors, newPassword: '' })
              }}
              placeholder="Nhập mật khẩu mới"
              className={errors.newPassword ? "border-destructive focus-visible:ring-destructive mt-2" : "mt-2"}
            />
            {errors.newPassword && <p className="text-xs text-destructive mt-1">{errors.newPassword}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Xác nhận mật khẩu mới</label>
            <Input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value })
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' })
              }}
              placeholder="Nhập lại mật khẩu mới"
              className={errors.confirmPassword ? "border-destructive focus-visible:ring-destructive mt-2" : "mt-2"}
            />
            {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-primary">
              {isLoading ? "Đang lưu..." : "Đổi mật khẩu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
