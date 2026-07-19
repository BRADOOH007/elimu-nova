"use client"

import { Bot, MessageSquare, Loader2, BookOpen } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { useState, useEffect, useRef } from "react"

interface ChatMessage {
  id: string
  role: "user" | "ai"
  content: string
  timestamp: Date
}

interface AIChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentLesson: { title: string } | null
  isTyping: boolean
  messages: ChatMessage[]
  message: string
  onMessageChange: (msg: string) => void
  onSend: (msg: string) => void
}

export default function AIChatDialog({
  open,
  onOpenChange,
  currentLesson,
  isTyping,
  messages,
  message,
  onMessageChange,
  onSend,
}: AIChatDialogProps) {
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-base leading-tight">AI Teacher</p>
            <p className="text-blue-100 text-xs">Personalised learning assistant</p>
          </div>
          {currentLesson && (
            <div className="hidden sm:flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
              <BookOpen className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-medium truncate max-w-[140px]">{currentLesson.title}</span>
            </div>
          )}
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white ml-1"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-4 min-h-0">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div className={`max-w-[78%] flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`rounded-2xl shadow-sm overflow-hidden ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm px-4 py-3"
                    : "bg-white border border-gray-200 rounded-bl-sm"
                }`}>
                  {msg.role === "user"
                    ? <p className="text-sm leading-relaxed">{msg.content}</p>
                    : <div className="px-4 py-3"><MarkdownRenderer content={msg.content} /></div>
                  }
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
                  <span className="text-xs text-gray-400 ml-1">AI is thinking…</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        <div className="flex gap-2 px-4 py-2 bg-white border-t border-gray-100 flex-shrink-0 overflow-x-auto">
          {["Explain this lesson", "Give me practice questions", "What should I study next?", "Quiz me!"].map(p => (
            <button
              key={p}
              onClick={() => onMessageChange(p)}
              className="text-xs whitespace-nowrap px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full hover:bg-blue-100 transition-colors font-medium flex-shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
          <div className="flex items-end gap-2 bg-gray-100 rounded-2xl px-4 py-2">
            <Textarea
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Ask me anything about your lessons…"
              rows={1}
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none text-sm p-0 min-h-[24px] max-h-32"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  onSend(message)
                }
              }}
            />
            <Button
              onClick={() => onSend(message)}
              disabled={isTyping || !message.trim()}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 rounded-xl h-9 w-9 p-0 shrink-0 disabled:opacity-40"
            >
              {isTyping
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <MessageSquare className="w-4 h-4" />
              }
            </Button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1.5">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
