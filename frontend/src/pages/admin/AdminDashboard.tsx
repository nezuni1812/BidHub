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
  
  // Filter states
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'active' | 'ended' | 'completed'>('all')
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
        title: "Lỗi",
        description: error.message || "Không thể tải dữ liệu bảng điều khiển",
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

  // Filtered data
  const filteredUsers = users.filter(user => {
    const matchesSearch = !userSearchTerm || 
      user.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
    
    const matchesStatus = userStatusFilter === 'all' ||
      (userStatusFilter === 'active' && user.is_active) ||
      (userStatusFilter === 'inactive' && !user.is_active)
    
    return matchesSearch && matchesStatus
  })

  const filteredProducts = products.filter(product => {
    const matchesSearch = !productSearchTerm ||
      product.title?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.seller_name?.toLowerCase().includes(productSearchTerm.toLowerCase())
    
    const matchesStatus = productStatusFilter === 'all' ||
      product.status === productStatusFilter
    
    return matchesSearch && matchesStatus
  })

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p>Đang tải...</p>
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
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Quản lý nền tảng, người dùng và danh sách</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Tổng sản phẩm</p>
              <ShoppingCart className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{stats?.products.total.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.products.active_auctions || 0} phiên đấu giá đang hoạt động
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Tổng người dùng</p>
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{stats?.users.total.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats?.users.new_users || 0} mới tháng này
            </p>
          </Card>

          <Card className="p-6 border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Yêu cầu người bán</p>
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-600">
              {upgradeRequests.length || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Chờ phê duyệt</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Tổng quan nền tảng</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tổng lượt đấu giá (30 ngày)</span>
                <span className="font-semibold">{stats?.bids.total.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tổng danh mục</span>
                <span className="font-semibold">{stats?.categories.total.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Phiên đấu giá mới (30 ngày)</span>
                <span className="font-semibold">{stats?.products.new_auctions.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Nâng cấp đã duyệt (30 ngày)</span>
                <span className="font-semibold">{stats?.upgrades.approved.toLocaleString() || 0}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Phân bổ người dùng</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Quản trị viên</span>
                <Badge variant="default">{stats?.users.by_role.admin || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Người bán</span>
                <Badge variant="secondary">{stats?.users.by_role.seller || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Người đấu giá</span>
                <Badge variant="outline">{stats?.users.by_role.bidder || 0}</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Trạng thái sản phẩm</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Đang hoạt động</span>
                <Badge variant="default">{stats?.products.by_status.active || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Hoàn thành</span>
                <Badge variant="secondary">{stats?.products.by_status.completed || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Kết thúc</span>
                <Badge variant="outline">{stats?.products.by_status.ended || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Chờ duyệt</span>
                <Badge variant="outline">{stats?.products.by_status.pending || 0}</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full max-w-xl grid-cols-4">
            <TabsTrigger value="users">Người dùng</TabsTrigger>
            <TabsTrigger value="listings">Danh sách</TabsTrigger>
            <TabsTrigger value="requests">Yêu cầu người bán</TabsTrigger>
            <TabsTrigger value="categories">Danh mục</TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users" className="mt-6 space-y-4">
            <div className="flex gap-2 mb-4">
              <Input 
                placeholder="Tìm kiếm người dùng..." 
                className="max-w-xs" 
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
              <select 
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value as any)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Tên</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Ngày tham gia</th>
                    <th className="text-left py-3 px-4 font-semibold">Trạng thái</th>
                    <th className="text-left py-3 px-4 font-semibold">Đánh giá</th>
                    <th className="text-left py-3 px-4 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Đang tải người dùng...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Không tìm thấy người dùng
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.slice(0, 10).map((user) => (
                      <tr key={user.user_id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-4 px-4">{user.full_name || user.username}</td>
                        <td className="py-4 px-4 text-muted-foreground">{user.email}</td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={user.is_active ? "default" : "outline"}>
                            {user.is_active ? "Hoạt động" : "Không hoạt động"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          {user.rating !== null && user.rating !== undefined && user.rating !== "0.00"
                            ? `${(parseFloat(user.rating) * 100).toFixed(0)}%` 
                            : "N/A"}
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
                <Input 
                  placeholder="Tìm kiếm danh sách..." 
                  className="max-w-xs" 
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                />
                <select 
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                  value={productStatusFilter}
                  onChange={(e) => setProductStatusFilter(e.target.value as any)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="ended">Kết thúc</option>
                  <option value="completed">Hoàn thành</option>
                </select>
              </div>
              <Button onClick={() => navigate('/admin/products')}>
                Quản lý chi tiết
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Tiêu đề</th>
                    <th className="text-left py-3 px-4 font-semibold">Người bán</th>
                    <th className="text-left py-3 px-4 font-semibold">Giá hiện tại</th>
                    <th className="text-left py-3 px-4 font-semibold">Trạng thái</th>
                    <th className="text-left py-3 px-4 font-semibold">Thời gian kết thúc</th>
                    <th className="text-left py-3 px-4 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Đang tải sản phẩm...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Không tìm thấy sản phẩm
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.slice(0, 10).map((product) => (
                      <tr key={product.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-4 px-4 font-medium">{product.title}</td>
                        <td className="py-4 px-4 text-muted-foreground">{product.seller_name}</td>
                        <td className="py-4 px-4">{formatPrice(product.current_price)}</td>
                        <td className="py-4 px-4">
                          <Badge variant={product.status === 'active' ? 'default' : 'outline'}>
                            {product.status === 'active' ? 'Đang hoạt động' : 
                             product.status === 'ended' ? 'Kết thúc' : 
                             product.status === 'completed' ? 'Hoàn thành' : 
                             product.status === 'pending' ? 'Chờ duyệt' : product.status}
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
                <p className="text-center text-muted-foreground">Đang tải yêu cầu nâng cấp...</p>
              </Card>
            ) : upgradeRequests.length === 0 ? (
              <Card className="p-6">
                <p className="text-center text-muted-foreground">Không có yêu cầu nâng cấp chờ duyệt</p>
              </Card>
            ) : (
              upgradeRequests.map((request) => (
                <Card key={request.id} className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{request.full_name}</h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        Email: {request.email}
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        Tổng lượt đấu giá: {request.total_bids} | Phiên thắng: {request.auctions_won}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Yêu cầu vào {new Date(request.requested_at).toLocaleDateString()}
                      </p>
                      <Badge variant="outline">{request.status}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleApproveRequest(request.id)}
                        disabled={processingRequest === request.id}
                      >
                        {processingRequest === request.id ? "Đang xử lý..." : "Phê duyệt"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive bg-transparent"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={processingRequest === request.id}
                      >
                        {processingRequest === request.id ? "Đang xử lý..." : "Từ chối"}
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
