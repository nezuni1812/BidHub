"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Trash2, CheckCircle, Clock, AlertCircle, DollarSign, MessageSquare } from "lucide-react"

interface Notification {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  read: boolean
  icon: React.ReactNode
  actionUrl?: string
}

const notifications: Notification[] = [
  {
    id: "1",
    type: "auction_won",
    title: "Auction Won!",
    description: "You won the auction for Vintage Camera Collection - Sony Alpha 7",
    timestamp: "5 minutes ago",
    read: false,
    icon: <CheckCircle className="w-5 h-5 text-accent" />,
    actionUrl: "/checkout/ORD-001",
  },
  {
    id: "2",
    type: "outbid",
    title: "You've Been Outbid",
    description: "Someone placed a higher bid on Designer Leather Watch",
    timestamp: "1 hour ago",
    read: false,
    icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    actionUrl: "/product/2",
  },
  {
    id: "3",
    type: "payment_confirmed",
    title: "Payment Confirmed",
    description: "Your payment for MacBook Pro 16 2024 has been received",
    timestamp: "2 hours ago",
    read: true,
    icon: <DollarSign className="w-5 h-5 text-accent" />,
    actionUrl: "/orders",
  },
  {
    id: "4",
    type: "question_received",
    title: "New Question",
    description: "Someone asked about the condition of your item",
    timestamp: "3 hours ago",
    read: true,
    icon: <MessageSquare className="w-5 h-5 text-primary" />,
    actionUrl: "/dashboard",
  },
  {
    id: "5",
    type: "item_shipped",
    title: "Item Shipped",
    description: "Your item has been shipped with tracking number ABC123",
    timestamp: "5 hours ago",
    read: true,
    icon: <Clock className="w-5 h-5 text-blue-500" />,
    actionUrl: "/orders",
  },
]

export default function NotificationsPage() {
  const [notificationList, setNotificationList] = useState(notifications)
  const [filter, setFilter] = useState("all")

  const unreadCount = notificationList.filter((n) => !n.read).length

  const filteredNotifications = filter === "unread" ? notificationList.filter((n) => !n.read) : notificationList

  const handleMarkAsRead = (id: string) => {
    setNotificationList(notificationList.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const handleDelete = (id: string) => {
    setNotificationList(notificationList.filter((n) => n.id !== id))
  }

  const handleMarkAllAsRead = () => {
    setNotificationList(notificationList.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && <Badge className="ml-2 bg-primary text-xs">{unreadCount}</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredNotifications.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No notifications</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 transition cursor-pointer hover:shadow-md ${
                  !notification.read ? "bg-primary/5 border-primary/30" : ""
                }`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="pt-1">{notification.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold">{notification.title}</h3>
                      {!notification.read && <Badge className="bg-primary text-xs flex-shrink-0">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                      <div className="flex gap-2">
                        {notification.actionUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = notification.actionUrl || ""
                            }}
                          >
                            View
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(notification.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
