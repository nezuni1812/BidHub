"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Star, Edit2, Trash2 } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

const feedbackData = [
  {
    id: 1,
    rating: 5,
    comment: "Excellent seller! Item arrived quickly and as described.",
    reviewer: "user123",
    date: "Oct 28, 2025",
    transactionId: "TXN-001",
    canEdit: true,
  },
  {
    id: 2,
    rating: 4,
    comment: "Good communication. Item is good but packaging could be better.",
    reviewer: "buyer456",
    date: "Oct 25, 2025",
    transactionId: "TXN-002",
    canEdit: true,
  },
  {
    id: 3,
    rating: 5,
    comment: "Perfect condition! Highly recommended.",
    reviewer: "shopper789",
    date: "Oct 22, 2025",
    transactionId: "TXN-003",
    canEdit: false,
  },
  {
    id: 4,
    rating: 3,
    comment: "Item is okay but took longer to ship than expected.",
    reviewer: "customer101",
    date: "Oct 19, 2025",
    transactionId: "TXN-004",
    canEdit: false,
  },
]

const ratingStats = [
  { rating: 5, count: 127, percentage: 65 },
  { rating: 4, count: 45, percentage: 23 },
  { rating: 3, count: 18, percentage: 9 },
  { rating: 2, count: 5, percentage: 2 },
  { rating: 1, count: 1, percentage: 1 },
]

const chartData = [
  { rating: "5 Stars", count: 127 },
  { rating: "4 Stars", count: 45 },
  { rating: "3 Stars", count: 18 },
  { rating: "2 Stars", count: 5 },
  { rating: "1 Star", count: 1 },
]

const COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#ef4444", "#dc2626"]

export default function FeedbackPage() {
  const [selectedFeedback, setSelectedFeedback] = useState<number | null>(null)
  const [feedbackList, setFeedbackList] = useState(feedbackData)

  const averageRating = (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(1)

  const handleDeleteFeedback = (id: number) => {
    setFeedbackList(feedbackList.filter((f) => f.id !== id))
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Feedback & Ratings</h1>
          <Link href="/profile">
            <Button variant="outline">← Back to Profile</Button>
          </Link>
        </div>

        {/* Rating Summary Card */}
        <Card className="p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Overall Rating */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-5xl font-bold text-primary mb-2">{averageRating}</div>
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${
                      i < Math.round(Number(averageRating))
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <p className="text-muted-foreground">Based on {feedbackList.length} ratings</p>
            </div>

            {/* Right: Rating Distribution */}
            <div className="space-y-3">
              {ratingStats.map((stat) => (
                <div key={stat.rating} className="flex items-center gap-4">
                  <div className="flex gap-1 w-16">
                    {[...Array(stat.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${stat.percentage}%` }} />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground w-16 text-right">
                    {stat.count} ({stat.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Bar Chart */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Rating Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="rating" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: "var(--color-card)" }} />
                <Bar dataKey="count" fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Pie Chart */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Rating Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Feedback List */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6">Recent Feedback</h2>

          <Tabs defaultValue="all" className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Feedback</TabsTrigger>
              <TabsTrigger value="positive">Positive (4-5 stars)</TabsTrigger>
              <TabsTrigger value="neutral">Neutral (3 stars)</TabsTrigger>
              <TabsTrigger value="negative">Negative (1-2 stars)</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
              {feedbackList.map((feedback) => (
                <div key={feedback.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">
                          {[...Array(feedback.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          ))}
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            feedback.rating >= 4
                              ? "bg-green-500/10 text-green-700 border-green-500/30"
                              : feedback.rating === 3
                                ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/30"
                                : "bg-red-500/10 text-red-700 border-red-500/30"
                          }
                        >
                          {feedback.rating === 5 && "Excellent"}
                          {feedback.rating === 4 && "Good"}
                          {feedback.rating === 3 && "Fair"}
                          {feedback.rating === 2 && "Poor"}
                          {feedback.rating === 1 && "Very Poor"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        By {feedback.reviewer} • {feedback.date}
                      </p>
                    </div>
                    {feedback.canEdit && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedFeedback(feedback.id)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteFeedback(feedback.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm">{feedback.comment}</p>
                  <p className="text-xs text-muted-foreground mt-2">Transaction ID: {feedback.transactionId}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="positive" className="space-y-4 mt-6">
              {feedbackList
                .filter((f) => f.rating >= 4)
                .map((feedback) => (
                  <div key={feedback.id} className="border border-border rounded-lg p-4">
                    <div className="flex gap-2 mb-2">
                      {[...Array(feedback.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <p className="text-sm font-semibold mb-1">{feedback.reviewer}</p>
                    <p className="text-sm">{feedback.comment}</p>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="neutral" className="space-y-4 mt-6">
              {feedbackList
                .filter((f) => f.rating === 3)
                .map((feedback) => (
                  <div key={feedback.id} className="border border-border rounded-lg p-4">
                    <div className="flex gap-2 mb-2">
                      {[...Array(feedback.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <p className="text-sm font-semibold mb-1">{feedback.reviewer}</p>
                    <p className="text-sm">{feedback.comment}</p>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="negative" className="space-y-4 mt-6">
              {feedbackList
                .filter((f) => f.rating <= 2)
                .map((feedback) => (
                  <div key={feedback.id} className="border border-border rounded-lg p-4">
                    <div className="flex gap-2 mb-2">
                      {[...Array(feedback.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <p className="text-sm font-semibold mb-1">{feedback.reviewer}</p>
                    <p className="text-sm">{feedback.comment}</p>
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
