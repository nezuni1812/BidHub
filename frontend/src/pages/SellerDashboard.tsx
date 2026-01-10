"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link, useNavigate } from "react-router-dom"
import { Plus, Edit, Eye, Trash2, MessageCircle, MapPin, Package, XCircle, Star } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect, useState } from "react"
import { getSellerStats, getSellerProducts, getSellerOrders, markAsShipped, cancelOrder, rateBuyer, type SellerStats, type SellerProduct, type SellerOrder } from "@/lib/seller"
import { formatPrice, formatTimeRemaining, getImageUrl } from "@/lib/products"
import { useToast } from "@/components/ui/use-toast"
import { BuyerRatingDialog } from "@/components/buyer-rating-dialog"

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [shippingLoading, setShippingLoading] = useState<Record<number, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<number, string>>({});
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Protect route - only sellers can access
  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin');
    } else if (user && user.role !== 'seller') {
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
      console.log('🔄 Fetching seller dashboard data...');
      
      const [productsData, ordersData] = await Promise.all([
        getSellerProducts(),
        getSellerOrders()
      ]);
      
      console.log('📦 Products response:', productsData);
      console.log('📋 Orders response:', ordersData);
      
      // productsData has nested structure: data.items
      const productItems = productsData.items || [];
      console.log('✅ Setting products:', productItems.length, 'items');
      setProducts(productItems);
      
      // ordersData has data directly
      const orderItems = ordersData || [];
      console.log('✅ Setting orders:', orderItems.length, 'items');
      setOrders(orderItems);
      
      // Calculate stats from existing data
      const activeProducts = productItems.length;
      
      // Filter completed orders
      const completedOrders = orderItems.filter((order: any) => 
        order.payment_status === 'completed'
      );
      const soldProducts = completedOrders.length;
      
      // Calculate total revenue
      const totalRevenue = completedOrders.reduce((sum: number, order: any) => {
        return sum + parseFloat(order.total_price || '0');
      }, 0);
      
      // Fetch user profile to get rating
      let averageRating = '0.00';
      if (user?.id) {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
          const response = await fetch(`${API_URL}/bidder/users/${user.id}/profile`);
          if (response.ok) {
            const result = await response.json();
            averageRating = result.data.user.rating || '0.00';
            console.log('⭐ User rating from profile:', averageRating);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
      
      const calculatedStats = {
        active_products: activeProducts,
        sold_products: soldProducts,
        total_revenue: totalRevenue.toString(),
        average_rating: averageRating
      };
      
      console.log('📊 Calculated stats:', calculatedStats);
      setStats(calculatedStats);
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsShipped = async (orderId: number) => {
    try {
      setShippingLoading(prev => ({ ...prev, [orderId]: true }));
      
      await markAsShipped(orderId);
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái vận chuyển",
      });
      
      // Refresh orders
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Error marking as shipped:', error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể cập nhật trạng thái",
        variant: "destructive"
      });
    } finally {
      setShippingLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    const reason = prompt("Nhập lý do hủy đơn (tùy chọn):");
    if (reason === null) return; // User cancelled
    
    try {
      setActionLoading(prev => ({ ...prev, [orderId]: 'cancelling' }));
      
      await cancelOrder(orderId, reason);
      
      toast({
        title: "Thành công",
        description: "Đã hủy đơn hàng",
      });
      
      // Refresh orders
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể hủy đơn hàng",
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: '' }));
    }
  };

  const handleRateBuyer = async (orderId: number, rating: 1 | -1) => {
    const comment = prompt(rating === 1 ? "Nhập đánh giá tích cực (tùy chọn):" : "Nhập lý do đánh giá tiêu cực:");
    if (comment === null) return; // User cancelled
    
    try {
      setActionLoading(prev => ({ ...prev, [orderId]: 'rating' }));
      
      await rateBuyer(orderId, rating, comment);
      
      toast({
        title: "Thành công",
        description: rating === 1 ? "Đã gửi đánh giá tích cực" : "Đã gửi đánh giá tiêu cực",
      });
      
      // Refresh orders
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Error rating buyer:', error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể gửi đánh giá",
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: '' }));
    }
  };

  const openRatingDialog = (orderId: number) => {
    setSelectedOrderId(orderId);
    setRatingDialogOpen(true);
  };

  const submitRating = async (rating: 1 | -1, comment: string) => {
    if (!selectedOrderId) return;
    
    try {
      setActionLoading(prev => ({ ...prev, [selectedOrderId]: 'rating' }));
      
      await rateBuyer(selectedOrderId, rating, comment);
      
      toast({
        title: "Thành công",
        description: rating === 1 ? "Đã gửi đánh giá tích cực" : "Đã gửi đánh giá tiêu cực",
      });
      
      setRatingDialogOpen(false);
      setSelectedOrderId(null);
      
      // Refresh orders
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Error rating buyer:', error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể gửi đánh giá",
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedOrderId]: '' }));
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
            <p className="text-2xl font-bold">{loading ? '...' : (stats?.active_products || 0)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-muted-foreground text-sm mb-1">Tổng doanh thu</p>
            <p className="text-2xl font-bold text-primary break-words">
              {loading ? '...' : formatPrice(parseFloat(stats?.total_revenue || '0'))}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-muted-foreground text-sm mb-1">Đã bán</p>
            <p className="text-2xl font-bold">{loading ? '...' : (stats?.sold_products || 0)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-muted-foreground text-sm mb-1">Đánh giá</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {loading ? '...' : `${(parseFloat(stats?.average_rating || '0') * 100).toFixed(0)}%`}
              </span>
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
                      {order.payment_status !== 'completed' && (
                        <Badge variant="outline">Chờ thanh toán</Badge>
                      )}
                      {order.payment_status === 'completed' && order.order_status === 'paid' && (
                        <Badge className="bg-green-600">Đã thanh toán</Badge>
                      )}
                      {order.order_status === 'shipping' && (
                        <Badge className="bg-blue-600">Đang giao hàng</Badge>
                      )}
                      {order.order_status === 'delivered' && (
                        <Badge className="bg-green-700">Đã giao hàng</Badge>
                      )}
                      {order.order_status === 'completed' && (
                        <Badge className="bg-green-800">Hoàn thành</Badge>
                      )}
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

                    <div className="flex gap-2 flex-wrap">
                      {/* Chưa thanh toán - Hủy đơn */}
                      {order.payment_status !== 'completed' && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={actionLoading[order.id] === 'cancelling'}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          {actionLoading[order.id] === 'cancelling' ? 'Đang hủy...' : 'Hủy đơn'}
                        </Button>
                      )}
                      
                      {/* Đã thanh toán - Đã vận chuyển */}
                      {order.payment_status === 'completed' && order.order_status === 'paid' && order.buyer_address && (
                        <Button 
                          size="sm" 
                          className="gap-2 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleMarkAsShipped(order.id)}
                          disabled={shippingLoading[order.id]}
                        >
                          <Package className="w-4 h-4" />
                          {shippingLoading[order.id] ? 'Đang xử lý...' : 'Đã vận chuyển'}
                        </Button>
                      )}
                      
                      {/* Đã giao hàng - Đánh giá người mua */}
                      {(order.order_status === 'delivered' || order.order_status === 'completed') && (
                        <>
                          {!order.seller_rating ? (
                            <Button 
                              size="sm" 
                              className="bg-yellow-600 hover:bg-yellow-700"
                              onClick={() => openRatingDialog(order.id)}
                              disabled={actionLoading[order.id] === 'rating'}
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Đánh giá người mua
                            </Button>
                          ) : (
                            <Badge className={order.seller_rating === 1 ? "bg-green-600" : "bg-red-600"}>
                              <Star className="w-4 h-4 mr-1" />
                              Đã đánh giá: {order.seller_rating === 1 ? 'Tích cực' : 'Tiêu cực'}
                            </Badge>
                          )}
                        </>
                      )}
                      
                      {/* Chat */}
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

      {/* Rating Dialog */}
      <BuyerRatingDialog
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
        onSubmit={submitRating}
        isSubmitting={selectedOrderId ? actionLoading[selectedOrderId] === 'rating' : false}
      />
    </div>
  )
}
