"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom";
import { Search, Heart, Filter, X } from "lucide-react"
import { useState } from "react"
import { SearchFilters } from "@/components/search-filters"

const allProducts = [
    {
        id: 1,
        name: "Vintage Camera Collection",
        currentBid: 2500000,
        bids: 24,
        timeLeft: "3 days",
        image: "/placeholder.svg?key=vv11m",
        category: "Electronics",
        seller: "TechCollector",
        rating: 4.8,
        condition: "Excellent",
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).getTime(),
    },
    {
        id: 2,
        name: "Designer Leather Watch",
        currentBid: 5500000,
        bids: 12,
        timeLeft: "2 days",
        image: "/placeholder.svg?key=8eg2r",
        category: "Fashion",
        seller: "LuxuryDeals",
        rating: 4.9,
        condition: "Like New",
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).getTime(),
    },
    {
        id: 3,
        name: "MacBook Pro 16 2024",
        currentBid: 45000000,
        bids: 8,
        timeLeft: "1 day",
        image: "/placeholder.svg?key=v6lz4",
        category: "Electronics",
        seller: "ElectroHub",
        rating: 4.7,
        condition: "Excellent",
        endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).getTime(),
    },
    {
        id: 4,
        name: "Vintage Nike Sneakers",
        currentBid: 1800000,
        bids: 31,
        timeLeft: "6 hours",
        image: "/placeholder.svg?key=qyobx",
        category: "Fashion",
        seller: "SneakerHub",
        rating: 4.6,
        condition: "Good",
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).getTime(),
    },
    {
        id: 5,
        name: "Sony PlayStation 5",
        currentBid: 12000000,
        bids: 18,
        timeLeft: "4 days",
        image: "/placeholder.svg?key=kyw83",
        category: "Electronics",
        seller: "GamingDeals",
        rating: 4.8,
        condition: "Excellent",
        endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).getTime(),
    },
]

interface Filters {
    search: string
    category: string | null
    priceRange: [number, number]
    sortBy: string
    condition: string | null
    sellerRating: number
}

export default function Home() {
    const [filters, setFilters] = useState<Filters>({
        search: "",
        category: null,
        priceRange: [0, 50000000],
        sortBy: "newest",
        condition: null,
        sellerRating: 0,
    })
    const [showFilters, setShowFilters] = useState(true)

    const filteredProducts = allProducts.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(filters.search.toLowerCase())
        const matchesCategory = !filters.category || product.category === filters.category
        const matchesPrice = product.currentBid >= filters.priceRange[0] && product.currentBid <= filters.priceRange[1]
        const matchesCondition = !filters.condition || product.condition === filters.condition
        const matchesRating = product.rating >= filters.sellerRating

        return matchesSearch && matchesCategory && matchesPrice && matchesCondition && matchesRating
    })

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (filters.sortBy) {
            case "price-low":
                return a.currentBid - b.currentBid
            case "price-high":
                return b.currentBid - a.currentBid
            case "ending-soon":
                return a.endTime - b.endTime
            case "most-bids":
                return b.bids - a.bids
            default:
                return 0
        }
    })

    const hasActiveFilters = filters.search || filters.category || filters.condition || filters.sellerRating > 0

    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filters Sidebar */}
                    {showFilters && (
                        <div className="lg:col-span-1">
                            <SearchFilters filters={filters} onChange={setFilters} />
                        </div>
                    )}

                    {/* Main Content */}
                    <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
                        {/* Search Bar */}
                        <div className="mb-6 flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    className="pl-10"
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                />
                            </div>
                            <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
                                {showFilters ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
                            </Button>
                        </div>

                        {/* Sort and Results Count */}
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-sm text-muted-foreground">
                                Showing {sortedProducts.length} result{sortedProducts.length !== 1 ? "s" : ""}
                            </p>
                            <div className="flex gap-2">
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                                >
                                    <option value="newest">Newest</option>
                                    <option value="ending-soon">Ending Soon</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="most-bids">Most Bids</option>
                                </select>
                            </div>
                        </div>

                        {/* Active Filters Tags */}
                        {hasActiveFilters && (
                            <div className="mb-6 flex flex-wrap gap-2">
                                {filters.search && (
                                    <Badge
                                        variant="secondary"
                                        className="cursor-pointer"
                                        onClick={() => setFilters({ ...filters, search: "" })}
                                    >
                                        {filters.search} <X className="w-3 h-3 ml-1" />
                                    </Badge>
                                )}
                                {filters.category && (
                                    <Badge
                                        variant="secondary"
                                        className="cursor-pointer"
                                        onClick={() => setFilters({ ...filters, category: null })}
                                    >
                                        {filters.category} <X className="w-3 h-3 ml-1" />
                                    </Badge>
                                )}
                                {filters.condition && (
                                    <Badge
                                        variant="secondary"
                                        className="cursor-pointer"
                                        onClick={() => setFilters({ ...filters, condition: null })}
                                    >
                                        {filters.condition} <X className="w-3 h-3 ml-1" />
                                    </Badge>
                                )}
                                {filters.sellerRating > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="cursor-pointer"
                                        onClick={() => setFilters({ ...filters, sellerRating: 0 })}
                                    >
                                        Rating {filters.sellerRating}+ <X className="w-3 h-3 ml-1" />
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* Products Grid */}
                        {sortedProducts.length === 0 ? (
                            <Card className="p-12 text-center">
                                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                                <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setFilters({
                                            search: "",
                                            category: null,
                                            priceRange: [0, 50000000],
                                            sortBy: "newest",
                                            condition: null,
                                            sellerRating: 0,
                                        })
                                    }
                                >
                                    Clear Filters
                                </Button>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {sortedProducts.map((product) => (
                                    <Link key={product.id} to={`/product/${product.id}`}>
                                        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                                            <div className="relative h-48 bg-muted overflow-hidden group">
                                                <img
                                                    src={product.image || "/placeholder.svg"}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                                <button className="absolute top-3 right-3 bg-background/80 backdrop-blur p-2 rounded-full hover:bg-background">
                                                    <Heart className="w-5 h-5" />
                                                </button>
                                                {product.condition === "Excellent" && (
                                                    <Badge className="absolute top-3 left-3">{product.condition}</Badge>
                                                )}
                                            </div>
                                            <div className="p-4 flex flex-col flex-1">
                                                <Badge variant="outline" className="w-fit mb-2">
                                                    {product.category}
                                                </Badge>
                                                <h3 className="font-semibold line-clamp-2 mb-2">{product.name}</h3>
                                                <p className="text-xs text-muted-foreground mb-3">by {product.seller}</p>
                                                <div className="mt-auto space-y-2">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Current bid</p>
                                                        <p className="text-lg font-bold text-primary">
                                                            ${(product.currentBid / 1000000).toFixed(1)}M
                                                        </p>
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
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
