"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircle, Check } from "lucide-react"

interface AskQuestionDialogProps {
  isOpen: boolean
  onClose: () => void
  sellerName: string
  onAsk: (question: string) => Promise<void>
}

export function AskQuestionDialog({ isOpen, onClose, sellerName, onAsk }: AskQuestionDialogProps) {
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleAsk = async () => {
    if (!question.trim()) {
      setError("Please enter your question")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await onAsk(question)
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setQuestion("")
      }, 2000)
    } catch (err) {
      setError("Failed to send question. Please try again.")
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
              <h2 className="text-xl font-bold mb-2">Question Sent!</h2>
              <p className="text-muted-foreground">Your question has been sent to {sellerName}.</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">Ask a Question</h2>
              <p className="text-muted-foreground text-sm mb-6">Ask {sellerName} about this item</p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="question">Your question</Label>
                  <Textarea
                    id="question"
                    placeholder="Enter your question here..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={isLoading}
                    className="mt-2 min-h-24"
                  />
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleAsk} disabled={!question.trim() || isLoading}>
                    {isLoading ? "Sending..." : "Send Question"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
