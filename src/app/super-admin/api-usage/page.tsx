"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, BarChart3, Activity, Clock, Globe, Users, Server, RefreshCw } from "lucide-react"

export default function ApiUsagePage() {
  const [period, setPeriod] = useState("today")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRequests: 0, uniqueUsers: 0, avgResponseTime: 0, errorRate: 0,
    topEndpoints: [] as Array<{ path: string; count: number; avgTime: number }>,
    requestsByHour: [] as number[],
  })

  useEffect(() => { fetchStats() }, [period])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/system-settings?category=api_stats&period=${period}`)
      if (res.ok) {
        const data = await res.json()
        if (data.stats) setStats(data.stats)
      }
    } catch {} finally { setLoading(false) }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-blue-600" /> API Usage & Monitoring</h1>
          <p className="text-sm text-gray-600">Track API requests, response times, and errors</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchStats}><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow bg-gradient-to-br from-blue-50 to-indigo-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{stats.totalRequests.toLocaleString()}</p><p className="text-xs text-gray-600">Total Requests</p></CardContent></Card>
        <Card className="border-0 shadow bg-gradient-to-br from-green-50 to-emerald-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.uniqueUsers}</p><p className="text-xs text-gray-600">Unique Users</p></CardContent></Card>
        <Card className="border-0 shadow bg-gradient-to-br from-amber-50 to-orange-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{stats.avgResponseTime}ms</p><p className="text-xs text-gray-600">Avg Response</p></CardContent></Card>
        <Card className="border-0 shadow bg-gradient-to-br from-red-50 to-rose-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{stats.errorRate}%</p><p className="text-xs text-gray-600">Error Rate</p></CardContent></Card>
      </div>

      <Card className="border-0 shadow">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5" /> Top Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stats.topEndpoints.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No data available for this period</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Avg Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topEndpoints.map((ep, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm">{ep.path}</TableCell>
                    <TableCell>{ep.count}</TableCell>
                    <TableCell>{ep.avgTime}ms</TableCell>
                    <TableCell><Badge variant={ep.avgTime > 500 ? 'destructive' : ep.avgTime > 200 ? 'secondary' : 'default'}>{ep.avgTime > 500 ? 'Slow' : ep.avgTime > 200 ? 'Okay' : 'Fast'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
