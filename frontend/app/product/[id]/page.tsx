"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Share2, Flag } from "lucide-react"
import { useState } from "react"
import { BidDialog } from "@/components/bid-dialog"
import { AskQuestionDialog } from "@/components/ask-question-dialog"

export default function ProductPage({ params }: { params: { id: string } }) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showBidDialog, setShowBidDialog] = useState(false)
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)

  const product = {
    id: params.id,
    name: "Vintage Camera Collection - Sony Alpha 7",
    currentBid: 2500000,
    buyNow: 3500000,
    bids: 24,
    timeLeft: "3 days, 4 hours",
    posted: "Oct 27, 2025",
    ends: "Oct 30, 2025 10:43 AM",
    minIncrement: 100000,
    description: "Beautiful vintage camera in excellent condition. Fully functional with all original accessories.",
    seller: {
      name: "TechCollector",
      rating: 4.8,
      reviews: 156,
    },
    topBidder: {
      name: "****Khoa",
      rating: 4.9,
      reviews: 89,
    },
    images: ["/placeholder.svg?key=pj3x1", "/placeholder.svg?key=v7kaf", "/placeholder.svg?key=jsk06"],
    relatedProducts: [
      { id: 1, name: "Canon EOS R5", bid: 4200000 },
      { id: 2, name: "Nikon Z9", bid: 5100000 },
      { id: 3, name: "Leica M6", bid: 1800000 },
    ],
  }

  const suggestedBid = product.currentBid + product.minIncrement

  const handlePlaceBid = async (amount: number, isAutoBid: boolean) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(undefined), 1500)
    })
  }

  const handleAskQuestion = async (question: string) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(undefined), 1500)
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div className="bg-muted rounded-lg overflow-hidden">
                <img
                  src={product.images[currentImageIndex] || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-96 object-cover"
                />
              </div>
              <div className="flex gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                      currentImageIndex === idx ? "border-primary" : "border-border"
                    }`}
                  >
                    <img src={img || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info & Bidding */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <h1 className="text-2xl font-bold">{product.name}</h1>

                <div className="space-y-2 pb-4 border-b border-border">
                  <p className="text-sm text-muted-foreground">Current bid</p>
                  <p className="text-3xl font-bold text-primary">${(product.currentBid / 1000000).toFixed(1)}M</p>
                  <p className="text-sm text-muted-foreground">{product.bids} bids</p>
                </div>

                <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                  <p className="text-sm font-semibold text-accent mb-1">Time remaining</p>
                  <p className="text-lg font-bold text-foreground">{product.timeLeft}</p>
                </div>

                <Button className="w-full" size="lg" onClick={() => setShowBidDialog(true)}>
                  Place Bid
                </Button>

                {product.buyNow && (
                  <Button className="w-full bg-transparent" variant="outline" size="lg">
                    Buy Now - ${(product.buyNow / 1000000).toFixed(1)}M
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 bg-transparent"
                    onClick={() => setIsFavorited(!isFavorited)}
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1 bg-transparent">
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1 bg-transparent">
                    <Flag className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Seller Info */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Seller Information</h3>
              <div className="space-y-2">
                <p className="font-semibold">{product.seller.name}</p>
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-500">{"★".repeat(Math.floor(product.seller.rating))}</div>
                  <span className="text-sm text-muted-foreground">
                    {product.seller.rating} ({product.seller.reviews})
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  size="sm"
                  onClick={() => setShowQuestionDialog(true)}
                >
                  Contact Seller
                </Button>
              </div>
            </Card>

            {/* Top Bidder */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Top Bidder</h3>
              <div className="space-y-2">
                <p className="font-semibold">{product.topBidder.name}</p>
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-500">{"★".repeat(Math.floor(product.topBidder.rating))}</div>
                  <span className="text-sm text-muted-foreground">
                    {product.topBidder.rating} ({product.topBidder.reviews})
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="bidding">Bid History</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Product Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Posted</p>
                    <p className="font-semibold">{product.posted}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ends</p>
                    <p className="font-semibold">{product.ends}</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="bidding" className="mt-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Bidding History</h3>
                <div className="space-y-3">
                  {[
                    {
                      date: "27/10/2025 10:43",
                      bidder: "****Khoa",
                      bid: 2500000,
                      display: 2500000,
                      isAuto: true,
                      note: "Auto bid placed",
                    },
                    {
                      date: "27/10/2025 9:43",
                      bidder: "****Kha",
                      bid: 2400000,
                      display: 2400000,
                      isAuto: false,
                    },
                    {
                      date: "27/10/2025 8:43",
                      bidder: "****Tuấn",
                      bid: 2300000,
                      display: 2300000,
                      isAuto: false,
                    },
                    {
                      date: "27/10/2025 7:43",
                      bidder: "****Khánh",
                      bid: 2200000,
                      display: 2200000,
                      isAuto: true,
                      note: "Auto bid placed",
                    },
                  ].map((bid, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start py-2 border-b border-border last:border-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{bid.bidder}</p>
                          {bid.isAuto && (
                            <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded border border-accent/30">
                              Auto
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{bid.date}</p>
                        {bid.note && <p className="text-xs text-muted-foreground italic mt-1">{bid.note}</p>}
                      </div>
                      <p className="font-bold text-primary">${(bid.display / 1000000).toFixed(1)}M</p>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="questions" className="mt-6">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Questions About This Item</h3>
                  <Button size="sm" onClick={() => setShowQuestionDialog(true)}>
                    Ask Question
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="border-b border-border pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-sm">Is this item original?</p>
                      <Badge variant="outline" className="text-xs">
                        Answered
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Asked by user123</p>
                    <p className="text-sm bg-muted/50 rounded p-2 mt-2">
                      Yes, this is 100% original with all certificates.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Related Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {product.relatedProducts.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="h-48 bg-muted">
                  <img
                    src={`/.jpg?key=xnvbu&key=86obd&height=250&width=250&query=${item.name}`}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{item.name}</h3>
                  <p className="text-primary font-bold">${(item.bid / 1000000).toFixed(1)}M</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <BidDialog
        isOpen={showBidDialog}
        onClose={() => setShowBidDialog(false)}
        currentBid={product.currentBid}
        minIncrement={product.minIncrement}
        suggestedBid={suggestedBid}
        onPlaceBid={handlePlaceBid}
      />

      <AskQuestionDialog
        isOpen={showQuestionDialog}
        onClose={() => setShowQuestionDialog(false)}
        sellerName={product.seller.name}
        onAsk={handleAskQuestion}
      />
    </div>
  )
}
