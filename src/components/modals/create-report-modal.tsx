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
            trends: {
              userGrowth: { direction: 'stable', percentage: 0 },
              engagement: { direction: 'stable', percentage: 0 }
            }
          }
        }
      case 'FINANCIAL':
        return {
          financial: {
            revenue: { total: 0, recurring: 0, oneTime: 0 },
            expenses: { total: 0, operational: 0, marketing: 0 },
            breakdown: {}
          }
        }
      case 'ACADEMIC':
        return {
          academic: {
            students: { total: 0, active: 0, graduated: 0 },
            performance: { average: 0, median: 0, improvement: 0 },
            attendance: { rate: 0, trend: 'stable' },
            subjects: {}
          }
        }
      case 'USER_ACTIVITY':
        return {
          userActivity: {
            activeUsers: { total: 0, daily: 0, weekly: 0 },
            sessions: { total: 0, averageDuration: 0 },
            activities: []
          }
        }
      case 'SYSTEM_HEALTH':
        return {
          systemHealth: {
            uptime: { percentage: 0 },
            performance: { responseTime: 0, throughput: 0 },
            errors: { rate: 0, critical: 0 },
            services: {}
          }
        }
      default:
        return {
          summary: 'Report generated successfully',
          timestamp: new Date().toISOString(),
          data: {}
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
      // Generate appropriate content structure based on report type
      const content = generateSampleContent(formData.type)
      
      // Generate basic filters
      const filters = {
        dateRange: 'Last 30 days',
        generatedAt: new Date().toISOString()
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          content: JSON.stringify(content),
          filters: JSON.stringify(filters),
          scheduledAt: formData.scheduledAt || null,
          expiresAt: formData.expiresAt || null
        }),
      })

      if (response.ok) {
        const newReport = await response.json()
        onReportCreated(newReport)
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
          title: "Success",
          description: "Report created successfully. You can now edit it to add your data.",
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50">
        <DialogHeader>
          <DialogTitle className="edugenius-text-gradient-blue flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Create New Report
          </DialogTitle>
          <DialogDescription>
            Create a new report. The system will generate a template structure that you can edit later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="edugenius-glass"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="edugenius-button"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Report
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}