import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Eye, Trash2, Search, Filter } from "lucide-react"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Product {
  id: number
  title: string
  seller_name: string
  current_price: number
  starting_price: number
  status: string
  end_time: string
  total_bids: number
  category_name: string
  created_at: string
}

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 0
  })
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    ended: 0
  })
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
      fetchProducts()
    }
  }, [page, user])

  useEffect(() => {
    // Reset to page 1 when filter changes
    setPage(1)
  }, [statusFilter, searchQuery])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        limit: '100' // Load all products for client-side filtering
      })

      const response = await api.get(`/admin/products?${params.toString()}`)
      if (response.data) {
        setProducts(response.data as Product[])
        
        // Calculate stats from all data
        const dataArray = Array.isArray(response.data) ? response.data : []
        const currentStats = {
          total: dataArray.length,
          active: dataArray.filter((p: Product) => p.status === 'active').length,
          pending: dataArray.filter((p: Product) => p.status === 'pending').length,
          ended: dataArray.filter((p: Product) => p.status === 'ended').length
        }
        setStats(currentStats)
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách sản phẩm",
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

  const handleDeleteProduct = async (productId: number, totalBids: number) => {
    if (totalBids > 0) {
      toast({
        title: "Không thể xóa",
        description: `Sản phẩm có ${totalBids} lượt đặt giá. Không thể xóa sản phẩm đã có người đấu giá.`,
        variant: "destructive"
      })
      return
    }

    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.')) return

    try {
      await api.delete(`/admin/products/${productId}`)
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được xóa",
      })
      fetchProducts()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa sản phẩm",
        variant: "destructive"
      })
    }
  }

  const handleViewProduct = (productId: number) => {
    navigate(`/product/${productId}`)
  }

  // Filter products based on search and status
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery ||
      product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.seller_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Paginate filtered results
  const pageSize = 20
  const totalPages = Math.ceil(filteredProducts.length / pageSize)
  const paginatedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize)

  // Update pagination info
  useEffect(() => {
    setPagination({
      page: page,
      page_size: pageSize,
      total: filteredProducts.length,
      total_pages: totalPages
    })
  }, [filteredProducts.length, page, totalPages])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Đang đấu giá</Badge>
      case 'pending':
        return <Badge variant="outline">Chờ duyệt</Badge>
      case 'ended':
        return <Badge variant="secondary">Đã kết thúc</Badge>
      case 'completed':
        return <Badge className="bg-blue-600">Hoàn thành</Badge>
      case 'removed':
        return <Badge variant="destructive">Đã xóa</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading && products.length === 0) {
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
            <h1 className="text-3xl font-bold">Quản lý sản phẩm</h1>
            <p className="text-muted-foreground">Xem và quản lý tất cả sản phẩm đấu giá</p>
          </div>
          <Button onClick={() => navigate('/admin')} variant="outline">
            Về Dashboard
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Tổng sản phẩm</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Đang đấu giá</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Đã kết thúc</p>
            <p className="text-2xl font-bold text-muted-foreground">{stats.ended}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên sản phẩm, người bán, danh mục..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Đang đấu giá</SelectItem>
                  <SelectItem value="ended">Đã kết thúc</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="removed">Đã xóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Products Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-semibold">Sản phẩm</th>
                  <th className="text-left py-3 px-4 font-semibold">Người bán</th>
                  <th className="text-left py-3 px-4 font-semibold">Danh mục</th>
                  <th className="text-left py-3 px-4 font-semibold">Giá hiện tại</th>
                  <th className="text-left py-3 px-4 font-semibold">Lượt đấu giá</th>
                  <th className="text-left py-3 px-4 font-semibold">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-semibold">Kết thúc</th>
                  <th className="text-left py-3 px-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      Đang tải...
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      Không tìm thấy sản phẩm
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <tr key={product.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div className="font-medium max-w-xs truncate">{product.title}</div>
                        <div className="text-xs text-muted-foreground">ID: {product.id}</div>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{product.seller_name}</td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="text-xs">
                          {product.category_name || 'N/A'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 font-semibold">{formatPrice(product.current_price)}</td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant="secondary">{product.total_bids || 0}</Badge>
                      </td>
                      <td className="py-4 px-4">{getStatusBadge(product.status)}</td>
                      <td className="py-4 px-4 text-muted-foreground text-xs">
                        {new Date(product.end_time).toLocaleDateString('vi-VN')}
                        <br />
                        {new Date(product.end_time).toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewProduct(product.id)}
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteProduct(product.id, product.total_bids)}
                            disabled={product.total_bids > 0}
                            title={product.total_bids > 0 ? "Không thể xóa sản phẩm đã có lượt đấu giá" : "Xóa sản phẩm"}
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
        </Card>

        {/* Pagination */}
        {!loading && pagination.total_pages > 1 && (
          <div className="mt-8">
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
              >
                Trang trước
              </Button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.total_pages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pagination.total_pages - 2) {
                    pageNum = pagination.total_pages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      disabled={loading}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(pagination.total_pages, page + 1))}
                disabled={page === pagination.total_pages || loading}
              >
                Trang sau
              </Button>
            </div>
            
            <p className="text-center text-sm text-muted-foreground mt-3">
              Trang {page} / {pagination.total_pages} • Tổng {pagination.total} sản phẩm
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
