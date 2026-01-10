"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"

interface RatingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (rating: 1 | -1, comment: string) => Promise<void>
  isSubmitting?: boolean
}

export function RatingDialog({ open, onOpenChange, onSubmit, isSubmitting = false }: RatingDialogProps) {
  const [ratingType, setRatingType] = useState<'1' | '-1'>('1')
  const [ratingComment, setRatingComment] = useState('')

  const handleSubmit = async () => {
    await onSubmit(parseInt(ratingType) as 1 | -1, ratingComment)
    // Reset form after successful submit
    setRatingType('1')
    setRatingComment('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when dialog closes
      setRatingType('1')
      setRatingComment('')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Đánh giá người bán</DialogTitle>
          <DialogDescription>
            Vui lòng chọn loại đánh giá và nhập nhận xét của bạn
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            <Label>Loại đánh giá</Label>
            <RadioGroup value={ratingType} onValueChange={(value) => setRatingType(value as '1' | '-1')}>
              <div 
                className={`flex items-center space-x-3 p-3 rounded-lg border-1 cursor-pointer transition-all ${
                  ratingType === '1' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                    : 'border-border hover:border-green-300'
                }`}
                onClick={() => setRatingType('1')}
              >
                <RadioGroupItem value="1" id="positive" />
                <ThumbsUp className={`w-5 h-5 ${ratingType === '1' ? 'text-green-600' : 'text-muted-foreground'}`} />
                <Label htmlFor="positive" className="font-medium cursor-pointer flex-1">
                  <span className={ratingType === '1' ? 'text-green-700 dark:text-green-500' : ''}>
                    Tích cực
                  </span>
                  <span className="text-sm text-muted-foreground block">Người bán đáng tin cậy</span>
                </Label>
              </div>
              <div 
                className={`flex items-center space-x-3 p-3 rounded-lg border-1 cursor-pointer transition-all ${
                  ratingType === '-1' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
                    : 'border-border hover:border-red-300'
                }`}
                onClick={() => setRatingType('-1')}
              >
                <RadioGroupItem value="-1" id="negative" />
                <ThumbsDown className={`w-5 h-5 ${ratingType === '-1' ? 'text-red-600' : 'text-muted-foreground'}`} />
                <Label htmlFor="negative" className="font-medium cursor-pointer flex-1">
                  <span className={ratingType === '-1' ? 'text-red-700 dark:text-red-500' : ''}>
                    Tiêu cực
                  </span>
                  <span className="text-sm text-muted-foreground block">Người bán không đáng tin cậy</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Nhận xét (tùy chọn)</Label>
            <Textarea
              id="comment"
              placeholder="Nhập nhận xét của bạn về người bán..."
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className='bg-orange-600 hover:bg-orange-700'
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
