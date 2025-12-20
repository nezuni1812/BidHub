import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Users, TrendingUp, DollarSign } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect } from "react"

export default function SellingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect sellers to their dashboard
    if (user && user.role === 'seller') {
      navigate('/seller/dashboard');
    }
  }, [user, navigate]);

  // Don't render content if user is seller (while redirecting)
  if (user && user.role === 'seller') {
    return null;
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
          <Link to="/seller/post-item">
            <Button size="lg">Đăng sản phẩm đầu tiên</Button>
          </Link>
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
    </div>
  )
}
