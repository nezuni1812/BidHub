"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Send } from "lucide-react"

export default function ChatPage({ params }: { params: { username: string } }) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Array<{ id: number; sender: string; text: string; time: string }>>([
    { id: 1, sender: "other", text: "Hi! I'm interested in your item", time: "10:30 AM" },
    { id: 2, sender: "you", text: "Great! What would you like to know?", time: "10:35 AM" },
    { id: 3, sender: "other", text: "Can you tell me about the condition?", time: "10:40 AM" },
    { id: 4, sender: "you", text: "It's in excellent condition. Used only twice.", time: "10:45 AM" },
  ])

  const handleSend = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        { id: messages.length + 1, sender: "you", text: message, time: new Date().toLocaleTimeString() },
      ])
      setMessage("")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/messages">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Chat with {params.username}</h1>
            <p className="text-sm text-muted-foreground">About: Designer Leather Watch</p>
          </div>
        </div>

        {/* Chat Card */}
        <Card className="flex flex-col h-[600px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "you" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs ${msg.sender === "you" ? "" : ""}`}>
                  <div
                    className={`rounded-lg p-3 ${
                      msg.sender === "you"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted rounded-tl-none"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                  <p className={`text-xs text-muted-foreground mt-1 ${msg.sender === "you" ? "text-right" : ""}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
              />
              <Button size="icon" onClick={handleSend}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="outline">Report Conversation</Button>
          <Button variant="outline">Block User</Button>
        </div>
      </div>
    </div>
  )
}
