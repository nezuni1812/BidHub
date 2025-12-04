"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface ChatConversation {
  id: string
  username: string
  lastMessage: string
  unread: number
  timestamp: string
  productName?: string
  orderId?: string
}

interface ChatContextType {
  conversations: ChatConversation[]
  activeConversation: ChatConversation | null
  setActiveConversation: (conversation: ChatConversation | null) => void
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ChatConversation[]>([
    {
      id: "1",
      username: "TechCollector",
      lastMessage: "Thanks for winning! Please pay within 24 hours.",
      unread: 2,
      timestamp: "2:30 PM",
      productName: "Vintage Camera Collection",
      orderId: "ORD-001",
    },
    {
      id: "2",
      username: "VintageEnthusiast",
      lastMessage: "Can you ship to international?",
      unread: 0,
      timestamp: "11:15 AM",
      productName: "Leather Vintage Bag",
      orderId: "ORD-002",
    },
    {
      id: "3",
      username: "CollectorPro",
      lastMessage: "Item received in perfect condition!",
      unread: 0,
      timestamp: "Yesterday",
      productName: "Rare Vinyl Record Set",
      orderId: "ORD-003",
    },
  ])

  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        setActiveConversation,
        isSidebarOpen,
        setIsSidebarOpen,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
