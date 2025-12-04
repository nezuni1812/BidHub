"use client"

import { X } from "lucide-react"
import { ChatInterface } from "@/components/chat-interface"

interface ChatSidebarOverlayProps {
  isOpen: boolean
  onClose: () => void
  activeConversationId?: string
}

export function ChatSidebarOverlay({ isOpen, onClose, activeConversationId }: ChatSidebarOverlayProps) {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      
      <div className="fixed right-0 top-0 h-screen w-full max-w-5xl bg-background z-50 flex shadow-2xl">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border bg-card flex justify-between items-center">
            <h2 className="text-lg font-semibold">Messages</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dùng lại toàn bộ logic từ ChatInterface */}
          <div className="flex-1">
            <ChatInterface initialConversationId={activeConversationId} />
          </div>
        </div>
      </div>
    </>
  )
}