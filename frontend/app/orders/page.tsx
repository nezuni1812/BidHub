"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { PackageOpen, CheckCircle, Clock, AlertCircle } from "lucide-react"

const allOrders = [
  {
    id: "ORD-001",
    productName: "Vintage Camera Collection",
    winningBid: 2500000,
    seller: "TechCollector",
    status: "completed",
    orderDate: "Oct 27, 2025",
    deliveryDate: "Nov 2, 2025",
  },
  {
    id: "ORD-002",
    productName: "Designer Leather Watch",
    winningBid: 5500000,
    seller: "LuxuryDeals",
    status: "in-transit",
    orderDate: "Oct 26, 2025",
    expectedDate: "Nov 1, 2025",
  },
  {
    id: "ORD-003",
    productName: "MacBook Pro 16 2024",
    winningBid: 45000000,
    seller: "ElectroHub",
    status: "pending-payment",
    orderDate: "Oct 25, 2025",
    expiresIn: "24 hours",
  },
]

export default function OrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState("all")

  const filteredOrders = selectedStatus === "all" ? allOrders : allOrders.filter((o) => o.status === selectedStatus)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-accent">Completed</Badge>
      case "in-transit":
        return <Badge className="bg-blue-500">In Transit</Badge>
      case "pending-payment":
        return <Badge className="bg-yellow-500">Pending Payment</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-accent" />
      case "in-transit":
        return <PackageOpen className="w-5 h-5 text-blue-500" />
      case "pending-payment":
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending-payment">Pending Payment</TabsTrigger>
            <TabsTrigger value="in-transit">In Transit</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-start gap-4">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="text-xs text-muted-foreground">Order ID: {order.id}</p>
                    <h3 className="font-semibold text-lg mb-2">{order.productName}</h3>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <p>Seller: {order.seller}</p>
                      <p>Order Date: {order.orderDate}</p>
                      {order.status === "completed" && <p>Delivered: {order.deliveryDate}</p>}
                      {order.status === "in-transit" && <p>Expected: {order.expectedDate}</p>}
                      {order.status === "pending-payment" && <p>Expires in: {order.expiresIn}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Winning Bid</p>
                    <p className="text-2xl font-bold text-primary">${(order.winningBid / 1000000).toFixed(1)}M</p>
                  </div>
                  {getStatusBadge(order.status)}
                  <div className="flex gap-2">
                    {order.status === "pending-payment" && <Button size="sm">Complete Payment</Button>}
                    {order.status === "in-transit" && (
                      <Button size="sm" variant="outline">
                        Track Delivery
                      </Button>
                    )}
                    {order.status === "completed" && (
                      <Button size="sm" variant="outline">
                        Leave Feedback
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
