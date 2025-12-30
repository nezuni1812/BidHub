import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface AnswerQuestionDialogProps {
  isOpen: boolean
  onClose: () => void
  question: {
    id: number
    question: string
    asker_name: string
  }
  onAnswer: (answer: string) => Promise<void>
}

export function AnswerQuestionDialog({ isOpen, onClose, question, onAnswer }: AnswerQuestionDialogProps) {
  const [answer, setAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setAnswer(value)
    
    // Validate on change
    if (value.trim().length === 0) {
      setError('Vui lòng nhập câu trả lời')
    } else if (value.trim().length < 10) {
      setError('Câu trả lời phải có ít nhất 10 ký tự')
    } else if (value.length > 1000) {
      setError('Câu trả lời không được quá 1000 ký tự')
    } else {
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!answer.trim()) {
      setError('Vui lòng nhập câu trả lời')
      return
    }
    
    if (answer.trim().length < 10) {
      setError('Câu trả lời phải có ít nhất 10 ký tự')
      return
    }

    setIsSubmitting(true)
    try {
      await onAnswer(answer)
      setAnswer('')
      onClose()
    } catch (error) {
      console.error('Failed to answer question:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Trả lời câu hỏi</DialogTitle>
          <DialogDescription>
            Trả lời câu hỏi từ {question.asker_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Câu hỏi</Label>
              <p className="text-sm bg-muted p-3 rounded-md">{question.question}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Câu trả lời của bạn *</Label>
              <Textarea
                id="answer"
                placeholder="Nhập câu trả lời (ít nhất 10 ký tự)..."
                value={answer}
                onChange={handleAnswerChange}
                className={`min-h-[120px] ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                required
              />
              <div className="flex justify-between items-center">
                <div>
                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {answer.length}/1000
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || !answer.trim() || !!error}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi câu trả lời'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
