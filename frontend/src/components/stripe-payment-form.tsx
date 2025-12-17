import { useState } from "react"
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface StripePaymentFormProps {
  onSuccess: () => void
  amount: string
}

export function StripePaymentForm({ onSuccess, amount }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    })

    if (submitError) {
      setError(submitError.message || "An error occurred")
      setProcessing(false)
    } else {
      // Payment successful
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border p-4">
        <PaymentElement />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Amount:</span>
          <span className="font-semibold">{parseFloat(amount).toLocaleString('vi-VN')} ₫</span>
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={!stripe || processing}
        >
          {processing ? "Processing..." : "Complete Payment"}
        </Button>
      </div>

      <div className="text-xs text-center text-muted-foreground space-y-1">
        <p>Test Mode - Use test card: <code className="bg-muted px-1 py-0.5 rounded">4242 4242 4242 4242</code></p>
        <p>Any future date, any 3-digit CVC, any ZIP code</p>
      </div>
    </form>
  )
}
