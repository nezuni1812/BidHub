"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Check, Clock, MapPin, AlertCircle, MessageSquare, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useChat } from "@/contexts/ChatContext"
import { useEffect } from "react"
import { ChatSidebarOverlay } from "@/components/chat-sidebar-overlay"
import { useParams } from "react-router-dom";

interface OrderStep {
  id: number
  title: string
  status: "completed" | "current" | "pending"
}

interface ChatMessage {
  id: number
  sender: string
  text: string
  time: string
}

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
      return <div>Product not found</div>;
  }
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const [paymentMethod, setPaymentMethod] = useState("momo")
  const [address, setAddress] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isSeller] = useState(true)

  const [showChatSidebar, setShowChatSidebar] = useState(false)

  const order = {
    id,
    productName: "Vintage Camera Collection - Sony Alpha 7",
    winningBid: 2500000,
    seller: "TechCollector",
    buyer: "You",
  }

  const paymentMethods = [
    { id: "momo", name: "MoMo", icon: "💳" },
    { id: "zalopay", name: "ZaloPay", icon: "💳" },
    { id: "vnpay", name: "VNPay QR", icon: "📱" },
    { id: "stripe", name: "Stripe", icon: "💳" },
    { id: "paypal", name: "PayPal", icon: "🅿️" },
  ]

  const steps: OrderStep[] = [
    { id: 1, title: "Payment", status: currentStep === 1 ? "current" : currentStep > 1 ? "completed" : "pending" },
    {
      id: 2,
      title: "Shipping Address",
      status: currentStep === 2 ? "current" : currentStep > 2 ? "completed" : "pending",
    },
    {
      id: 3,
      title: "Seller Confirmation",
      status: currentStep === 3 ? "current" : currentStep > 3 ? "completed" : "pending",
    },
    { id: 4, title: "Delivery", status: currentStep === 4 ? "current" : currentStep > 4 ? "completed" : "pending" },
  ]

  const { setActiveConversation } = useChat()

  useEffect(() => {
    const seller = {
      id: "1",
      username: "TechCollector",
      lastMessage: "Thanks for winning! Please pay within 24 hours.",
      unread: 0,
      timestamp: "2:30 PM",
      productName: order.productName,
      orderId: order.id,
    }
    setActiveConversation(seller)
  }, [id])

  const handlePayment = async () => {
    if (!paymentMethod) {
      setErrors({ payment: "Please select a payment method" })
      return
    }
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    setCurrentStep(2)
  }

  const handleAddressSubmit = async () => {
    const newErrors: Record<string, string> = {}
    if (!address.trim()) newErrors.address = "Address is required"
    if (!phoneNumber.trim()) newErrors.phone = "Phone number is required"
    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setIsLoading(false)
      setCurrentStep(3)
    }
  }

  const handleSendMessage = () => {
    // Handled in global chat context
  }

  const handleCancelTransaction = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setShowCancelDialog(false)
    alert("Transaction cancelled. Buyer has been assigned -1 rating and notified via email.")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Order Completion</h1>

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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {currentStep === 1 && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">Select Payment Method</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-4 rounded-lg border-2 transition text-left ${
                        paymentMethod === method.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <p className="text-lg font-semibold">{method.name}</p>
                    </button>
                  ))}
                </div>
                {errors.payment && (
                  <p className="text-sm text-destructive mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.payment}
                  </p>
                )}
                <Button className="w-full" size="lg" onClick={handlePayment} disabled={isLoading}>
                  {isLoading ? "Processing..." : "Continue to Shipping"}
                </Button>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Full Address</label>
                    <textarea
                      placeholder="Enter your shipping address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full mt-2 p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none h-24"
                    />
                    {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input
                      type="tel"
                      placeholder="Your phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep(1)} disabled={isLoading}>
                      Back
                    </Button>
                    <Button className="flex-1" onClick={handleAddressSubmit} disabled={isLoading}>
                      {isLoading ? "Saving..." : "Submit Address"}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="p-8">
                <div className="text-center py-8">
                  <Clock className="w-16 h-16 text-accent mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Waiting for Seller Confirmation</h2>
                  <p className="text-muted-foreground mb-4">
                    Your payment and shipping address have been received. The seller will confirm receipt of payment and
                    shipping information within 24 hours.
                  </p>
                  <Badge variant="outline" className="inline-block">
                    Status: Pending Seller Confirmation
                  </Badge>
                </div>
              </Card>
            )}

            {currentStep === 4 && (
              <Card className="p-8">
                <div className="text-center py-8">
                  <MapPin className="w-16 h-16 text-accent mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Delivery in Progress</h2>
                  <p className="text-muted-foreground mb-4">
                    Your item has been shipped and is on its way. You can track your delivery status using the tracking
                    number provided by the seller.
                  </p>
                  <Button className="mt-4">View Tracking</Button>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebars */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card className="p-6 sticky top-20">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Product</p>
                  <p className="font-semibold line-clamp-2">{order.productName}</p>
                </div>
                <div className="pb-4 border-b border-border">
                  <p className="text-xs text-muted-foreground">Winning Bid</p>
                  <p className="text-2xl font-bold text-primary">${(order.winningBid / 1000000).toFixed(1)}M</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seller</span>
                    <span className="font-medium">{order.seller}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">TBD</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">${(order.winningBid / 1000000).toFixed(1)}M</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Seller Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Seller Information</h3>
              <div className="space-y-3 text-sm">
                <p className="font-semibold">{order.seller}</p>
                <div className="flex items-center gap-1">
                  {"★".repeat(4)}
                  <span className="text-muted-foreground">4.8 (156 reviews)</span>
                </div>

                <Button
                  className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => setShowChatSidebar(true)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact {isSeller ? order.buyer : order.seller}
                </Button>

                {isSeller && (
                  <Button variant="destructive" className="w-full mt-2" onClick={() => setShowCancelDialog(true)}>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Cancel Transaction
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>

        {showCancelDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Cancel Transaction?</h2>
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-sm text-red-700 font-semibold mb-2">Important:</p>
                  <ul className="text-sm text-red-600 space-y-1 ml-4 list-disc">
                    <li>The buyer will receive a -1 rating</li>
                    <li>This action cannot be undone</li>
                    <li>The transaction will be marked as cancelled</li>
                    <li>Buyer will be notified via email</li>
                  </ul>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <p className="text-sm mb-2">
                    <span className="font-semibold">Reason:</span> Payment not received or requirements not met within
                    agreed timeframe
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowCancelDialog(false)}
                  disabled={isLoading}
                >
                  Keep Transaction
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleCancelTransaction} disabled={isLoading}>
                  {isLoading ? "Cancelling..." : "Confirm Cancel"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        <ChatSidebarOverlay
          isOpen={showChatSidebar}
          onClose={() => setShowChatSidebar(false)}
          activeConversationId="1"
        />
      </div>
    </div>
  )
}
