"use client";

import type React from "react";

import { Navigation } from "@/components/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { Upload, X, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AvailableBidder {
  id: string;
  full_name: string;
  email: string;
  role: string;
  rating: string;
}

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  parent_name: string | null;
  product_count: string;
  children?: Category[];
}

// Format number with commas
const formatNumber = (value: string): string => {
  // Remove all non-digit characters
  const number = value.replace(/\D/g, "");
  // Add commas
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Parse formatted number back to plain number
const parseNumber = (value: string): string => {
  return value.replace(/,/g, "");
};

export default function PostItemPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper: get now in GMT+7 as yyyy-MM-ddTHH:mm
  // Helper: get now in GMT+7 as yyyy-MM-ddTHH:mm (for input value)
  function getNowGmt7LocalString() {
    const now = new Date();
    // Lấy giờ UTC + 7
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const gmt7 = new Date(utc + 7 * 3600000);
    // Định dạng yyyy-MM-ddTHH:mm
    const pad = (n) => n.toString().padStart(2, "0");
    return `${gmt7.getFullYear()}-${pad(gmt7.getMonth() + 1)}-${pad(
      gmt7.getDate()
    )}T${pad(gmt7.getHours())}:${pad(gmt7.getMinutes())}`;
  }

  const [formData, setFormData] = useState({
    title: "",
    category_id: "",
    description: "",
    startingBid: "",
    biddingIncrement: "",
    buyNowPrice: "",
    endDateTime: getNowGmt7LocalString(),
    autoExtend: false,
  });

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [availableBidders, setAvailableBidders] = useState<AvailableBidder[]>(
    []
  );
  const [selectedBidders, setSelectedBidders] = useState<string[]>([]);
  const [loadingBidders, setLoadingBidders] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    category?: string;
    description?: string;
    startingBid?: string;
    biddingIncrement?: string;
    buyNowPrice?: string;
    mainImage?: string;
    additionalImages?: string;
  }>({});

  // Protect route - only sellers can access
  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/admin");
    } else if (user && user.role !== "seller") {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await api.get("/categories/tree");
        console.log("📦 Categories tree response:", response);
        console.log("📊 Categories data:", response.data);

        // Flatten tree to get only subcategories (children)
        let categoryTree: Category[] = [];
        if (response.data?.success && response.data?.data) {
          categoryTree = response.data.data;
        } else if (response.success && response.data) {
          categoryTree = response.data;
        } else if (Array.isArray(response.data)) {
          categoryTree = response.data;
        }

        // Extract only subcategories (children) from the tree
        const subcategories: Category[] = [];
        categoryTree.forEach((parent) => {
          if (parent.children && parent.children.length > 0) {
            parent.children.forEach((child) => {
              subcategories.push({
                ...child,
                parent_name: parent.name, // Keep parent name for display
              });
            });
          }
        });

        console.log("✅ Setting subcategories:", subcategories);
        setCategories(subcategories);

        // Set first subcategory as default if available
        if (subcategories.length > 0) {
          setFormData((prev) => ({
            ...prev,
            category_id: subcategories[0].id,
          }));
        }
      } catch (error) {
        console.error("❌ Failed to fetch categories:", error);
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        });
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch available bidders on mount
  useEffect(() => {
    const fetchBidders = async () => {
      setLoadingBidders(true);
      try {
        const response = await api.get("/seller/available-bidders");
        console.log("📦 Full response:", response);
        console.log("📊 Response data:", response.data);

        // Check if response has nested data structure
        if (response.data?.success && response.data?.data) {
          console.log("✅ Setting bidders:", response.data.data);
          setAvailableBidders(response.data.data);
        } else if (response.success && response.data) {
          // Alternative structure: response might already be unwrapped
          console.log("✅ Setting bidders (alt):", response.data);
          setAvailableBidders(response.data);
        } else {
          console.warn("⚠️ Unexpected response structure:", response);
        }
      } catch (error) {
        console.error("❌ Failed to fetch bidders:", error);
        toast({
          title: "Error",
          description: "Failed to load available bidders",
          variant: "destructive",
        });
      } finally {
        setLoadingBidders(false);
      }
    };
    fetchBidders();
  }, []);

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImage(file);
    }
  };

  const handleAdditionalImagesUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files) {
      setAdditionalImages((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const toggleBidder = (bidderId: string) => {
    setSelectedBidders((prev) =>
      prev.includes(bidderId)
        ? prev.filter((id) => id !== bidderId)
        : [...prev, bidderId]
    );
  };

  const toggleAllBidders = () => {
    if (selectedBidders.length === availableBidders.length) {
      setSelectedBidders([]);
    } else {
      setSelectedBidders(availableBidders.map((b) => b.id));
    }
  };

  const removeMainImage = () => {
    setMainImage(null);
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Validate title
    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tên sản phẩm";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Tên sản phẩm phải có ít nhất 3 ký tự";
    } else if (formData.title.trim().length > 200) {
      newErrors.title = "Tên sản phẩm không được quá 200 ký tự";
    }

    // Validate category
    if (!formData.category_id) {
      newErrors.category = "Vui lòng chọn danh mục";
    }

    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = "Vui lòng nhập mô tả sản phẩm";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Mô tả phải có ít nhất 10 ký tự";
    } else if (formData.description.trim().length > 5000) {
      newErrors.description = "Mô tả không được quá 5000 ký tự";
    }

    // Validate starting bid
    if (
      !formData.startingBid ||
      parseFloat(parseNumber(formData.startingBid)) <= 0
    ) {
      newErrors.startingBid = "Giá khởi điểm phải lớn hơn 0";
    }

    // Validate bidding increment
    if (
      !formData.biddingIncrement ||
      parseFloat(parseNumber(formData.biddingIncrement)) <= 0
    ) {
      newErrors.biddingIncrement = "Bước giá phải lớn hơn 0";
    }

    // Validate buy now price
    if (
      formData.buyNowPrice &&
      parseFloat(parseNumber(formData.buyNowPrice)) <=
        parseFloat(parseNumber(formData.startingBid))
    ) {
      newErrors.buyNowPrice = "Giá mua ngay phải lớn hơn giá khởi điểm";
    }

    // Validate main image
    if (!mainImage) {
      newErrors.mainImage = "Vui lòng tải lên ảnh chính";
    }

    // Validate additional images
    if (additionalImages.length < 2) {
      newErrors.additionalImages = "Vui lòng tải lên ít nhất 2 ảnh phụ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log("🚀 Starting form submission...");
    console.log("📋 Form data:", formData);
    console.log("👥 Selected bidders at submit:", selectedBidders);
    console.log("📊 Selected bidders count:", selectedBidders.length);

    try {
      // Validate all fields
      if (!validateForm()) {
        toast({
          title: "Thông tin không hợp lệ",
          description: "Vui lòng kiểm tra lại các trường thông tin",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Create FormData for multipart upload
      const formDataObj = new FormData();

      // Add product details
      formDataObj.append("title", formData.title);
      formDataObj.append("description", formData.description);
      formDataObj.append("category_id", formData.category_id);
      formDataObj.append("start_price", formData.startingBid);
      formDataObj.append("bid_step", formData.biddingIncrement);
      if (formData.buyNowPrice) {
        formDataObj.append("buy_now_price", formData.buyNowPrice);
      }
      formDataObj.append("auto_extend", formData.autoExtend.toString());

      // Lưu thời gian vào DB
      if (formData.endDateTime) {
        // Nếu thiếu giây, thêm :00
        let dateStr = formData.endDateTime;
        if (dateStr.length === 16) dateStr += ":00";

        // Parse datetime-local input như UTC (không offset)
        // Ví dụ: "2026-01-04T23:28:00"
        const [datePart, timePart] = dateStr.split("T");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute, second] = timePart.split(":").map(Number);

        // Tạo Date object UTC - giữ nguyên giá trị user nhập
        // Ví dụ: 2026-01-04 23:28 -> 2026-01-04T23:28:00.000Z
        const endTimeUTC = new Date(
          Date.UTC(year, month - 1, day, hour, minute, second || 0)
        );
        const endTimeISOString = endTimeUTC.toISOString();

        // 🕐 DEBUG: Log time conversion
        console.log("⏰ [POST ITEM TIME]", {
          userInput: dateStr,
          savedToDb: endTimeISOString,
          explanation: `User chọn ${dateStr} → Lưu ${endTimeISOString} (UTC vào DB)`,
        });

        formDataObj.append("end_time", endTimeISOString);
      }

      // Add images
      formDataObj.append("main_image", mainImage);
      for (let i = 0; i < additionalImages.length; i++) {
        formDataObj.append("additional_images", additionalImages[i]);
      }

      // Create product (DO NOT set Content-Type header - browser sets it automatically with boundary)
      const response = await api.post("/seller/products", formDataObj);

      console.log("🔍 Product creation response:", response);
      console.log("📦 Response data:", response.data);
      console.log("✅ Selected bidders:", selectedBidders);

      // Handle different response structures
      let productId = null;
      if (response.data?.success && response.data?.data?.id) {
        productId = response.data.data.id;
      } else if (response.data?.id) {
        productId = response.data.id;
      } else if (response.success && response.data?.id) {
        productId = response.data.id;
      }

      console.log("🆔 Product ID:", productId);

      if (productId) {
        // Allow selected bidders to bid
        if (selectedBidders.length > 0) {
          console.log(
            `🎯 Allowing ${selectedBidders.length} bidders:`,
            selectedBidders
          );

          toast({
            title: "Đã tạo sản phẩm",
            description: `Đang thêm ${selectedBidders.length} người đấu giá được phép...`,
          });

          try {
            // Call batch API to allow multiple bidders
            const response = await api.post(
              `/seller/products/${productId}/allow-multiple-bidders`,
              {
                bidderIds: selectedBidders,
              }
            );

            console.log("✅ Batch allow response:", response.data);

            // Check if response has the expected structure
            if (response.data && response.data.data) {
              const { added, skipped, notFound } = response.data.data;

              if (added > 0) {
                toast({
                  title: "Thành công",
                  description: `Đã tạo sản phẩm và thêm ${added} người đấu giá thành công!${
                    skipped > 0
                      ? ` (Bỏ qua ${skipped} người đã đủ điều kiện)`
                      : ""
                  }`,
                });
              } else if (skipped > 0) {
                toast({
                  title: "Đã tạo sản phẩm",
                  description: `Tất cả ${skipped} người đã đủ điều kiện đấu giá`,
                });
              } else {
                toast({
                  title: "Thành công",
                  description: "Sản phẩm đã được tạo thành công!",
                });
              }
            } else {
              // If response structure is unexpected
              toast({
                title: "Đã tạo sản phẩm",
                description: "Sản phẩm đã được tạo thành công!",
              });
            }
          } catch (error) {
            console.error("❌ Failed to allow bidders:", error);
            toast({
              title: "Đã tạo sản phẩm",
              description:
                "Sản phẩm đã được tạo nhưng không thể thêm người đấu giá",
              variant: "destructive",
            });
          }
        } else {
          console.log("ℹ️ No bidders selected");
          toast({
            title: "Thành công",
            description: "Sản phẩm đã được tạo thành công!",
          });
        }

        // Clear form after successful creation
        setFormData({
          title: "",
          category_id: categories.length > 0 ? categories[0].id : "",
          description: "",
          startingBid: "",
          biddingIncrement: "",
          buyNowPrice: "",
          duration: "7",
          autoExtend: false,
        });
        setMainImage(null);
        setAdditionalImages([]);
        setSelectedBidders([]);

        // Redirect to seller dashboard
        setTimeout(() => {
          navigate("/seller/dashboard");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Failed to create product:", error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể tạo sản phẩm",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Return null if not a seller
  if (!user || user.role !== "seller") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Đăng sản phẩm đấu giá</h1>
          <p className="text-muted-foreground">
            Tạo danh mục mới và bắt đầu bán hàng
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Thông tin sản phẩm</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Tên sản phẩm *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (errors.title)
                      setErrors({ ...errors, title: undefined });
                  }}
                  placeholder="Nhập tên sản phẩm"
                  className={`mt-2 ${errors.title ? "border-destructive" : ""}`}
                  required
                />
                {errors.title && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Danh mục *</Label>
                {loadingCategories ? (
                  <div className="w-full mt-2 px-3 py-2 text-sm text-muted-foreground">
                    Đang tải danh mục...
                  </div>
                ) : categories.length === 0 ? (
                  <div className="w-full mt-2 px-3 py-2 text-sm text-destructive">
                    Không có danh mục con nào. Vui lòng liên hệ admin để tạo
                    danh mục.
                  </div>
                ) : (
                  <select
                    id="category"
                    value={formData.category_id}
                    onChange={(e) => {
                      setFormData({ ...formData, category_id: e.target.value });
                      if (errors.category)
                        setErrors({ ...errors, category: undefined });
                    }}
                    className={`w-full mt-2 px-3 py-2 rounded-lg border bg-background text-sm ${
                      errors.category ? "border-destructive" : "border-border"
                    }`}
                    required
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parent_name
                          ? `${cat.parent_name} → ${cat.name}`
                          : cat.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.category ? (
                  <p className="text-xs text-destructive mt-1">
                    {errors.category}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Chỉ có thể chọn danh mục con
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Mô tả *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (errors.description)
                      setErrors({ ...errors, description: undefined });
                  }}
                  placeholder="Mô tả chi tiết sản phẩm của bạn..."
                  className={`mt-2 min-h-32 ${
                    errors.description ? "border-destructive" : ""
                  }`}
                  required
                />
                {errors.description && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.description.length}/5000 ký tự
                </p>
              </div>
            </div>
          </Card>

          {/* Images */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Hình ảnh sản phẩm</h2>

            {/* Main Image */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-semibold">
                  Ảnh chính *
                </div>
                <p className="text-sm text-muted-foreground">
                  Ảnh đại diện cho sản phẩm
                </p>
              </div>

              {!mainImage ? (
                <div className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center hover:border-primary transition cursor-pointer bg-primary/5">
                  <label className="cursor-pointer">
                    <Upload className="w-10 h-10 text-primary mx-auto mb-2" />
                    <p className="font-semibold text-primary mb-1">
                      Tải lên ảnh chính
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG tối đa 10MB
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMainImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="relative group rounded-lg overflow-hidden border-2 border-primary">
                  <img
                    src={URL.createObjectURL(mainImage)}
                    alt="Ảnh chính"
                    className="w-full h-64 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeMainImage}
                    className="absolute top-2 right-2 bg-destructive/80 hover:bg-destructive text-white p-2 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-bold shadow-lg">
                    ✓ Ảnh chính
                  </div>
                </div>
              )}
            </div>

            {/* Additional Images */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm font-semibold">
                  Ảnh phụ *
                </div>
                <p className="text-sm text-muted-foreground">
                  Tối thiểu 2 ảnh, tối đa 10 ảnh
                </p>
              </div>

              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-secondary transition cursor-pointer mb-4">
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-semibold mb-1">Tải lên ảnh phụ</p>
                  <p className="text-xs text-muted-foreground">
                    Có thể chọn nhiều ảnh cùng lúc
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleAdditionalImagesUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {additionalImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {additionalImages.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-lg overflow-hidden border border-border"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Ảnh phụ ${idx + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAdditionalImage(idx)}
                        className="absolute top-1 right-1 bg-destructive/80 hover:bg-destructive text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs font-semibold">
                        Ảnh {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {additionalImages.length > 0 && (
                <p className="text-sm text-muted-foreground mt-3">
                  Đã tải lên {additionalImages.length} ảnh phụ
                </p>
              )}
            </div>
          </Card>

          {/* Allowed Bidders Selection */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5" />
              <h2 className="text-xl font-bold">
                Người đấu giá được phép (Tùy chọn)
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Chọn người dùng cụ thể được phép đấu giá sản phẩm này. Để trống để
              cho phép tất cả mọi người.
            </p>

            {loadingBidders ? (
              <div className="text-center py-8 text-muted-foreground">
                Đang tải danh sách người đấu giá...
              </div>
            ) : availableBidders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Không có người dùng khác
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={
                        selectedBidders.length === availableBidders.length
                      }
                      onCheckedChange={toggleAllBidders}
                    />
                    <Label
                      htmlFor="select-all"
                      className="font-semibold cursor-pointer"
                    >
                      Chọn tất cả ({availableBidders.length} người dùng)
                    </Label>
                  </div>
                  {selectedBidders.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {selectedBidders.length} đã chọn
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                  {availableBidders.map((bidder) => (
                    <div
                      key={bidder.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition"
                    >
                      <Checkbox
                        id={`bidder-${bidder.id}`}
                        checked={selectedBidders.includes(bidder.id)}
                        onCheckedChange={() => toggleBidder(bidder.id)}
                      />
                      <Label
                        htmlFor={`bidder-${bidder.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{bidder.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {bidder.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                              {bidder.role}
                            </span>
                            {parseFloat(bidder.rating) > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ⭐ {parseFloat(bidder.rating).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Pricing & Duration */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Giá & Thời gian</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startBid">Giá khởi điểm (VND) *</Label>
                  <Input
                    id="startBid"
                    type="text"
                    value={formatNumber(formData.startingBid)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startingBid: parseNumber(e.target.value),
                      })
                    }
                    placeholder="VD: 1,000,000"
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="increment">Bước giá (VND) *</Label>
                  <Input
                    id="increment"
                    type="text"
                    value={formatNumber(formData.biddingIncrement)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        biddingIncrement: parseNumber(e.target.value),
                      })
                    }
                    placeholder="VD: 100,000"
                    className="mt-2"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="buyNow">Giá mua ngay (VND)</Label>
                <Input
                  id="buyNow"
                  type="text"
                  value={formatNumber(formData.buyNowPrice)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      buyNowPrice: parseNumber(e.target.value),
                    })
                  }
                  placeholder="Tùy chọn - để trống nếu không có"
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="endDateTime">Thời gian kết thúc *</Label>
                  <Input
                    id="endDateTime"
                    type="datetime-local"
                    value={formData.endDateTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endDateTime: e.target.value })
                    }
                    className="mt-2"
                    required
                    step="60"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoExtend}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          autoExtend: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">
                      Tự động gia hạn nếu đấu giá trong 5 phút cuối
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              size="lg"
              disabled={
                isSubmitting || !mainImage || additionalImages.length < 2
              }
            >
              {isSubmitting ? "Đang đăng..." : "Đăng sản phẩm"}
            </Button>
            <Link to="/seller/dashboard">
              <Button type="button" variant="outline" size="lg">
                Hủy
              </Button>
            </Link>
          </div>
          {(!mainImage || additionalImages.length < 2) && (
            <div className="text-sm space-y-1">
              {!mainImage && (
                <p className="text-destructive">⚠ Vui lòng tải lên ảnh chính</p>
              )}
              {additionalImages.length < 2 && (
                <p className="text-destructive">
                  ⚠ Vui lòng tải lên ít nhất 2 ảnh phụ (
                  {additionalImages.length}/2)
                </p>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
