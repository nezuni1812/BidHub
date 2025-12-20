"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navigation } from "@/components/navigation"
import { Link } from "react-router-dom"
import { CheckCircle } from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "reset" | "success">("email")
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
    setError("")

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể gửi OTP');
      }

      setStep("reset")
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (otp.length !== 6) {
      setError("Mã OTP phải có 6 chữ số")
      return
    }

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự")
      return
    }
    
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          new_password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể đặt lại mật khẩu');
      }

      setStep("success")
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
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
                    required
                  />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
                </Button>
                <div className="text-center mt-4">
                  <Link to="/auth/login" className="text-sm text-primary hover:underline">
                    Quay lại đăng nhập
                  </Link>
                </div>
              </form>
            </>
          )}

          {step === "reset" && (
            <>
              <h1 className="text-2xl font-bold mb-2">Đặt lại mật khẩu</h1>
              <p className="text-muted-foreground mb-6">
                Mã OTP đã được gửi đến <strong>{email}</strong>
              </p>
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Mã OTP</label>
                  <Input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Nhập mã OTP 6 chữ số từ email
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Mật khẩu mới</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tối thiểu 8 ký tự
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Xác nhận mật khẩu</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
                </Button>
                <button 
                  type="button"
                  onClick={() => setStep("email")} 
                  className="text-xs text-primary hover:underline mt-2 w-full"
                >
                  Quay lại nhập email
                </button>
              </form>
            </>
          )}

          {step === "success" && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Đặt lại mật khẩu thành công!</h1>
              <p className="text-muted-foreground mb-6">
                Mật khẩu của bạn đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới.
              </p>
              <Link to="/auth/login">
                <Button className="w-full">Đăng nhập ngay</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
