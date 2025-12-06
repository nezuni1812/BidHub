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
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/watchlist"
import { useToast } from "@/components/ui/use-toast"

interface Filters {
  search: string
  category: number | null
  categoryName: string | null
  priceRange: [number, number]
  sortBy: string
  condition: string | null
  sellerRating: number
  showWatchlist: boolean
}

export default function Home() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: null,
    categoryName: null,
    priceRange: [0, 50000000],
    sortBy: "newest",
    condition: null,
    sellerRating: 0,
    showWatchlist: false,
  })
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set())
  const [showFilters, setShowFilters] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 8,
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
  
  // Load watchlist IDs on initial mount
  useEffect(() => {
    const loadWatchlistIds = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      try {
        const watchlistData = await getWatchlist(1, 100);
        console.log('💖 [INITIAL_LOAD] Watchlist data:', watchlistData);
        if (watchlistData.data && watchlistData.data.length > 0) {
          const ids = new Set(watchlistData.data.map(p => parseInt((p as any).product_id)));
          console.log('💖 [INITIAL_LOAD] Loaded IDs:', Array.from(ids));
          setWatchlistIds(ids);
        }
      } catch (err) {
        console.log('Could not load initial watchlist:', err);
      }
    };
    
    loadWatchlistIds();
  }, []); // Run once on mount

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.category, filters.sortBy, filters.showWatchlist]);

  // Fetch products based on filters
  useEffect(() => {
    const fetchProducts = async () => {
      console.log('🔍 [HOME] Starting fetchProducts...')
      setLoading(true)
      setError(null)
      
      try {
        // If showing watchlist, fetch from watchlist API
        if (filters.showWatchlist) {
          const token = localStorage.getItem('access_token');
          if (!token) {
            toast({
              title: "Login Required",
              description: "Please login to view your watchlist",
              variant: "destructive"
            });
            setProducts([]);
            setPagination({ page: 1, page_size: 8, total: 0, total_pages: 0 });
            setLoading(false);
            return;
          }
          
          const watchlistData = await getWatchlist(currentPage, 8);
          console.log('💖 [WATCHLIST] API Response:', watchlistData);
          console.log('💖 [WATCHLIST] Data length:', watchlistData.data?.length || 0);
          
          // Transform watchlist data: use product_id as id for rendering
          const transformedProducts = (watchlistData.data || []).map((item: any) => ({
            ...item,
            id: item.product_id // Use product_id as the main id for links and keys
          }));
          
          console.log('💖 [WATCHLIST] Transformed products:', transformedProducts);
          
          setProducts(transformedProducts);
          setPagination(watchlistData.pagination || { page: 1, page_size: 8, total: 0, total_pages: 0 });
          
          // Update watchlist IDs - use product_id from watchlist response
          if (transformedProducts.length > 0) {
            const ids = new Set(transformedProducts.map(p => parseInt(p.id as any)));
            console.log('💖 [WATCHLIST] Extracted IDs:', Array.from(ids));
            setWatchlistIds(ids);
          }
          
          setLoading(false);
          return;
        }
        
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
          page: currentPage,
          page_size: 8
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
  }, [filters.search, filters.category, filters.sortBy, filters.showWatchlist, currentPage])
  
  // Toggle watchlist for a product
  const toggleWatchlist = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast({
        title: "Login Required",
        description: "Please login to add items to watchlist",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const isInWatchlist = watchlistIds.has(productId);
      
      if (isInWatchlist) {
        await removeFromWatchlist(productId);
        setWatchlistIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        toast({
          title: "Removed from watchlist",
          description: "Product removed from your watchlist"
        });
        
        // If currently viewing watchlist, remove from UI
        if (filters.showWatchlist) {
          setProducts(prev => prev.filter(p => parseInt(p.id as any) !== productId));
        }
      } else {
        await addToWatchlist(productId);
        setWatchlistIds(prev => new Set([...prev, productId]));
        toast({
          title: "Added to watchlist",
          description: "Product added to your watchlist"
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update watchlist",
        variant: "destructive"
      });
    }
  };

  const hasActiveFilters = filters.search || filters.category || filters.condition || filters.sellerRating > 0 || filters.showWatchlist

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

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
                    Showing {products?.length || 0} result{products?.length !== 1 ? "s" : ""} 
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
                    onClick={() => setFilters({ ...filters, category: null, categoryName: null })}
                  >
                    {filters.categoryName || 'Category'} <X className="w-3 h-3 ml-1" />
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
                      categoryName: null,
                      priceRange: [0, 50000000],
                      sortBy: "newest",
                      condition: null,
                      sellerRating: 0,
                      showWatchlist: false,
                    })
                  }
                >
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(products || []).map((product) => {
                  const productId = parseInt(product.id as any);
                  const isInWatchlist = watchlistIds.has(productId);
                  
                  return (
                    <Link key={product.id} to={`/product/${product.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                        <div className="relative h-48 bg-muted overflow-hidden group">
                          <img
                            src={getImageUrl(product.main_image)}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <button 
                            onClick={(e) => toggleWatchlist(productId, e)}
                            className={`absolute top-3 right-3 backdrop-blur p-2 rounded-full transition-all ${
                              isInWatchlist 
                                ? 'bg-red-500 hover:bg-red-600' 
                                : 'bg-background/80 hover:bg-background'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${isInWatchlist ? 'fill-white text-white' : ''}`} />
                          </button>
                        </div>
                      <div className="p-4 flex flex-col flex-1">
                        <Badge variant="outline" className="w-fit mb-2">
                          {product.category_name}
                        </Badge>
                        <h3 className="font-semibold line-clamp-2 mb-2">{product.title}</h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          by {product.seller_name} ⭐ {parseFloat(product.seller_rating as any).toFixed(1)}
                        </p>
                        <div className="mt-auto space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Current bid</p>
                            <p className="text-lg font-bold text-primary">
                              {formatPrice(parseFloat(product.current_price as any))}
                            </p>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{typeof product.total_bids === 'string' ? parseInt(product.total_bids) : product.total_bids} bids</span>
                            <span className="text-accent font-semibold">
                              {product.seconds_remaining 
                                ? formatTimeRemaining(parseFloat(product.seconds_remaining as any))
                                : 'Ended'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && products.length > 0 && pagination.total_pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({length: pagination.total_pages}, (_, i) => i + 1).map(page => (
                  <Button 
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))} 
                  disabled={currentPage === pagination.total_pages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
