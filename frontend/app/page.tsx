"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom";
import { Search, Heart, Filter, X, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { SearchFilters } from "@/components/search-filters"
import { 
  searchProducts,
  formatPrice,
  formatTimeRemaining,
  getImageUrl
} from "@/lib/products"
import type { Product, ProductSearchParams } from "@/lib/products"

interface Filters {
  search: string
  category: number | null
  priceRange: [number, number]
  sortBy: string
  condition: string | null
  sellerRating: number
}

export default function Home() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: null,
    priceRange: [0, 50000000],
    sortBy: "newest",
    condition: null,
    sellerRating: 0,
  })
  const [showFilters, setShowFilters] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 0
  })

  // Debug: Log products state when it changes
  useEffect(() => {
    console.log('🔄 [HOME STATE] Products updated:', {
      count: products.length,
      products: products.slice(0, 2) // Log first 2 products
    });
  }, [products]);

  // Fetch products based on filters
  useEffect(() => {
    const fetchProducts = async () => {
      console.log('🔍 [HOME] Starting fetchProducts...')
      setLoading(true)
      setError(null)
      
      try {
        // Map sortBy to backend format
        let sort_by: 'end_time_asc' | 'end_time_desc' | 'price_asc' | 'price_desc' | undefined
        
        switch (filters.sortBy) {
          case 'newest':
            sort_by = undefined // Default
            break
          case 'ending-soon':
            sort_by = 'end_time_asc'
            break
          case 'price-low':
            sort_by = 'price_asc'
            break
          case 'price-high':
            sort_by = 'price_desc'
            break
          case 'most-bids':
            // Backend doesn't support sorting by bids, we'll sort client-side
            sort_by = undefined
            break
        }
        
        const params: ProductSearchParams = {
          keyword: filters.search || undefined,
          category_id: filters.category || undefined,
          sort_by,
          page: pagination.page,
          page_size: pagination.page_size
        }
        
        console.log('📤 [HOME] Request params:', params)
        console.log('🌐 [HOME] API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1')
        
        const response = await searchProducts(params)
        
        console.log('📥 [HOME] Raw API Response:', response)
        console.log('📦 [HOME] Response.data:', response.data)
        console.log('📊 [HOME] Response.pagination:', response.pagination)
        
        let productList = response.data || []
        
        console.log('✅ [HOME] Product list length:', productList.length)
        if (productList.length > 0) {
          console.log('📝 [HOME] First product:', productList[0])
        }
        
        // Client-side sorting for most-bids if needed
        if (filters.sortBy === 'most-bids') {
          productList = [...productList].sort((a, b) => b.total_bids - a.total_bids)
          console.log('🔄 [HOME] Sorted by most bids')
        }
        
        setProducts(productList)
        setPagination(response.pagination)
        console.log('✨ [HOME] Products state updated successfully')
      } catch (err) {
        console.error('❌ [HOME] Error fetching products:', err)
        console.error('❌ [HOME] Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined
        })
        setError('Failed to load products')
      } finally {
        setLoading(false)
        console.log('🏁 [HOME] Fetch products completed')
      }
    }
    
    fetchProducts()
  }, [filters.search, filters.category, filters.sortBy, pagination.page])

  const hasActiveFilters = filters.search || filters.category || filters.condition || filters.sellerRating > 0

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Debug Info - Remove in production */}
      {import.meta.env.DEV && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-xs">
            <strong>🐛 Debug Info:</strong>
            <div className="mt-1 space-y-1">
              <div>API URL: {import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}</div>
              <div>Loading: {loading ? '✅ Yes' : '❌ No'}</div>
              <div>Error: {error || 'None'}</div>
              <div>Products Count: {products.length}</div>
              <div>Filters: search="{filters.search}", category={filters.category}, sort={filters.sortBy}</div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1">
              <SearchFilters filters={filters} onChange={setFilters} />
            </div>
          )}

          {/* Main Content */}
          <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            {/* Search Bar */}
            <div className="mb-6 flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
                {showFilters ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
              </Button>
            </div>

            {/* Sort and Results Count */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-muted-foreground">
                {loading ? (
                  "Loading..."
                ) : (
                  <>
                    Showing {products.length} result{products.length !== 1 ? "s" : ""} 
                    {pagination.total > 0 && ` of ${pagination.total}`}
                  </>
                )}
              </p>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="ending-soon">Ending Soon</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="most-bids">Most Bids</option>
                </select>
              </div>
            </div>

            {/* Active Filters Tags */}
            {hasActiveFilters && (
              <div className="mb-6 flex flex-wrap gap-2">
                {filters.search && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setFilters({ ...filters, search: "" })}
                  >
                    {filters.search} <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                {filters.category && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setFilters({ ...filters, category: null })}
                  >
                    Category: {filters.category} <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                {filters.condition && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setFilters({ ...filters, condition: null })}
                  >
                    {filters.condition} <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                {filters.sellerRating > 0 && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setFilters({ ...filters, sellerRating: 0 })}
                  >
                    Rating {filters.sellerRating}+ <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <Card className="p-12 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </Card>
            ) : products.length === 0 ? (
              <Card className="p-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      search: "",
                      category: null,
                      priceRange: [0, 50000000],
                      sortBy: "newest",
                      condition: null,
                      sellerRating: 0,
                    })
                  }
                >
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((product) => (
                  <Link key={product.id} to={`/product/${product.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                      <div className="relative h-48 bg-muted overflow-hidden group">
                        <img
                          src={getImageUrl(product.main_image)}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <button className="absolute top-3 right-3 bg-background/80 backdrop-blur p-2 rounded-full hover:bg-background">
                          <Heart className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <Badge variant="outline" className="w-fit mb-2">
                          {product.category_name}
                        </Badge>
                        <h3 className="font-semibold line-clamp-2 mb-2">{product.title}</h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          by {product.seller_name} ⭐ {product.seller_rating.toFixed(1)}
                        </p>
                        <div className="mt-auto space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Current bid</p>
                            <p className="text-lg font-bold text-primary">
                              {formatPrice(product.current_price)}
                            </p>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{product.total_bids} bids</span>
                            <span className="text-accent font-semibold">
                              {product.seconds_remaining 
                                ? formatTimeRemaining(product.seconds_remaining)
                                : 'Ended'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
