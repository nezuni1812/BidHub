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
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

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
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [upgradeRequests, setUpgradeRequests] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const { toast } = useToast()
  const navigate = useNavigate()

  // Protect route - only admins can access
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, usersRes, upgradesRes, productsRes, categoriesRes] = await Promise.all([
        api.get('/admin/dashboard/overview?period=30d'),
        api.get('/admin/users?page=1&limit=10'),
        api.get('/admin/upgrade-requests?status=pending&page=1&limit=10'),
        api.get('/admin/products?page=1&limit=10'),
        api.get('/admin/categories?page=1&limit=100')
      ])

      if (statsRes.data) setStats(statsRes.data as DashboardStats)
      if (usersRes.data) setUsers(usersRes.data as any[])
      if (upgradesRes.data) setUpgradeRequests(upgradesRes.data as any[])
      if (productsRes.data) setProducts(productsRes.data as any[])
      if (categoriesRes.data) setCategories(categoriesRes.data as any[])
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

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequest(requestId)
    try {
      await api.post(`/admin/upgrade-requests/${requestId}/approve`)
      toast({
        title: "Đã phê duyệt",
        description: "Yêu cầu nâng cấp đã được phê duyệt thành công.",
      })
      // Refresh data
      fetchDashboardData()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể phê duyệt yêu cầu.",
        variant: "destructive"
      })
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequest(requestId)
    try {
      await api.post(`/admin/upgrade-requests/${requestId}/reject`, {
        reason: "Không đáp ứng yêu cầu"
      })
      toast({
        title: "Đã từ chối",
        description: "Yêu cầu nâng cấp đã bị từ chối.",
      })
      // Refresh data
      fetchDashboardData()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể từ chối yêu cầu.",
        variant: "destructive"
      })
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return

    try {
      await api.delete(`/admin/categories/${categoryId}`)
      toast({
        title: "Thành công",
        description: "Danh mục đã được xóa.",
      })
      fetchDashboardData()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa danh mục có sản phẩm.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return

    try {
      await api.delete(`/admin/products/${productId}`)
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được xóa.",
      })
      fetchDashboardData()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa sản phẩm có bid.",
        variant: "destructive"
      })
    }
  }

  const handleViewProduct = (productId: number) => {
    navigate(`/product/${productId}`)
  }

  const handleViewUser = (username: string) => {
    navigate(`/profile/${username}`)
  }

  if (!user || user.role !== 'admin') {
    return null;
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage platform, users, and listings</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/admin/products')} variant="outline">
              Quản lý sản phẩm
            </Button>
            <Button onClick={() => navigate('/admin/categories')} variant="outline">
              Quản lý danh mục
            </Button>
          </div>
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
                          <Button variant="ghost" size="sm" onClick={() => handleViewUser(user.username)}>
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
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Input placeholder="Search listings..." className="max-w-xs" />
                <Button variant="outline">Filter</Button>
              </div>
              <Button onClick={() => navigate('/admin/products')}>
                Quản lý chi tiết
              </Button>
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
                            <Button variant="ghost" size="sm" onClick={() => handleViewProduct(product.id)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={product.total_bids > 0}
                            >
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
                      <Button variant="outline" size="sm" onClick={() => handleViewUser(request.username)}>
                        View Profile
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleApproveRequest(request.request_id)}
                        disabled={processingRequest === request.request_id}
                      >
                        {processingRequest === request.request_id ? "Processing..." : "Approve"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive bg-transparent"
                        onClick={() => handleRejectRequest(request.request_id)}
                        disabled={processingRequest === request.request_id}
                      >
                        {processingRequest === request.request_id ? "Processing..." : "Reject"}
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
                <div>
                  <h3 className="font-semibold text-lg mb-1">Quản lý danh mục</h3>
                  <p className="text-sm text-muted-foreground">
                    Tạo, chỉnh sửa và tổ chức danh mục sản phẩm
                  </p>
                </div>
                <Button onClick={() => navigate('/admin/categories')} size="lg">
                  Quản lý danh mục
                </Button>
              </div>

              {/* Category Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Tổng danh mục</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Danh mục cha</p>
                  <p className="text-2xl font-bold">
                    {categories.filter(c => !c.parent_id).length}
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Danh mục con</p>
                  <p className="text-2xl font-bold">
                    {categories.filter(c => c.parent_id).length}
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Tổng sản phẩm</p>
                  <p className="text-2xl font-bold">
                    {categories.reduce((sum, c) => sum + (c.total_products || 0), 0)}
                  </p>
                </div>
              </div>

              {/* Quick Overview */}
              <div className="border-t border-border pt-6">
                <h4 className="font-semibold mb-4">Danh mục hàng đầu</h4>
                {loading ? (
                  <p className="text-center text-muted-foreground py-4">Đang tải...</p>
                ) : categories.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Chưa có danh mục nào</p>
                ) : (
                  <div className="space-y-2">
                    {categories
                      .sort((a, b) => (b.total_products || 0) - (a.total_products || 0))
                      .slice(0, 5)
                      .map((cat) => (
                        <div key={cat.id} className="flex justify-between items-center p-3 bg-muted/20 rounded">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {cat.parent_id && '↳ '}
                              {cat.name}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {cat.parent_id ? 'Con' : 'Cha'}
                            </Badge>
                          </div>
                          <Badge variant="secondary">{cat.total_products || 0} sản phẩm</Badge>
                        </div>
                      ))
                    }
                  </div>
                )}
                <div className="mt-4 text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/admin/categories')}
                    className="w-full sm:w-auto"
                  >
                    Xem tất cả và quản lý
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
