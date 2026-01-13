'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Search,
  Filter,
  Plus,
  FileText,
  Calendar,
  User,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Share,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  DollarSign,
  GraduationCap,
  Users,
  Activity,
  Settings
} from 'lucide-react'
import CreateReportModal from '@/components/modals/create-report-modal'
import ReportDetailsModal from '@/components/modals/report-details-modal'
import { generateReportPDF } from '@/lib/pdf-generator'

interface Report {
  id: string
  title: string
  description: string | null
  type: 'ANALYTICS' | 'FINANCIAL' | 'ACADEMIC' | 'USER_ACTIVITY' | 'SYSTEM_HEALTH' | 'CUSTOM'
  status: 'DRAFT' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'EXPIRED'
  content: string
  filters: string | null
  isPublic: boolean
  scheduledAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  generatedByUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  school: {
    id: string
    name: string
    email: string
  } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all-types')
  const [statusFilter, setStatusFilter] = useState('all-status')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const { toast } = useToast()

  const fetchReports = async (page = 1, search = '', type = '', status = '', sort = 'createdAt', order = 'desc') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(type && type !== 'all-types' && { type }),
        ...(status && status !== 'all-status' && { status }),
        sortBy: sort,
        sortOrder: order
      })

      const response = await fetch(`/api/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
        setPagination(data.pagination)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch reports",
        })
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch reports",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports(currentPage, searchTerm, typeFilter, statusFilter, sortBy, sortOrder)
  }, [currentPage, searchTerm, typeFilter, statusFilter, sortBy, sortOrder])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const handleReportClick = (report: Report) => {
    setSelectedReport(report)
    setDetailsModalOpen(true)
  }

  const handleReportCreated = (newReport: Report) => {
    setReports(prev => [newReport, ...prev])
    setCreateModalOpen(false)
    toast({
      title: "Success",
      description: "Report created successfully",
    })
  }

  const handleReportUpdated = (updatedReport: Report) => {
    setReports(prev => prev.map(report => 
      report.id === updatedReport.id ? updatedReport : report
    ))
    setDetailsModalOpen(false)
    toast({
      title: "Success",
      description: "Report updated successfully",
    })
  }

  const handleReportDeleted = (reportId: string) => {
    setReports(prev => prev.filter(report => report.id !== reportId))
    setDetailsModalOpen(false)
    toast({
      title: "Success",
      description: "Report deleted successfully",
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ANALYTICS': return BarChart3
      case 'FINANCIAL': return DollarSign
      case 'ACADEMIC': return GraduationCap
      case 'USER_ACTIVITY': return Users
      case 'SYSTEM_HEALTH': return Activity
      case 'CUSTOM': return Settings
      default: return FileText
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ANALYTICS': return 'bg-blue-100 text-blue-800'
      case 'FINANCIAL': return 'bg-green-100 text-green-800'
      case 'ACADEMIC': return 'bg-purple-100 text-purple-800'
      case 'USER_ACTIVITY': return 'bg-orange-100 text-orange-800'
      case 'SYSTEM_HEALTH': return 'bg-red-100 text-red-800'
      case 'CUSTOM': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return CheckCircle
      case 'GENERATING': return Loader2
      case 'FAILED': return XCircle
      case 'EXPIRED': return AlertCircle
      case 'DRAFT': return Clock
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'GENERATING': return 'bg-blue-100 text-blue-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'EXPIRED': return 'bg-yellow-100 text-yellow-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="edugenius-text-gradient">Reports Management</span>
          </h1>
          <p className="text-gray-600">Generate, manage, and analyze system reports</p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="edugenius-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Report
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 edugenius-card-gradient">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 edugenius-glass"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={(value) => {
                setTypeFilter(value)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-40 edugenius-glass">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-types">All Types</SelectItem>
                  <SelectItem value="ANALYTICS">Analytics</SelectItem>
                  <SelectItem value="FINANCIAL">Financial</SelectItem>
                  <SelectItem value="ACADEMIC">Academic</SelectItem>
                  <SelectItem value="USER_ACTIVITY">User Activity</SelectItem>
                  <SelectItem value="SYSTEM_HEALTH">System Health</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-40 edugenius-glass">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-status">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="GENERATING">Generating</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value) => {
                setSortBy(value)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-40 edugenius-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="updatedAt">Updated Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="edugenius-glass"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchReports(currentPage, searchTerm, typeFilter, statusFilter, sortBy, sortOrder)}
                className="edugenius-glass"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-500">Loading reports...</span>
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => {
            const TypeIcon = getTypeIcon(report.type)
            const StatusIcon = getStatusIcon(report.status)
            return (
              <Card key={report.id} className="group hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white via-blue-50 to-purple-50 border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1 flex items-center">
                        <TypeIcon className="w-5 h-5 mr-2 text-blue-600" />
                        {report.title}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {report.description || 'No description provided'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(report.status)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {report.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Type and School */}
                  <div className="flex items-center justify-between">
                    <Badge className={getTypeColor(report.type)}>
                      {report.type.replace('_', ' ')}
                    </Badge>
                    {report.school && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{report.school.name}</p>
                        <p className="text-xs text-gray-500">School Report</p>
                      </div>
                    )}
                  </div>

                  {/* Generated By */}
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {report.generatedByUser.firstName} {report.generatedByUser.lastName}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="font-medium">{new Date(report.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Updated</p>
                      <p className="font-medium">{new Date(report.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      {report.isPublic && (
                        <Badge variant="outline" className="text-xs">
                          <Share className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      )}
                      {report.scheduledAt && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Scheduled
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReportClick(report)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          try {
                            generateReportPDF(report)
                            toast({
                              title: "Success",
                              description: "Report PDF downloaded successfully",
                            })
                          } catch (error) {
                            console.error('Error generating PDF:', error)
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: "Failed to generate PDF",
                            })
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="Download Report as PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation()
                          const confirmed = window.confirm(`Are you sure you want to delete "${report.title}"? This action cannot be undone.`)
                          
                          if (!confirmed) {
                            return
                          }
                          
                          try {
                            const response = await fetch(`/api/reports/${report.id}`, {
                              method: 'DELETE',
                            })
                            if (response.ok) {
                              handleReportDeleted(report.id)
                            } else {
                              const error = await response.json()
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: error.error || "Failed to delete report",
                              })
                            }
                          } catch (error) {
                            console.error('Error deleting report:', error)
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: "Failed to delete report",
                            })
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-700"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-0 edugenius-card-gradient">
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || typeFilter || statusFilter ? 'No reports match your search criteria.' : 'Get started by creating your first report.'}
            </p>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="edugenius-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Report
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Card className="border-0 edugenius-card-gradient">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reports
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="edugenius-glass"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={currentPage === pagination.pages}
                  className="edugenius-glass"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateReportModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onReportCreated={handleReportCreated}
      />

      {selectedReport && (
        <ReportDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false)
            setSelectedReport(null)
          }}
          reportId={selectedReport.id}
          onReportUpdated={handleReportUpdated}
          onReportDeleted={handleReportDeleted}
        />
      )}
    </div>
  )
}
