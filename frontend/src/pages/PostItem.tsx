"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import { Upload, X, Users } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"

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
}

// Format number with commas
const formatNumber = (value: string): string => {
  // Remove all non-digit characters
  const number = value.replace(/\D/g, '');
  // Add commas
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Parse formatted number back to plain number
const parseNumber = (value: string): string => {
  return value.replace(/,/g, '');
};

export default function PostItemPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    category_id: "",
    description: "",
    startingBid: "",
    biddingIncrement: "",
    buyNowPrice: "",
    duration: "7",
    autoExtend: false,
  })
  
  const [mainImage, setMainImage] = useState<File | null>(null)
  const [additionalImages, setAdditionalImages] = useState<File[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [availableBidders, setAvailableBidders] = useState<AvailableBidder[]>([])
  const [selectedBidders, setSelectedBidders] = useState<string[]>([])
  const [loadingBidders, setLoadingBidders] = useState(false)
  
  // Protect route - only sellers can access
  useEffect(() => {
    if (user && user.role !== 'seller') {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true)
      try {
        const response = await api.get('/categories')
        console.log('📦 Categories response:', response)
        console.log('📊 Categories data:', response.data)
        
        if (response.data?.success && response.data?.data) {
          console.log('✅ Setting categories:', response.data.data)
          setCategories(response.data.data)
          // Set first category as default if available
          if (response.data.data.length > 0) {
            setFormData(prev => ({ ...prev, category_id: response.data.data[0].id }))
          }
        } else if (response.success && response.data) {
          console.log('✅ Setting categories (alt):', response.data)
          setCategories(response.data)
          if (response.data.length > 0) {
            setFormData(prev => ({ ...prev, category_id: response.data[0].id }))
          }
        } else {
          console.warn('⚠️ Unexpected categories response structure')
        }
      } catch (error) {
        console.error('❌ Failed to fetch categories:', error)
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive"
        })
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  // Fetch available bidders on mount
  useEffect(() => {
    const fetchBidders = async () => {
      setLoadingBidders(true)
      try {
        const response = await api.get('/seller/available-bidders')
        console.log('📦 Full response:', response)
        console.log('📊 Response data:', response.data)
        
        // Check if response has nested data structure
        if (response.data?.success && response.data?.data) {
          console.log('✅ Setting bidders:', response.data.data)
          setAvailableBidders(response.data.data)
        } else if (response.success && response.data) {
          // Alternative structure: response might already be unwrapped
          console.log('✅ Setting bidders (alt):', response.data)
          setAvailableBidders(response.data)
        } else {
          console.warn('⚠️ Unexpected response structure:', response)
        }
      } catch (error) {
        console.error('❌ Failed to fetch bidders:', error)
        toast({
          title: "Error",
          description: "Failed to load available bidders",
          variant: "destructive"
        })
      } finally {
        setLoadingBidders(false)
      }
    }
    fetchBidders()
  }, [])

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMainImage(file)
    }
  }

  const handleAdditionalImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setAdditionalImages((prev) => [...prev, ...Array.from(files)])
    }
  }

  const toggleBidder = (bidderId: string) => {
    setSelectedBidders(prev => 
      prev.includes(bidderId) 
        ? prev.filter(id => id !== bidderId)
        : [...prev, bidderId]
    )
  }

  const toggleAllBidders = () => {
    if (selectedBidders.length === availableBidders.length) {
      setSelectedBidders([])
    } else {
      setSelectedBidders(availableBidders.map(b => b.id))
    }
  }

  const removeMainImage = () => {
    setMainImage(null)
  }

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    console.log('🚀 Starting form submission...')
    console.log('📋 Form data:', formData)
    console.log('👥 Selected bidders at submit:', selectedBidders)
    console.log('📊 Selected bidders count:', selectedBidders.length)

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        toast({
          title: "Thiếu tên sản phẩm",
          description: "Vui lòng nhập tên sản phẩm",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      if (!formData.description.trim()) {
        toast({
          title: "Thiếu mô tả",
          description: "Vui lòng nhập mô tả sản phẩm",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      if (!formData.category_id) {
        toast({
          title: "Thiếu danh mục",
          description: "Vui lòng chọn danh mục",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      if (!formData.startingBid || parseFloat(formData.startingBid) <= 0) {
        toast({
          title: "Giá khởi điểm không hợp lệ",
          description: "Vui lòng nhập giá khởi điểm hợp lệ",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      if (!formData.biddingIncrement || parseFloat(formData.biddingIncrement) <= 0) {
        toast({
          title: "Bước giá không hợp lệ",
          description: "Vui lòng nhập bước giá hợp lệ",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      if (!mainImage) {
        toast({
          title: "Thiếu ảnh chính",
          description: "Vui lòng tải lên ảnh chính cho sản phẩm",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      if (additionalImages.length < 2) {
        toast({
          title: "Thiếu ảnh phụ",
          description: "Vui lòng tải lên ít nhất 2 ảnh phụ",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      // Create FormData for multipart upload
      const formDataObj = new FormData()
      
      // Add product details
      formDataObj.append('title', formData.title)
      formDataObj.append('description', formData.description)
      formDataObj.append('category_id', formData.category_id)
      formDataObj.append('start_price', formData.startingBid)
      formDataObj.append('bid_step', formData.biddingIncrement)
      if (formData.buyNowPrice) {
        formDataObj.append('buy_now_price', formData.buyNowPrice)
      }
      formDataObj.append('auto_extend', formData.autoExtend.toString())
      
      // Calculate end_time
      const endTime = new Date()
      endTime.setDate(endTime.getDate() + parseInt(formData.duration))
      formDataObj.append('end_time', endTime.toISOString())

      // Add images
      formDataObj.append('main_image', mainImage)
      for (let i = 0; i < additionalImages.length; i++) {
        formDataObj.append('additional_images', additionalImages[i])
      }

      // Create product (DO NOT set Content-Type header - browser sets it automatically with boundary)
      const response = await api.post('/seller/products', formDataObj)

      console.log('🔍 Product creation response:', response)
      console.log('📦 Response data:', response.data)
      console.log('✅ Selected bidders:', selectedBidders)

      // Handle different response structures
      let productId = null
      if (response.data?.success && response.data?.data?.id) {
        productId = response.data.data.id
      } else if (response.data?.id) {
        productId = response.data.id
      } else if (response.success && response.data?.id) {
        productId = response.data.id
      }

      console.log('🆔 Product ID:', productId)

      if (productId) {
        // Allow selected bidders to bid
        if (selectedBidders.length > 0) {
          console.log(`🎯 Allowing ${selectedBidders.length} bidders:`, selectedBidders)
          
          toast({
            title: "Đã tạo sản phẩm",
            description: `Đang thêm ${selectedBidders.length} người đấu giá được phép...`
          })

          const allowPromises = selectedBidders.map(bidderId => {
            console.log(`📤 Calling allow API for bidder ${bidderId}`)
            return api.post(`/seller/products/${productId}/allow-unrated-bidder/${bidderId}`)
          })

          try {
            const results = await Promise.all(allowPromises)
            console.log('✅ All bidders allowed:', results)
            toast({
              title: "Thành công",
              description: "Đã tạo sản phẩm và thêm người đấu giá thành công!",
            })
          } catch (error) {
            console.error('❌ Failed to allow some bidders:', error)
            toast({
              title: "Thành công một phần",
              description: "Đã tạo sản phẩm nhưng không thể thêm một số người đấu giá",
              variant: "destructive"
            })
          }
        } else {
          console.log('ℹ️ No bidders selected')
          toast({
            title: "Thành công",
            description: "Sản phẩm đã được tạo thành công!",
          })
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
        })
        setMainImage(null)
        setAdditionalImages([])
        setSelectedBidders([])

        // Redirect to seller dashboard
        setTimeout(() => {
          navigate('/seller/dashboard')
        }, 1500)
      }
    } catch (error: any) {
      console.error('Failed to create product:', error)
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể tạo sản phẩm",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Return null if not a seller
  if (!user || user.role !== 'seller') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Đăng sản phẩm đấu giá</h1>
          <p className="text-muted-foreground">Tạo danh mục mới và bắt đầu bán hàng</p>
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
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tên sản phẩm"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Danh mục *</Label>
                {loadingCategories ? (
                  <div className="w-full mt-2 px-3 py-2 text-muted-foreground">Đang tải danh mục...</div>
                ) : (
                  <select
                    id="category"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background"
                    required
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <Label htmlFor="description">Mô tả *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết sản phẩm của bạn..."
                  className="mt-2 min-h-32"
                  required
                />
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
                <p className="text-sm text-muted-foreground">Ảnh đại diện cho sản phẩm</p>
              </div>
              
              {!mainImage ? (
                <div className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center hover:border-primary transition cursor-pointer bg-primary/5">
                  <label className="cursor-pointer">
                    <Upload className="w-10 h-10 text-primary mx-auto mb-2" />
                    <p className="font-semibold text-primary mb-1">Tải lên ảnh chính</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG tối đa 10MB</p>
                    <input type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
                  </label>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border-2 border-primary">
                  <img
                    src={URL.createObjectURL(mainImage)}
                    alt="Ảnh chính"
                    className="w-full h-64 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeMainImage}
                    className="absolute top-2 right-2 bg-destructive hover:bg-destructive/90 text-white p-2 rounded-md shadow-lg"
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
                <p className="text-sm text-muted-foreground">Tối thiểu 2 ảnh, tối đa 10 ảnh</p>
              </div>
              
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-secondary transition cursor-pointer mb-4">
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-semibold mb-1">Tải lên ảnh phụ</p>
                  <p className="text-xs text-muted-foreground">Có thể chọn nhiều ảnh cùng lúc</p>
                  <input type="file" multiple accept="image/*" onChange={handleAdditionalImagesUpload} className="hidden" />
                </label>
              </div>

              {additionalImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {additionalImages.map((file, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-border">
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
              <h2 className="text-xl font-bold">Người đấu giá được phép (Tùy chọn)</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Chọn người dùng cụ thể được phép đấu giá sản phẩm này. Để trống để cho phép tất cả mọi người.
            </p>

            {loadingBidders ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải danh sách người đấu giá...</div>
            ) : availableBidders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Không có người dùng khác</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="select-all"
                      checked={selectedBidders.length === availableBidders.length}
                      onCheckedChange={toggleAllBidders}
                    />
                    <Label htmlFor="select-all" className="font-semibold cursor-pointer">
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
                  {availableBidders.map(bidder => (
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
                            <p className="text-xs text-muted-foreground">{bidder.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                              {bidder.role}
                            </span>
                            {parseFloat(bidder.rating) > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ⭐ {parseFloat(bidder.rating).toFixed(1)}
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
                    onChange={(e) => setFormData({ ...formData, startingBid: parseNumber(e.target.value) })}
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
                  onChange={(e) => setFormData({ ...formData, buyNowPrice: parseNumber(e.target.value) })}
                  placeholder="Tùy chọn - để trống nếu không có"
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Thời hạn đấu giá (Ngày) *</Label>
                  <select
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    {[1, 3, 5, 7, 10, 14, 21, 30].map((day) => (
                      <option key={day} value={day}>
                        {day} ngày
                      </option>
                    ))}
                  </select>
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
                    <span className="text-sm">Tự động gia hạn nếu đấu giá trong 5 phút cuối</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" size="lg" disabled={isSubmitting || !mainImage || additionalImages.length < 2}>
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
                <p className="text-destructive">⚠ Vui lòng tải lên ít nhất 2 ảnh phụ ({additionalImages.length}/2)</p>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
