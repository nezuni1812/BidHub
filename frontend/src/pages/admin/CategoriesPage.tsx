import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useState } from "react"

interface Category {
  id: number
  name: string
  parent: string | null
  items: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: "Electronics", parent: null, items: 234 },
    { id: 2, name: "Smartphones", parent: "Electronics", items: 89 },
    { id: 3, name: "Laptops", parent: "Electronics", items: 45 },
    { id: 4, name: "Fashion", parent: null, items: 156 },
    { id: 5, name: "Shoes", parent: "Fashion", items: 78 },
    { id: 6, name: "Watches", parent: "Fashion", items: 32 },
  ])

  const [newCategory, setNewCategory] = useState({ name: "", parent: "" })
  const [editingId, setEditingId] = useState<number | null>(null)

  const topLevelCategories = categories.filter((c) => !c.parent)
  const subcategories = (parentName: string) => categories.filter((c) => c.parent === parentName)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Category Management</h1>
            <p className="text-muted-foreground">Manage auction categories</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </div>

        {/* Add New Category */}
        <Card className="p-6 mb-8">
          <h3 className="font-semibold mb-4">Add New Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="e.g., Electronics"
                className="mt-2"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="parent">Parent Category (Optional)</Label>
              <select
                id="parent"
                value={newCategory.parent}
                onChange={(e) => setNewCategory({ ...newCategory, parent: e.target.value })}
                className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background"
              >
                <option value="">None</option>
                {topLevelCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button className="mt-4">Create Category</Button>
        </Card>

        {/* Categories List */}
        {topLevelCategories.map((category) => (
          <Card key={category.id} className="p-6 mb-6">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.items} items</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Subcategories */}
            {subcategories(category.name).length > 0 && (
              <div className="space-y-2 ml-4">
                {subcategories(category.name).map((subcat) => (
                  <div key={subcat.id} className="flex justify-between items-center p-3 bg-muted/30 rounded">
                    <div>
                      <p className="font-medium text-sm">↳ {subcat.name}</p>
                      <p className="text-xs text-muted-foreground">{subcat.items} items</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
