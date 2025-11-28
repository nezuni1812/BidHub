"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Star, Check } from "lucide-react"

interface FeedbackDialogProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  itemName: string
  onSubmit: (rating: number, comment: string) => Promise<void>
}

export function FeedbackDialog({ isOpen, onClose, userName, itemName, onSubmit }: FeedbackDialogProps) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [hoveredRating, setHoveredRating] = useState(0)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await onSubmit(rating, comment)
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setRating(5)
        setComment("")
      }, 2000)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold mb-2">Feedback Submitted!</h2>
              <p className="text-muted-foreground">Thank you for your feedback about your transaction.</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">Leave Feedback</h2>
              <p className="text-muted-foreground text-sm mb-6">
                for {userName} about {itemName}
              </p>

              <div className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="transition"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= (hoveredRating || rating)
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {rating === 5
                      ? "Excellent"
                      : rating === 4
                        ? "Good"
                        : rating === 3
                          ? "Fair"
                          : rating === 2
                            ? "Poor"
                            : "Very Poor"}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label htmlFor="comment" className="block text-sm font-semibold mb-2">
                    Comments (Optional)
                  </label>
                  <Textarea
                    id="comment"
                    placeholder="Share your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-24"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{comment.length}/500 characters</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
