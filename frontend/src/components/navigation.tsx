"use client"

import type React from "react"

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">AH</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline">AuctionHub</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </form>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/selling" className="px-3 py-2 text-sm font-medium hover:bg-muted rounded-md transition">
              Sell
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/auth/register">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
