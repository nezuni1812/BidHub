"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Check, Info } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface BidDialogProps {
  isOpen: boolean
  onClose: () => void
  currentBid: number
  minIncrement: number
  suggestedBid: number
  onPlaceBid: (amount: number, isAutoBid: boolean) => Promise<void>
}

export function BidDialog({ isOpen, onClose, currentBid, minIncrement, suggestedBid, onPlaceBid }: BidDialogProps) {
  const [bidType, setBidType] = useState<"manual" | "auto">("auto")
  const [bidAmount, setBidAmount] = useState(suggestedBid)
  const [maxBidAmount, setMaxBidAmount] = useState(suggestedBid * 2)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const isValidBid = bidAmount >= suggestedBid
  const isValidMaxBid = maxBidAmount >= bidAmount

  const handlePlaceBid = async () => {
    if (!isValidBid) {
      setError(`Bid must be at least ${(suggestedBid / 1000000).toFixed(1)}M`)
      return
    }

    if (bidType === "auto" && !isValidMaxBid) {
      setError(`Maximum bid must be at least ${(bidAmount / 1000000).toFixed(1)}M`)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await onPlaceBid(bidType === "auto" ? maxBidAmount : bidAmount, bidType === "auto")
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setBidAmount(suggestedBid)
        setMaxBidAmount(suggestedBid * 2)
      }, 2000)
    } catch (err) {
      setError("Failed to place bid. Please try again.")
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
                {bidType === "auto"
                  ? `Auto-bid set up to ${(maxBidAmount / 1000000).toFixed(1)}M`
                  : `Your bid of ${(bidAmount / 1000000).toFixed(1)}M has been confirmed.`}
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6">Place Your Bid</h2>

              <Tabs value={bidType} onValueChange={(v) => setBidType(v as "manual" | "auto")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="auto">Auto Bid</TabsTrigger>
                  <TabsTrigger value="manual">Manual Bid</TabsTrigger>
                </TabsList>

                <TabsContent value="auto" className="space-y-4">
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 flex gap-3 mb-4">
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
                    <p className="text-2xl font-bold text-primary">${(currentBid / 1000000).toFixed(1)}M</p>
                  </div>

                  <div>
                    <Label htmlFor="max-bid">Your maximum bid</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="max-bid"
                        type="number"
                        value={(maxBidAmount / 1000000).toFixed(1)}
                        onChange={(e) => setMaxBidAmount(Number.parseFloat(e.target.value) * 1000000)}
                        className="pl-8"
                        disabled={isLoading}
                        step="0.1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Min: ${(Math.max(suggestedBid, currentBid + minIncrement) / 1000000).toFixed(1)}M
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Starting bid amount</p>
                    <p className="text-lg font-bold">${(suggestedBid / 1000000).toFixed(1)}M</p>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 flex gap-3 mb-4">
                    <Info className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-accent mb-1">Manual Bidding</p>
                      <p className="text-muted-foreground text-xs">
                        You control each bid manually. Higher engagement but requires active monitoring.
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Current bid</p>
                    <p className="text-2xl font-bold text-primary">${(currentBid / 1000000).toFixed(1)}M</p>
                  </div>

                  <div>
                    <Label htmlFor="bid-amount">Your bid</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="bid-amount"
                        type="number"
                        value={(bidAmount / 1000000).toFixed(1)}
                        onChange={(e) => setMaxBidAmount(Number.parseFloat(e.target.value) * 1000000)}
                        className="pl-8"
                        disabled={isLoading}
                        step="0.1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Minimum: ${(suggestedBid / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

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
                  disabled={!isValidBid || (bidType === "auto" && !isValidMaxBid) || isLoading}
                >
                  {isLoading ? "Placing..." : `Place ${bidType === "auto" ? "Auto " : ""}Bid`}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
