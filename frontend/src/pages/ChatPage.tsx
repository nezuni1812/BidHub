"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Search, Send } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { useNavigate } from "react-router-dom"
import { io, Socket } from "socket.io-client"

interface Conversation {
  order_id: number
  product_id: number
  product_title: string
  product_image: string
  other_user_id: number
  other_user_name: string
  other_user_username: string
  last_message: string
  last_message_time: string
  unread_count: number
}

interface Message {
  id: number
  order_id: number
  sender_id: number
  receiver_id: number
  message: string
  is_read: boolean
  created_at: string
  sender_name: string
  receiver_name: string
}

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const selectedConversationRef = useRef<Conversation | null>(null)

  // Keep ref updated
  useEffect(() => {
    selectedConversationRef.current = selectedConversation
  }, [selectedConversation])

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch conversations on mount
  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      navigate('/login')
      return
    }
    fetchConversations()
  }, [user, authLoading])

  // Socket.IO connection
  useEffect(() => {
    console.log('🔍 Socket useEffect triggered, user:', user)
    
    if (!user) {
      console.log('⏭️ No user, skipping socket connection')
      return
    }

    // Connect to socket - use access_token like ProductDetail does
    const token = localStorage.getItem('access_token')
    if (!token) {
      console.log('❌ No access_token found for socket connection')
      return
    }

    console.log('🔌 Connecting socket for user:', user.id)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'
    console.log('🔌 Socket URL:', socketUrl)
    console.log('🔌 Token (first 20 chars):', token.substring(0, 20) + '...')
    
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('✅✅✅ Socket connected to chat successfully!')
      console.log('✅ Socket ID:', socket.id)
      console.log('✅ Socket connected:', socket.connected)
      console.log('👤 User room: user-' + user.id)
    })

    socket.on('connect_error', async (error) => {
      console.error('❌❌❌ Socket connection error:', error)
      console.error('❌ Error message:', error.message)
      console.error('❌ Error type:', error.type)
      
      // If token expired, try to refresh and reconnect
      if (error.message.includes('expired') || error.message.includes('Authentication')) {
        console.log('🔄 Token expired, attempting to refresh...')
        
        // Import API client to use refresh token logic
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          console.error('❌ No refresh token, redirecting to login')
          navigate('/login')
          return
        }
        
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
          const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          })
          
          if (!response.ok) {
            throw new Error('Refresh token expired')
          }
          
          const data = await response.json()
          const newAccessToken = data.data.access_token
          
          localStorage.setItem('access_token', newAccessToken)
          console.log('✅ Token refreshed, reconnecting socket...')
          
          // Reconnect socket with new token
          socket.auth = { token: newAccessToken }
          socket.connect()
        } catch (err) {
          console.error('❌ Failed to refresh token:', err)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          navigate('/login')
        }
      }
    })

    socket.on('error', (error) => {
      console.error('❌ Socket error event:', error)
    })

    // Listen for new messages
    socket.on('new-message', (data: { orderId: number; message: Message; senderName: string }) => {
      console.log('📨📨📨 NEW MESSAGE EVENT RECEIVED!')
      console.log('📨 Data:', JSON.stringify(data, null, 2))
      console.log('📨 Current conversation:', selectedConversationRef.current?.order_id)
      console.log('📨 Message order_id:', data.orderId)
      console.log('📨 Sender:', data.senderName)
      
      // Update messages if this is the active conversation
      if (selectedConversationRef.current && selectedConversationRef.current.order_id === data.orderId) {
        console.log('✅✅✅ ADDING MESSAGE TO ACTIVE CONVERSATION!')
        setMessages(prev => {
          const newMessages = [...prev, data.message]
          console.log('✅ New messages array length:', newMessages.length)
          return newMessages
        })
      } else {
        console.log('⏭️ Message is for different conversation')
        console.log('⏭️ Current:', selectedConversationRef.current?.order_id, 'vs Message:', data.orderId)
      }

      // Update conversation list with new last message
      setConversations(prev => {
        const updated = prev.map(conv => 
          conv.order_id === data.orderId 
            ? { 
                ...conv, 
                last_message: data.message.message,
                last_message_time: data.message.created_at,
                unread_count: selectedConversationRef.current?.order_id === data.orderId ? conv.unread_count : conv.unread_count + 1
              }
            : conv
        )
        console.log('✅ Updated conversations')
        return updated
      })
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected, reason:', reason)
    })

    console.log('🔌 Socket setup complete')

    return () => {
      console.log('🔌 Disconnecting socket')
      socket.disconnect()
    }
  }, [user])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/chat/conversations')
      setConversations(response.data || [])
      if (response.data && response.data.length > 0 && !selectedConversation) {
        setSelectedConversation(response.data[0])
        fetchMessages(response.data[0].order_id)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (orderId: number) => {
    try {
      const response = await api.get(`/chat/${orderId}/messages`)
      setMessages(response.data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    fetchMessages(conversation.order_id)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    try {
      setSending(true)
      await api.post(`/chat/${selectedConversation.order_id}/messages`, {
        message: newMessage
      })
      setNewMessage("")
      await fetchMessages(selectedConversation.order_id)
      await fetchConversations() // Refresh conversation list
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('vi-VN')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="overflow-y-auto h-[calc(100%-80px)]">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No conversations yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Win an auction or sell an item to start chatting
                  </p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.order_id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedConversation?.order_id === conv.order_id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold truncate">{conv.other_user_name}</h3>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conv.last_message_time)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-1">
                          {conv.product_title}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message || 'No messages yet'}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{selectedConversation.other_user_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.product_title}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/product/${selectedConversation.product_id}`)}
                    >
                      View Product
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => {
                        const isOwn = msg.sender_id === user.id
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {!isOwn && (
                                <p className="text-xs font-semibold mb-1">
                                  {msg.sender_name}
                                </p>
                              )}
                              <p className="text-sm">{msg.message}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                }`}
                              >
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      disabled={sending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}