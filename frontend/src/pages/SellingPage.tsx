import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Users, TrendingUp, DollarSign } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function SellingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [hasUpgradeRequest, setHasUpgradeRequest] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Redirect admin to admin dashboard
  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin')
    }
  }, [user, navigate])

  useEffect(() => {
    if (user && user.role === 'bidder') {
      checkUpgradeRequest()
    }
  }, [user])

  const checkUpgradeRequest = async () => {
    try {
      const response = await api.get('/bidder/upgrade-request')
      if (response.data) {
        setHasUpgradeRequest(true)
      }
    } catch (error: any) {
      // No request found
      setHasUpgradeRequest(false)
    }
  }

  const handlePostProduct = () => {
    if (!user) {
      navigate('/auth/login')
      return
    }

    if (user.role === 'admin') {
      navigate('/admin')
      return
    }

    if (user.role === 'seller') {
      navigate('/seller/post-item')
      return
    }

    // Bidder role - check if already requested
    if (hasUpgradeRequest) {
      toast({
        title: "Yêu cầu đang chờ xử lý",
        description: "Yêu cầu nâng cấp lên Seller của bạn đang được admin xem xét.",
        variant: "default"
      })
      return
    }

    // Show upgrade dialog
    setShowUpgradeDialog(true)
  }

  const handleUpgradeRequest = async () => {
    setIsLoading(true)
    try {
      await api.post('/bidder/upgrade-request')
      toast({
        title: "Yêu cầu thành công",
        description: "Yêu cầu nâng cấp lên Seller đã được gửi. Admin sẽ xem xét trong thời gian sớm nhất.",
      })
      setHasUpgradeRequest(true)
      setShowUpgradeDialog(false)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi yêu cầu. Vui lòng thử lại.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: Users,
      title: "Tiếp cận hàng triệu người mua",
      description: "Kết nối với hàng nghìn người đấu giá đang tìm kiếm sản phẩm chất lượng",
    },
    {
      icon: TrendingUp,
      title: "Tối đa hóa thu nhập",
      description: "Đấu giá cạnh tranh giúp tăng giá và gia tăng doanh thu của bạn",
    },
    {
      icon: DollarSign,
      title: "Thanh toán dễ dàng",
      description: "Thanh toán an toàn và rút tiền nhanh chóng",
    },
    {
      icon: CheckCircle,
      title: "An toàn & Bảo vệ",
      description: "Bảo vệ người mua & người bán tích hợp sẵn để an tâm",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Bắt đầu bán hàng ngay hôm nay</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Tham gia cùng hàng nghìn người bán kiếm tiền bằng cách đấu giá sản phẩm trên Bido
          </p>
          <Button size="lg" onClick={handlePostProduct}>
            {hasUpgradeRequest ? "Yêu cầu đang chờ xử lý" : "Đăng sản phẩm đầu tiên"}
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <Card key={idx} className="p-6 text-center">
                <Icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </Card>
            )
          })}
        </div>

        {/* How It Works */}
        <div className="bg-muted/50 rounded-lg p-8 sm:p-12 mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Cách thức bán hàng</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Tạo tài khoản", desc: "Đăng ký và xác minh email" },
              { step: 2, title: "Đăng sản phẩm", desc: "Thêm ảnh, mô tả và giá" },
              { step: 3, title: "Thu hút người mua", desc: "Để người mua cạnh tranh cho sản phẩm" },
              { step: 4, title: "Nhận tiền", desc: "Nhận thanh toán sau khi đấu giá kết thúc" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sẵn sàng bắt đầu bán hàng?</h2>
          <p className="text-muted-foreground mb-8">Tiếp cận hàng triệu người mua tiềm năng</p>
          <Link to="/register">
            <Button size="lg" className="gap-2">
              Tạo tài khoản miễn phí
            </Button>
          </Link>
        </div>
      </div>

      {/* Upgrade Request Dialog */}
      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nâng cấp lên Seller</AlertDialogTitle>
            <AlertDialogDescription>
              Để đăng sản phẩm, bạn cần nâng cấp tài khoản lên vai trò Seller.
              Yêu cầu của bạn sẽ được gửi đến admin để xem xét và phê duyệt.
              <br /><br />
              Bạn có muốn gửi yêu cầu nâng cấp không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpgradeRequest} disabled={isLoading}>
              {isLoading ? "Đang gửi..." : "Gửi yêu cầu"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
