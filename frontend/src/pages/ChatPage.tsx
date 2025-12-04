"use client"

import { Navigation } from "@/components/navigation"
import { ChatInterface } from "@/components/chat-interface"

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-[calc(100vh-120px)] border border-border rounded-lg overflow-hidden bg-card">
          <ChatInterface />
        </div>
      </div>
    </div>
  )
}