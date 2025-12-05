"use client"

import type React from "react"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, User, MapPin, Calendar, Loader2 } from "lucide-react"
import { register, saveAuthData } from "@/lib/auth"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { OTPVerificationDialog } from "./otp-verification-dialog"

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showOTPDialog, setShowOTPDialog] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    date_of_birth: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const navigate = useNavigate()
  const { login: loginUser } = useAuth()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
    // Clear error when user types
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }
    
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required'
    } else {
      // Check if user is at least 18 years old
      const birthDate = new Date(formData.date_of_birth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      if (age < 18 || (age === 18 && monthDiff < 0)) {
        newErrors.date_of_birth = 'You must be at least 18 years old'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setIsLoading(true)
    
    try {
      const { confirmPassword, ...registerData } = formData
      const response = await register(registerData)
      
      if (response.success) {
        toast({
          title: "Registration successful",
          description: "Please check your email for the OTP code",
        })
        
        // Show OTP dialog
        setShowOTPDialog(true)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Please try again",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPVerified = (authData: any) => {
    // Save auth data
    saveAuthData(authData)
    
    // Update context
    loginUser(authData.user)
    
    // Close dialog
    setShowOTPDialog(false)
    
    // Show success toast
    toast({
      title: "Account verified!",
      description: `Welcome to BidHub, ${authData.user.full_name}!`,
    })
    
    // Redirect to home page
    navigate('/')
  }

  return (
    <>
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Create Account</h1>
            <p className="text-muted-foreground text-sm mt-2">Join BidHub to start bidding</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="full_name" 
                  placeholder="John Doe" 
                  className="pl-10" 
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  className="pl-10" 
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="address" 
                  placeholder="Your address" 
                  className="pl-10" 
                  value={formData.address}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="date_of_birth" 
                  type="date" 
                  className="pl-10" 
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  disabled={isLoading}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              {errors.date_of_birth && (
                <p className="text-sm text-destructive">{errors.date_of_birth}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10" 
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10" 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </Card>

      <OTPVerificationDialog
        open={showOTPDialog}
        onOpenChange={setShowOTPDialog}
        email={formData.email}
        onVerified={handleOTPVerified}
      />
    </>
  )
}
