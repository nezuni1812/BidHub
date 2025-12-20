"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Heart, ShoppingCart, Trophy, MessageCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { getActiveBids, getWonProducts, type BiddingProduct, type WonProduct } from "@/lib/dashboard"
import { getWatchlist } from "@/lib/watchlist"
import { formatPrice, formatTimeRemaining, getImageUrl, type Product } from "@/lib/products"

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeBids, setActiveBids] = useState<BiddingProduct[]>([]);
  const [watchlist, setWatchlist] = useState<Product[]>([]);
  const [wonItems, setWonItems] = useState<WonProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'watchlist' | 'won'>('active');

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
  }, [activeTab]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Please login to view your dashboard</p>
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
                  <span className="text-sm text-muted-foreground">Role: {user.role}</span>
                </div>
              </div>
              <Link to="/profile/settings">
                <Button>Edit Profile</Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="active" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Active Bids</span>
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Watchlist</span>
            </TabsTrigger>
            <TabsTrigger value="won" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Won</span>
            </TabsTrigger>
          </TabsList>

          {/* Active Bids */}
          <TabsContent value="active" className="mt-6 space-y-4">
            {loading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Loading...</p>
              </Card>
            ) : activeBids.length === 0 ? (
              <Card className="p-8 text-center">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No active bids yet</p>
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
                            <Badge className="bg-green-600">✓ Winning</Badge>
                          ) : (
                            <Badge variant="outline">Outbid</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>Your bid: {formatPrice(parseFloat(bid.my_bid_price))}</span>
                          <span>•</span>
                          <span>Current: {formatPrice(parseFloat(bid.current_price))}</span>
                          <span>•</span>
                          <span>{bid.total_bids} bids</span>
                          <span>•</span>
                          <span className="text-accent font-semibold">
                            {formatTimeRemaining(bid.seconds_remaining)} left
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
                <p className="text-muted-foreground">Loading...</p>
              </Card>
            ) : watchlist.length === 0 ? (
              <Card className="p-8 text-center">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No items in watchlist</p>
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
                          <span>Current bid: {formatPrice(parseFloat(item.current_price))}</span>
                          <span>•</span>
                          <span className="text-accent font-semibold">
                            {formatTimeRemaining(parseFloat(item.seconds_remaining))} left
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
                <p className="text-muted-foreground">Loading...</p>
              </Card>
            ) : wonItems.length === 0 ? (
              <Card className="p-8 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No won items yet</p>
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
                          <Badge variant="destructive">Pending Payment</Badge>
                        )}
                        {item.order_status === 'paid' && (
                          <Badge className="bg-green-600">Paid</Badge>
                        )}
                        {item.order_status === 'shipping' && (
                          <Badge className="bg-blue-600">Shipping</Badge>
                        )}
                        {item.order_status === 'delivered' && (
                          <Badge className="bg-green-700">Delivered</Badge>
                        )}
                        {item.order_status === 'completed' && (
                          <Badge className="bg-green-800">Completed</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        <span>Won for: {formatPrice(parseFloat(item.final_price))}</span>
                        <span>•</span>
                        <span>Seller: {item.seller_name}</span>
                        <span>•</span>
                        <span>{new Date(item.won_date).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {item.order_status === 'pending_payment' && item.order_id && (
                          <Link to={`/checkout/${item.order_id}`}>
                            <Button size="sm" className="bg-primary">
                              Proceed to Payment
                            </Button>
                          </Link>
                        )}
                        {item.order_status === 'paid' && (
                          <Button size="sm" variant="outline" disabled>
                            Waiting for Shipment
                          </Button>
                        )}
                        {item.order_id && (
                          <Link to={`/messages/${item.seller_username || item.seller_name}`}>
                            <Button size="sm" variant="outline" className="gap-2">
                              <MessageCircle className="w-4 h-4" />
                              Chat with Seller
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
    </div>
  )
}
