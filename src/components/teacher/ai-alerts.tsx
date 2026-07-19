"use client"

import { Brain, AlertCircle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AlertItem {
  id: string
  title?: string
  type?: string
  message?: string
  priority: string
}

interface AIAlertsProps {
  alerts: AlertItem[]
  loading: boolean
}

export default function AIAlertsPanel({ alerts, loading }: AIAlertsProps) {
  return (
    <Card className="bg-gradient-to-br from-white via-amber-50 to-orange-50 shadow-lg border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-600" />
            AI Insights
          </CardTitle>
          <Link href="/teacher/analytics">
            <Button variant="ghost" size="sm" className="text-xs">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-200 rounded-lg animate-pulse" />)}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No alerts — everything looks good</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.map((alert, i) => (
              <div key={alert.id || i} className={`flex gap-3 p-3 rounded-xl border ${
                alert.priority === "high" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
              }`}>
                <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${alert.priority === "high" ? "text-red-500" : "text-amber-500"}`} />
                <div>
                  <p className="text-sm font-medium text-gray-800">{alert.title || alert.type}</p>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
