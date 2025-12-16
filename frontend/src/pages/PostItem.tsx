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

export default function PostItemPage() {
  const [formData, setFormData] = useState({
    title: "",
    category_id: "",
    description: "",
    startingBid: "",
    biddingIncrement: "",
    buyNowPrice: "",
    duration: "7",
    autoExtend: false,
    images: [] as File[],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [availableBidders, setAvailableBidders] = useState<AvailableBidder[]>([])
  const [selectedBidders, setSelectedBidders] = useState<string[]>([])
  const [loadingBidders, setLoadingBidders] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...Array.from(files)],
      }))
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

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        toast({
          title: "Missing Title",
          description: "Please enter a product title",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      if (!formData.description.trim()) {
        toast({
          title: "Missing Description",
          description: "Please enter a product description",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      if (!formData.category_id) {
        toast({
          title: "Missing Category",
          description: "Please select a category",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      if (!formData.startingBid || parseFloat(formData.startingBid) <= 0) {
        toast({
          title: "Invalid Starting Price",
          description: "Please enter a valid starting price",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      if (!formData.biddingIncrement || parseFloat(formData.biddingIncrement) <= 0) {
        toast({
          title: "Invalid Bid Step",
          description: "Please enter a valid bid increment",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      if (formData.images.length < 3) {
        toast({
          title: "Missing Images",
          description: "Please upload 1 main image and at least 2 additional images",
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

      // Add images (first image is main, rest are additional)
      formDataObj.append('main_image', formData.images[0])
      for (let i = 1; i < formData.images.length; i++) {
        formDataObj.append('additional_images', formData.images[i])
      }

      // Create product (DO NOT set Content-Type header - browser sets it automatically with boundary)
      const response = await api.post('/seller/products', formDataObj)

      if (response.data?.success) {
        const productId = response.data.data.id

        // Allow selected bidders to bid
        if (selectedBidders.length > 0) {
          toast({
            title: "Product Created",
            description: `Adding ${selectedBidders.length} allowed bidders...`
          })

          const allowPromises = selectedBidders.map(bidderId =>
            api.post(`/seller/products/${productId}/allow-unrated-bidder/${bidderId}`)
          )

          try {
            await Promise.all(allowPromises)
            toast({
              title: "Success",
              description: "Product created and bidders allowed successfully!",
            })
          } catch (error) {
            console.error('Failed to allow some bidders:', error)
            toast({
              title: "Partial Success",
              description: "Product created but some bidders could not be added",
              variant: "destructive"
            })
          }
        } else {
          toast({
            title: "Success",
            description: "Product created successfully!",
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
          images: [],
        })
        setSelectedBidders([])

        // Redirect to seller dashboard
        setTimeout(() => {
          navigate('/seller/dashboard')
        }, 1500)
      }
    } catch (error: any) {
      console.error('Failed to create product:', error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create product",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Post an Item for Auction</h1>
          <p className="text-muted-foreground">Create a new listing and start selling</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Item Details</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Item Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter item title"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                {loadingCategories ? (
                  <div className="w-full mt-2 px-3 py-2 text-muted-foreground">Loading categories...</div>
                ) : (
                  <select
                    id="category"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background"
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your item in detail..."
                  className="mt-2 min-h-32"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Images */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Photos (1 Main + 2 Additional)</h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition cursor-pointer">
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-semibold mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {formData.images.map((file, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden bg-muted">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx}`}
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-destructive/80 hover:bg-destructive text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute top-1 left-1 text-xs px-2 py-1 rounded font-semibold" style={{
                        backgroundColor: idx === 0 ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                        color: idx === 0 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))'
                      }}>
                        {idx === 0 ? '✓ Main Image' : `Additional ${idx}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Allowed Bidders Selection */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5" />
              <h2 className="text-xl font-bold">Allowed Bidders (Optional)</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select specific users who are allowed to bid on this product. Leave empty to allow all users.
            </p>

            {loadingBidders ? (
              <div className="text-center py-8 text-muted-foreground">Loading bidders...</div>
            ) : availableBidders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No other users available</div>
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
                      Select All ({availableBidders.length} users)
                    </Label>
                  </div>
                  {selectedBidders.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {selectedBidders.length} selected
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
            <h2 className="text-xl font-bold mb-6">Pricing & Duration</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startBid">Starting Bid (VND) *</Label>
                  <Input
                    id="startBid"
                    type="number"
                    value={formData.startingBid}
                    onChange={(e) => setFormData({ ...formData, startingBid: e.target.value })}
                    placeholder="e.g., 1000000"
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="increment">Bid Increment (VND) *</Label>
                  <Input
                    id="increment"
                    type="number"
                    value={formData.biddingIncrement}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        biddingIncrement: e.target.value,
                      })
                    }
                    placeholder="e.g., 100000"
                    className="mt-2"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="buyNow">Buy Now Price (VND)</Label>
                <Input
                  id="buyNow"
                  type="number"
                  value={formData.buyNowPrice}
                  onChange={(e) => setFormData({ ...formData, buyNowPrice: e.target.value })}
                  placeholder="Optional - leave empty if not available"
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Auction Duration (Days) *</Label>
                  <select
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    {[1, 3, 5, 7, 10, 14, 21, 30].map((day) => (
                      <option key={day} value={day}>
                        {day} day{day !== 1 ? "s" : ""}
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
                    <span className="text-sm">Auto-extend if bid within 5 min of end</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" size="lg" disabled={isSubmitting || formData.images.length < 3}>
              {isSubmitting ? "Posting..." : "Post Item"}
            </Button>
            <Link to="/seller/dashboard">
              <Button type="button" variant="outline" size="lg">
                Cancel
              </Button>
            </Link>
          </div>
          {formData.images.length < 3 && formData.images.length > 0 && (
            <p className="text-sm text-destructive">
              Please upload at least 3 images (1 main + 2 additional)
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
