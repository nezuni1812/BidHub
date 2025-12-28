"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, ShoppingCart, DollarSign, AlertCircle, Eye, Trash2 } from "lucide-react"
import { useState } from "react"
import { AdminChart } from "@/components/admin-chart"

export default function AdminDashboard() {
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const stats = {
    totalListings: 1243,
    activeUsers: 5623,
    totalRevenue: 892450000,
    newSellerRequests: 7,
  }

  const recentUsers = [
    { id: 1, name: "John Doe", email: "john@example.com", joinDate: "2025-10-27", status: "Active", rating: 4.8 },
    { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2025-10-26", status: "Active", rating: 4.9 },
    { id: 3, name: "Mike Johnson", email: "mike@example.com", joinDate: "2025-10-25", status: "Pending", rating: 0 },
  ]

  const flaggedListings = [
    {
      id: 1,
      name: "Vintage Camera",
      seller: "TechCollector",
      reason: "Suspicious pricing",
      date: "2025-10-27",
      status: "Pending",
    },
    {
      id: 2,
      name: "Designer Watch",
      seller: "LuxuryDeals",
      reason: "Unclear description",
      date: "2025-10-26",
      status: "Reviewing",
    },
  ]

  const sellerRequests = [
    { id: 1, user: "buyer_123", joinDate: "2025-10-20", request: "Upgrade to seller", status: "Pending", rating: 4.7 },
    {
      id: 2,
      user: "collector_mike",
      joinDate: "2025-10-18",
      request: "Upgrade to seller",
      status: "Pending",
      rating: 4.6,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage platform, users, and listings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Total Listings</p>
              <ShoppingCart className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{stats.totalListings.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Active Users</p>
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{stats.activeUsers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">+8% from last month</p>
          </Card>

          <Card className="p-6 border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Seller Requests</p>
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-600">{stats.newSellerRequests}</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Platform Activity</h3>
            <AdminChart />
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full max-w-xl grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="requests">Seller Requests</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users" className="mt-6 space-y-4">
            <div className="flex gap-2 mb-4">
              <Input placeholder="Search users..." className="max-w-xs" />
              <Button variant="outline">Filter</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Join Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Rating</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-4">{user.name}</td>
                      <td className="py-4 px-4 text-muted-foreground">{user.email}</td>
                      <td className="py-4 px-4 text-muted-foreground">{user.joinDate}</td>
                      <td className="py-4 px-4">
                        <Badge variant={user.status === "Active" ? "default" : "outline"}>{user.status}</Badge>
                      </td>
                      <td className="py-4 px-4">{user.rating ? `${user.rating} ★` : "N/A"}</td>
                      <td className="py-4 px-4">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Listings Management */}
          <TabsContent value="listings" className="mt-6 space-y-4">
            <div className="flex gap-2 mb-4">
              <Input placeholder="Search listings..." className="max-w-xs" />
              <Button variant="outline">Filter</Button>
            </div>

            {flaggedListings.map((listing) => (
              <Card key={listing.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{listing.name}</h3>
                      <Badge variant="outline" className="bg-amber-50">
                        {listing.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">by {listing.seller}</p>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-700">
                        <strong>Reason:</strong> {listing.reason}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Flagged on {listing.date}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive bg-transparent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Seller Requests */}
          <TabsContent value="requests" className="mt-6 space-y-4">
            {sellerRequests.map((request) => (
              <Card key={request.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{request.user}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Member since {request.joinDate} • Rating: {request.rating} ★
                    </p>
                    <Badge variant="outline">{request.status}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedUser(request)}>
                      View Profile
                    </Button>
                    <Button size="sm">Approve</Button>
                    <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Categories Management */}
          <TabsContent value="categories" className="mt-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold">Category Management</h3>
                <Button>Add Category</Button>
              </div>

              <div className="space-y-3">
                {[
                  { name: "Electronics", items: 234, status: "Active" },
                  { name: "Fashion", items: 156, status: "Active" },
                  { name: "Home", items: 89, status: "Active" },
                  { name: "Sports", items: 45, status: "Active" },
                  { name: "Art", items: 23, status: "Active" },
                ].map((cat, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-semibold">{cat.name}</p>
                      <p className="text-sm text-muted-foreground">{cat.items} items</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>{cat.status}</Badge>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
