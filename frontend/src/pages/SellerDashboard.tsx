"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link, useNavigate } from "react-router-dom"
import { Plus, Edit, Eye, Trash2, MessageCircle, MapPin } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect, useState } from "react"
import { getSellerStats, getSellerProducts, getSellerOrders, type SellerStats, type SellerProduct, type SellerOrder } from "@/lib/seller"
import { formatPrice, formatTimeRemaining, getImageUrl } from "@/lib/products"

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);

  // Protect route - only sellers can access
  useEffect(() => {
    if (user && user.role !== 'seller') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'seller') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, productsData, ordersData] = await Promise.all([
        getSellerStats(),
        getSellerProducts(),
        getSellerOrders()
      ]);
      console.log('📊 Stats:', statsData);
      console.log('📦 Products response:', productsData);
      console.log('📋 Orders response:', ordersData);
      
      setStats(statsData);
      // productsData has nested structure: data.items
      const productItems = productsData.items || [];
      console.log('✅ Setting products:', productItems.length, 'items');
      setProducts(productItems);
      
      // ordersData has data directly
      const orderItems = ordersData || [];
      console.log('✅ Setting orders:', orderItems.length, 'items');
      setOrders(orderItems);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'seller') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-muted-foreground text-sm mb-1">Sản phẩm đang bán</p>
            <p className="text-3xl font-bold">{loading ? '...' : (stats?.active_products || 0)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-muted-foreground text-sm mb-1">Tổng doanh thu</p>
            <p className="text-3xl font-bold text-primary">
              {loading ? '...' : formatPrice(parseFloat(stats?.total_revenue || '0'))}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-muted-foreground text-sm mb-1">Đã bán</p>
            <p className="text-3xl font-bold">{loading ? '...' : (stats?.sold_products || 0)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-muted-foreground text-sm mb-1">Đánh giá</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">
                {loading ? '...' : (parseFloat(stats?.average_rating || '0')).toFixed(2)}
              </span>
              <span className="text-yellow-500">★</span>
            </div>
          </Card>
        </div>

        {/* Main Action */}
        <div className="mb-8">
          <Link to="/seller/post-item">
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Đăng sản phẩm mới
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active">Đang bán</TabsTrigger>
            <TabsTrigger value="sold">Đã bán</TabsTrigger>
          </TabsList>

          {/* Active Listings */}
          <TabsContent value="active" className="mt-6 space-y-4">
            {loading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Đang tải...</p>
              </Card>
            ) : products.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Chưa có sản phẩm đang bán</p>
              </Card>
            ) : (
              products.map((item) => (
                <Card key={item.id} className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <Badge className="bg-green-600">{item.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p className="text-xs">Giá hiện tại</p>
                          <p className="font-semibold text-foreground">{formatPrice(parseFloat(item.current_price))}</p>
                        </div>
                        <div>
                          <p className="text-xs">Lượt đặt giá</p>
                          <p className="font-semibold text-foreground">{item.bid_count}</p>
                        </div>
                        <div>
                          <p className="text-xs">Lượt xem</p>
                          <p className="font-semibold text-foreground">{item.views || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs">Thời gian còn lại</p>
                          <p className="font-semibold text-accent">
                            {formatTimeRemaining(Math.floor((new Date(item.end_time).getTime() - Date.now()) / 1000))}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/product/${item.id}`}>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                          <Eye className="w-4 h-4" />
                          Xem
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Sold Items */}
          <TabsContent value="sold" className="mt-6 space-y-4">
            {loading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Đang tải...</p>
              </Card>
            ) : orders.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Chưa có đơn hàng</p>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id} className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{order.product_title}</h3>
                      <Badge variant="outline" className={order.payment_status === 'completed' ? 'bg-green-50' : ''}>
                        {order.payment_status === 'completed' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Giá bán</p>
                        <p className="font-semibold">{formatPrice(parseFloat(order.total_price))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Người mua</p>
                        <p className="font-semibold">{order.buyer_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ngày đặt</p>
                        <p className="font-semibold">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>

                    {/* Show address when paid */}
                    {order.payment_status === 'completed' && order.buyer_address && (
                      <div className="border-t pt-4 mt-2">
                        <p className="text-sm font-semibold mb-2">Địa chỉ giao hàng:</p>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span>{order.buyer_address}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link to={`/chat`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <MessageCircle className="w-4 h-4" />
                          Chat với người mua
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
