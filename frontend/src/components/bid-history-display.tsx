"use client"
import { Badge } from "@/components/ui/badge"

interface BidEntry {
  date: string
  bidder: string
  bidAmount: number
  displayAmount: number
  isAutoBid: boolean
  note?: string
}

interface BidHistoryDisplayProps {
  bids: BidEntry[]
}

export function BidHistoryDisplay({ bids }: BidHistoryDisplayProps) {
  return (
    <div className="space-y-3">
      {bids.map((bid, idx) => (
        <div key={idx} className="flex justify-between items-start py-3 border-b border-border last:border-0">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm">{bid.bidder}</p>
              {bid.isAutoBid && (
                <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">
                  Auto Bid
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{bid.date}</p>
            {bid.note && <p className="text-xs text-muted-foreground mt-1 italic">{bid.note}</p>}
          </div>
          <div className="text-right">
            <p className="font-bold text-primary text-sm">${(bid.displayAmount / 1000000).toFixed(1)}M</p>
            {bid.displayAmount !== bid.bidAmount && (
              <p className="text-xs text-muted-foreground">(Max: ${(bid.bidAmount / 1000000).toFixed(1)}M)</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
