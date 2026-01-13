'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  X, 
  Calendar, 
  Users, 
  BookOpen,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Download,
  Edit,
  Trash2
} from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'

interface ViewAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  assignmentId: string | null
  onEdit: (assignment: any) => void
  onDelete: (assignmentId: string) => void
}

export default function ViewAssignmentModal({ isOpen, onClose, assignmentId, onEdit, onDelete }: ViewAssignmentModalProps) {
  const [assignment, setAssignment] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Fetch assignment details
  useEffect(() => {
    if (assignmentId && isOpen) {
      fetchAssignment()
    }
  }, [assignmentId, isOpen])

  const fetchAssignment = async () => {
    if (!assignmentId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`)
      if (response.ok) {
        const data = await response.json()
        setAssignment(data.assignment)
      } else {
        console.error('Failed to fetch assignment')
      }
    } catch (error) {
      console.error('Error fetching assignment:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800'
      case 'GRADED': return 'bg-green-100 text-green-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'SUBMITTED': return <FileText className="w-4 h-4" />
      case 'GRADED': return <CheckCircle className="w-4 h-4" />
      case 'OVERDUE': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const handleClose = () => {
    setAssignment(null)
    onClose()
  }

  const handleEdit = () => {
    onEdit(assignment)
    handleClose()
  }

  const handleDelete = () => {
    // Confirmation removed - using toast notifications only
  }

  if (!assignment && !loading) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gradient-to-br from-white via-purple-50 to-blue-50 border-0 shadow-2xl">
        <div className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Eye className="w-6 h-6 text-purple-600" />
            Assignment Details
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            View detailed information about this assignment.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading assignment details...</p>
            </div>
          </div>
        ) : assignment ? (
          <div className="space-y-6">
            {/* Header Information */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{assignment.title}</h3>
                  <p className="text-gray-600 mb-4">{assignment.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(assignment.dueDate).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {assignment.teacher.name}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusColor(assignment.status)} flex items-center gap-1`}>
                    {getStatusIcon(assignment.status)}
                    {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1).toLowerCase()}
                  </Badge>
                </div>
              </div>

              {/* Lesson Plan Information */}
              {assignment.lessonPlan && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Linked Lesson Plan</span>
                  </div>
                  <p className="text-blue-700">
                    <strong>{assignment.lessonPlan.title}</strong> - {assignment.lessonPlan.subject} ({assignment.lessonPlan.grade})
                  </p>
                </div>
              )}

              {/* Assignment Content */}
              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Assignment Content</h4>
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <MarkdownRenderer content={assignment.content} />
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200 text-center">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{assignment.stats.totalStudents}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200 text-center">
                <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{assignment.stats.totalSubmissions}</p>
                <p className="text-sm text-gray-600">Submissions</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200 text-center">
                <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{assignment.stats.gradedSubmissions}</p>
                <p className="text-sm text-gray-600">Graded</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200 text-center">
                <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{assignment.stats.pendingSubmissions}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Submission Progress</span>
                <span>{assignment.stats.totalStudents > 0 ? Math.round((assignment.stats.totalSubmissions / assignment.stats.totalStudents) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${assignment.stats.totalStudents > 0 ? (assignment.stats.totalSubmissions / assignment.stats.totalStudents) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Students List */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Assigned Students ({assignment.students.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {assignment.students.map((student: any) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {assignment.submissions.find((s: any) => s.student.id === student.id) ? 'Submitted' : 'Not submitted'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submissions */}
            {assignment.submissions.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Submissions ({assignment.submissions.length})
                </h4>
                <div className="space-y-3">
                  {assignment.submissions.map((submission: any) => (
                    <div key={submission.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{submission.student.name}</p>
                            <p className="text-sm text-gray-500">
                              Submitted: {new Date(submission.submittedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {submission.grade !== null && (
                          <Badge className="bg-green-100 text-green-800">
                            Grade: {submission.grade}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm text-gray-700 mb-2">Submission Content:</p>
                        <div className="bg-white rounded p-3 border border-gray-200">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                            {submission.content}
                          </pre>
                        </div>
                      </div>

                      {submission.feedback && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-700 mb-2">Teacher Feedback:</p>
                          <div className="bg-blue-50 rounded p-3 border border-blue-200">
                            <p className="text-sm text-blue-800">{submission.feedback}</p>
                          </div>
                        </div>
                      )}

                      {submission.attachments && submission.attachments.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-700 mb-2">Attachments:</p>
                          <div className="flex flex-wrap gap-2">
                            {submission.attachments.map((attachment: string, index: number) => (
                              <a
                                key={index}
                                href={attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                              >
                                Attachment {index + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleClose}
                className="bg-white/70 backdrop-blur-sm border-0 shadow-sm hover:bg-white/90"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
              <Button
                variant="outline"
                onClick={handleEdit}
                className="bg-white/70 backdrop-blur-sm border-0 shadow-sm hover:bg-white/90"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
