'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { FileText, Calendar, CheckCircle, MoreHorizontal, Eye, Edit, Download, Copy, Trash2 } from 'lucide-react'

interface Rubric {
  id: string
  title: string
  content: string
  subject: string
  grade: string
  topic: string
  metadata: any
  createdAt: string
  updatedAt: string
  rubricData?: {
    totalPoints: number
    performanceLevels: any[]
    criteria: any[]
  }
}

interface RubricCardProps {
  rubric: Rubric
  onView: (rubric: Rubric) => void
  onEdit: (rubric: Rubric) => void
  onDelete: (id: string) => void
  onExport: (rubric: Rubric, format: 'pdf' | 'word') => void
  onCopy: (rubric: Rubric) => void
}

export function RubricCard({ rubric, onView, onEdit, onDelete, onExport, onCopy }: RubricCardProps) {
  const rubricData = typeof rubric.content === 'string'
    ? JSON.parse(rubric.content)
    : rubric.content

  return (
    <Card className="bg-gradient-to-br from-white via-purple-50 to-blue-50 shadow-lg backdrop-blur-sm border-0 hover:shadow-xl transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <Badge className="bg-blue-100 text-blue-800">Rubric</Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onView(rubric)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(rubric)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport(rubric, 'pdf')}>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport(rubric, 'word')}>
                <Download className="mr-2 h-4 w-4" />
                Export Word
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopy(rubric)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(rubric.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
          {rubric.title}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {rubric.subject} • {rubric.grade}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{new Date(rubric.createdAt).toLocaleDateString()}</span>
          </div>
          {rubricData && (
            <>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>{rubricData.criteria?.length || 0} criteria</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="h-4 w-4 mr-2" />
                <span>{rubricData.totalPoints || 100} total points</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface RubricsGridProps {
  rubrics: Rubric[]
  onView: (rubric: Rubric) => void
  onEdit: (rubric: Rubric) => void
  onDelete: (id: string) => void
  onExport: (rubric: Rubric, format: 'pdf' | 'word') => void
  onCopy: (rubric: Rubric) => void
}

export function RubricsGrid({ rubrics, onView, onEdit, onDelete, onExport, onCopy }: RubricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rubrics.map((rubric) => (
        <RubricCard
          key={rubric.id}
          rubric={rubric}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onExport={onExport}
          onCopy={onCopy}
        />
      ))}
    </div>
  )
}
