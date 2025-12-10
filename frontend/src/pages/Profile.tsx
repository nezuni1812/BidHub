"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { EditProfileDialog } from "@/components/edit-profile-dialog"
import { useState } from "react"
import { useParams } from "react-router-dom"

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState({
    username,
    name: "John Doe",
    joinDate: "Jan 15, 2024",
    avatar: "/placeholder.svg?key=avtr",
    reputation: {
      positive: 156,
      neutral: 3,
      negative: 2,
      score: 4.85,
    },
    stats: {
      itemsSold: 48,
      itemsBought: 23,
      responseTime: "2 hours",
    },
  })

  const handleProfileUpdate = (data: { name: string; username: string; avatar: string }) => {
    setProfile({
      ...profile,
      name: data.name,
      username: data.username,
      avatar: data.avatar,
    })
  }

  const isOwnProfile = true // This should be determined by checking if current user matches the profile username

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <Card className="p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <img
                src={profile.avatar || "/placeholder.svg"}
                alt={profile.username}
                className="w-24 h-24 rounded-full bg-muted object-cover"
              />
              <div className="flex-1">
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold">{profile.name}</h1>
                    {isOwnProfile && (
                      <EditProfileDialog
                        currentName={profile.name}
                        currentUsername={profile.username}
                        currentAvatar={profile.avatar}
                        onSave={handleProfileUpdate}
                      />
                    )}
                  </div>
                  <p className="text-muted-foreground">@{profile.username}</p>
                  <p className="text-sm text-muted-foreground mt-1">Member since {profile.joinDate}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-2xl font-bold">{profile.stats.itemsSold}</p>
                    <p className="text-xs text-muted-foreground">Items Sold</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{profile.stats.itemsBought}</p>
                    <p className="text-xs text-muted-foreground">Items Bought</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{profile.stats.responseTime}</p>
                    <p className="text-xs text-muted-foreground">Avg Response</p>
                  </div>
                </div>

                <Button>Contact User</Button>
              </div>

              {/* Reputation Score */}
              <Card className="p-6 min-w-fit">
                <h3 className="font-semibold mb-4 text-center">Reputation</h3>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-primary">{profile.reputation.score}</div>
                  <div className="flex text-yellow-500 justify-center my-2">
                    {"★".repeat(Math.floor(profile.reputation.score))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    based on {profile.reputation.positive + profile.reputation.neutral + profile.reputation.negative}{" "}
                    ratings
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
                    <span>{profile.reputation.positive} Positive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-gray-400 rounded-full"></span>
                    <span>{profile.reputation.neutral} Neutral</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-red-600 rounded-full"></span>
                    <span>{profile.reputation.negative} Negative</span>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </div>

        {/* Feedback */}
        <Tabs defaultValue="feedback" className="w-full">
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="feedback">Feedback ({ratings.length})</TabsTrigger>
            <TabsTrigger value="details">Ratings Details</TabsTrigger>
          </TabsList>

          <TabsContent value="feedback" className="mt-6 space-y-4">
            {ratings.map((rating) => (
              <Card key={rating.id} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">{rating.reviewer}</p>
                    <p className="text-xs text-muted-foreground">{rating.date}</p>
                  </div>
                  <Badge
                    className={
                      rating.type === "positive"
                        ? "bg-green-100 text-green-800"
                        : rating.type === "neutral"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                    }
                  >
                    {rating.rating === 5 ? "Positive" : rating.rating < 3 ? "Negative" : "Neutral"}
                  </Badge>
                </div>
                <div className="flex text-yellow-500 mb-2">{"★".repeat(rating.rating)}</div>
                <p className="text-muted-foreground">{rating.comment}</p>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-6">Rating Breakdown</h3>
              <div className="space-y-4">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = stars === 5 ? 140 : stars === 4 ? 10 : stars === 3 ? 5 : stars === 2 ? 3 : 2
                  const total = 160
                  const percentage = (count / total) * 100
                  return (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-12">{stars} ★</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

const ratings = [
  {
    id: 1,
    rating: 5,
    reviewer: "buyer_123",
    date: "Oct 25, 2025",
    comment: "Excellent condition, fast shipping!",
    type: "positive",
  },
  {
    id: 2,
    rating: 5,
    reviewer: "jane_smith",
    date: "Oct 20, 2025",
    comment: "Perfect item, great communication",
    type: "positive",
  },
  {
    id: 3,
    rating: 4,
    reviewer: "collector_mike",
    date: "Oct 15, 2025",
    comment: "Good quality but took longer than expected",
    type: "positive",
  },
  {
    id: 4,
    rating: 1,
    reviewer: "user_789",
    date: "Oct 10, 2025",
    comment: "Item not as described",
    type: "negative",
  },
]
