"use client";

import type React from "react";

import { Navigation } from "@/components/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  Search,
  Heart,
  Filter,
  X,
  Loader2,
  Flame,
  Gavel,
  Diamond,
  Trophy,
  TrendingUp,
  Sparkles,
  Clock,
  DollarSign,
} from "lucide-react";
import { useState, useEffect } from "react";
import { SearchFilters } from "@/components/search-filters";
import {
  searchProducts,
  formatPrice,
  formatTimeRemaining,
  getImageUrl,
} from "@/lib/products";
import type { Product, ProductSearchParams } from "@/lib/products";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/watchlist";
import { useToast } from "@/components/ui/use-toast";

interface Filters {
  search: string;
  categories: number[];
  categoryName: string | null;
  priceRange: [number, number] | null;
  sortBy: string;
  sellerRating: number;
  showWatchlist: boolean;
}

// Helper function to format time with detailed minutes/seconds for < 1 hour
function formatDetailedTime(seconds: number): string {
  if (seconds <= 0) return "Đã kết thúc";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours === 0) {
    // Less than 1 hour - show minutes and seconds
    return `${minutes} phút ${secs} giây`;
  } else if (hours < 24) {
    // Less than 24 hours - show hours and minutes
    return `${hours} giờ ${minutes} phút`;
  } else {
    // More than 24 hours - show days and hours
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} ngày ${remainingHours} giờ`;
  }
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
  });
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 8,
    total: 0,
    total_pages: 0,
  });

  // Top 5 lists
  const [topEndingSoon, setTopEndingSoon] = useState<Product[]>([]);
  const [topMostBids, setTopMostBids] = useState<Product[]>([]);
  const [topHighestPrice, setTopHighestPrice] = useState<Product[]>([]);
  const [topLoading, setTopLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Debug: Log products state when it changes
  useEffect(() => {
    console.log("🔄 [HOME STATE] Products updated:", {
      count: products.length,
      products: products.slice(0, 2), // Log first 2 products
    });
  }, [products]);

  // Real-time countdown updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Update every second for accurate countdown

    return () => clearInterval(interval);
  }, []);

  // Fetch top 5 lists on initial mount
  useEffect(() => {
    const fetchTopLists = async () => {
      setTopLoading(true);
      try {
        // Fetch top 5 ending soon
        const endingSoonResponse = await searchProducts({
          sort_by: "end_time_asc",
          page: 1,
          page_size: 10, // Fetch more to ensure we get 5 active auctions
        });
        console.log(
          "🔥 Ending soon response:",
          endingSoonResponse.data?.length
        );
        setTopEndingSoon((endingSoonResponse.data || []).slice(0, 5));

        // Fetch top 5 highest price
        const highestPriceResponse = await searchProducts({
          sort_by: "price_desc",
          page: 1,
          page_size: 10, // Fetch more to ensure we get 5
        });
        console.log(
          "💎 Highest price response:",
          highestPriceResponse.data?.length
        );
        setTopHighestPrice((highestPriceResponse.data || []).slice(0, 5));

        // Fetch products for most bids (need larger set to sort)
        const mostBidsResponse = await searchProducts({
          page: 1,
          page_size: 50,
        });
        const sortedByBids = (mostBidsResponse.data || [])
          .sort((a, b) => {
            const bidsA =
              typeof a.total_bids === "string"
                ? Number.parseInt(a.total_bids)
                : a.total_bids;
            const bidsB =
              typeof b.total_bids === "string"
                ? Number.parseInt(b.total_bids)
                : b.total_bids;
            return bidsB - bidsA;
          })
          .slice(0, 5);
        console.log("⭐ Most bids response:", sortedByBids.length);
        setTopMostBids(sortedByBids);
      } catch (err) {
        console.error("Error fetching top lists:", err);
      } finally {
        setTopLoading(false);
      }
    };

    fetchTopLists();
  }, []);

  // Load watchlist IDs on initial mount
  useEffect(() => {
    const loadWatchlistIds = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        const watchlistData = await getWatchlist(1, 100);
        console.log("💖 [INITIAL_LOAD] Watchlist data:", watchlistData);
        if (watchlistData.data && watchlistData.data.length > 0) {
          const ids = new Set(
            watchlistData.data.map((p) =>
              Number.parseInt((p as any).product_id)
            )
          );
          console.log("💖 [INITIAL_LOAD] Loaded IDs:", Array.from(ids));
          setWatchlistIds(ids);
        }
      } catch (err) {
        console.log("Could not load initial watchlist:", err);
      }
    };

    loadWatchlistIds();
  }, []); // Run once on mount

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.search,
    filters.categories,
    filters.sortBy,
    filters.showWatchlist,
    filters.priceRange,
    filters.sellerRating,
  ]);

  // Fetch products based on filters
  useEffect(() => {
    const fetchProducts = async () => {
      console.log("🔍 [HOME] Starting fetchProducts...");
      setLoading(true);
      setError(null);

      try {
        // If showing watchlist, fetch from watchlist API
        if (filters.showWatchlist) {
          const token = localStorage.getItem("access_token");
          if (!token) {
            toast({
              title: "Yêu cầu đăng nhập",
              description: "Vui lòng đăng nhập để xem danh sách yêu thích",
              variant: "destructive",
            });
            setProducts([]);
            setPagination({ page: 1, page_size: 8, total: 0, total_pages: 0 });
            setLoading(false);
            return;
          }

          const watchlistData = await getWatchlist(currentPage, 8);
          console.log("💖 [WATCHLIST] API Response:", watchlistData);
          console.log(
            "💖 [WATCHLIST] Data length:",
            watchlistData.data?.length || 0
          );

          // Transform watchlist data: use product_id as id for rendering
          const transformedProducts = (watchlistData.data || []).map(
            (item: any) => ({
              ...item,
              id: item.product_id, // Use product_id as the main id for links and keys
            })
          );

          console.log(
            "💖 [WATCHLIST] Transformed products:",
            transformedProducts
          );

          setProducts(transformedProducts);
          setPagination(
            watchlistData.pagination || {
              page: 1,
              page_size: 8,
              total: 0,
              total_pages: 0,
            }
          );

          // Update watchlist IDs - use product_id from watchlist response
          if (transformedProducts.length > 0) {
            const ids = new Set(
              transformedProducts.map((p) => Number.parseInt(p.id as any))
            );
            console.log("💖 [WATCHLIST] Extracted IDs:", Array.from(ids));
            setWatchlistIds(ids);
          }

          setLoading(false);
          return;
        }

        // Map sortBy to backend format
        let sort_by:
          | "end_time_asc"
          | "end_time_desc"
          | "price_asc"
          | "price_desc"
          | undefined;

        switch (filters.sortBy) {
          case "newest":
            sort_by = undefined; // Default
            break;
          case "ending-soon":
            sort_by = "end_time_asc";
            break;
          case "price-low":
            sort_by = "price_asc";
            break;
          case "price-high":
            sort_by = "price_desc";
            break;
          case "most-bids":
            // Backend doesn't support sorting by bids, we'll sort client-side
            sort_by = undefined;
            break;
        }

        // Build params based on selected categories
        if (filters.categories.length === 0) {
          // No category filter
          // If we have client-side filters (price or rating), fetch all products
          const hasClientSideFilters =
            filters.priceRange || filters.sellerRating > 0;

          const params: ProductSearchParams = {
            keyword: filters.search || undefined,
            sort_by,
            page: hasClientSideFilters ? 1 : currentPage,
            page_size: hasClientSideFilters ? 1000 : 8,
          };

          console.log("📤 [HOME] Request params (no category):", params);
          const response = await searchProducts(params);

          let productList = response.data || [];

          // Apply client-side filters
          productList = productList.filter((product) => {
            // Filter by price range (only if set)
            if (filters.priceRange) {
              const price = Number.parseFloat(product.current_price as any);
              if (
                price < filters.priceRange[0] ||
                price > filters.priceRange[1]
              ) {
                return false;
              }
            }

            // Filter by seller rating
            if (filters.sellerRating > 0) {
              const rating =
                Number.parseFloat(product.seller_rating as any) * 100;
              if (rating < filters.sellerRating) {
                return false;
              }
            }

            return true;
          });

          // Client-side sorting for most-bids if needed
          if (filters.sortBy === "most-bids") {
            productList = [...productList].sort(
              (a, b) =>
                (typeof b.total_bids === "string"
                  ? Number.parseInt(b.total_bids)
                  : b.total_bids) -
                (typeof a.total_bids === "string"
                  ? Number.parseInt(a.total_bids)
                  : a.total_bids)
            );
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
              total_pages: Math.ceil(productList.length / 8),
            });
          } else {
            setProducts(productList);
            setPagination(response.pagination);
          }
        } else if (filters.categories.length === 1) {
          // Single category - use API filter
          // If we have client-side filters (price or rating), fetch all products
          const hasClientSideFilters =
            filters.priceRange || filters.sellerRating > 0;

          const params: ProductSearchParams = {
            keyword: filters.search || undefined,
            category_id: filters.categories[0],
            sort_by,
            page: hasClientSideFilters ? 1 : currentPage,
            page_size: hasClientSideFilters ? 1000 : 8,
          };

          console.log("📤 [HOME] Request params (single category):", params);
          const response = await searchProducts(params);

          let productList = response.data || [];

          // Apply client-side filters
          productList = productList.filter((product) => {
            // Filter by price range (only if set)
            if (filters.priceRange) {
              const price = Number.parseFloat(product.current_price as any);
              if (
                price < filters.priceRange[0] ||
                price > filters.priceRange[1]
              ) {
                return false;
              }
            }

            // Filter by seller rating
            if (filters.sellerRating > 0) {
              const rating =
                Number.parseFloat(product.seller_rating as any) * 100;
              if (rating < filters.sellerRating) {
                return false;
              }
            }

            return true;
          });

          // Client-side sorting for most-bids if needed
          if (filters.sortBy === "most-bids") {
            productList = [...productList].sort(
              (a, b) =>
                (typeof b.total_bids === "string"
                  ? Number.parseInt(b.total_bids)
                  : b.total_bids) -
                (typeof a.total_bids === "string"
                  ? Number.parseInt(a.total_bids)
                  : a.total_bids)
            );
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
              total_pages: Math.ceil(productList.length / 8),
            });
          } else {
            setProducts(productList);
            setPagination(response.pagination);
          }
        } else {
          // Multiple categories - fetch each category and merge results
          console.log(
            "📤 [HOME] Fetching multiple categories:",
            filters.categories
          );

          const allProducts: Product[] = [];

          // Fetch products for each category
          for (const categoryId of filters.categories) {
            const params: ProductSearchParams = {
              keyword: filters.search || undefined,
              category_id: categoryId,
              sort_by,
              page: 1,
              page_size: 100, // Get more products per category
            };

            console.log("📤 [HOME] Fetching category:", categoryId);
            const response = await searchProducts(params);

            if (response.data && response.data.length > 0) {
              allProducts.push(...response.data);
            }
          }

          console.log(
            "✅ [HOME] Total products from all categories:",
            allProducts.length
          );

          // Remove duplicates (in case a product appears in multiple responses)
          const uniqueProducts = Array.from(
            new Map(allProducts.map((p) => [p.id, p])).values()
          );

          let productList = uniqueProducts;

          // Apply client-side filters
          productList = productList.filter((product) => {
            // Filter by price range (only if set)
            if (filters.priceRange) {
              const price = Number.parseFloat(product.current_price as any);
              if (
                price < filters.priceRange[0] ||
                price > filters.priceRange[1]
              ) {
                return false;
              }
            }

            // Filter by seller rating
            if (filters.sellerRating > 0) {
              const rating =
                Number.parseFloat(product.seller_rating as any) * 100;
              if (rating < filters.sellerRating) {
                return false;
              }
            }

            return true;
          });

          // Client-side sorting for most-bids if needed
          if (filters.sortBy === "most-bids") {
            productList = [...productList].sort(
              (a, b) =>
                (typeof b.total_bids === "string"
                  ? Number.parseInt(b.total_bids)
                  : b.total_bids) -
                (typeof a.total_bids === "string"
                  ? Number.parseInt(a.total_bids)
                  : a.total_bids)
            );
          }

          // Handle pagination manually for merged results
          const startIndex = (currentPage - 1) * 8;
          const endIndex = startIndex + 8;
          const paginatedList = productList.slice(startIndex, endIndex);

          setProducts(paginatedList);
          setPagination({
            page: currentPage,
            page_size: 8,
            total: productList.length,
            total_pages: Math.ceil(productList.length / 8),
          });
        }

        console.log("✨ [HOME] Products state updated successfully");
      } catch (err) {
        console.error("❌ [HOME] Error fetching products:", err);
        console.error("❌ [HOME] Error details:", {
          message: err instanceof Error ? err.message : "Unknown error",
          stack: err instanceof Error ? err.stack : undefined,
        });
        setError("Failed to load products");
      } finally {
        setLoading(false);
        console.log("🏁 [HOME] Fetch products completed");
      }
    };

    fetchProducts();
  }, [
    filters.search,
    filters.categories,
    filters.sortBy,
    filters.showWatchlist,
    filters.priceRange,
    filters.sellerRating,
    currentPage,
  ]);

  // Toggle watchlist for a product
  const toggleWatchlist = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();

    const token = localStorage.getItem("access_token");
    if (!token) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để thêm vào danh sách yêu thích",
        variant: "destructive",
      });
      return;
    }

    try {
      const isInWatchlist = watchlistIds.has(productId);

      if (isInWatchlist) {
        await removeFromWatchlist(productId);
        setWatchlistIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        toast({
          title: "Đã xóa khỏi danh sách yêu thích",
          description: "Sản phẩm đã được xóa khỏi danh sách yêu thích của bạn",
        });

        // If currently viewing watchlist, remove from UI
        if (filters.showWatchlist) {
          setProducts((prev) =>
            prev.filter((p) => Number.parseInt(p.id as any) !== productId)
          );
        }
      } else {
        await addToWatchlist(productId);
        setWatchlistIds((prev) => new Set([...prev, productId]));
        toast({
          title: "Đã thêm vào danh sách yêu thích",
          description: "Sản phẩm đã được thêm vào danh sách yêu thích của bạn",
        });
      }
    } catch (err) {
      toast({
        title: "Lỗi",
        description:
          err instanceof Error
            ? err.message
            : "Không thể cập nhật danh sách yêu thích",
        variant: "destructive",
      });
    }
  };

  const hasActiveFilters =
    filters.search ||
    filters.categories.length > 0 ||
    filters.priceRange ||
    filters.sellerRating > 0 ||
    filters.showWatchlist;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top 5 Sections */}
        {!topLoading && (
          <div className="mb-16 space-y-20">
            {/* Top 5 Ending Soon */}
            <section>
              <div className="flex items-center gap-3 mb-8 group">
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                  <Flame className="w-6 h-6 fill-current" />
                </div>
                <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Sắp kết thúc
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {topEndingSoon.map((product, index) => {
                  const productId = Number.parseInt(product.id as any);
                  const isInWatchlist = watchlistIds.has(productId);

                  const getRankingConfig = (rank: number) => {
                    if (rank === 0)
                      return {
                        style:
                          "bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 text-white border-yellow-200",
                      };
                    if (rank === 1)
                      return {
                        style:
                          "bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 text-white border-slate-200",
                      };
                    if (rank === 2)
                      return {
                        style:
                          "bg-gradient-to-br from-orange-300 via-orange-500 to-orange-600 text-white border-orange-200",
                      };
                    return null;
                  };
                  const rankConfig = getRankingConfig(index);

                  return (
                    <Link key={product.id} to={`/product/${product.id}`}>
                      <Card className="group overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-none h-full flex flex-col">
                        <div className="relative h-44 bg-muted overflow-hidden">
                          <img
                            src={
                              getImageUrl(product.main_image) ||
                              "/placeholder.svg"
                            }
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {rankConfig && (
                            <div
                              className={`absolute top-0 left-0 ${rankConfig.style} px-3 py-1.5 rounded-br-xl shadow-lg flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider`}
                            >
                              {rankConfig.icon}
                              <span>#{index + 1}</span>
                            </div>
                          )}
                          <button
                            onClick={(e) => toggleWatchlist(productId, e)}
                            className={`absolute top-3 right-3 backdrop-blur-md p-2 rounded-full transition-all duration-300 transform group-hover:scale-110 ${
                              isInWatchlist
                                ? "bg-red-500 text-white shadow-lg"
                                : "bg-white/70 hover:bg-white text-foreground shadow-sm"
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                isInWatchlist ? "fill-current" : ""
                              }`}
                            />
                          </button>
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="font-bold text-sm line-clamp-2 mb-3 min-h-[2.5rem] group-hover:text-primary transition-colors">
                            {product.title}
                          </h3>
                          <div className="mt-auto space-y-3">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-black text-primary">
                                {formatPrice(
                                  Number.parseFloat(
                                    product.current_price as any
                                  )
                                )}
                              </span>
                            </div>
                            {(() => {
                              const endTimeUTC = new Date(product.end_time);
                              const secondsRemaining = Math.max(
                                0,
                                Math.floor(
                                  (endTimeUTC.getTime() - currentTime) / 1000
                                )
                              );
                              return (
                                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md w-fit">
                                  <Clock className="w-3 h-3" />
                                  {secondsRemaining > 0
                                    ? formatDetailedTime(secondsRemaining)
                                    : "Đã kết thúc"}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Top 5 Most Bids */}
            <section>
              <div className="flex items-center gap-3 mb-8 group">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Sôi nổi nhất
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {topMostBids.map((product, index) => {
                  const productId = Number.parseInt(product.id as any);
                  const isInWatchlist = watchlistIds.has(productId);
                  const getRankingConfig = (rank: number) => {
                    if (rank === 0)
                      return {
                        style:
                          "bg-gradient-to-br from-yellow-300 to-yellow-600 text-white",
                      };
                    if (rank === 1)
                      return {
                        style:
                          "bg-gradient-to-br from-slate-200 to-slate-500 text-white",
                      };
                    if (rank === 2)
                      return {
                        style:
                          "bg-gradient-to-br from-orange-300 to-orange-600 text-white",
                      };
                    return null;
                  };
                  const rankConfig = getRankingConfig(index);

                  return (
                    <Link key={product.id} to={`/product/${product.id}`}>
                      <Card className="group overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-none h-full flex flex-col">
                        <div className="relative h-44 bg-muted overflow-hidden">
                          <img
                            src={
                              getImageUrl(product.main_image) ||
                              "/placeholder.svg"
                            }
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {rankConfig && (
                            <div
                              className={`absolute top-0 left-0 ${rankConfig.style} px-3 py-1.5 rounded-br-xl shadow-lg flex items-center gap-1.5 font-bold text-xs`}
                            >
                              {rankConfig.icon}
                              <span>#{index + 1}</span>
                            </div>
                          )}
                          <button
                            onClick={(e) => toggleWatchlist(productId, e)}
                            className={`absolute top-3 right-3 backdrop-blur-md p-2 rounded-full transition-all duration-300 transform group-hover:scale-110 ${
                              isInWatchlist
                                ? "bg-red-500 text-white shadow-lg"
                                : "bg-white/70 hover:bg-white text-foreground shadow-sm"
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                isInWatchlist ? "fill-current" : ""
                              }`}
                            />
                          </button>
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="font-bold text-sm line-clamp-2 mb-3 min-h-[2.5rem] group-hover:text-primary transition-colors">
                            {product.title}
                          </h3>
                          <div className="mt-auto space-y-3">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-black text-primary">
                                {formatPrice(
                                  Number.parseFloat(
                                    product.current_price as any
                                  )
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-fit">
                              <Gavel className="w-3 h-3" />
                              {typeof product.total_bids === "string"
                                ? Number.parseInt(product.total_bids)
                                : product.total_bids}{" "}
                              lượt đấu giá
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Top 5 Highest Price */}
            <section>
              <div className="flex items-center gap-3 mb-8 group">
                <div className="p-2.5 rounded-xl bg-green-500/10 text-green-500 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Giá trị nhất
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {topHighestPrice.map((product, index) => {
                  const productId = Number.parseInt(product.id as any);
                  const isInWatchlist = watchlistIds.has(productId);
                  const getRankingConfig = (rank: number) => {
                    if (rank === 0)
                      return {
                        style:
                          "bg-gradient-to-br from-yellow-300 to-yellow-600 text-white",
                      };
                    if (rank === 1)
                      return {
                        style:
                          "bg-gradient-to-br from-slate-200 to-slate-500 text-white",
                      };
                    if (rank === 2)
                      return {
                        style:
                          "bg-gradient-to-br from-orange-300 to-orange-600 text-white",
                      };
                    return null;
                  };
                  const rankConfig = getRankingConfig(index);

                  return (
                    <Link key={product.id} to={`/product/${product.id}`}>
                      <Card className="group overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-none h-full flex flex-col">
                        <div className="relative h-44 bg-muted overflow-hidden">
                          <img
                            src={
                              getImageUrl(product.main_image) ||
                              "/placeholder.svg"
                            }
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {rankConfig && (
                            <div
                              className={`absolute top-0 left-0 ${rankConfig.style} px-3 py-1.5 rounded-br-xl shadow-lg flex items-center gap-1.5 font-bold text-xs`}
                            >
                              {rankConfig.icon}
                              <span>#{index + 1}</span>
                            </div>
                          )}
                          <button
                            onClick={(e) => toggleWatchlist(productId, e)}
                            className={`absolute top-3 right-3 backdrop-blur-md p-2 rounded-full transition-all duration-300 transform group-hover:scale-110 ${
                              isInWatchlist
                                ? "bg-red-500 text-white shadow-lg"
                                : "bg-white/70 hover:bg-white text-foreground shadow-sm"
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                isInWatchlist ? "fill-current" : ""
                              }`}
                            />
                          </button>
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="font-bold text-sm line-clamp-2 mb-3 min-h-[2.5rem] group-hover:text-primary transition-colors">
                            {product.title}
                          </h3>
                          <div className="mt-auto space-y-3">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-black text-primary">
                                {formatPrice(
                                  Number.parseFloat(
                                    product.current_price as any
                                  )
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 mt-16">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <SearchFilters filters={filters} onChange={setFilters} />
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            {/* Search Bar - Redesigned */}
            <div className="mb-8 flex gap-3">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Khám phá hàng ngàn vật phẩm đấu giá..."
                  className="pl-12 h-14 rounded-2xl border-none bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-background transition-all text-lg shadow-sm"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-14 w-14 rounded-2xl transition-all duration-300 ${
                  showFilters
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {showFilters ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Filter className="w-6 h-6" />
                )}
              </Button>
            </div>

            {/* Sort and Results Count */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-black tracking-tight mb-1">
                  Tất cả sản phẩm
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang tìm
                      kiếm...
                    </span>
                  ) : (
                    <>
                      Tìm thấy{" "}
                      <span className="text-foreground font-bold">
                        {pagination.total}
                      </span>{" "}
                      kết quả phù hợp
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-xl">
                <span className="text-xs font-bold text-muted-foreground px-2 uppercase tracking-wider">
                  Sắp xếp:
                </span>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters({ ...filters, sortBy: e.target.value })
                  }
                  className="px-3 py-1.5 rounded-lg border-none bg-background text-sm font-bold focus:ring-0 cursor-pointer shadow-sm"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="ending-soon">Sắp kết thúc</option>
                  <option value="price-low">Giá: Thấp đến Cao</option>
                  <option value="price-high">Giá: Cao đến Thấp</option>
                  <option value="most-bids">Nhiều lượt nhất</option>
                </select>
              </div>
            </div>

            {/* Active Filters Tags */}
            {hasActiveFilters && (
              <div className="mb-8 flex flex-wrap gap-2.5">
                {filters.search && (
                  <Badge
                    variant="secondary"
                    className="pl-3 pr-1 py-1.5 rounded-full bg-primary/10 text-primary border-none font-bold hover:bg-primary/20 cursor-pointer"
                    onClick={() => setFilters({ ...filters, search: "" })}
                  >
                    "{filters.search}"{" "}
                    <X className="w-4 h-4 ml-1.5 p-0.5 rounded-full bg-primary/20" />
                  </Badge>
                )}
                {/* ... existing badges updated for consistency ... */}
                {filters.categories.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="pl-3 pr-1 py-1.5 rounded-full bg-blue-500/10 text-blue-600 border-none font-bold hover:bg-blue-500/20 cursor-pointer"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        categories: [],
                        categoryName: null,
                      })
                    }
                  >
                    {filters.categories.length === 1
                      ? filters.categoryName || "Danh mục"
                      : `${filters.categories.length} danh mục`}{" "}
                    <X className="w-4 h-4 ml-1.5 p-0.5 rounded-full bg-blue-500/20" />
                  </Badge>
                )}
                {filters.priceRange && (
                  <Badge
                    variant="secondary"
                    className="pl-3 pr-1 py-1.5 rounded-full bg-green-500/10 text-green-600 border-none font-bold hover:bg-green-500/20 cursor-pointer"
                    onClick={() => setFilters({ ...filters, priceRange: null })}
                  >
                    Giá: {filters.priceRange[0].toLocaleString("vi-VN")} -{" "}
                    {filters.priceRange[1].toLocaleString("vi-VN")} ₫{" "}
                    <X className="w-4 h-4 ml-1.5 p-0.5 rounded-full bg-green-500/20" />
                  </Badge>
                )}
              </div>
            )}

            {/* Products Grid - Redesigned Card */}
            {loading ? (
              <div className="flex flex-col justify-center items-center py-24 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                <p className="text-muted-foreground font-medium animate-pulse">
                  Đang tải danh sách sản phẩm...
                </p>
              </div>
            ) : error ? (
              <Card className="p-16 text-center border-dashed">
                <p className="text-red-500 font-bold mb-6">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="rounded-xl px-8 shadow-lg shadow-primary/20"
                >
                  Thử lại
                </Button>
              </Card>
            ) : products.length === 0 ? (
              <Card className="p-20 text-center border-dashed rounded-3xl">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-xl font-black mb-2">
                  KHÔNG TÌM THẤY SẢN PHẨM
                </h3>
                <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
                  Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để khám phá những
                  món đồ khác
                </p>
                <Button
                  variant="outline"
                  className="rounded-xl px-8 font-bold bg-transparent"
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
                  Xóa tất cả bộ lọc
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {(products || []).map((product) => {
                  const productId = Number.parseInt(product.id as any);
                  const isInWatchlist = watchlistIds.has(productId);

                  return (
                    <Link key={product.id} to={`/product/${product.id}`}>
                      <Card className="group overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-500 border-none rounded-2xl flex flex-col h-full">
                        <div className="relative h-60 bg-muted overflow-hidden">
                          <img
                            src={
                              getImageUrl(product.main_image) ||
                              "/placeholder.svg"
                            }
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute top-4 left-4 flex gap-2">
                            <Badge className="bg-white/90 backdrop-blur-md text-foreground border-none font-bold py-1 px-3 shadow-sm">
                              {product.category_name}
                            </Badge>
                            {(() => {
                              const minutesSinceCreated =
                                product.minutes_since_created
                                  ? typeof product.minutes_since_created ===
                                    "string"
                                    ? Number.parseFloat(
                                        product.minutes_since_created
                                      )
                                    : product.minutes_since_created
                                  : null;
                              if (
                                minutesSinceCreated !== null &&
                                minutesSinceCreated <= 60
                              ) {
                                return (
                                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-none font-black py-1 px-3 shadow-lg animate-pulse">
                                    <Sparkles className="w-3 h-3 mr-1 inline" />
                                    MỚI
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <button
                            onClick={(e) => toggleWatchlist(productId, e)}
                            className={`absolute top-4 right-4 backdrop-blur-md p-2.5 rounded-full transition-all duration-300 transform group-hover:scale-110 shadow-lg ${
                              isInWatchlist
                                ? "bg-red-500 text-white"
                                : "bg-white/80 hover:bg-white text-foreground"
                            }`}
                          >
                            <Heart
                              className={`w-5 h-5 ${
                                isInWatchlist ? "fill-current" : ""
                              }`}
                            />
                          </button>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          <h3 className="font-black text-lg line-clamp-2 mb-3 leading-tight group-hover:text-primary transition-colors h-[3rem] overflow-hidden text-ellipsis">
                            {product.title}
                          </h3>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                              {product.seller_name
                                ?.substring(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <p className="text-xs font-bold text-muted-foreground tracking-tighter">
                                Người bán
                              </p>
                              <p className="text-sm font-black">
                                {product.seller_name}
                              </p>
                            </div>
                            {/* Rating badge ... existing rating logic ... */}
                            {(() => {
                              const rating =
                                Number.parseFloat(
                                  product.seller_rating as any
                                ) * 100;
                              let colorClass = "text-green-600 bg-green-50";
                              if (rating < 80)
                                colorClass = "text-blue-600 bg-blue-50";
                              if (rating < 60)
                                colorClass = "text-yellow-600 bg-yellow-50";

                              return (
                                <span
                                  className={`ml-auto inline-flex items-center px-2.5 py-1 ${colorClass} rounded-lg text-xs font-black shadow-sm`}
                                >
                                  {rating.toFixed(0)}%
                                </span>
                              );
                            })()}
                          </div>
                          <div className="mt-auto pt-3 border-t border-muted-foreground/10">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <p className="text-xs font-bold text-muted-foreground tracking-widest mb-1">
                                  Giá đấu hiện tại
                                </p>
                                <p className="text-2xl font-black text-primary tracking-tight">
                                  {formatPrice(
                                    Number.parseFloat(
                                      product.current_price as any
                                    )
                                  )}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold text-muted-foreground tracking-widest mb-1">
                                  Lượt đấu
                                </p>
                                <Badge
                                  variant="secondary"
                                  className="font-black bg-muted/80 text-foreground border-none"
                                >
                                  {typeof product.total_bids === "string"
                                    ? Number.parseInt(product.total_bids)
                                    : product.total_bids}
                                </Badge>
                              </div>
                            </div>
                            {(() => {
                              const endTimeUTC = new Date(product.end_time);
                              const secondsRemaining = Math.max(
                                0,
                                Math.floor(
                                  (endTimeUTC.getTime() - currentTime) / 1000
                                )
                              );
                              const threeDaysInSeconds = 259200;

                              if (
                                secondsRemaining > 0 &&
                                secondsRemaining < threeDaysInSeconds
                              ) {
                                // Show real-time countdown for < 3 days
                                return (
                                  <div
                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm tracking-widest transition-colors ${
                                      secondsRemaining < 3600
                                        ? "bg-red-50 text-red-600 border border-red-100 animate-pulse"
                                        : secondsRemaining < 86400
                                        ? "bg-orange-50 text-orange-600 border border-orange-100"
                                        : "bg-yellow-50 text-yellow-600 border border-yellow-100"
                                    }`}
                                  >
                                    <Clock className="w-4 h-4" />
                                    {formatDetailedTime(secondsRemaining)}
                                  </div>
                                );
                              } else if (secondsRemaining > 0) {
                                // Just show end date for > 3 days
                                return (
                                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm bg-muted/50 text-foreground/70">
                                    <Clock className="w-4 h-4" />
                                    Kết thúc:{" "}
                                    {endTime.toLocaleDateString("vi-VN")}
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm bg-gray-100 text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    Đã kết thúc
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination ... existing pagination updated for style ... */}
            {!loading &&
              !error &&
              products.length > 0 &&
              pagination.total_pages > 1 && (
                <div className="mt-16 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    className="rounded-xl h-12 px-6 font-bold bg-transparent"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Trước
                  </Button>
                  <div className="flex gap-2 bg-muted/50 p-1.5 rounded-2xl">
                    {Array.from(
                      { length: pagination.total_pages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "ghost"}
                        className={`w-10 h-10 rounded-xl font-black ${
                          currentPage === page
                            ? "shadow-lg shadow-primary/20"
                            : ""
                        }`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-xl h-12 px-6 font-bold bg-transparent"
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(pagination.total_pages, prev + 1)
                      )
                    }
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
  );
}
