"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link, useNavigate } from "react-router-dom"
import { Plus, Edit, Eye, Trash2, Users, MessageCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect } from "react"

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Protect route - only sellers can access
  useEffect(() => {
    if (user && user.role !== 'seller') {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'seller') {
    return null;
  }

  const sellerStats = {
    activeListings: 12,
    revenue: 156000000,
    itemsSold: 48,
    rating: 4.85,
  }

  const activeListings = [
    {
      id: 1,
      name: "Vintage Camera Collection",
      bids: 24,
      currentBid: 2500000,
      timeLeft: "3 days",
      views: 342,
      status: "Active",
    },
    {
      id: 2,
      name: "Designer Leather Watch",
      bids: 12,
      currentBid: 5500000,
      timeLeft: "2 days",
      views: 189,
      status: "Active",
    },
    {
      id: 3,
      name: "Classic Wristwatch",
      bids: 18,
      currentBid: 3200000,
      timeLeft: "5 days",
      views: 421,
      status: "Active",
    },
  ]

  const soldItems = [
    {
      id: 1,
      name: "MacBook Pro 16 2024",
      buyer: "John Doe",
      finalBid: 45000000,
      saleDate: "Oct 25, 2025",
      status: "Payment Completed",
    },
    {
      id: 2,
      name: "Sony PlayStation 5",
      buyer: "Jane Smith",
      finalBid: 12000000,
      saleDate: "Oct 20, 2025",
      status: "Completed",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-muted-foreground text-sm mb-1">Sản phẩm đang bán</p>
            <p className="text-3xl font-bold">{sellerStats.activeListings}</p>
          </Card>
          <Card className="p-6">
            <p className="text-muted-foreground text-sm mb-1">Tổng doanh thu</p>
            <p className="text-3xl font-bold text-primary">${(sellerStats.revenue / 1000000).toFixed(0)}M</p>
          </Card>
          <Card className="p-6">
            <p className="text-muted-foreground text-sm mb-1">Đã bán</p>
            <p className="text-3xl font-bold">{sellerStats.itemsSold}</p>
          </Card>
          <Card className="p-6">
            <p className="text-muted-foreground text-sm mb-1">Đánh giá</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{sellerStats.rating}</span>
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
            {activeListings.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <Badge className="bg-green-600">{item.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p className="text-xs">Giá hiện tại</p>
                        <p className="font-semibold text-foreground">${(item.currentBid / 1000000).toFixed(1)}M</p>
                      </div>
                      <div>
                        <p className="text-xs">Lượt đặt giá</p>
                        <p className="font-semibold text-foreground">{item.bids}</p>
                      </div>
                      <div>
                        <p className="text-xs">Lượt xem</p>
                        <p className="font-semibold text-foreground">{item.views}</p>
                      </div>
                      <div>
                        <p className="text-xs">Thời gian còn lại</p>
                        <p className="font-semibold text-accent">{item.timeLeft}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/seller/edit/${item.id}`}>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <Edit className="w-4 h-4" />
                        Sửa
                      </Button>
                    </Link>
                    <Link to={`/product/${item.id}`}>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <Eye className="w-4 h-4" />
                        Xem
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive bg-transparent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Sold Items */}
          <TabsContent value="sold" className="mt-6 space-y-4">
            {soldItems.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <Badge variant="outline" className="bg-green-50">
                        {item.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p className="text-xs">Giá bán</p>
                        <p className="font-semibold text-foreground">${(item.finalBid / 1000000).toFixed(1)}M</p>
                      </div>
                      <div>
                        <p className="text-xs">Người mua</p>
                        <p className="font-semibold text-foreground">{item.buyer}</p>
                      </div>
                      <div>
                        <p className="text-xs">Ngày bán</p>
                        <p className="font-semibold text-foreground">{item.saleDate}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/messages/${item.buyer || item.buyer_username}`}>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <MessageCircle className="w-4 h-4" />
                        Chat với người mua
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
