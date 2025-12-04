"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Search, Send } from "lucide-react"

interface Conversation {
    id: string
    username: string
    lastMessage: string
    timestamp: string
    unread: number
    productName: string
    productId: string
    orderId?: string
}

interface Message {
    id: number
    sender: string
    text: string
    time: string
    isOwn: boolean
}

interface ChatInterfaceProps {
    initialConversationId?: string
    className?: string
}

export function ChatInterface({ initialConversationId, className = "" }: ChatInterfaceProps) {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const urlSellerId = searchParams.get("seller")
    const activeId = initialConversationId || urlSellerId

    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [searchQuery, setSearchQuery] = useState("")

    const allConversations: Conversation[] = [
        {
            id: "1",
            username: "TechCollector",
            lastMessage: "Thanks for winning! Please pay within 24 hours.",
            timestamp: "2:30 PM",
            unread: 2,
            productName: "Vintage Camera Collection - Sony Alpha 7",
            productId: "1",
            orderId: "12345",
        },
        {
            id: "2",
            username: "VintageGems",
            lastMessage: "I can provide more photos if you need them",
            timestamp: "Yesterday",
            unread: 0,
            productName: "Antique Diamond Ring",
            productId: "2",
        },
        {
            id: "3",
            username: "ElectroDeals",
            lastMessage: "Shipping will arrive on Friday",
            timestamp: "3 days ago",
            unread: 0,
            productName: "iPhone 15 Pro Max",
            productId: "3",
        },
    ]
    const mockMessages: Record<string, Message[]> = {
        "1": [
            {
                id: 1,
                sender: "TechCollector",
                text: "Congratulations on winning the auction!",
                time: "2:15 PM",
                isOwn: false,
            },
            { id: 2, sender: "You", text: "Thank you! How should I proceed with payment?", time: "2:20 PM", isOwn: true },
            {
                id: 3,
                sender: "TechCollector",
                text: "Thanks for winning! Please pay within 24 hours.",
                time: "2:30 PM",
                isOwn: false,
            },
        ],
        "2": [
            {
                id: 1,
                sender: "VintageGems",
                text: "Hi! Do you have any questions about the ring?",
                time: "1:00 PM",
                isOwn: false,
            },
            { id: 2, sender: "You", text: "Yes, could you send me more photos?", time: "1:15 PM", isOwn: true },
            {
                id: 3,
                sender: "VintageGems",
                text: "I can provide more photos if you need them",
                time: "1:30 PM",
                isOwn: false,
            },
        ],
        "3": [
            { id: 1, sender: "ElectroDeals", text: "Your item has been shipped!", time: "10:00 AM", isOwn: false },
            { id: 2, sender: "ElectroDeals", text: "Shipping will arrive on Friday", time: "10:05 AM", isOwn: false },
        ],
    }

    useEffect(() => {
        if (activeId) {
            const conv = allConversations.find(c => c.id === activeId)
            if (conv) {
                setSelectedConversation(conv)
                setMessages(mockMessages[activeId] || [])
            }
        }
    }, [activeId])

    const handleSelectConversation = (conv: Conversation) => {
        setSelectedConversation(conv)
        setMessages(mockMessages[conv.id] || [])
    }

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedConversation) return
        const msg: Message = {
            id: messages.length + 1,
            sender: "You",
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isOwn: true,
        }
        setMessages(prev => [...prev, msg])
        setNewMessage("")
    }

    const filteredConversations = allConversations.filter(conv =>
        conv.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.productName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className={`flex h-full ${className}`}>
            {/* Sidebar */}
            <div className="w-80 flex flex-col border-r border-border bg-card">
                <div className="p-4 border-b border-border">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Messages
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => handleSelectConversation(conv)}
                            className={`w-full p-4 text-left border-b border-border hover:bg-muted/50 transition ${selectedConversation?.id === conv.id ? "bg-primary/10 border-l-4 border-l-primary" : ""
                                }`}
                        >
                            <div className="flex justify-between mb-1">
                                <p className="font-semibold text-sm">{conv.username}</p>
                                {conv.unread > 0 && <Badge className="text-xs">{conv.unread}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{conv.productName}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{conv.lastMessage}</p>
                            <p className="text-xs text-muted-foreground mt-1">{conv.timestamp}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {!selectedConversation ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-lg font-medium">Choose a conversation</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-lg">{selectedConversation.username}</h3>
                                <p className="text-xs text-muted-foreground">{selectedConversation.productName}</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/product/${selectedConversation.productId}`)}
                            >
                                View Product
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.isOwn ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"}`}>
                                        <p className="text-sm">{msg.text}</p>
                                        <p className={`text-xs mt-1 ${msg.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                            {msg.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-border bg-muted/30">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type your message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                                />
                                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}