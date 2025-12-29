"use client"
import { Card } from "@/components/ui/card"
import { ChevronDown, ChevronRight, Heart } from "lucide-react"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"

interface Category {
  id: string
  name: string
  parent_id: string | null
  product_count: string
  children?: Category[]
}

interface SearchFiltersProps {
  filters: {
    search: string
    categories: number[]
    categoryName: string | null
    priceRange: [number, number]
    sortBy: string
    sellerRating: number
    showWatchlist: boolean
  }
  onChange: (filters: any) => void
}

const ratings = [80, 60, 40, 20, 0]

export function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    rating: true,
  })
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Category[] }>('/categories/tree')
      console.log('Full API Response:', response)
      
      // Check if response is the wrapped format or direct array
      let categoriesData: Category[] = []
      
      if (Array.isArray(response)) {
        // Response is direct array (shouldn't happen but handle it)
        categoriesData = response
        console.log('Response is direct array')
      } else if (response.success && response.data) {
        // Response is wrapped format
        categoriesData = response.data
        console.log('Response has success wrapper')
      } else if (Array.isArray((response as any).data)) {
        // Fallback: check if response itself has data array
        categoriesData = (response as any).data
        console.log('Response.data is array')
      }
      
      if (categoriesData.length > 0) {
        console.log('Setting categories:', categoriesData.length, 'categories')
        setCategories(categoriesData)
        // Auto-expand first few parent categories
        const initialExpanded = new Set(categoriesData.slice(0, 3).map(c => c.id))
        setExpandedCategories(initialExpanded)
      } else {
        console.error('No categories data found in response')
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  // Helper: Get all child IDs of a parent category
  const getChildIds = (parent: Category): number[] => {
    if (!parent.children || parent.children.length === 0) return []
    return parent.children.map(child => parseInt(child.id))
  }

  // Helper: Check if all children are selected
  const areAllChildrenSelected = (parent: Category): boolean => {
    const childIds = getChildIds(parent)
    if (childIds.length === 0) return false
    return childIds.every(id => filters.categories.includes(id))
  }

  // Helper: Check if parent is selected (either directly or all children selected)
  const isParentSelected = (parent: Category): boolean => {
    const parentId = parseInt(parent.id)
    // Check if parent ID is in categories OR all children are selected
    return filters.categories.includes(parentId) || areAllChildrenSelected(parent)
  }

  // Handle parent category toggle
  const handleParentToggle = (parent: Category) => {
    const parentId = parseInt(parent.id)
    const childIds = getChildIds(parent)
    let newCategories = [...filters.categories]

    if (isParentSelected(parent)) {
      // Unselect: remove parent and all children
      newCategories = newCategories.filter(id => id !== parentId && !childIds.includes(id))
    } else {
      // Select: if has children, add all children; otherwise add parent
      if (childIds.length > 0) {
        // Add all children (don't add parent itself)
        childIds.forEach(id => {
          if (!newCategories.includes(id)) {
            newCategories.push(id)
          }
        })
      } else {
        // No children, add parent
        if (!newCategories.includes(parentId)) {
          newCategories.push(parentId)
        }
      }
    }

    onChange({
      ...filters,
      categories: newCategories,
      categoryName: newCategories.length > 0 ? 'Multiple' : null,
    })
  }

  // Handle child category toggle
  const handleChildToggle = (childId: number) => {
    let newCategories = [...filters.categories]
    
    if (newCategories.includes(childId)) {
      // Remove child
      newCategories = newCategories.filter(id => id !== childId)
    } else {
      // Add child
      newCategories.push(childId)
    }

    onChange({
      ...filters,
      categories: newCategories,
      categoryName: newCategories.length > 0 ? 'Multiple' : null,
    })
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Bộ lọc</h3>

        {/* Watchlist */}
        <div className="mb-6 pb-6 border-b border-border">
          <Button
            variant={filters.showWatchlist ? "default" : "outline"}
            className="w-full justify-start gap-2"
            onClick={() => onChange({ ...filters, showWatchlist: !filters.showWatchlist })}
          >
            <Heart className={`w-4 h-4 ${filters.showWatchlist ? 'fill-current' : ''}`} />
            Danh sách yêu thích
          </Button>
        </div>

        {/* Category */}
        <div className="mb-6 pb-6 border-b border-border">
          <button
            onClick={() => toggleSection("category")}
            className="flex justify-between items-center w-full mb-3 font-medium text-sm"
          >
            Danh mục
            <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.category ? "" : "-rotate-90"}`} />
          </button>
          {expandedSections.category && (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Đang tải danh mục...</p>
              ) : (
                categories.map((parent) => (
                <div key={parent.id} className="space-y-1">
                  {/* Parent Category */}
                  <div className="flex items-start gap-1">
                    <button
                      onClick={() => parent.children && parent.children.length > 0 && toggleCategory(parent.id)}
                      className={`mt-1 rounded p-0.5 transition-colors ${
                        parent.children && parent.children.length > 0 
                          ? 'hover:bg-muted cursor-pointer' 
                          : 'opacity-0 cursor-default'
                      }`}
                    >
                      <ChevronRight 
                        className={`w-3.5 h-3.5 transition-transform ${
                          expandedCategories.has(parent.id) ? 'rotate-90' : ''
                        }`} 
                      />
                    </button>
                    <label className="flex items-center gap-2 cursor-pointer hover:opacity-75 transition flex-1 py-1">
                      <input
                        type="checkbox"
                        checked={isParentSelected(parent)}
                        onChange={() => handleParentToggle(parent)}
                        className="w-3.5 h-3.5 rounded border-border cursor-pointer flex-shrink-0"
                      />
                      <span className="text-sm font-medium">
                        {parent.name}
                        {parent.children && parent.children.length > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">({parent.children.length})</span>
                        )}
                      </span>
                    </label>
                  </div>

                  {/* Child Categories */}
                  {parent.children && 
                   parent.children.length > 0 && 
                   expandedCategories.has(parent.id) && (
                    <div className="ml-5 space-y-1 border-l-2 border-border pl-2">
                      {parent.children.map((child) => (
                        <label 
                          key={child.id} 
                          className="flex items-center gap-2 cursor-pointer hover:opacity-75 transition py-1"
                        >
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(parseInt(child.id))}
                            onChange={() => handleChildToggle(parseInt(child.id))}
                            className="w-3.5 h-3.5 rounded border-border cursor-pointer flex-shrink-0"
                          />
                          <span className="text-sm">{child.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))
              )}
            </div>
          )}
        </div>

        {/* Price Range */}
        <div className="mb-6 pb-6 border-b border-border">
          <button
            onClick={() => toggleSection("price")}
            className="flex justify-between items-center w-full mb-3 font-medium text-sm"
          >
            Khoảng giá
            <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.price ? "" : "-rotate-90"}`} />
          </button>
          {expandedSections.price && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={(filters.priceRange[0] / 1000000).toFixed(1)}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      priceRange: [Number.parseFloat(e.target.value) * 1000000, filters.priceRange[1]],
                    })
                  }
                  className="w-full px-2 py-1 border border-border rounded text-sm"
                  placeholder="Tối thiểu"
                />
                <input
                  type="number"
                  value={(filters.priceRange[1] / 1000000).toFixed(1)}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      priceRange: [filters.priceRange[0], Number.parseFloat(e.target.value) * 1000000],
                    })
                  }
                  className="w-full px-2 py-1 border border-border rounded text-sm"
                  placeholder="Tối đa"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                ${(filters.priceRange[0] / 1000000).toFixed(1)}M - ${(filters.priceRange[1] / 1000000).toFixed(1)}M
              </div>
            </div>
          )}
        </div>

        {/* Seller Rating */}
        <div>
          <button
            onClick={() => toggleSection("rating")}
            className="flex justify-between items-center w-full mb-3 font-medium text-sm"
          >
            Đánh giá người bán
            <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.rating ? "" : "-rotate-90"}`} />
          </button>
          {expandedSections.rating && (
            <div className="space-y-2">
              {ratings.map((rating) => (
                <label key={rating} className="flex items-center gap-3 cursor-pointer hover:opacity-75 transition">
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.sellerRating === rating}
                    onChange={() =>
                      onChange({
                        ...filters,
                        sellerRating: rating,
                      })
                    }
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm">{rating === 0 ? "Tất cả" : `${rating}%+`}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
