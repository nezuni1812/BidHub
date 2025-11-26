"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp" | "reset" | "success">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes("@")) {
      setError("Valid email is required")
      return
    }
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setStep("otp")
    setError("")
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setError("OTP must be 6 digits")
      return
    }
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setStep("reset")
    setError("")
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setStep("success")
    setError("")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-md mx-auto px-4 py-12">
        <Card className="p-8">
          {step === "email" && (
            <>
              <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
              <p className="text-muted-foreground mb-6">Enter your email to receive an OTP</p>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send OTP"}
                </Button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <h1 className="text-2xl font-bold mb-2">Verify OTP</h1>
              <p className="text-muted-foreground mb-6">Enter the 6-digit OTP sent to your email</p>
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">OTP Code</label>
                  <Input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </form>
              <button onClick={() => setStep("email")} className="text-xs text-primary hover:underline mt-4">
                Back to email
              </button>
            </>
          )}

          {step === "reset" && (
            <>
              <h1 className="text-2xl font-bold mb-2">Create New Password</h1>
              <p className="text-muted-foreground mb-6">Enter your new password</p>
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">New Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </>
          )}

          {step === "success" && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Password Reset</h1>
              <p className="text-muted-foreground mb-6">Your password has been successfully reset</p>
              <Link href="/auth/login">
                <Button className="w-full">Back to Sign In</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
