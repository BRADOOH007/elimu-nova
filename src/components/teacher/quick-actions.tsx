"use client"

import { Users, BookOpen, Brain, ClipboardList, Sparkles, Plus } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

const actions = [
  { title: "My Students", description: "View and manage your students", icon: Users, href: "/teacher/students", color: "from-green-500 to-green-600" },
  { title: "Create Lesson Plan", description: "Generate AI-powered lesson plans", icon: BookOpen, href: "/teacher/lesson-plans/create", color: "from-blue-500 to-blue-600" },
  { title: "AI Tools", description: "Generate images & presentations", icon: Brain, href: "/teacher/ai-tools", color: "from-indigo-500 to-purple-600" },
  { title: "Generate Scheme of Work", description: "Create comprehensive schemes", icon: ClipboardList, href: "/teacher/schemes-of-work", color: "from-purple-500 to-purple-600" },
  { title: "Ask Hope AI", description: "Get instant teaching support", icon: Sparkles, href: "/teacher/hope-ai", color: "from-pink-500 to-pink-600" },
]

export default function QuickActionsGrid() {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 animate-stagger">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="bg-gradient-to-br from-white via-gray-50 to-blue-50 shadow-lg border-0 hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer h-full">
              <CardContent className="p-6 h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <Plus className="w-5 h-5 text-gray-400 ml-auto" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
