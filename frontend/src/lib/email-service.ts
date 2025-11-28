/**
 * Email notification service for auction platform
 * Handles sending emails for all transaction events
 */

export type NotificationType =
  | "bid_placed"
  | "outbid"
  | "auction_won"
  | "auction_lost"
  | "question_received"
  | "answer_received"
  | "payment_confirmed"
  | "seller_payment_received"
  | "shipping_address_received"
  | "item_shipped"
  | "item_delivered"
  | "feedback_received"

interface EmailData {
  [key: string]: any
}

export async function sendNotificationEmail(email: string, type: NotificationType, data: EmailData) {
  try {
    const response = await fetch("/api/notifications/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        type,
        data,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Email sending error:", error)
    throw error
  }
}

/**
 * Usage Examples:
 *
 * // Notify seller of successful bid
 * await sendNotificationEmail("seller@example.com", "bid_placed", {
 *   productName: "Vintage Camera",
 *   bidAmount: 2500000,
 *   currentBid: 2500000,
 *   endTime: "Oct 30, 10:43 AM",
 * })
 *
 * // Notify buyer they won
 * await sendNotificationEmail("buyer@example.com", "auction_won", {
 *   productName: "Vintage Camera",
 *   winningBid: 2500000,
 *   seller: "TechCollector",
 *   orderId: "ORD-001",
 * })
 *
 * // Notify previous bidder they were outbid
 * await sendNotificationEmail("bidder@example.com", "outbid", {
 *   productName: "Vintage Camera",
 *   newBid: 2600000,
 *   yourBid: 2500000,
 *   productId: 1,
 * })
 */
