'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Plus, Info } from 'lucide-react'

interface CreateReportModalProps {
  isOpen: boolean
  onClose: () => void
  onReportCreated: (report: any) => void
}

export default function CreateReportModal({
  isOpen,
  onClose,
  onReportCreated
}: CreateReportModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'ANALYTICS',
    isPublic: false,
    scheduledAt: '',
    expiresAt: ''
  })
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generateSampleContent = (type: string) => {
    switch (type) {
      case 'ANALYTICS':
        return {
          analytics: {
            metrics: {
              totalUsers: 0,
              activeUsers: 0,
              sessionDuration: 0,
              pageViews: 0,
              bounceRate: 0,
              conversionRate: 0
            },
            trends: [],
            topPages: [],
            userSegments: []
          }
        }
      case 'FINANCIAL':
        return {
          financial: {
            revenue: 0,
            expenses: 0,
            profit: 0,
            transactions: [],
            paymentMethods: [],
            monthlyBreakdown: []
          }
        }
      case 'ACADEMIC':
        return {
          academic: {
            totalStudents: 0,
            totalTeachers: 0,
            averageGrade: 0,
            passRate: 0,
            topPerformers: [],
            subjects: []
          }
        }
      case 'USER_ACTIVITY':
        return {
          userActivity: {
            logins: [],
            actions: [],
            activeHours: [],
            roleDistribution: []
          }
        }
      case 'SYSTEM_HEALTH':
        return {
          systemHealth: {
            uptime: 0,
            responseTime: 0,
            errorRate: 0,
            apiCalls: 0,
            databaseSize: 0,
            alerts: []
          }
        }
      default:
        return {
          custom: {
            sections: [],
            data: {}
          }
        }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.type) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          content: generateSampleContent(formData.type)
        }),
      })

      if (response.ok) {
        const reportData = await response.json()
        onReportCreated(reportData)
        setFormData({
          title: '',
          description: '',
          type: 'ANALYTICS',
          isPublic: false,
          scheduledAt: '',
          expiresAt: ''
        })
        onClose()
        toast({
          variant: "default",
          title: "Success",
          description: "Report created successfully",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to create report",
        })
      }
    } catch (error) {
      console.error('Error creating report:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create report",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-white via-blue-50 to-purple-50">
        <DialogHeader>
          <DialogTitle className="edugenius-text-gradient-blue flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Create New Report
          </DialogTitle>
          <DialogDescription>
            Create a new report. The system will generate a template structure that you can edit later.
          </DialogDescription>
        </DialogHeader>

        <form id="create-report-form" onSubmit={handleSubmit} className="contents">
          <DialogBody className="space-y-6 mt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Report Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="edugenius-glass"
                  placeholder="e.g., Monthly Analytics Report"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Report Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className="edugenius-glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANALYTICS">📊 Analytics Report</SelectItem>
                    <SelectItem value="FINANCIAL">💰 Financial Report</SelectItem>
                    <SelectItem value="ACADEMIC">🎓 Academic Report</SelectItem>
                    <SelectItem value="USER_ACTIVITY">👥 User Activity Report</SelectItem>
                    <SelectItem value="SYSTEM_HEALTH">🔧 System Health Report</SelectItem>
                    <SelectItem value="CUSTOM">📋 Custom Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="edugenius-glass"
                rows={3}
                placeholder="Describe what this report contains and its purpose"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Report Content</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    The system will create a template structure based on your selected report type. 
                    After creation, you can edit the report to add your actual data and customize the content.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Schedule For (Optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                  className="edugenius-glass"
                />
                <p className="text-xs text-gray-500">Leave empty for immediate creation</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                  className="edugenius-glass"
                />
                <p className="text-xs text-gray-500">Leave empty for no expiration</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
              />
              <Label htmlFor="isPublic">Make this report publicly accessible</Label>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="edugenius-glass px-5 py-2.5 text-sm font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-report-form"
              disabled={loading}
              className="edugenius-button px-5 py-2.5 text-sm font-medium"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
