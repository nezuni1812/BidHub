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
    category: number | null
    categoryName: string | null
    priceRange: [number, number]
    sortBy: string
    condition: string | null
    sellerRating: number
    showWatchlist: boolean
  }
  onChange: (filters: any) => void
}

const conditions = ["Excellent", "Like New", "Good", "Fair"]
const ratings = [4, 3.5, 3, 2.5, 0]

export function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    condition: true,
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

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Filters</h3>

        {/* Watchlist */}
        <div className="mb-6 pb-6 border-b border-border">
          <Button
            variant={filters.showWatchlist ? "default" : "outline"}
            className="w-full justify-start gap-2"
            onClick={() => onChange({ ...filters, showWatchlist: !filters.showWatchlist })}
          >
            <Heart className={`w-4 h-4 ${filters.showWatchlist ? 'fill-current' : ''}`} />
            My Watchlist
          </Button>
        </div>

        {/* Category */}
        <div className="mb-6 pb-6 border-b border-border">
          <button
            onClick={() => toggleSection("category")}
            className="flex justify-between items-center w-full mb-3 font-medium text-sm"
          >
            Category
            <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.category ? "" : "-rotate-90"}`} />
          </button>
          {expandedSections.category && (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Loading categories...</p>
              ) : (
                categories.map((parent) => (
                <div key={parent.id} className="space-y-1">
                  {/* Parent Category */}
                  <div className="flex items-start gap-1">
                    {parent.children && parent.children.length > 0 && (
                      <button
                        onClick={() => toggleCategory(parent.id)}
                        className="mt-1 hover:bg-muted rounded p-0.5 transition-colors"
                      >
                        <ChevronRight 
                          className={`w-3.5 h-3.5 transition-transform ${
                            expandedCategories.has(parent.id) ? 'rotate-90' : ''
                          }`} 
                        />
                      </button>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer hover:opacity-75 transition flex-1 py-1">
                      <input
                        type="checkbox"
                        checked={filters.category === parseInt(parent.id)}
                        onChange={(e) =>
                          onChange({
                            ...filters,
                            category: e.target.checked ? parseInt(parent.id) : null,
                            categoryName: e.target.checked ? parent.name : null,
                          })
                        }
                        className="w-3.5 h-3.5 rounded border-border cursor-pointer flex-shrink-0"
                      />
                      <span className="text-sm font-medium">{parent.name}</span>
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
                            checked={filters.category === parseInt(child.id)}
                            onChange={(e) =>
                              onChange({
                                ...filters,
                                category: e.target.checked ? parseInt(child.id) : null,
                                categoryName: e.target.checked ? child.name : null,
                              })
                            }
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
            Price Range
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
                  placeholder="Min"
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
                  placeholder="Max"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                ${(filters.priceRange[0] / 1000000).toFixed(1)}M - ${(filters.priceRange[1] / 1000000).toFixed(1)}M
              </div>
            </div>
          )}
        </div>

        {/* Condition */}
        <div className="mb-6 pb-6 border-b border-border">
          <button
            onClick={() => toggleSection("condition")}
            className="flex justify-between items-center w-full mb-3 font-medium text-sm"
          >
            Condition
            <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.condition ? "" : "-rotate-90"}`} />
          </button>
          {expandedSections.condition && (
            <div className="space-y-2">
              {conditions.map((cond) => (
                <label key={cond} className="flex items-center gap-3 cursor-pointer hover:opacity-75 transition">
                  <input
                    type="checkbox"
                    checked={filters.condition === cond}
                    onChange={(e) =>
                      onChange({
                        ...filters,
                        condition: e.target.checked ? cond : null,
                      })
                    }
                    className="w-4 h-4 rounded border-border cursor-pointer"
                  />
                  <span className="text-sm">{cond}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Seller Rating */}
        <div>
          <button
            onClick={() => toggleSection("rating")}
            className="flex justify-between items-center w-full mb-3 font-medium text-sm"
          >
            Seller Rating
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
                  <span className="text-sm">{rating === 0 ? "Any" : `${rating}+ ★ (${Math.floor(rating * 10)}%)`}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
