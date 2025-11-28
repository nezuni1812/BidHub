import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom";
import { CheckCircle, Users, TrendingUp, DollarSign } from "lucide-react"

export default function SellingPage() {
  const features = [
    {
      icon: Users,
      title: "Reach Millions of Buyers",
      description: "Connect with thousands of active bidders looking for quality items",
    },
    {
      icon: TrendingUp,
      title: "Maximize Your Earnings",
      description: "Competitive bidding drives prices up and increases your revenue",
    },
    {
      icon: DollarSign,
      title: "Easy Payments",
      description: "Secure payments and fast withdrawal of your earnings",
    },
    {
      icon: CheckCircle,
      title: "Safe & Protected",
      description: "Built-in buyer & seller protection for peace of mind",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Start Selling Today</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of sellers earning money by auctioning their items on AuctionHub
          </p>
          <Link to="/seller/post-item">
            <Button size="lg">Post Your First Item</Button>
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
          <h2 className="text-2xl font-bold mb-8 text-center">How to Sell</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Create Account", desc: "Sign up and verify your email" },
              { step: 2, title: "Post Item", desc: "Add photos, description & pricing" },
              { step: 3, title: "Attract Bidders", desc: "Let buyers compete for your item" },
              { step: 4, title: "Get Paid", desc: "Receive payment after auction ends" },
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
          <h2 className="text-2xl font-bold mb-4">Ready to start selling?</h2>
          <p className="text-muted-foreground mb-8">Get access to millions of potential buyers</p>
          <Link to="/register">
            <Button size="lg" className="gap-2">
              Create Free Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
