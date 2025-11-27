"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { Upload, X } from "lucide-react"
import Link from "next/link"

export default function PostItemPage() {
  const [formData, setFormData] = useState({
    name: "",
    category: "Electronics",
    condition: "Excellent",
    description: "",
    startingBid: "",
    biddingIncrement: "",
    buyNowPrice: "",
    duration: "7",
    autoExtend: false,
    images: [] as string[],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = ["Electronics", "Fashion", "Home", "Sports", "Art", "Collectibles", "Jewelry", "Vehicles"]

  const conditions = ["Excellent", "Like New", "Good", "Fair", "Poor"]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, event.target.result as string],
            }))
          }
        }
        reader.readAsDataURL(file)
      })
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
    setTimeout(() => {
      setIsSubmitting(false)
      alert("Item posted successfully!")
    }, 1500)
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
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter item name"
                  className="mt-2"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="condition">Condition *</Label>
                  <select
                    id="condition"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    {conditions.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond}
                      </option>
                    ))}
                  </select>
                </div>
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
            <h2 className="text-xl font-bold mb-6">Photos (Minimum 3)</h2>
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
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden bg-muted">
                      <img
                        src={img || "/placeholder.svg"}
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
                      {idx === 0 && (
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          Main
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            <Link href="/seller/dashboard">
              <Button type="button" variant="outline" size="lg">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
