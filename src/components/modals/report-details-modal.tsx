'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, FileText, Edit, Save, Trash2, Download, Share, Calendar, Clock, User, BarChart3, DollarSign, GraduationCap, Users, Activity, Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { generateReportPDF } from '@/lib/pdf-generator'
import { confirmToast } from '@/lib/confirm-toast'
import { FiltersViewer, ReportContentViewer, ReportData } from './report-viewers'

interface ReportDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: string
  onReportUpdated: (report: any) => void
  onReportDeleted: (reportId: string) => void
}

export default function ReportDetailsModal({
  isOpen,
  onClose,
  reportId,
  onReportUpdated,
  onReportDeleted
}: ReportDetailsModalProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'ANALYTICS',
    status: 'DRAFT',
    content: '{}',
    filters: '',
    isPublic: false,
    scheduledAt: '',
    expiresAt: ''
  })
  const { toast } = useToast()

  const fetchReport = async () => {
    if (!reportId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/${reportId}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
        setFormData({
          title: data.title,
          description: data.description || '',
          type: data.type,
          status: data.status,
          content: data.content,
          filters: data.filters || '',
          isPublic: data.isPublic,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString().slice(0, 16) : '',
          expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString().slice(0, 16) : ''
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch report details",
        })
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch report details",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && reportId) {
      fetchReport()
    }
  }, [isOpen, reportId])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!formData.title || !formData.type) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          scheduledAt: formData.scheduledAt || null,
          expiresAt: formData.expiresAt || null
        }),
      })

      if (response.ok) {
        const updatedReport = await response.json()
        setReportData(updatedReport)
        setEditing(false)
        onReportUpdated(updatedReport)
        toast({
          title: "Success",
          description: "Report updated successfully",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to update report",
        })
      }
    } catch (error) {
      console.error('Error updating report:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update report",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    // Add confirmation dialog
    if (!(await confirmToast({ title: `Are you sure you want to delete "${reportData?.title}"? This action cannot be undone.`, variant: 'destructive' }))) return

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onReportDeleted(reportId)
        onClose() // Close the modal after successful deletion
        toast({
          title: "Success",
          description: "Report deleted successfully",
        })
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
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50">
          <DialogHeader>
            <DialogTitle className="edugenius-text-gradient-blue">Loading Report Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Loading report details...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!reportData) {
    return null
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50">
        <DialogHeader className="sticky top-0 bg-gradient-to-br from-white via-blue-50 to-purple-50 z-10 pb-4">
          <DialogTitle className="edugenius-text-gradient-blue flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Report Details
            </div>
            <div className="flex items-center space-x-2">
              {editing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(false)
                      setFormData({
                        title: reportData.title,
                        description: reportData.description || '',
                        type: reportData.type,
                        status: reportData.status,
                        content: reportData.content,
                        filters: reportData.filters || '',
                        isPublic: reportData.isPublic,
                        scheduledAt: reportData.scheduledAt ? new Date(reportData.scheduledAt).toISOString().slice(0, 16) : '',
                        expiresAt: reportData.expiresAt ? new Date(reportData.expiresAt).toISOString().slice(0, 16) : ''
                      })
                    }}
                    className="edugenius-glass"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="edugenius-button"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      try {
                        generateReportPDF(reportData)
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
                    className="edugenius-glass"
                    title="Download as PDF"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                    className="edugenius-glass"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="edugenius-glass text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            View and manage report information and settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {/* Report Information */}
          <Card className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">Report Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Report Title</Label>
                  {editing ? (
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{reportData.title}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Report Type</Label>
                  {editing ? (
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger className="edugenius-glass">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ANALYTICS">Analytics</SelectItem>
                        <SelectItem value="FINANCIAL">Financial</SelectItem>
                        <SelectItem value="ACADEMIC">Academic</SelectItem>
                        <SelectItem value="USER_ACTIVITY">User Activity</SelectItem>
                        <SelectItem value="SYSTEM_HEALTH">System Health</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getTypeColor(reportData.type)}>
                      {reportData.type.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                {editing ? (
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="edugenius-glass"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700">{reportData.description || 'No description provided'}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  {editing ? (
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger className="edugenius-glass">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="GENERATING">Generating</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getStatusColor(reportData.status)}>
                      {reportData.status}
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isPublic">Public Access</Label>
                  {editing ? (
                    <Switch
                      id="isPublic"
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                    />
                  ) : (
                    <Badge variant={reportData.isPublic ? "default" : "outline"}>
                      {reportData.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters and Content */}
          <Card className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">Report Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="filters">Applied Filters</Label>
                {editing ? (
                  <Textarea
                    id="filters"
                    value={formData.filters}
                    onChange={(e) => handleInputChange('filters', e.target.value)}
                    className="edugenius-glass"
                    rows={3}
                    placeholder="Enter filters as JSON"
                  />
                ) : (
                  <FiltersViewer filters={reportData.filters} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Report Content</Label>
                <ReportContentViewer content={reportData.content} />
              </div>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Scheduled At</Label>
                  {editing ? (
                    <Input
                      id="scheduledAt"
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <p className="text-gray-700">
                      {reportData.scheduledAt ? new Date(reportData.scheduledAt).toLocaleString() : 'Not scheduled'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires At</Label>
                  {editing ? (
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <p className="text-gray-700">
                      {reportData.expiresAt ? new Date(reportData.expiresAt).toLocaleString() : 'No expiration'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Metadata */}
          <Card className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">Report Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Generated by: {reportData.generatedByUser.firstName} {reportData.generatedByUser.lastName}
                  </span>
                </div>
                {reportData.school && (
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      School: {reportData.school.name}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium">{new Date(reportData.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Updated</p>
                    <p className="font-medium">{new Date(reportData.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
