"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Heart, ShoppingCart, Trophy } from "lucide-react"

export default function DashboardPage() {
  const userProfile = {
    name: "John Doe",
    email: "john@example.com",
    rating: 4.8,
    reviews: 42,
    joinDate: "Jan 15, 2024",
  }

  const watchlist = [
    {
      id: 1,
      name: "Vintage Camera Collection",
      bid: 2500000,
      timeLeft: "3 days",
      status: "Active",
    },
    {
      id: 2,
      name: "Designer Leather Watch",
      bid: 5500000,
      timeLeft: "2 days",
      status: "Active",
    },
  ]

  const activeBids = [
    {
      id: 1,
      name: "Vintage Camera Collection",
      myBid: 2500000,
      status: "Winning",
      bids: 24,
      timeLeft: "3 days",
    },
    {
      id: 2,
      name: "Classic Wristwatch",
      myBid: 3100000,
      status: "Outbid",
      bids: 18,
      timeLeft: "5 days",
    },
    {
      id: 3,
      name: "Vintage Nike Sneakers",
      myBid: 1700000,
      status: "Winning",
      bids: 31,
      timeLeft: "6 hours",
    },
  ]

  const won = [
    {
      id: 1,
      name: "MacBook Pro 16 2024",
      finalBid: 45000000,
      seller: "ElectroHub",
      wonDate: "Oct 25, 2025",
      status: "Payment Pending",
    },
    {
      id: 2,
      name: "Sony PlayStation 5",
      finalBid: 12000000,
      seller: "GamingDeals",
      wonDate: "Oct 20, 2025",
      status: "Completed",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{userProfile.name}</h1>
                <p className="text-muted-foreground mb-3">{userProfile.email}</p>
                <div className="flex items-center gap-4">
                  <div className="flex text-yellow-500">{"★".repeat(Math.floor(userProfile.rating))}</div>
                  <span className="text-sm text-muted-foreground">
                    {userProfile.rating} rating ({userProfile.reviews} reviews)
                  </span>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">Member since {userProfile.joinDate}</span>
                </div>
              </div>
              <Button>Edit Profile</Button>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
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
            {activeBids.length === 0 ? (
              <Card className="p-8 text-center">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No active bids yet</p>
              </Card>
            ) : (
              activeBids.map((bid) => (
                <Link key={bid.id} to={`/product/${bid.id}`}>
                  <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg line-clamp-1">{bid.name}</h3>
                          <Badge
                            variant={bid.status === "Winning" ? "default" : "outline"}
                            className={bid.status === "Winning" ? "bg-green-600" : ""}
                          >
                            {bid.status === "Winning" ? "✓ Winning" : "Outbid"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>Your bid: ${(bid.myBid / 1000000).toFixed(1)}M</span>
                          <span>•</span>
                          <span>{bid.bids} bids</span>
                          <span>•</span>
                          <span className="text-accent font-semibold">{bid.timeLeft} left</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="whitespace-nowrap bg-transparent">
                        View Item
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </TabsContent>

          {/* Watchlist */}
          <TabsContent value="watchlist" className="mt-6 space-y-4">
            {watchlist.length === 0 ? (
              <Card className="p-8 text-center">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No items in watchlist</p>
              </Card>
            ) : (
              watchlist.map((item) => (
                <Link key={item.id} to={`/product/${item.id}`}>
                  <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>Current bid: ${(item.bid / 1000000).toFixed(1)}M</span>
                          <span>•</span>
                          <span className="text-accent font-semibold">{item.timeLeft} left</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="whitespace-nowrap bg-transparent">
                        Place Bid
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </TabsContent>

          {/* Won Items */}
          <TabsContent value="won" className="mt-6 space-y-4">
            {won.length === 0 ? (
              <Card className="p-8 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No won items yet</p>
              </Card>
            ) : (
              won.map((item) => (
                <Card key={item.id} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <Badge
                          variant="outline"
                          className={item.status === "Completed" ? "bg-green-50 text-green-700" : ""}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Won for: ${(item.finalBid / 1000000).toFixed(1)}M</span>
                        <span>•</span>
                        <span>Seller: {item.seller}</span>
                        <span>•</span>
                        <span>{item.wonDate}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Contact Seller
                      </Button>
                      {item.status === "Completed" && (
                        <Button variant="outline" size="sm">
                          Leave Feedback
                        </Button>
                      )}
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
