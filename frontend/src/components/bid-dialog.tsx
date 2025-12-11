"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Check, Info } from "lucide-react"

interface BidDialogProps {
  isOpen: boolean
  onClose: () => void
  currentBid: number
  minIncrement: number
  suggestedBid: number
  onPlaceBid: (amount: number, isAutoBid: boolean) => Promise<void>
}

export function BidDialog({ isOpen, onClose, currentBid, minIncrement, suggestedBid, onPlaceBid }: BidDialogProps) {
  const [maxBidAmount, setMaxBidAmount] = useState(suggestedBid)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [validationError, setValidationError] = useState("")

  // Validate bid increment
  const validateBidIncrement = (amount: number): boolean => {
    if (amount < suggestedBid) {
      setValidationError(`Giá tối thiểu phải từ ${(suggestedBid / 1000000).toFixed(1)}M VND`)
      return false
    }

    const priceIncrement = amount - currentBid
    const remainder = priceIncrement % minIncrement

    if (Math.abs(remainder) > 0.01) {
      const roundedDown = currentBid + (Math.floor(priceIncrement / minIncrement) * minIncrement)
      const roundedUp = currentBid + (Math.ceil(priceIncrement / minIncrement) * minIncrement)
      
      setValidationError(
        `Giá phải là bội số của ${(minIncrement / 1000000).toFixed(1)}M VND. ` +
        `Gợi ý: ${(roundedDown / 1000000).toFixed(1)}M hoặc ${(roundedUp / 1000000).toFixed(1)}M VND`
      )
      return false
    }

    setValidationError("")
    return true
  }

  const handleBidChange = (value: number) => {
    setMaxBidAmount(value)
    setError("")
    validateBidIncrement(value)
  }

  const handlePlaceBid = async () => {
    if (!validateBidIncrement(maxBidAmount)) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await onPlaceBid(maxBidAmount, true)
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setMaxBidAmount(suggestedBid)
      }, 2000)
    } catch (err: any) {
      // Handle backend validation errors
      if (err?.code === 'INVALID_BID_INCREMENT' && err?.suggestedPrices) {
        const suggestions = err.suggestedPrices
          .map((p: number) => `${(p / 1000000).toFixed(1)}M`)
          .join(' hoặc ')
        setError(`${err.message}\nGợi ý: ${suggestions}`)
      } else {
        setError(err?.message || "Không thể đặt giá. Vui lòng thử lại.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Quick select buttons for common increments
  const quickSelects = [
    { label: "+1 bước", value: currentBid + minIncrement },
    { label: "+3 bước", value: currentBid + (minIncrement * 3) },
    { label: "+5 bước", value: currentBid + (minIncrement * 5) },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold mb-2">Đặt giá thành công!</h2>
              <p className="text-muted-foreground">
                Auto-bid đã được đặt lên tới {(maxBidAmount / 1000000).toFixed(1)}M VND
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6">Đặt Giá Tự Động</h2>

              <div className="space-y-4">
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 flex gap-3">
                  <Info className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-accent mb-1">Cách hoạt động của Auto-Bid</p>
                    <p className="text-muted-foreground text-xs">
                      Đặt giá tối đa của bạn. Hệ thống sẽ tự động đấu giá theo từng bước nhảy để giành chiến thắng với giá thấp nhất.
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Giá hiện tại</p>
                  <p className="text-2xl font-bold text-primary">{(currentBid / 1000000).toFixed(1)}M VND</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bước nhảy: {(minIncrement / 1000000).toFixed(1)}M VND
                  </p>
                </div>

                <div>
                  <Label htmlFor="max-bid">Giá tối đa của bạn</Label>
                  <div className="relative mt-2">
                    <Input
                      id="max-bid"
                      type="number"
                      value={(maxBidAmount / 1000000).toFixed(1)}
                      onChange={(e) => handleBidChange(Number.parseFloat(e.target.value) * 1000000)}
                      className={`pr-12 ${validationError ? 'border-destructive' : ''}`}
                      disabled={isLoading}
                      step={(minIncrement / 1000000).toFixed(1)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">M VND</span>
                  </div>
                  {validationError && (
                    <p className="text-xs text-destructive mt-1">{validationError}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Tối thiểu: {(suggestedBid / 1000000).toFixed(1)}M VND
                  </p>
                </div>

                {/* Quick select buttons */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Chọn nhanh:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {quickSelects.map((option) => (
                      <Button
                        key={option.label}
                        variant="outline"
                        size="sm"
                        onClick={() => handleBidChange(option.value)}
                        disabled={isLoading}
                        className="text-xs"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Giá bắt đầu đấu</p>
                  <p className="text-lg font-bold">{(suggestedBid / 1000000).toFixed(1)}M VND</p>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-3 mt-4">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive whitespace-pre-line">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-6 mt-6 border-t border-border">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose} disabled={isLoading}>
                  Hủy
                </Button>
                <Button
                  className="flex-1"
                  onClick={handlePlaceBid}
                  disabled={!!validationError || isLoading}
                >
                  {isLoading ? "Đang đặt..." : "Đặt Auto Bid"}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
