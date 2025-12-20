"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Heart, ShoppingCart, Trophy, Package, Edit, Eye, Trash2, MessageCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { getActiveBids, getWonProducts, type BiddingProduct, type WonProduct } from "@/lib/dashboard"
import { getWatchlist } from "@/lib/watchlist"
import { formatPrice, formatTimeRemaining, getImageUrl, type Product } from "@/lib/products"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface SellerProduct {
  id: number
  title: string
  current_price: number
  total_bids: number
  total_views: number
  status: string
  end_time: string
  main_image: string
  created_at: string
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeBids, setActiveBids] = useState<BiddingProduct[]>([]);
  const [watchlist, setWatchlist] = useState<Product[]>([]);
  const [wonItems, setWonItems] = useState<WonProduct[]>([]);
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'watchlist' | 'won' | 'selling'>('active');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (activeTab === 'active') {
          const bidsData = await getActiveBids(1, 20);
          setActiveBids(bidsData.data);
        } else if (activeTab === 'watchlist') {
          const watchlistData = await getWatchlist(1, 20);
          setWatchlist(watchlistData.data);
        } else if (activeTab === 'won') {
          const wonData = await getWonProducts(1, 20);
          setWonItems(wonData.data);
        } else if (activeTab === 'selling' && user?.role === 'seller') {
          const response = await api.get('/seller/products?page=1&limit=20');
          setSellerProducts((response.data as SellerProduct[]) || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Vui lòng đăng nhập để xem bảng điều khiển</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{user.full_name}</h1>
                <p className="text-muted-foreground mb-3">{user.email}</p>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Vai trò: {user.role}</span>
                </div>
              </div>
              <Link to="/profile/settings">
                <Button>Chỉnh sửa hồ sơ</Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className={`grid w-full max-w-md ${user.role === 'seller' ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="active" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Đang đấu giá</span>
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Theo dõi</span>
            </TabsTrigger>
            <TabsTrigger value="won" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Đã thắng</span>
            </TabsTrigger>
            {user.role === 'seller' && (
              <TabsTrigger value="selling" className="gap-2">
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Đang bán</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Active Bids */}
          <TabsContent value="active" className="mt-6 space-y-4">
            {loading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Đang tải...</p>
              </Card>
            ) : activeBids.length === 0 ? (
              <Card className="p-8 text-center">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Chưa có lượt đấu giá nào</p>
              </Card>
            ) : (
              activeBids.map((bid) => (
                <Link key={bid.id} to={`/product/${bid.product_id}`}>
                  <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex gap-4">
                      <img 
                        src={getImageUrl(bid.main_image)} 
                        alt={bid.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg line-clamp-1">{bid.title}</h3>
                          {bid.is_winning ? (
                            <Badge className="bg-green-600">✓ Đang thắng</Badge>
                          ) : (
                            <Badge variant="outline">Bị vượt giá</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>Giá của bạn: {formatPrice(parseFloat(bid.my_bid_price))}</span>
                          <span>•</span>
                          <span>Hiện tại: {formatPrice(parseFloat(bid.current_price))}</span>
                          <span>•</span>
                          <span>{bid.total_bids} lượt đặt giá</span>
                          <span>•</span>
                          <span className="text-accent font-semibold">
                            Còn {formatTimeRemaining(bid.seconds_remaining)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </TabsContent>

          {/* Watchlist */}
          <TabsContent value="watchlist" className="mt-6 space-y-4">
            {loading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Đang tải...</p>
              </Card>
            ) : watchlist.length === 0 ? (
              <Card className="p-8 text-center">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Chưa có sản phẩm theo dõi</p>
              </Card>
            ) : (
              watchlist.map((item: any) => (
                <Link key={item.id} to={`/product/${item.product_id || item.id}`}>
                  <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex gap-4">
                      <img 
                        src={getImageUrl(item.main_image)} 
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>Giá hiện tại: {formatPrice(parseFloat(item.current_price))}</span>
                          <span>•</span>
                          <span className="text-accent font-semibold">
                            Còn {formatTimeRemaining(parseFloat(item.seconds_remaining))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </TabsContent>

          {/* Won Items */}
          <TabsContent value="won" className="mt-6 space-y-4">
            {loading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Đang tải...</p>
              </Card>
            ) : wonItems.length === 0 ? (
              <Card className="p-8 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Chưa có sản phẩm thắng đấu giá</p>
              </Card>
            ) : (
              wonItems.map((item) => (
                <Card key={item.id} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <img 
                      src={getImageUrl(item.main_image)} 
                      alt={item.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        {item.order_status === 'pending_payment' && (
                          <Badge variant="destructive">Chờ thanh toán</Badge>
                        )}
                        {item.order_status === 'paid' && (
                          <Badge className="bg-green-600">Đã thanh toán</Badge>
                        )}
                        {item.order_status === 'shipping' && (
                          <Badge className="bg-blue-600">Đang giao hàng</Badge>
                        )}
                        {item.order_status === 'delivered' && (
                          <Badge className="bg-green-700">Đã giao hàng</Badge>
                        )}
                        {item.order_status === 'completed' && (
                          <Badge className="bg-green-800">Hoàn thành</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        <span>Giá thắng: {formatPrice(parseFloat(item.final_price))}</span>
                        <span>•</span>
                        <span>Người bán: {item.seller_name || item.seller_email}</span>
                        <span>•</span>
                        <span>{new Date(item.won_date).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {item.order_status === 'pending_payment' && item.order_id && (
                          <Link to={`/checkout/${item.order_id}`}>
                            <Button size="sm" className="bg-primary">
                              Tiến hành thanh toán
                            </Button>
                          </Link>
                        )}
                        {item.order_status === 'paid' && (
                          <Badge className="bg-green-600">Đã thanh toán</Badge>
                        )}
                        {item.order_id && (
                          <Link to={`/chat`}>
                            <Button size="sm" variant="outline" className="gap-2">
                              <MessageCircle className="w-4 h-4" />
                              Nhắn tin với người bán
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Selling Tab - Only for Sellers */}
          {user.role === 'seller' && (
            <TabsContent value="selling" className="mt-6 space-y-4">
              {loading ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Đang tải...</p>
                </Card>
              ) : sellerProducts.length === 0 ? (
                <Card className="p-8 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">Chưa có sản phẩm đang bán</p>
                  <Link to="/seller/post-item">
                    <Button>Đăng sản phẩm mới</Button>
                  </Link>
                </Card>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-muted-foreground">
                      {sellerProducts.length} sản phẩm đang bán
                    </p>
                    <Link to="/seller/post-item">
                      <Button size="sm">Đăng sản phẩm mới</Button>
                    </Link>
                  </div>
                  {sellerProducts.map((product) => (
                    <Card key={product.id} className="p-4 sm:p-6">
                      <div className="flex gap-4">
                        <img 
                          src={getImageUrl(product.main_image)} 
                          alt={product.title}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg line-clamp-1">{product.title}</h3>
                            {product.status === 'active' && (
                              <Badge className="bg-green-600">Đang đấu giá</Badge>
                            )}
                            {product.status === 'pending' && (
                              <Badge variant="outline">Chờ duyệt</Badge>
                            )}
                            {product.status === 'ended' && (
                              <Badge variant="secondary">Đã kết thúc</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                            <span>Giá hiện tại: {formatPrice(parseFloat(product.current_price as any))}</span>
                            <span>•</span>
                            <span>{product.total_bids} lượt đặt giá</span>
                            <span>•</span>
                            <span>{product.total_views} lượt xem</span>
                            <span>•</span>
                            <span className="text-accent font-semibold">
                              Còn {formatTimeRemaining(Math.floor((new Date(product.end_time).getTime() - Date.now()) / 1000))}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Link to={`/seller/edit/${product.id}`}>
                              <Button variant="outline" size="sm" className="gap-2">
                                <Edit className="w-4 h-4" />
                                Sửa
                              </Button>
                            </Link>
                            <Link to={`/product/${product.id}`}>
                              <Button variant="outline" size="sm" className="gap-2">
                                <Eye className="w-4 h-4" />
                                Xem
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
