"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  TrendingUp, 
  BookOpen, 
  Award,
  Save,
  X,
  Edit,
  Target,
  Zap
} from "lucide-react"

interface AIInsight {
  id: string
  type: 'performance' | 'assignment' | 'submission'
  studentName?: string
  className?: string
  subject?: string
  progress?: number
  notes?: string
  assignmentTitle?: string
  completionRate?: number
  averageGrade?: number
  totalStudents?: number
  completedStudents?: number
  grade?: number
  isLate?: boolean
  quality?: string
  recommendation: string
  priority: 'high' | 'medium' | 'low'
  createdAt: string
}

interface AIInsightModalProps {
  isOpen: boolean
  onClose: () => void
  onInsightUpdated: () => void
  insight: AIInsight | null
  action: string
}

export default function AIInsightModal({ isOpen, onClose, onInsightUpdated, insight, action }: AIInsightModalProps) {
  const [notes, setNotes] = useState(insight?.notes || '')
  const [priority, setPriority] = useState(insight?.priority || 'medium')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4" />
      case 'medium': return <Info className="w-4 h-4" />
      case 'low': return <CheckCircle className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <TrendingUp className="w-4 h-4" />
      case 'assignment': return <BookOpen className="w-4 h-4" />
      case 'submission': return <Award className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  const handleSave = async () => {
    if (!insight) return

    try {
      setIsLoading(true)
      
      // Here you would typically save the notes and priority to the database
      // For now, we'll just show a success message
      
      toast({
        title: "Success",
        description: "Insight updated successfully",
      })
      
      onInsightUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating insight:', error)
      toast({
        title: "Error",
        description: "Failed to update insight",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = async () => {
    if (!insight) return

    try {
      setIsLoading(true)
      
      // Here you would typically mark the insight as dismissed in the database
      
      toast({
        title: "Success",
        description: "Insight marked as resolved",
      })
      
      onInsightUpdated()
      onClose()
    } catch (error) {
      console.error('Error dismissing insight:', error)
      toast({
        title: "Error",
        description: "Failed to dismiss insight",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!insight) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
        <DialogHeader>
          <DialogTitle className="edugenius-text-gradient-blue flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            AI Insight Details
          </DialogTitle>
          <DialogDescription>
            {action === 'view' ? 'View insight details and recommendations' : 
             action === 'edit' ? 'Edit insight notes and priority' : 
             'Mark insight as resolved'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Insight Header */}
          <div className="p-4 bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-2 rounded-lg ${getPriorityColor(insight.priority)}`}>
                {getPriorityIcon(insight.priority)}
              </div>
              <div className="flex items-center space-x-2">
                {getInsightTypeIcon(insight.type)}
                <span className="text-sm font-medium capitalize">{insight.type}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                {insight.priority} priority
              </span>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-2">
              {insight.studentName && `${insight.studentName} - `}
              {insight.assignmentTitle || insight.subject || 'Performance Analysis'}
            </h3>
            
            {insight.className && (
              <p className="text-sm text-gray-600 mb-2">Class: {insight.className}</p>
            )}
            
            <p className="text-sm text-gray-700">{insight.recommendation}</p>
          </div>

          {/* Metrics */}
          {(insight.progress !== undefined || insight.completionRate !== undefined || insight.grade !== undefined) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insight.progress !== undefined && (
                <div className="p-3 bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Progress</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{insight.progress}%</p>
                </div>
              )}
              
              {insight.completionRate !== undefined && (
                <div className="p-3 bg-gradient-to-r from-white/70 to-green-50/70 backdrop-blur-sm rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Completion</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{insight.completionRate.toFixed(1)}%</p>
                </div>
              )}
              
              {insight.grade !== undefined && (
                <div className="p-3 bg-gradient-to-r from-white/70 to-purple-50/70 backdrop-blur-sm rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Grade</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{insight.grade}%</p>
                </div>
              )}
            </div>
          )}

          {/* Additional Details */}
          {insight.totalStudents !== undefined && (
            <div className="p-4 bg-gradient-to-r from-white/70 to-gray-50/70 backdrop-blur-sm rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Assignment Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Students:</span>
                  <span className="ml-2 font-medium">{insight.totalStudents}</span>
                </div>
                <div>
                  <span className="text-gray-600">Completed:</span>
                  <span className="ml-2 font-medium">{insight.completedStudents}</span>
                </div>
                {insight.averageGrade !== undefined && (
                  <div>
                    <span className="text-gray-600">Average Grade:</span>
                    <span className="ml-2 font-medium">{insight.averageGrade.toFixed(1)}%</span>
                  </div>
                )}
                {insight.isLate !== undefined && (
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 font-medium ${insight.isLate ? 'text-red-600' : 'text-green-600'}`}>
                      {insight.isLate ? 'Late' : 'On Time'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {action === 'edit' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Teacher Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add your notes about this insight..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select
                  value={priority}
                  onValueChange={setPriority as (value: string) => void}
                >
                  <SelectTrigger className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* View Mode */}
          {action === 'view' && insight.notes && (
            <div className="space-y-2">
              <Label>Teacher Notes</Label>
              <div className="p-3 bg-gradient-to-r from-white/70 to-gray-50/70 backdrop-blur-sm rounded-lg">
                <p className="text-sm text-gray-700">{insight.notes}</p>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-gray-500">
            Generated: {new Date(insight.createdAt).toLocaleDateString()} at {new Date(insight.createdAt).toLocaleTimeString()}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="bg-white/70 backdrop-blur-sm border-0 shadow-sm hover:bg-white/90"
          >
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
          
          {action === 'edit' && (
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          )}
          
          {action === 'dismiss' && (
            <Button
              onClick={handleDismiss}
              disabled={isLoading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Resolved
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
