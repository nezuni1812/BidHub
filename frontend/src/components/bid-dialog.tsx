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
  const [maxBidAmount, setMaxBidAmount] = useState(suggestedBid * 2)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const isValidMaxBid = maxBidAmount >= suggestedBid

  const handlePlaceBid = async () => {
    if (!isValidMaxBid) {
      setError(`Maximum bid must be at least ${(suggestedBid / 1000000).toFixed(1)}M`)
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
        setMaxBidAmount(suggestedBid * 2)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place bid. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

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
              <h2 className="text-xl font-bold mb-2">Bid Placed Successfully!</h2>
              <p className="text-muted-foreground">
                Auto-bid set up to {(maxBidAmount / 1000000).toFixed(1)}M VND
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6">Place Auto Bid</h2>

              <div className="space-y-4">
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 flex gap-3">
                  <Info className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-accent mb-1">How Auto-Bidding Works</p>
                    <p className="text-muted-foreground text-xs">
                      Set your maximum bid. We'll automatically bid for you in increments to win at the lowest
                      possible price.
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Current bid</p>
                  <p className="text-2xl font-bold text-primary">{(currentBid / 1000000).toFixed(1)}M VND</p>
                </div>

                <div>
                  <Label htmlFor="max-bid">Your maximum bid</Label>
                  <div className="relative mt-2">
                    <Input
                      id="max-bid"
                      type="number"
                      value={(maxBidAmount / 1000000).toFixed(1)}
                      onChange={(e) => setMaxBidAmount(Number.parseFloat(e.target.value) * 1000000)}
                      className="pr-12"
                      disabled={isLoading}
                      step="0.1"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">M VND</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Minimum: {(suggestedBid / 1000000).toFixed(1)}M VND
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Starting bid amount</p>
                  <p className="text-lg font-bold">{(suggestedBid / 1000000).toFixed(1)}M VND</p>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-3 mt-4">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-6 mt-6 border-t border-border">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handlePlaceBid}
                  disabled={!isValidMaxBid || isLoading}
                >
                  {isLoading ? "Placing..." : "Place Auto Bid"}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
