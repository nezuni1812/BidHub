export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, email, data } = body

    // Email templates based on transaction type
    const emailTemplates: Record<string, { subject: string; template: (data: any) => string }> = {
      bid_placed: {
        subject: "Your Bid Has Been Placed",
        template: (data) => `
          <h2>Bid Confirmation</h2>
          <p>Your bid of $${(data.bidAmount / 1000000).toFixed(1)}M has been successfully placed on:</p>
          <p><strong>${data.productName}</strong></p>
          <p>Current highest bid: $${(data.currentBid / 1000000).toFixed(1)}M</p>
          <p>Auction ends: ${data.endTime}</p>
        `,
      },
      outbid: {
        subject: "You've Been Outbid",
        template: (data) => `
          <h2>You've Been Outbid</h2>
          <p>Someone has placed a higher bid on <strong>${data.productName}</strong></p>
          <p>New highest bid: $${(data.newBid / 1000000).toFixed(1)}M</p>
          <p>Your bid was: $${(data.yourBid / 1000000).toFixed(1)}M</p>
          <p><a href="https://auctiohub.com/product/${data.productId}">Place a higher bid now</a></p>
        `,
      },
      auction_won: {
        subject: "Congratulations! You've Won an Auction",
        template: (data) => `
          <h2>You Won!</h2>
          <p>Congratulations! You are the highest bidder for:</p>
          <p><strong>${data.productName}</strong></p>
          <p>Winning bid: $${(data.winningBid / 1000000).toFixed(1)}M</p>
          <p>Seller: ${data.seller}</p>
          <p>Please complete payment within 24 hours.</p>
          <p><a href="https://auctionhub.com/checkout/${data.orderId}">Complete Checkout</a></p>
        `,
      },
      auction_lost: {
        subject: "Auction Ended - Better Luck Next Time",
        template: (data) => `
          <h2>Auction Ended</h2>
          <p>Unfortunately, you were not the highest bidder for <strong>${data.productName}</strong></p>
          <p>Winning bid: $${(data.winningBid / 1000000).toFixed(1)}M</p>
          <p>We have similar items you might be interested in.</p>
        `,
      },
      question_received: {
        subject: "New Question About Your Item",
        template: (data) => `
          <h2>New Question</h2>
          <p>Someone asked a question about <strong>${data.productName}</strong>:</p>
          <p><em>"${data.question}"</em></p>
          <p>From: ${data.askerName}</p>
          <p><a href="https://auctionhub.com/product/${data.productId}">Answer the question</a></p>
        `,
      },
      answer_received: {
        subject: "Seller Answered Your Question",
        template: (data) => `
          <h2>Question Answered</h2>
          <p>The seller of <strong>${data.productName}</strong> answered your question:</p>
          <p><strong>Your question:</strong> ${data.question}</p>
          <p><strong>Answer:</strong> ${data.answer}</p>
        `,
      },
      payment_confirmed: {
        subject: "Payment Confirmed - Order #${data.orderId}",
        template: (data) => `
          <h2>Payment Received</h2>
          <p>Your payment of $${(data.amount / 1000000).toFixed(1)}M has been confirmed.</p>
          <p>Order ID: ${data.orderId}</p>
          <p>Product: ${data.productName}</p>
          <p>Please provide your shipping address to proceed.</p>
        `,
      },
      seller_payment_received: {
        subject: "Payment Received for Your Item",
        template: (data) => `
          <h2>Payment Received</h2>
          <p>You have received payment of $${(data.amount / 1000000).toFixed(1)}M for:</p>
          <p><strong>${data.productName}</strong></p>
          <p>Buyer: ${data.buyer}</p>
          <p>Please confirm receipt and provide tracking information.</p>
        `,
      },
      shipping_address_received: {
        subject: "Shipping Address Received - Order #${data.orderId}",
        template: (data) => `
          <h2>Shipping Address Received</h2>
          <p>Shipping address for order #${data.orderId} has been received.</p>
          <p>Address: ${data.address}</p>
          <p>Please confirm you will ship the item soon.</p>
        `,
      },
      item_shipped: {
        subject: "Your Item Has Been Shipped",
        template: (data) => `
          <h2>Item Shipped</h2>
          <p>Your item <strong>${data.productName}</strong> has been shipped!</p>
          <p>Tracking Number: ${data.trackingNumber}</p>
          <p>Carrier: ${data.carrier}</p>
          <p>Expected Delivery: ${data.expectedDelivery}</p>
        `,
      },
      item_delivered: {
        subject: "Your Item Has Been Delivered",
        template: (data) => `
          <h2>Item Delivered</h2>
          <p>Your item <strong>${data.productName}</strong> has been delivered!</p>
          <p>Please confirm receipt and leave feedback for the seller.</p>
          <p><a href="https://auctionhub.com/feedback/${data.orderId}">Leave Feedback</a></p>
        `,
      },
      feedback_received: {
        subject: "You Received Feedback",
        template: (data) => `
          <h2>New Feedback</h2>
          <p>You received feedback for <strong>${data.productName}</strong>:</p>
          <p>Rating: ${"★".repeat(data.rating)}</p>
          <p>Comment: ${data.comment}</p>
          <p>From: ${data.reviewer}</p>
        `,
      },
    }

    const emailConfig = emailTemplates[type]
    if (!emailConfig) {
      return Response.json({ error: "Invalid notification type" }, { status: 400 })
    }

    // In production, integrate with email service (SendGrid, Mailgun, etc.)
    // This is a mock implementation
    console.log(`Email sent to ${email}`)
    console.log(`Subject: ${emailConfig.subject}`)
    console.log(`Body:\n${emailConfig.template(data)}`)

    return Response.json({
      success: true,
      message: "Email notification sent",
      type,
      email,
    })
  } catch (error) {
    console.error("Email sending error:", error)
    return Response.json({ error: "Failed to send email" }, { status: 500 })
  }
}
