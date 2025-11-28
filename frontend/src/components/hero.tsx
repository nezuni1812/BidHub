import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6 text-balance">Bid on What You Love</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
          Discover unique items at great prices. Join thousands of bidders competing fairly in real-time auctions.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/browse">
            <Button size="lg" className="gap-2">
              Start Bidding
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
