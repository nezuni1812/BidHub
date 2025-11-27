"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navigation } from "@/components/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

export default function SettingsPage() {
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    email: "john@example.com",
    dob: "1990-01-01",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}

    if (!profileData.name.trim()) errors.name = "Name is required"
    if (!profileData.email.includes("@")) errors.email = "Valid email is required"
    if (!profileData.dob) errors.dob = "Date of birth is required"

    setProfileErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setSuccessMessage("Profile updated successfully!")
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}

    if (!passwordData.currentPassword) errors.currentPassword = "Current password is required"
    if (passwordData.newPassword.length < 8) errors.newPassword = "Password must be at least 8 characters"
    if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = "Passwords do not match"

    setPasswordErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setSuccessMessage("Password changed successfully!")
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link href="/profile" className="text-primary hover:underline text-sm">
            ← Back to Profile
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        {successMessage && <Card className="p-4 mb-6 bg-accent/10 border-accent text-accent">{successMessage}</Card>}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="password">Change Password</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="p-8">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className={profileErrors.name ? "border-destructive" : ""}
                  />
                  {profileErrors.name && <p className="text-xs text-destructive mt-1">{profileErrors.name}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className={profileErrors.email ? "border-destructive" : ""}
                  />
                  {profileErrors.email && <p className="text-xs text-destructive mt-1">{profileErrors.email}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium">Date of Birth</label>
                  <Input
                    type="date"
                    value={profileData.dob}
                    onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                    className={profileErrors.dob ? "border-destructive" : ""}
                  />
                  {profileErrors.dob && <p className="text-xs text-destructive mt-1">{profileErrors.dob}</p>}
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card className="p-8">
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-medium">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showPasswords.current ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className={passwordErrors.currentPassword ? "border-destructive" : ""}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-xs text-destructive mt-1">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">New Password</label>
                  <div className="relative">
                    <Input
                      type={showPasswords.new ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className={passwordErrors.newPassword ? "border-destructive" : ""}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-xs text-destructive mt-1">{passwordErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <div className="relative">
                    <Input
                      type={showPasswords.confirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={passwordErrors.confirmPassword ? "border-destructive" : ""}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-destructive mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Change Password"}
                </Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
