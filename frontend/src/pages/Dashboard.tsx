"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Heart, ShoppingCart, Trophy, Edit, Eye, Trash2, MessageCircle, CheckCircle, Star, XCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { getActiveBids, getWonProducts, confirmDelivery, rateSeller, cancelOrder as cancelBuyerOrder, type BiddingProduct, type WonProduct } from "@/lib/dashboard"
import { getWatchlist } from "@/lib/watchlist"
import { formatPrice, formatTimeRemaining, getImageUrl, type Product } from "@/lib/products"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'watchlist' | 'won'>('active');
  const [actionLoading, setActionLoading] = useState<Record<number, string>>({});
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [ratingType, setRatingType] = useState<'1' | '-1'>('1');
  const [ratingComment, setRatingComment] = useState('');

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
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab, user]);

  const handleConfirmDelivery = async (orderId: number) => {
    try {
      setActionLoading(prev => ({ ...prev, [orderId]: 'confirming' }));
      
      await confirmDelivery(orderId);
      
      toast({
        title: "Thành công",
        description: "Đã xác nhận nhận hàng",
      });
      
      // Refresh data
      const wonData = await getWonProducts(1, 20);
      setWonItems(wonData.data);
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể xác nhận nhận hàng",
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: '' }));
    }
  };

  const handleRateSeller = async (orderId: number, rating: 1 | -1) => {
    const comment = prompt(rating === 1 ? "Nhập đánh giá tích cực (tùy chọn):" : "Nhập lý do đánh giá tiêu cực:");
    if (comment === null) return; // User cancelled
    
    try {
      setActionLoading(prev => ({ ...prev, [orderId]: 'rating' }));
      
      await rateSeller(orderId, rating, comment);
      
      toast({
        title: "Thành công",
        description: rating === 1 ? "Đã gửi đánh giá tích cực" : "Đã gửi đánh giá tiêu cực",
      });
      
      // Refresh data
      const wonData = await getWonProducts(1, 20);
      setWonItems(wonData.data);
    } catch (error: any) {
      console.error('Error rating seller:', error);
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
    setRatingType('1');
    setRatingComment('');
    setRatingDialogOpen(true);
  };

  const submitRating = async () => {
    if (!selectedOrderId) return;
    
    try {
      setActionLoading(prev => ({ ...prev, [selectedOrderId]: 'rating' }));
      
      await rateSeller(selectedOrderId, parseInt(ratingType) as 1 | -1, ratingComment);
      
      toast({
        title: "Thành công",
        description: ratingType === '1' ? "Đã gửi đánh giá tích cực" : "Đã gửi đánh giá tiêu cực",
      });
      
      setRatingDialogOpen(false);
      setSelectedOrderId(null);
      setRatingComment('');
      
      // Refresh data
      const wonData = await getWonProducts(1, 20);
      setWonItems(wonData.data);
    } catch (error: any) {
      console.error('Error rating seller:', error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể gửi đánh giá",
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedOrderId]: '' }));
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    const reason = prompt("Nhập lý do hủy đơn (tùy chọn):");
    if (reason === null) return; // User cancelled
    
    try {
      setActionLoading(prev => ({ ...prev, [orderId]: 'cancelling' }));
      
      await cancelBuyerOrder(orderId, reason);
      
      toast({
        title: "Thành công",
        description: "Đã hủy đơn hàng",
      });
      
      // Refresh data
      const wonData = await getWonProducts(1, 20);
      setWonItems(wonData.data);
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
              <div className="flex gap-2">
                {user.role === 'seller' && (
                  <Link to="/seller/dashboard">
                    <Button variant="outline">Quản lí đơn hàng</Button>
                  </Link>
                )}
                <Link to="/profile/settings">
                  <Button>Chỉnh sửa hồ sơ</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
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
                        {/* Thanh toán */}
                        {item.order_status === 'pending_payment' && item.order_id && (
                          <>
                            <Link to={`/checkout/${item.order_id}`}>
                              <Button size="sm" className="bg-primary">
                                Tiến hành thanh toán
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleCancelOrder(item.order_id!)}
                              disabled={actionLoading[item.order_id!] === 'cancelling'}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              {actionLoading[item.order_id!] === 'cancelling' ? 'Đang hủy...' : 'Hủy đơn'}
                            </Button>
                          </>
                        )}
                        
                        {/* Đã thanh toán - Xem chi tiết */}
                        {item.order_status === 'paid' && item.order_id && (
                          <Link to={`/checkout/${item.order_id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              Xem chi tiết
                            </Button>
                          </Link>
                        )}
                        
                        {/* Đang giao hàng - Xem chi tiết + Xác nhận nhận hàng */}
                        {item.order_status === 'shipping' && item.order_id && (
                          <>
                            <Link to={`/checkout/${item.order_id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4 mr-1" />
                                Xem chi tiết
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleConfirmDelivery(item.order_id!)}
                              disabled={actionLoading[item.order_id!] === 'confirming'}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {actionLoading[item.order_id!] === 'confirming' ? 'Đang xác nhận...' : 'Đã nhận hàng'}
                            </Button>
                          </>
                        )}
                        
                        {/* Đã giao hàng - Xem chi tiết + Đánh giá */}
                        {item.order_status === 'delivered' && item.order_id && (
                          <>
                            <Link to={`/checkout/${item.order_id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4 mr-1" />
                                Xem chi tiết
                              </Button>
                            </Link>
                            {!item.buyer_rating ? (
                              <Button 
                                size="sm" 
                                className="bg-yellow-600 hover:bg-yellow-700"
                                onClick={() => openRatingDialog(item.order_id!)}
                                disabled={actionLoading[item.order_id!] === 'rating'}
                              >
                                <Star className="w-4 h-4 mr-1" />
                                Đánh giá
                              </Button>
                            ) : (
                              <Badge className={item.buyer_rating === 1 ? "bg-green-600" : "bg-red-600"}>
                                <Star className="w-4 h-4 mr-1" />
                                Đã đánh giá: {item.buyer_rating === 1 ? 'Tích cực' : 'Tiêu cực'}
                              </Badge>
                            )}
                          </>
                        )}
                        
                        {/* Hoàn thành - Chỉ xem chi tiết */}
                        {item.order_status === 'completed' && item.order_id && (
                          <Link to={`/checkout/${item.order_id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              Xem chi tiết
                            </Button>
                          </Link>
                        )}
                        
                        {/* Chat với người bán */}
                        {item.order_id && (
                          <Link to={`/chat`}>
                            <Button size="sm" variant="outline" className="gap-2">
                              <MessageCircle className="w-4 h-4" />
                              Nhắn tin
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
        </Tabs>
      </div>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Đánh giá người bán</DialogTitle>
            <DialogDescription>
              Vui lòng chọn loại đánh giá và nhập nhận xét của bạn
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              <Label>Loại đánh giá</Label>
              <RadioGroup value={ratingType} onValueChange={(value) => setRatingType(value as '1' | '-1')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="positive" />
                  <Label htmlFor="positive" className="font-normal cursor-pointer">
                    Tích cực - Người bán đáng tin cậy
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="-1" id="negative" />
                  <Label htmlFor="negative" className="font-normal cursor-pointer">
                    Tiêu cực - Người bán không đáng tin cậy
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Nhận xét (tùy chọn)</Label>
              <Textarea
                id="comment"
                placeholder="Nhập nhận xét của bạn về người bán..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={submitRating}
              disabled={selectedOrderId ? actionLoading[selectedOrderId] === 'rating' : false}
              className={ratingType === '1' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {selectedOrderId && actionLoading[selectedOrderId] === 'rating' ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
