"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navigation } from "@/components/navigation"
import { Link } from "react-router-dom"
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
      setError("Vui lòng nhập email hợp lệ")
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
      setError("Mã OTP phải có 6 chữ số")
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
      setError("Mật khẩu phải có ít nhất 8 ký tự")
      return
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
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
        <Card className="p-8 gap-0">
          {step === "email" && (
            <>
              <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
              <p className="text-muted-foreground mb-6">Nhập email để nhận mã OTP</p>
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
                  {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
                </Button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <h1 className="text-2xl font-bold mb-2">Xác minh OTP</h1>
              <p className="text-muted-foreground mb-6">Nhập mã OTP 6 chữ số đã gửi đến email của bạn</p>
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Mã OTP</label>
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
                  {isLoading ? "Đang xác minh..." : "Xác minh OTP"}
                </Button>
              </form>
              <button onClick={() => setStep("email")} className="text-xs text-primary hover:underline mt-4">
                Quay lại email
              </button>
            </>
          )}

          {step === "reset" && (
            <>
              <h1 className="text-2xl font-bold mb-2">Tạo mật khẩu mới</h1>
              <p className="text-muted-foreground mb-6">Nhập mật khẩu mới của bạn</p>
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Mật khẩu mới</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Xác nhận mật khẩu</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
                </Button>
              </form>
            </>
          )}

          {step === "success" && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Đặt lại mật khẩu thành công</h1>
              <p className="text-muted-foreground mb-6">Mật khẩu của bạn đã được đặt lại thành công</p>
              <Link to="/auth/login">
                <Button className="w-full">Quay lại đăng nhập</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
