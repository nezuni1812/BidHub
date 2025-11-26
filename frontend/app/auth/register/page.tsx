"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    dob: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.email.includes("@")) newErrors.email = "Valid email is required"
    if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters"
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match"
    if (!formData.dob) newErrors.dob = "Date of birth is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    // Redirect to login or dashboard
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-md mx-auto px-4 py-12">
        <Card className="p-8">
          <h1 className="text-2xl font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground mb-6">Join AuctionHub to start bidding and selling</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Date of Birth</label>
              <Input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className={errors.dob ? "border-destructive" : ""}
              />
              {errors.dob && <p className="text-xs text-destructive mt-1">{errors.dob}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={errors.password ? "border-destructive" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <p className="text-sm text-center text-muted-foreground">Or continue with</p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="w-full bg-transparent">
                Google
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Facebook
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                GitHub
              </Button>
            </div>
          </div>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
