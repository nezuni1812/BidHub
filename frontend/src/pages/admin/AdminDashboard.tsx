import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, ShoppingCart, DollarSign, AlertCircle, Eye, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { AdminChart } from "@/components/admin-chart"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface DashboardStats {
  period: string
  users: {
    total: number
    by_role: { admin: number; bidder: number; seller: number }
    new_users: number
  }
  products: {
    total: number
    by_status: {
      pending: number
      approved: number
      active: number
      ended: number
      removed: number
      completed: number
    }
    new_auctions: number
    active_auctions: number
  }
  categories: {
    total: number
  }
  revenue: {
    total: number
    period: string
  }
  upgrades: {
    approved: number
    period: string
  }
  bids: {
    total: number
    period: string
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [upgradeRequests, setUpgradeRequests] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, usersRes, upgradesRes, productsRes, categoriesRes] = await Promise.all([
        api.get('/admin/dashboard/overview?period=30d'),
        api.get('/admin/users?page=1&limit=10'),
        api.get('/admin/upgrade-requests?status=pending&page=1&limit=10'),
        api.get('/admin/products?page=1&limit=10'),
        api.get('/categories')
      ])

      if (statsRes.data) setStats(statsRes.data)
      if (usersRes.data) setUsers(usersRes.data)
      if (upgradesRes.data) setUpgradeRequests(upgradesRes.data)
      if (productsRes.data) setProducts(productsRes.data)
      if (categoriesRes.data) setCategories(categoriesRes.data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage platform, users, and listings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Total Products</p>
              <ShoppingCart className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{stats?.products.total.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.products.active_auctions || 0} active auctions
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Total Users</p>
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{stats?.users.total.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats?.users.new_users || 0} new this month
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Total Revenue</p>
              <DollarSign className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">
              {formatPrice(stats?.revenue.total || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{stats?.revenue.period}</p>
          </Card>

          <Card className="p-6 border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Seller Requests</p>
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-600">
              {upgradeRequests.length || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Platform Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Bids (30 days)</span>
                <span className="font-semibold">{stats?.bids.total.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Categories</span>
                <span className="font-semibold">{stats?.categories.total.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">New Auctions (30 days)</span>
                <span className="font-semibold">{stats?.products.new_auctions.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Approved Upgrades (30 days)</span>
                <span className="font-semibold">{stats?.upgrades.approved.toLocaleString() || 0}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">User Distribution</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Admins</span>
                <Badge variant="default">{stats?.users.by_role.admin || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sellers</span>
                <Badge variant="secondary">{stats?.users.by_role.seller || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Bidders</span>
                <Badge variant="outline">{stats?.users.by_role.bidder || 0}</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Product Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active</span>
                <Badge variant="default">{stats?.products.by_status.active || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completed</span>
                <Badge variant="secondary">{stats?.products.by_status.completed || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ended</span>
                <Badge variant="outline">{stats?.products.by_status.ended || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending</span>
                <Badge variant="outline">{stats?.products.by_status.pending || 0}</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Revenue Insights</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue (30 days)</p>
                <p className="text-2xl font-bold">{formatPrice(stats?.revenue.total || 0)}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Generated from {stats?.products.by_status.completed || 0} completed transactions
                </p>
              </div>
            </div>
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
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.slice(0, 10).map((user) => (
                      <tr key={user.user_id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-4 px-4">{user.full_name || user.username}</td>
                        <td className="py-4 px-4 text-muted-foreground">{user.email}</td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={user.is_active ? "default" : "outline"}>
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          {user.average_rating ? `${user.average_rating.toFixed(1)} ★` : "N/A"}
                        </td>
                        <td className="py-4 px-4">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
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

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Title</th>
                    <th className="text-left py-3 px-4 font-semibold">Seller</th>
                    <th className="text-left py-3 px-4 font-semibold">Current Price</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">End Time</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Loading products...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    products.slice(0, 10).map((product) => (
                      <tr key={product.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-4 px-4 font-medium">{product.title}</td>
                        <td className="py-4 px-4 text-muted-foreground">{product.seller_name}</td>
                        <td className="py-4 px-4">{formatPrice(product.current_price)}</td>
                        <td className="py-4 px-4">
                          <Badge variant={product.status === 'active' ? 'default' : 'outline'}>
                            {product.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {new Date(product.end_time).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Seller Requests */}
          <TabsContent value="requests" className="mt-6 space-y-4">
            {loading ? (
              <Card className="p-6">
                <p className="text-center text-muted-foreground">Loading upgrade requests...</p>
              </Card>
            ) : upgradeRequests.length === 0 ? (
              <Card className="p-6">
                <p className="text-center text-muted-foreground">No pending upgrade requests</p>
              </Card>
            ) : (
              upgradeRequests.map((request) => (
                <Card key={request.request_id} className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{request.username}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Requested on {new Date(request.requested_at).toLocaleDateString()}
                      </p>
                      <Badge variant="outline">{request.status}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                      <Button size="sm">Approve</Button>
                      <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Categories Management */}
          <TabsContent value="categories" className="mt-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold">Category Management</h3>
                <Button>Add Category</Button>
              </div>

              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading categories...</p>
              ) : categories.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No categories found</p>
              ) : (
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex justify-between items-center p-4 border border-border rounded-lg">
                      <div>
                        <p className="font-semibold">{cat.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {cat.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge>Active</Badge>
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
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
