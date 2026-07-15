'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClipboardList, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Assignment {
  id: string
  title: string
  dueDate: string
  status: string
  grade: number | null
  subject: string
}

interface Props {
  assignments: Assignment[]
}

export default function AssignmentsList({ assignments }: Props) {
  const pending = assignments.filter(a => a.status === 'Pending' || a.status === 'Submitted')
  const overdue = assignments.filter(a => a.status === 'Overdue')

  if (assignments.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">No assignments yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-600" />
          Assignments
        </CardTitle>
        <div className="flex gap-2">
          {overdue.length > 0 && (
            <Badge className="bg-red-100 text-red-700 border-0">{overdue.length} overdue</Badge>
          )}
          {pending.length > 0 && (
            <Badge className="bg-yellow-100 text-yellow-700 border-0">{pending.length} pending</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {[...overdue, ...pending].slice(0, 5).map(a => (
          <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              a.status === 'Overdue' ? 'bg-red-100' :
              a.status === 'Submitted' ? 'bg-blue-100' :
              a.status === 'Completed' ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {a.status === 'Completed' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
               a.status === 'Overdue' ? <AlertCircle className="w-4 h-4 text-red-500" /> :
               <Clock className="w-4 h-4 text-yellow-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{a.subject}</span>
                <span>·</span>
                <span>{new Date(a.dueDate).toLocaleDateString()}</span>
                {a.grade !== null && (
                  <>
                    <span>·</span>
                    <span className="text-green-600 font-medium">{a.grade}%</span>
                  </>
                )}
              </div>
            </div>
            <Badge className={`shrink-0 ${
              a.status === 'Completed' ? 'bg-green-100 text-green-700 border-0' :
              a.status === 'Overdue' ? 'bg-red-100 text-red-700 border-0' :
              a.status === 'Submitted' ? 'bg-blue-100 text-blue-700 border-0' :
              'bg-yellow-100 text-yellow-700 border-0'
            }`}>
              {a.status === 'Submitted' ? 'Submitted' : a.status}
            </Badge>
          </div>
        ))}
        <Link href="/student/assignments">
          <Button variant="ghost" size="sm" className="w-full mt-1 text-gray-500 hover:text-gray-900">
            View all assignments <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
