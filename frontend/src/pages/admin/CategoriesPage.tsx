import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

interface Category {
  id: number
  name: string
  parent_id: number | null
  parent_name?: string
  total_products: number
  direct_products: number
  created_at: string
  updated_at: string
}

export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState({ name: "", parent_id: "" })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingData, setEditingData] = useState({ name: "", parent_id: "" })
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
      fetchCategories()
    }
  }, [user])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await api.get<Category[]>('/admin/categories?page=1&limit=100')
      if (response.data) {
        setCategories(response.data)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load categories",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên danh mục không được để trống",
        variant: "destructive"
      })
      return
    }

    try {
      await api.post('/admin/categories', {
        name: newCategory.name,
        parent_id: newCategory.parent_id ? parseInt(newCategory.parent_id) : null
      })
      toast({
        title: "Thành công",
        description: "Danh mục đã được tạo",
      })
      setNewCategory({ name: "", parent_id: "" })
      fetchCategories()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo danh mục",
        variant: "destructive"
      })
    }
  }

  const handleUpdateCategory = async (id: number) => {
    if (!editingData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên danh mục không được để trống",
        variant: "destructive"
      })
      return
    }

    try {
      await api.put(`/admin/categories/${id}`, {
        name: editingData.name,
        parent_id: editingData.parent_id ? parseInt(editingData.parent_id) : null
      })
      toast({
        title: "Thành công",
        description: "Danh mục đã được cập nhật",
      })
      setEditingId(null)
      fetchCategories()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật danh mục",
        variant: "destructive"
      })
    }
  }

  const handleDeleteCategory = async (id: number, productCount: number) => {
    if (productCount > 0) {
      toast({
        title: "Không thể xóa",
        description: `Danh mục có ${productCount} sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm trước.`,
        variant: "destructive"
      })
      return
    }

    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return

    try {
      await api.delete(`/admin/categories/${id}`)
      toast({
        title: "Thành công",
        description: "Danh mục đã được xóa",
      })
      fetchCategories()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa danh mục",
        variant: "destructive"
      })
    }
  }

  const startEditing = (category: Category) => {
    setEditingId(category.id)
    setEditingData({
      name: category.name,
      parent_id: category.parent_id?.toString() || ""
    })
  }

  const parentCategories = categories.filter((c) => !c.parent_id)
  const getChildCategories = (parentId: number) => categories.filter((c) => c.parent_id === parentId)

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p>Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Quản lý danh mục</h1>
            <p className="text-muted-foreground">Quản lý danh mục và danh mục con của sản phẩm đấu giá</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/admin/products')} variant="outline">
              Quản lý sản phẩm
            </Button>
            <Button onClick={() => navigate('/admin')} variant="outline">
              Về Dashboard
            </Button>
          </div>
        </div>

        {/* Add New Category */}
        <Card className="p-6 mb-8">
          <h3 className="font-semibold mb-4">Thêm danh mục mới</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Tên danh mục</Label>
              <Input
                id="name"
                placeholder="VD: Điện tử"
                className="mt-2"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="parent">Danh mục cha (Tùy chọn)</Label>
              <select
                id="parent"
                value={newCategory.parent_id}
                onChange={(e) => setNewCategory({ ...newCategory, parent_id: e.target.value })}
                className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background"
              >
                <option value="">Không (Cấp cao nhất)</option>
                {parentCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button className="mt-4 gap-2" onClick={handleCreateCategory}>
            <Plus className="w-4 h-4" />
            Tạo danh mục
          </Button>
        </Card>

        {/* Categories List */}
        <div className="space-y-4">
          {parentCategories.length === 0 && (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">Chưa có danh mục nào. Tạo danh mục đầu tiên ở trên.</p>
            </Card>
          )}
          
          {parentCategories.map((category) => {
            const childCategories = getChildCategories(category.id)
            const isEditing = editingId === category.id
            
            return (
              <Card key={category.id} className="overflow-hidden">
                {/* Parent Category */}
                <div className="p-6 bg-muted/30">
                  {isEditing ? (
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <Label htmlFor={`edit-name-${category.id}`}>Category Name</Label>
                        <Input
                          id={`edit-name-${category.id}`}
                          value={editingData.name}
                          onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      <Button onClick={() => handleUpdateCategory(category.id)}>Save</Button>
                      <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{category.name}</h3>
                          <Badge variant="secondary">Danh mục cha</Badge>
                          <Badge variant="outline">{category.total_products} sản phẩm</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.direct_products} sản phẩm trực tiếp
                          {childCategories.length > 0 && ` • ${childCategories.length} danh mục con`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEditing(category)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive"
                          onClick={() => handleDeleteCategory(category.id, category.total_products)}
                          disabled={category.total_products > 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Child Categories */}
                {childCategories.length > 0 && (
                  <div className="p-6 space-y-3">
                    {childCategories.map((subcat) => {
                      const isEditingSub = editingId === subcat.id
                      
                      return (
                        <div key={subcat.id} className="flex items-center gap-3 p-4 bg-muted/20 rounded-lg border border-border">
                          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          
                          {isEditingSub ? (
                            <div className="flex gap-4 items-center flex-1">
                              <Input
                                value={editingData.name}
                                onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                                className="flex-1"
                              />
                              <Button size="sm" onClick={() => handleUpdateCategory(subcat.id)}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{subcat.name}</p>
                                  <Badge variant="outline" className="text-xs">{subcat.total_products} sản phẩm</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">Danh mục con của {category.name}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => startEditing(subcat)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-destructive"
                                  onClick={() => handleDeleteCategory(subcat.id, subcat.total_products)}
                                  disabled={subcat.total_products > 0}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

