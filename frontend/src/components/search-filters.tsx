"use client"
import { Card } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

interface SearchFiltersProps {
  filters: {
    search: string
    category: string | null
    priceRange: [number, number]
    sortBy: string
    condition: string | null
    sellerRating: number
  }
  onChange: (filters: any) => void
}

const categories = ["Electronics", "Fashion", "Home", "Sports", "Art"]
const conditions = ["Excellent", "Like New", "Good", "Fair"]
const ratings = [4, 3.5, 3, 2.5, 0]

export function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    condition: true,
    rating: true,
  })

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
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer hover:opacity-75 transition">
                  <input
                    type="checkbox"
                    checked={filters.category === cat}
                    onChange={(e) =>
                      onChange({
                        ...filters,
                        category: e.target.checked ? cat : null,
                      })
                    }
                    className="w-4 h-4 rounded border-border cursor-pointer"
                  />
                  <span className="text-sm">{cat}</span>
                </label>
              ))}
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
