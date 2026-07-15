'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { generateReportPDF } from '@/lib/pdf-generator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  Calendar,
  Clock,
  User,
  BarChart3,
  DollarSign,
  GraduationCap,
  Users,
  Activity,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'

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
    address?: string
    phone?: string
  } | null
}

const reportTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'ANALYTICS', label: 'Analytics' },
  { value: 'FINANCIAL', label: 'Financial' },
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'USER_ACTIVITY', label: 'User Activity' },
  { value: 'SYSTEM_HEALTH', label: 'System Health' },
  { value: 'CUSTOM', label: 'Custom' },
]

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'GENERATING', label: 'Generating' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'EXPIRED', label: 'Expired' },
]

export default function SchoolAdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    type: 'ANALYTICS' as const
  })
  const { toast } = useToast()

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      })

      const response = await fetch(`/api/school-admin/reports?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }

      const data = await response.json()
      setReports(data.reports || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch reports',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [currentPage, searchTerm, typeFilter, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchReports()
  }

  const handleDelete = async (reportId: string) => {
    try {
      const response = await fetch(`/api/school-admin/reports/${reportId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete report')
      }

      toast({
        title: 'Success',
        description: 'Report deleted successfully',
      })

      fetchReports()
    } catch (error) {
      console.error('Error deleting report:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete report',
      })
    }
  }

  const handleDownload = async (report: Report) => {
    try {
      await generateReportPDF(report)
      toast({
        title: 'Success',
        description: 'Report downloaded successfully',
      })
    } catch (error) {
      console.error('Error downloading report:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to download report',
      })
    }
  }

  const handleCreateReport = async () => {
    if (!createFormData.title || !createFormData.type) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all required fields',
      })
      return
    }

    try {
      const response = await fetch('/api/school-admin/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: createFormData.title,
          description: createFormData.description || null,
          type: createFormData.type,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create report')
      }

      toast({
        title: 'Success',
        description: 'Report created successfully',
      })

      // Reset form and close modal
      setCreateFormData({
        title: '',
        description: '',
        type: 'ANALYTICS'
      })
      setIsCreateOpen(false)
      fetchReports()
    } catch (error) {
      console.error('Error creating report:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create report',
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'GENERATING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'EXPIRED':
        return <AlertCircle className="w-4 h-4 text-gray-500" />
      default:
        return <FileText className="w-4 h-4 text-blue-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ANALYTICS':
        return <BarChart3 className="w-4 h-4" />
      case 'FINANCIAL':
        return <DollarSign className="w-4 h-4" />
      case 'ACADEMIC':
        return <GraduationCap className="w-4 h-4" />
      case 'USER_ACTIVITY':
        return <Users className="w-4 h-4" />
      case 'SYSTEM_HEALTH':
        return <Activity className="w-4 h-4" />
      default:
        return <Settings className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'GENERATING':
        return 'bg-yellow-100 text-yellow-800'
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and manage school reports and analytics
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>
                Generate a new report for your school
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Report Type</label>
                  <Select 
                    value={createFormData.type} 
                    onValueChange={(value) => setCreateFormData(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.slice(1).map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input 
                    placeholder="Enter report title" 
                    value={createFormData.title}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input 
                  placeholder="Enter report description" 
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateReport}>
                  Create Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>School Reports</CardTitle>
          <CardDescription>
            Manage and download your school's reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reports found</h3>
              <p className="text-gray-500 mb-4">
                Create your first report to get started
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Report
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader className="border-none">
                  <TableRow className="border-none">
                    <TableHead className="border-none">Title</TableHead>
                    <TableHead className="border-none">Type</TableHead>
                    <TableHead className="border-none">Status</TableHead>
                    <TableHead className="border-none">Created By</TableHead>
                    <TableHead className="border-none">Created At</TableHead>
                    <TableHead className="text-right border-none">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="border-none">
                  {reports.map((report) => (
                    <TableRow key={report.id} className="group border-none">
                      <TableCell className="border-none">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(report.type)}
                          <div>
                            <div className="font-medium">{report.title}</div>
                            {report.description && (
                              <div className="text-sm text-gray-500">
                                {report.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        <Badge variant="outline">{report.type}</Badge>
                      </TableCell>
                      <TableCell className="border-none">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(report.status)}
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>
                            {report.generatedByUser.firstName}{' '}
                            {report.generatedByUser.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(report.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right border-none">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report)
                              setIsDetailsOpen(true)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(report)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            title="Download Report"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedReport(report)
                                  setIsDetailsOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownload(report)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(report.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              View and manage report information
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Title</label>
                  <p className="text-lg font-semibold">{selectedReport.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(selectedReport.type)}
                    <Badge variant="outline">{selectedReport.type}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedReport.status)}
                    <Badge className={getStatusColor(selectedReport.status)}>
                      {selectedReport.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <p>{selectedReport.generatedByUser.firstName} {selectedReport.generatedByUser.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p>{formatDate(selectedReport.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Updated At</label>
                  <p>{formatDate(selectedReport.updatedAt)}</p>
                </div>
              </div>
              
              {selectedReport.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1">{selectedReport.description}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => handleDownload(selectedReport)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
