import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2 } from "lucide-react";

interface EditProfileDialogProps {
  currentName: string;
  currentAddress: string;
  currentDateOfBirth?: string;
  onSave: (data: {
    name: string;
    address: string;
    date_of_birth?: string;
  }) => void;
}

export function EditProfileDialog({
  currentName,
  currentAddress,
  currentDateOfBirth,
  onSave,
}: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getLocalDateString = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    name: currentName,
    address: currentAddress,
    date_of_birth: getLocalDateString(currentDateOfBirth),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập họ tên";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Họ tên phải có ít nhất 2 ký tự";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Họ tên không được quá 100 ký tự";
    } else if (!/^[\p{L}\s]+$/u.test(formData.name.trim())) {
      newErrors.name = "Họ tên chỉ được chứa chữ cái và khoảng trắng";
    }

    // Validate address
    if (formData.address && formData.address.trim()) {
      if (formData.address.trim().length < 5) {
        newErrors.address = "Địa chỉ phải có ít nhất 5 ký tự";
      } else if (formData.address.trim().length > 200) {
        newErrors.address = "Địa chỉ không được quá 200 ký tự";
      }
    }

    // Validate date of birth
    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const minDate = new Date("1900-01-01");

      if (dob > today) {
        newErrors.date_of_birth = "Ngày sinh không thể là ngày tương lai";
      } else if (dob < minDate) {
        newErrors.date_of_birth = "Ngày sinh không hợp lệ";
      } else if (age < 13) {
        newErrors.date_of_birth = "Bạn phải từ 13 tuổi trở lên";
      } else if (age > 120) {
        newErrors.date_of_birth = "Ngày sinh không hợp lệ";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    onSave(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Edit2 className="w-4 h-4" />
          Chỉnh sửa hồ sơ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa hồ sơ</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin hồ sơ của bạn bên dưới.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium">Họ và tên</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (errors.name) setErrors({ ...errors, name: '' })
              }}
              placeholder="Nhập họ và tên của bạn"
              className={errors.name ? "border-destructive focus-visible:ring-destructive mt-2" : "mt-2"}
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Địa chỉ</label>
            <Input
              type="text"
              value={formData.address}
              onChange={(e) => {
                setFormData({ ...formData, address: e.target.value })
                if (errors.address) setErrors({ ...errors, address: '' })
              }}
              placeholder="Nhập địa chỉ của bạn"
              className={errors.address ? "border-destructive focus-visible:ring-destructive mt-2" : "mt-2"}
            />
            {errors.address && (
              <p className="text-xs text-destructive mt-1">{errors.address}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Địa chỉ giao hàng của bạn (tùy chọn)
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Ngày sinh</label>
            <Input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => {
                setFormData({ ...formData, date_of_birth: e.target.value })
                if (errors.date_of_birth) setErrors({ ...errors, date_of_birth: '' })
              }}
              className={errors.date_of_birth ? "border-destructive focus-visible:ring-destructive mt-2" : "mt-2"}
            />
            {errors.date_of_birth && (
              <p className="text-xs text-destructive mt-1">{errors.date_of_birth}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Ngày sinh của bạn (tùy chọn)
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
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary"
            >
              {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
