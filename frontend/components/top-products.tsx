"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Heart } from "lucide-react"

const mockProducts = [
  {
    id: 1,
    name: "Vintage Camera Collection",
    currentBid: 2500000,
    bids: 24,
    timeLeft: "3 days",
    image: "/vintage-camera.png",
    category: "Electronics",
  },
  {
    id: 2,
    name: "Designer Leather Watch",
    currentBid: 5500000,
    bids: 12,
    timeLeft: "2 days",
    image: "/luxury-watch.jpg",
    category: "Fashion",
  },
  {
    id: 3,
    name: "MacBook Pro 16 2024",
    currentBid: 45000000,
    bids: 8,
    timeLeft: "1 day",
    image: "/modern-laptop.png",
    category: "Electronics",
  },
  {
    id: 4,
    name: "Classic Wristwatch",
    currentBid: 3200000,
    bids: 18,
    timeLeft: "5 days",
    image: "/classic-wristwatch.png",
    category: "Fashion",
  },
  {
    id: 5,
    name: "Vintage Nike Sneakers",
    currentBid: 1800000,
    bids: 31,
    timeLeft: "6 hours",
    image: "/vintage-sneakers.png",
    category: "Fashion",
  },
]

export function TopProducts() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-2">Featured Auctions</h2>
          <p className="text-muted-foreground">Trending items ending soon</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {mockProducts.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                <div className="relative h-40 bg-muted overflow-hidden group">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <button className="absolute top-2 right-2 bg-background/80 backdrop-blur p-1.5 rounded-full hover:bg-background">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <Badge variant="outline" className="w-fit mb-2 text-xs">
                    {product.category}
                  </Badge>
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2">{product.name}</h3>
                  <div className="mt-auto space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Current bid</p>
                      <p className="font-bold text-primary">${(product.currentBid / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{product.bids} bids</span>
                      <span className="text-accent font-semibold">{product.timeLeft}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
