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
  categories: number[]
  categoryName: string | null
  priceRange: [number, number] | null
  sortBy: string
  sellerRating: number
  showWatchlist: boolean
}

export default function Home() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<Filters>({
    search: "",
    categories: [],
    categoryName: null,
    priceRange: null,
    sortBy: "newest",
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
  }, [filters.search, filters.categories, filters.sortBy, filters.showWatchlist, filters.priceRange, filters.sellerRating]);

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
              title: "Yêu cầu đăng nhập",
              description: "Vui lòng đăng nhập để xem danh sách yêu thích",
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
        
        // Build params based on selected categories
        if (filters.categories.length === 0) {
          // No category filter
          // If we have client-side filters (price or rating), fetch all products
          const hasClientSideFilters = filters.priceRange || filters.sellerRating > 0;
          
          const params: ProductSearchParams = {
            keyword: filters.search || undefined,
            sort_by,
            page: hasClientSideFilters ? 1 : currentPage,
            page_size: hasClientSideFilters ? 1000 : 8
          }
          
          console.log('📤 [HOME] Request params (no category):', params)
          const response = await searchProducts(params)
          
          let productList = response.data || []
          
          // Apply client-side filters
          productList = productList.filter(product => {
            // Filter by price range (only if set)
            if (filters.priceRange) {
              const price = parseFloat(product.current_price as any);
              if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
                return false;
              }
            }
            
            // Filter by seller rating
            if (filters.sellerRating > 0) {
              const rating = parseFloat(product.seller_rating as any) * 100;
              if (rating < filters.sellerRating) {
                return false;
              }
            }
            
            return true;
          });
          
          // Client-side sorting for most-bids if needed
          if (filters.sortBy === 'most-bids') {
            productList = [...productList].sort((a, b) => (typeof b.total_bids === 'string' ? parseInt(b.total_bids) : b.total_bids) - (typeof a.total_bids === 'string' ? parseInt(a.total_bids) : a.total_bids))
          }
          
          // If we have client-side filters, do manual pagination
          if (hasClientSideFilters) {
            const startIndex = (currentPage - 1) * 8;
            const endIndex = startIndex + 8;
            const paginatedList = productList.slice(startIndex, endIndex);
            
            setProducts(paginatedList);
            setPagination({
              page: currentPage,
              page_size: 8,
              total: productList.length,
              total_pages: Math.ceil(productList.length / 8)
            });
          } else {
            setProducts(productList)
            setPagination(response.pagination)
          }
          
        } else if (filters.categories.length === 1) {
          // Single category - use API filter
          // If we have client-side filters (price or rating), fetch all products
          const hasClientSideFilters = filters.priceRange || filters.sellerRating > 0;
          
          const params: ProductSearchParams = {
            keyword: filters.search || undefined,
            category_id: filters.categories[0],
            sort_by,
            page: hasClientSideFilters ? 1 : currentPage,
            page_size: hasClientSideFilters ? 1000 : 8
          }
          
          console.log('📤 [HOME] Request params (single category):', params)
          const response = await searchProducts(params)
          
          let productList = response.data || []
          
          // Apply client-side filters
          productList = productList.filter(product => {
            // Filter by price range (only if set)
            if (filters.priceRange) {
              const price = parseFloat(product.current_price as any);
              if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
                return false;
              }
            }
            
            // Filter by seller rating
            if (filters.sellerRating > 0) {
              const rating = parseFloat(product.seller_rating as any) * 100;
              if (rating < filters.sellerRating) {
                return false;
              }
            }
            
            return true;
          });
          
          // Client-side sorting for most-bids if needed
          if (filters.sortBy === 'most-bids') {
            productList = [...productList].sort((a, b) => b.total_bids - a.total_bids)
          }
          
          // If we have client-side filters, do manual pagination
          if (hasClientSideFilters) {
            const startIndex = (currentPage - 1) * 8;
            const endIndex = startIndex + 8;
            const paginatedList = productList.slice(startIndex, endIndex);
            
            setProducts(paginatedList);
            setPagination({
              page: currentPage,
              page_size: 8,
              total: productList.length,
              total_pages: Math.ceil(productList.length / 8)
            });
          } else {
            setProducts(productList)
            setPagination(response.pagination)
          }
          
        } else {
          // Multiple categories - fetch each category and merge results
          console.log('📤 [HOME] Fetching multiple categories:', filters.categories)
          
          const allProducts: Product[] = []
          
          // Fetch products for each category
          for (const categoryId of filters.categories) {
            const params: ProductSearchParams = {
              keyword: filters.search || undefined,
              category_id: categoryId,
              sort_by,
              page: 1,
              page_size: 100 // Get more products per category
            }
            
            console.log('📤 [HOME] Fetching category:', categoryId)
            const response = await searchProducts(params)
            
            if (response.data && response.data.length > 0) {
              allProducts.push(...response.data)
            }
          }
          
          console.log('✅ [HOME] Total products from all categories:', allProducts.length)
          
          // Remove duplicates (in case a product appears in multiple responses)
          const uniqueProducts = Array.from(
            new Map(allProducts.map(p => [p.id, p])).values()
          )
          
          let productList = uniqueProducts
          
          // Apply client-side filters
          productList = productList.filter(product => {
            // Filter by price range (only if set)
            if (filters.priceRange) {
              const price = parseFloat(product.current_price as any);
              if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
                return false;
              }
            }
            
            // Filter by seller rating
            if (filters.sellerRating > 0) {
              const rating = parseFloat(product.seller_rating as any) * 100;
              if (rating < filters.sellerRating) {
                return false;
              }
            }
            
            return true;
          });
          
          // Client-side sorting for most-bids if needed
          if (filters.sortBy === 'most-bids') {
            productList = [...productList].sort((a, b) => (typeof b.total_bids === 'string' ? parseInt(b.total_bids) : b.total_bids) - (typeof a.total_bids === 'string' ? parseInt(a.total_bids) : a.total_bids))
          }
          
          // Handle pagination manually for merged results
          const startIndex = (currentPage - 1) * 8
          const endIndex = startIndex + 8
          const paginatedList = productList.slice(startIndex, endIndex)
          
          setProducts(paginatedList)
          setPagination({
            page: currentPage,
            page_size: 8,
            total: productList.length,
            total_pages: Math.ceil(productList.length / 8)
          })
        }
        
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
  }, [filters.search, filters.categories, filters.sortBy, filters.showWatchlist, filters.priceRange, filters.sellerRating, currentPage])
  
  // Toggle watchlist for a product
  const toggleWatchlist = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để thêm vào danh sách yêu thích",
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
          title: "Đã xóa khỏi danh sách yêu thích",
          description: "Sản phẩm đã được xóa khỏi danh sách yêu thích của bạn"
        });
        
        // If currently viewing watchlist, remove from UI
        if (filters.showWatchlist) {
          setProducts(prev => prev.filter(p => parseInt(p.id as any) !== productId));
        }
      } else {
        await addToWatchlist(productId);
        setWatchlistIds(prev => new Set([...prev, productId]));
        toast({
          title: "Đã thêm vào danh sách yêu thích",
          description: "Sản phẩm đã được thêm vào danh sách yêu thích của bạn"
        });
      }
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể cập nhật danh sách yêu thích",
        variant: "destructive"
      });
    }
  };

  const hasActiveFilters = filters.search || filters.category || filters.priceRange || filters.sellerRating > 0 || filters.showWatchlist

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
                  placeholder="Tìm kiếm sản phẩm..."
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
                  "Đang tải..."
                ) : (
                  <>
                    Hiển thị {products?.length || 0} {pagination.total > 0 && ` trong số ${pagination.total} sản phẩm`}
                  </>
                )}
              </p>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="ending-soon">Sắp kết thúc</option>
                  <option value="price-low">Giá: Thấp đến Cao</option>
                  <option value="price-high">Giá: Cao đến Thấp</option>
                  <option value="most-bids">Nhiều lượt đấu giá nhất</option>
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
                {filters.categories.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setFilters({ ...filters, categories: [], categoryName: null })}
                  >
                    {filters.categories.length === 1 
                      ? (filters.categoryName || 'Danh mục') 
                      : `${filters.categories.length} danh mục`} <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                {filters.priceRange && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setFilters({ ...filters, priceRange: null })}
                  >
                    Giá: {filters.priceRange[0].toLocaleString('vi-VN')} - {filters.priceRange[1].toLocaleString('vi-VN')} ₫ <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                {filters.sellerRating > 0 && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setFilters({ ...filters, sellerRating: 0 })}
                  >
                    Từ {filters.sellerRating}% <X className="w-3 h-3 ml-1" />
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
                  Thử lại
                </Button>
              </Card>
            ) : products.length === 0 ? (
              <Card className="p-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-muted-foreground mb-4">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn</p>
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      search: "",
                      categories: [],
                      categoryName: null,
                      priceRange: null,
                      sortBy: "newest",
                      sellerRating: 0,
                      showWatchlist: false,
                    })
                  }
                >
                  Xóa bộ lọc
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
                        <div className="flex items-center gap-2 mb-3">
                          <p className="text-xs text-muted-foreground">
                            bởi {product.seller_name}
                          </p>
                          {(() => {
                            const rating = (parseFloat(product.seller_rating as any) * 100);
                            let bgColor = 'bg-gray-100 dark:bg-gray-800';
                            let textColor = 'text-gray-600 dark:text-gray-400';
                            
                            if (rating >= 80) {
                              bgColor = 'bg-green-100 dark:bg-green-900/30';
                              textColor = 'text-green-700 dark:text-green-400';
                            } else if (rating >= 60) {
                              bgColor = 'bg-blue-100 dark:bg-blue-900/30';
                              textColor = 'text-blue-700 dark:text-blue-400';
                            } else if (rating >= 40) {
                              bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
                              textColor = 'text-yellow-700 dark:text-yellow-400';
                            } else if (rating >= 20) {
                              bgColor = 'bg-orange-100 dark:bg-orange-900/30';
                              textColor = 'text-orange-700 dark:text-orange-400';
                            } else {
                              bgColor = 'bg-red-100 dark:bg-red-900/30';
                              textColor = 'text-red-700 dark:text-red-400';
                            }
                            
                            return (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${bgColor} ${textColor} rounded-full text-xs font-medium`}>
                                {rating.toFixed(0)}%
                              </span>
                            );
                          })()}
                        </div>
                        <div className="mt-auto space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Giá hiện tại</p>
                            <p className="text-lg font-bold text-primary">
                              {formatPrice(parseFloat(product.current_price as any))}
                            </p>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{typeof product.total_bids === 'string' ? parseInt(product.total_bids) : product.total_bids} lượt đấu giá</span>
                            <span className="text-accent font-semibold">
                              {product.seconds_remaining 
                                ? formatTimeRemaining(parseFloat(product.seconds_remaining as any))
                                : 'Đã kết thúc'
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
                  Trước
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
                  Tiếp
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
