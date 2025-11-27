"use client"

import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import Link from "next/link"
import { Search, Send, MessageCircle } from "lucide-react"

interface Conversation {
  id: string
  otherUser: string
  lastMessage: string
  timestamp: string
  unread: number
  productName: string
  productId: number
  avatar?: string
}

const conversations: Conversation[] = [
  {
    id: "1",
    otherUser: "TechCollector",
    lastMessage: "Thanks for the bid! When can you come pick it up?",
    timestamp: "2 min ago",
    unread: 2,
    productName: "Vintage Camera Collection",
    productId: 1,
  },
  {
    id: "2",
    otherUser: "LuxuryDeals",
    lastMessage: "Yes, it's still available. Accepting bids.",
    timestamp: "1 hour ago",
    unread: 0,
    productName: "Designer Leather Watch",
    productId: 2,
  },
  {
    id: "3",
    otherUser: "ElectroHub",
    lastMessage: "Can you provide more details about the condition?",
    timestamp: "5 hours ago",
    unread: 1,
    productName: "MacBook Pro 16 2024",
    productId: 3,
  },
]

export default function MessagesPage() {
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState(conversations[0].id)

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.otherUser.toLowerCase().includes(search.toLowerCase()) ||
      conv.productName.toLowerCase().includes(search.toLowerCase()),
  )

  const selectedConversation = conversations.find((c) => c.id === selectedId)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-card border border-border rounded-lg flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">No conversations found</div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`w-full p-4 border-b border-border text-left transition hover:bg-muted/50 ${
                      selectedId === conv.id ? "bg-primary/10 border-l-2 border-l-primary" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold">{conv.otherUser}</p>
                      {conv.unread > 0 && <Badge className="bg-primary text-xs">{conv.unread}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{conv.productName}</p>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    <p className="text-xs text-muted-foreground mt-1">{conv.timestamp}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-lg">{selectedConversation.otherUser}</h2>
                      <p className="text-xs text-muted-foreground">{selectedConversation.productName}</p>
                    </div>
                    <Link href={`/product/${selectedConversation.productId}`}>
                      <Button variant="outline" size="sm">
                        View Item
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Message 1 - Other User */}
                  <div className="flex justify-start">
                    <div className="max-w-xs">
                      <div className="bg-muted rounded-lg rounded-tl-none p-3">
                        <p className="text-sm">{selectedConversation.otherUser} posted the item</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">10:30 AM</p>
                    </div>
                  </div>

                  {/* Message 2 - Current User */}
                  <div className="flex justify-end">
                    <div className="max-w-xs">
                      <div className="bg-primary text-primary-foreground rounded-lg rounded-tr-none p-3">
                        <p className="text-sm">Can you provide more details?</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 text-right">10:45 AM</p>
                    </div>
                  </div>

                  {/* Message 3 - Other User */}
                  <div className="flex justify-start">
                    <div className="max-w-xs">
                      <div className="bg-muted rounded-lg rounded-tl-none p-3">
                        <p className="text-sm">It's in excellent condition with all original accessories.</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">11:00 AM</p>
                    </div>
                  </div>

                  {/* Message 4 - Current User */}
                  <div className="flex justify-end">
                    <div className="max-w-xs">
                      <div className="bg-primary text-primary-foreground rounded-lg rounded-tr-none p-3">
                        <p className="text-sm">Thanks! I'm interested. I'll place a bid.</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 text-right">11:15 AM</p>
                    </div>
                  </div>

                  {/* Message 5 - Other User */}
                  <div className="flex justify-start">
                    <div className="max-w-xs">
                      <div className="bg-muted rounded-lg rounded-tl-none p-3">
                        <p className="text-sm">Great! Looking forward to it.</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">11:20 AM</p>
                    </div>
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input placeholder="Type your message..." className="flex-1" />
                    <Button size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
