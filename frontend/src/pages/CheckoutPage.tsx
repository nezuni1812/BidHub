"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { Check, MapPin, Package, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { StripePaymentForm } from "@/components/stripe-payment-form"

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

interface OrderStep {
  id: number
  title: string
  status: "completed" | "current" | "pending"
}

interface OrderData {
  id: number
  product_id: number
  product_title: string
  product_image: string
  total_price: string
  order_status: string
  payment_status: string
  shipping_address: string | null
  buyer_name: string
  seller_name: string
  seller_id: number
  buyer_id: number
}

export default function CheckoutPage() {
  const { id: orderId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const [order, setOrder] = useState<OrderData | null>(null)
  const [address, setAddress] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [clientSecret, setClientSecret] = useState("")
  const [paymentIntentId, setPaymentIntentId] = useState("")

  const steps: OrderStep[] = [
    { id: 1, title: "Thanh toán", status: currentStep === 1 ? "current" : currentStep > 1 ? "completed" : "pending" },
    {
      id: 2,
      title: "Địa chỉ giao hàng",
      status: currentStep === 2 ? "current" : currentStep > 2 ? "completed" : "pending",
    },
    {
      id: 3,
      title: "Xác nhận người bán",
      status: currentStep === 3 ? "current" : currentStep > 3 ? "completed" : "pending",
    },
    { id: 4, title: "Giao hàng", status: currentStep === 4 ? "current" : currentStep > 4 ? "completed" : "pending" },
  ]

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      try {
        setIsLoading(true);
        const response = await api.get(`/orders/${orderId}`);
        
        if (response.data) {
          setOrder(response.data);
          
          // Determine current step based on order status
          if (response.data.order_status === 'pending_payment') {
            setCurrentStep(1);
          } else if (response.data.order_status === 'paid' && !response.data.shipping_address) {
            setCurrentStep(2);
          } else if (response.data.order_status === 'paid' && response.data.shipping_address) {
            setCurrentStep(3);
          } else if (response.data.order_status === 'shipping' || response.data.order_status === 'delivered') {
            setCurrentStep(4);
          }
        }
      } catch (error: any) {
        console.error('Error fetching order:', error);
        toast({
          title: "Lỗi",
          description: error.response?.data?.message || "Không thể tải đơn hàng",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId])

  const handleCreatePaymentIntent = async () => {
    if (!order) return;
    
    try {
      setIsLoading(true);
      const response = await api.post(`/orders/${order.id}/create-payment-intent`, {});
      
      if (response.data) {
        setClientSecret(response.data.clientSecret);
        setPaymentIntentId(response.data.paymentIntentId);
        
        toast({
          title: "Đã khởi tạo thanh toán",
          description: "Vui lòng sử dụng thẻ test: 4242 4242 4242 4242",
        });
      }
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể khởi tạo thanh toán",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!order || !clientSecret) return;
    
    try {
      setIsLoading(true);
      
      // Extract payment intent ID from client secret
      const intentId = clientSecret.split('_secret_')[0];
      
      const response = await api.post(`/orders/${order.id}/confirm-payment`, {
        paymentIntentId: intentId
      });
      
      if (response.success || response.data?.success) {
        toast({
          title: "Thanh toán thành công",
          description: "Thanh toán của bạn đã được xử lý",
        });
        setCurrentStep(2);
        setClientSecret(""); // Reset for next time
      }
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể xác nhận thanh toán",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSubmit = async () => {
    if (!order) return;
    
    const newErrors: Record<string, string> = {};
    if (!address.trim()) newErrors.address = "Vui lòng nhập địa chỉ";
    if (!phoneNumber.trim()) newErrors.phone = "Vui lòng nhập số điện thoại";
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      try {
        setIsLoading(true);
        await api.put(`/orders/${order.id}/shipping-address`, {
          shipping_address: `${address} | Phone: ${phoneNumber}`
        });
        
        toast({
          title: "Đã lưu địa chỉ",
          description: "Địa chỉ giao hàng đã được cập nhật",
        });
        setCurrentStep(3);
      } catch (error: any) {
        console.error('Error updating address:', error);
        toast({
          title: "Lỗi",
          description: error.response?.data?.message || "Không thể cập nhật địa chỉ",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  }

  if (isLoading && !order) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Card className="p-8 text-center">
            <p className="text-destructive">Không tìm thấy đơn hàng</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Quay lại Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Hoàn tất đơn hàng</h1>

        {/* Order Summary Card */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-4">
            <img 
              src={order.product_image} 
              alt={order.product_title}
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold">{order.product_title}</h2>
              <p className="text-muted-foreground">Người bán: {order.seller_name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Tổng tiền</p>
              <p className="text-2xl font-bold text-primary">
                {parseInt(order.total_price).toLocaleString('vi-VN')} VND
              </p>
            </div>
          </div>
        </Card>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-between mb-8">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition ${
                    step.status === "completed"
                      ? "bg-accent text-accent-foreground"
                      : step.status === "current"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.status === "completed" ? <Check className="w-6 h-6" /> : step.id}
                </div>
                <p className={`ml-3 text-sm font-medium ${step.status === "pending" ? "text-muted-foreground" : ""}`}>
                  {step.title}
                </p>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${step.status === "completed" ? "bg-accent" : "bg-muted"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {currentStep === 1 && (
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">Thanh toán</h2>
                </div>
                
                {!clientSecret ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                        <strong>Stripe Test Mode</strong>
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Use card: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">4242 4242 4242 4242</code>
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Any future date for expiry, any 3 digits for CVC
                      </p>
                    </div>
                    <Button 
                      onClick={handleCreatePaymentIntent}
                      disabled={isLoading}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? "Đang khởi tạo thanh toán..." : "Tiếp tục thanh toán"}
                    </Button>
                  </div>
                ) : (
                  <Elements 
                    stripe={stripePromise} 
                    options={{ 
                      clientSecret,
                      appearance: { theme: 'stripe' }
                    }}
                  >
                    <StripePaymentForm 
                      onSuccess={handlePaymentSuccess}
                      amount={order?.total_price || "0"}
                    />
                  </Elements>
                )}
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">Địa chỉ giao hàng</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Địa chỉ đầy đủ</label>
                    <textarea
                      placeholder="Nhập địa chỉ giao hàng của bạn"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full mt-2 p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none h-24"
                    />
                    {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Số điện thoại</label>
                    <Input
                      type="tel"
                      placeholder="Số điện thoại của bạn"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep(1)} disabled={isLoading}>
                      Quay lại
                    </Button>
                    <Button className="flex-1" onClick={handleAddressSubmit} disabled={isLoading}>
                      {isLoading ? "Đang lưu..." : "Gửi địa chỉ"}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="p-8">
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-accent mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Đang chờ xác nhận từ người bán</h2>
                  <p className="text-muted-foreground mb-4">
                    Thanh toán và địa chỉ giao hàng của bạn đã được tiếp nhận. Người bán sẽ xác nhận và gửi hàng trong vòng 24-48 giờ.
                  </p>
                  <Badge variant="outline" className="inline-block mb-4">
                    Trạng thái: Chờ gửi hàng
                  </Badge>
                </div>
              </Card>
            )}

            {currentStep === 4 && (
              <Card className="p-8">
                <div className="text-center py-8">
                  <MapPin className="w-16 h-16 text-accent mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Đang giao hàng</h2>
                  <p className="text-muted-foreground mb-4">
                    Sản phẩm của bạn đã được gửi đi và đang trên đường giao hàng. Bạn có thể theo dõi trạng thái giao hàng bằng mã vận đơn do người bán cung cấp.
                  </p>
                  <Button className="mt-4">Xem thông tin vận chuyển</Button>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Sản phẩm</p>
                  <p className="font-semibold line-clamp-2">{order.product_title}</p>
                </div>
                <div className="pb-4 border-b border-border">
                  <p className="text-xs text-muted-foreground">Giá cuối</p>
                  <p className="text-2xl font-bold text-primary">
                    {parseInt(order.total_price).toLocaleString('vi-VN')} VND
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Người bán</span>
                    <span className="font-medium">{order.seller_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trạng thái đơn</span>
                    <Badge variant="outline">{order.order_status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trạng thái thanh toán</span>
                    <Badge variant={order.payment_status === 'completed' ? 'default' : 'outline'}>
                      {order.payment_status}
                    </Badge>
                  </div>
                  {order.shipping_address && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Địa chỉ giao hàng</p>
                      <p className="text-sm">{order.shipping_address}</p>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className="font-medium">Chưa xác định</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between font-bold">
                    <span>Tổng cộng</span>
                    <span className="text-primary">
                      {parseInt(order.total_price).toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Help Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">Cần trợ giúp?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Liên hệ hỗ trợ nếu bạn có bất kỳ câu hỏi nào về đơn hàng.
              </p>
              <Button variant="outline" className="w-full">
                Liên hệ hỗ trợ
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
