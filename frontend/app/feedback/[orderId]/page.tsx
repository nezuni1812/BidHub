"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { Star, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function FeedbackPage({ params }: { params: { orderId: string } }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const order = {
    id: params.orderId,
    productName: "Vintage Camera Collection - Sony Alpha 7",
    otherUser: "TechCollector",
    userType: "seller",
    winningBid: 2500000,
  }

  const handleSubmit = async () => {
    if (rating === 0) return

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                <Star className="w-8 h-8 text-accent fill-current" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Feedback Submitted</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for leaving feedback. This helps the community make informed decisions.
            </p>
            <Link href="/orders">
              <Button>Back to Orders</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/orders" className="text-primary hover:underline text-sm mb-6 inline-block">
          ← Back to Orders
        </Link>

        <h1 className="text-3xl font-bold mb-8">Leave Feedback</h1>

        <Card className="p-8 space-y-8">
          {/* Order Summary */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-1">Order Summary</p>
            <h2 className="font-semibold mb-3">{order.productName}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Transaction with</p>
                <p className="font-semibold">{order.otherUser}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-semibold text-primary">${(order.winningBid / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </div>

          {/* Rating Selection */}
          <div>
            <label className="text-sm font-medium mb-4 block">How was your transaction?</label>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <span className="text-sm font-medium">
                  {rating === 5 && "Excellent"}
                  {rating === 4 && "Good"}
                  {rating === 3 && "Fair"}
                  {rating === 2 && "Poor"}
                  {rating === 1 && "Very Poor"}
                </span>
              )}
            </div>

            {/* Rating Description */}
            <div className="grid grid-cols-5 gap-2 text-xs text-center text-muted-foreground">
              <p>Very Poor</p>
              <p>Poor</p>
              <p>Fair</p>
              <p>Good</p>
              <p>Excellent</p>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium mb-2 block">Add a comment (optional)</label>
            <Textarea
              placeholder="Share your experience with this seller/buyer. Was the item as described? How was the communication?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-32 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Be honest and constructive. Inappropriate reviews may be removed.
            </p>
          </div>

          {/* Warning for negative ratings */}
          {rating <= 2 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-600 mb-1">Before submitting a negative rating:</p>
                <p className="text-muted-foreground">
                  Consider contacting the {order.userType} first to resolve any issues. Honest communication often
                  solves problems.
                </p>
              </div>
            </div>
          )}

          {/* Submit Section */}
          <div className="pt-4 border-t border-border space-y-3">
            <p className="text-sm text-muted-foreground">
              Once submitted, you can still edit or remove your feedback within 30 days.
            </p>
            <div className="flex gap-3">
              <Link href="/orders" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  Cancel
                </Button>
              </Link>
              <Button className="flex-1" disabled={rating === 0 || isLoading} onClick={handleSubmit}>
                {isLoading ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
