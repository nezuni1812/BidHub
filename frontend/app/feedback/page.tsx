"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { FeedbackDialog } from "@/components/feedback-dialog"

interface PendingFeedback {
  id: string
  otherUser: string
  item: string
  transactionDate: string
  type: "sale" | "purchase"
}

export default function FeedbackPage() {
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<PendingFeedback | null>(null)

  const pendingFeedback: PendingFeedback[] = [
    {
      id: "1",
      otherUser: "buyer_123",
      item: "MacBook Pro 16 2024",
      transactionDate: "Oct 25, 2025",
      type: "sale",
    },
    {
      id: "2",
      otherUser: "seller_456",
      item: "Vintage Camera",
      transactionDate: "Oct 20, 2025",
      type: "purchase",
    },
  ]

  const givenFeedback = [
    {
      id: "1",
      user: "tech_seller",
      rating: 5,
      comment: "Great seller, fast shipping",
      date: "Oct 15, 2025",
    },
    {
      id: "2",
      user: "collector_mike",
      rating: 4,
      comment: "Good item, slight delay in communication",
      date: "Oct 10, 2025",
    },
  ]

  const handleLeaveFeedback = (feedback: PendingFeedback) => {
    setSelectedFeedback(feedback)
    setShowFeedbackDialog(true)
  }

  const handleSubmitFeedback = async (rating: number, comment: string) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(undefined), 1500)
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manage Feedback</h1>
          <p className="text-muted-foreground">Leave and manage feedback for transactions</p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pending">Pending ({pendingFeedback.length})</TabsTrigger>
            <TabsTrigger value="given">Given ({givenFeedback.length})</TabsTrigger>
          </TabsList>

          {/* Pending Feedback */}
          <TabsContent value="pending" className="mt-6 space-y-4">
            {pendingFeedback.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No pending feedback</p>
              </Card>
            ) : (
              pendingFeedback.map((feedback) => (
                <Card key={feedback.id} className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2">
                        <h3 className="font-semibold">{feedback.item}</h3>
                        <p className="text-sm text-muted-foreground">
                          Transaction with {feedback.otherUser} on {feedback.transactionDate}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {feedback.type === "sale" ? "You sold this item" : "You bought this item"}
                      </Badge>
                    </div>
                    <Button onClick={() => handleLeaveFeedback(feedback)}>Leave Feedback</Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Given Feedback */}
          <TabsContent value="given" className="mt-6 space-y-4">
            {givenFeedback.map((feedback) => (
              <Card key={feedback.id} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{feedback.user}</h3>
                    <p className="text-sm text-muted-foreground">{feedback.date}</p>
                  </div>
                  <div className="flex text-yellow-500">{"★".repeat(feedback.rating)}</div>
                </div>
                <p className="text-muted-foreground">{feedback.comment}</p>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {selectedFeedback && (
        <FeedbackDialog
          isOpen={showFeedbackDialog}
          onClose={() => setShowFeedbackDialog(false)}
          userName={selectedFeedback.otherUser}
          itemName={selectedFeedback.item}
          onSubmit={handleSubmitFeedback}
        />
      )}
    </div>
  )
}
