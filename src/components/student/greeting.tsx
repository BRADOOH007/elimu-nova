"use client"

import { Bot, MessageSquare, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StudentGreetingProps {
  displayName: string
  onChatClick: () => void
  onRefreshInsights: () => void
}

export default function StudentGreeting({ displayName, onChatClick, onRefreshInsights }: StudentGreetingProps) {
  return (
    <div className="text-center bg-gradient-to-r from-blue-50 via-purple-50 to-cyan-50 rounded-2xl p-4 md:p-8 shadow-lg">
      <div className="flex flex-col sm:flex-row items-center justify-center mb-4 gap-3">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-6 h-6 md:w-8 md:h-8 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">
            Welcome, {displayName.split(" ")[0]}!
          </h1>
          <p className="text-gray-600 text-sm md:text-lg">
            Your AI Teacher is ready to guide your learning journey
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:space-x-4">
        <Button
          onClick={onChatClick}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Chat with AI Teacher
        </Button>
        <Button
          variant="outline"
          className="w-full sm:w-auto bg-white/70 backdrop-blur-sm"
          onClick={onRefreshInsights}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Insights
        </Button>
      </div>
    </div>
  )
}
