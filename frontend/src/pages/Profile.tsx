"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EditProfileDialog } from "@/components/edit-profile-dialog"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

interface Rating {
  id: number
  score: number
  comment: string
  created_at: string
  rater_name: string
  product_title: string | null
}

interface RatingStats {
  total_ratings: string
  positive_ratings: string
  negative_ratings: string
  positive_percentage: string
}

interface UserProfile {
  id: number
  full_name: string
  email: string
  address: string | null
  date_of_birth: string | null
  role: string
  rating: number | null
  created_at: string
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isOwnProfile = !id || (user && id === user.id.toString())

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('access_token')

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
        
        const endpoint = id 
          ? `${API_URL}/bidder/users/${id}/profile`
          : `${API_URL}/bidder/profile`
        
        const headers: Record<string, string> = {}
        if (!id) {
          if (!token) {
            setError('Vui lòng đăng nhập để xem hồ sơ')
            return
          }
          headers['Authorization'] = `Bearer ${token}`
        } else if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(endpoint, { headers })

        if (!response.ok) {
          if (response.status === 404) {
            setError('Không tìm thấy hồ sơ người dùng')
            return
          }
          throw new Error('Không thể tải hồ sơ')
        }

        const result = await response.json()
        setProfile(result.data.user)
        setRatings(result.data.ratings)
        setRatingStats(result.data.rating_stats)
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError(err instanceof Error ? err.message : 'Không thể tải hồ sơ')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [id])

  const handleProfileUpdate = async (data: { name: string; address: string; date_of_birth?: string }) => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        alert('Vui lòng đăng nhập lại')
        return
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
      const requestBody: any = {
        full_name: data.name,
        address: data.address
      }
      if (data.date_of_birth) {
        requestBody.date_of_birth = data.date_of_birth
      }
      const response = await fetch(`${API_URL}/bidder/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const result = await response.json()
        // Backend returns data directly, not data.user
        setProfile(result.data)
        alert('Cập nhật hồ sơ thành công!')
      } else if (response.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        // Optionally redirect to login
        window.location.href = '/auth/login'
      } else {
        throw new Error('Không thể cập nhật hồ sơ')
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      alert('Không thể cập nhật hồ sơ. Vui lòng thử lại.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center">Đang tải hồ sơ...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-destructive">{error || 'Không tìm thấy hồ sơ'}</p>
        </div>
      </div>
    )
  }

  const totalRatings = parseInt(ratingStats?.total_ratings || '0')
  const positiveRatings = parseInt(ratingStats?.positive_ratings || '0')
  const negativeRatings = parseInt(ratingStats?.negative_ratings || '0')
  const positivePercentage = parseFloat(ratingStats?.positive_percentage || '0')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <Card className="p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex-1">
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                    {isOwnProfile && (
                      <EditProfileDialog
                        currentName={profile.full_name}
                        currentAddress={profile.address || ''}
                        currentDateOfBirth={profile.date_of_birth || undefined}
                        onSave={handleProfileUpdate}
                      />
                    )}
                  </div>
                  <p className="text-muted-foreground">{profile.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">Thành viên từ {formatDate(profile.created_at)}</p>
                  <p className="text-sm text-muted-foreground">Vai trò: <span className="capitalize">{profile.role}</span></p>
                  {profile.address && (
                    <p className="text-sm text-muted-foreground mt-1">📍 {profile.address}</p>
                  )}
                  {profile.date_of_birth && (
                    <p className="text-sm text-muted-foreground mt-1">🎂 {formatDate(profile.date_of_birth)}</p>
                  )}
                </div>
              </div>

              {/* Reputation Score */}
              <Card className="p-6 min-w-fit">
                <h3 className="font-semibold mb-4 text-center">Uy tín</h3>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-primary">{positivePercentage.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    dựa trên {totalRatings} đánh giá
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
                    <span>{positiveRatings} Tích cực</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-red-600 rounded-full"></span>
                    <span>{negativeRatings} Tiêu cực</span>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </div>

        {/* Feedback */}
        <Tabs defaultValue="feedback" className="w-full">
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="feedback">Đánh giá ({ratings.length})</TabsTrigger>
            <TabsTrigger value="details">Phân tích đánh giá</TabsTrigger>
          </TabsList>

          <TabsContent value="feedback" className="mt-6 space-y-4">
            {ratings.length === 0 ? (
              <Card className="p-6">
                <p className="text-center text-muted-foreground">Chưa có đánh giá nào</p>
              </Card>
            ) : (
              ratings.map((rating) => (
                <Card key={rating.id} className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">{rating.rater_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(rating.created_at)}</p>
                      {rating.product_title && (
                        <p className="text-xs text-muted-foreground mt-1">Sản phẩm: {rating.product_title}</p>
                      )}
                    </div>
                    <Badge
                      className={
                        rating.score > 0
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }
                    >
                      {rating.score > 0 ? "Tích cực" : "Tiêu cực"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{rating.comment || 'Không có bình luận'}</p>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24">Tích cực</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600" 
                      style={{ width: `${totalRatings > 0 ? (positiveRatings / totalRatings) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">{positiveRatings}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24">Tiêu cực</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600" 
                      style={{ width: `${totalRatings > 0 ? (negativeRatings / totalRatings) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">{negativeRatings}</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-green-600">{positivePercentage.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground mt-1">Tỷ lệ tích cực</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{totalRatings}</p>
                    <p className="text-sm text-muted-foreground mt-1">Tổng đánh giá</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
