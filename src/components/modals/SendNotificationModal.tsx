'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Checkbox
} from '@/components/ui/checkbox'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Send,
  X,
  Bell,
  Users,
  User,
  Loader2,
  CheckCircle2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SendNotificationModalProps {
  isOpen: boolean
  onClose: () => void
  userRole: string
  schoolId?: string
}

export default function SendNotificationModal({
  isOpen,
  onClose,
  userRole,
  schoolId
}: SendNotificationModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('info')
  const [activeTab, setActiveTab] = useState('roles')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  // Get available roles based on user's role
  const getAvailableRoles = () => {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']
      case 'SCHOOL_ADMIN':
        return ['TEACHER', 'STUDENT', 'PARENT']
      case 'TEACHER':
        return ['STUDENT', 'PARENT']
      default:
        return []
    }
  }

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in all required fields'
      })
      return
    }

    if (activeTab === 'roles' && selectedRoles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No roles selected',
        description: 'Please select at least one role to notify'
      })
      return
    }

    if (activeTab === 'users' && selectedUserIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No users selected',
        description: 'Please select at least one user to notify'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          type,
          target: {
            userIds: activeTab === 'users' ? selectedUserIds : [],
            roles: activeTab === 'roles' ? selectedRoles : [],
            schoolId
          }
        })
      })

      if (response.ok) {
        setSuccess(true)
        toast({
          variant: 'default',
          title: 'Notifications sent!',
          description: 'Notifications were successfully sent to recipients'
        })
        setTimeout(() => {
          setSuccess(false)
          onClose()
          resetForm()
        }, 2000)
      } else {
        throw new Error('Failed to send notifications')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to send',
        description: 'There was an error sending notifications'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setMessage('')
    setType('info')
    setSelectedRoles([])
    setSelectedUserIds([])
    setActiveTab('roles')
  }

  if (!isOpen) return null

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-lg border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50 to-purple-50">
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Notifications Sent!</h3>
            <p className="text-gray-600">Notifications have been successfully delivered</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50 to-purple-50">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Send Notifications
              </DialogTitle>
              <DialogDescription>
                Send targeted notifications to your audience
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto hover:bg-white/50"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Title</label>
                <Input
                  placeholder="Enter notification title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white/70 border-0 shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Type</label>
                <Select
                  value={type}
                  onValueChange={setType}
                >
                  <SelectTrigger className="bg-white/70 border-0 shadow-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Message</label>
              <Textarea
                placeholder="Write your notification message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="bg-white/70 border-0 shadow-sm"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-white/50">
                <TabsTrigger value="roles" className="data-[state=active]:bg-white">
                  <Users className="w-4 h-4 mr-2" />
                  By Role
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-white">
                  <User className="w-4 h-4 mr-2" />
                  By User
                </TabsTrigger>
              </TabsList>

              <TabsContent value="roles" className="mt-4">
                <Card className="border-0 bg-white/50 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Select Roles</CardTitle>
                    <CardDescription>Choose roles to send notifications to</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {getAvailableRoles().map((role) => (
                        <label
                          key={role}
                          className="flex items-center gap-3 p-3 rounded-lg bg-white/80 hover:bg-white cursor-pointer transition-all"
                        >
                          <Checkbox
                            id={role}
                            checked={selectedRoles.includes(role)}
                            onCheckedChange={() => toggleRole(role)}
                          />
                          <label
                            htmlFor={role}
                            className="text-sm font-medium text-gray-700 capitalize"
                          >
                            {role.replace('_', ' ')}
                          </label>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="mt-4">
                <Card className="border-0 bg-white/50 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Select Users</CardTitle>
                    <CardDescription>Choose specific users to send notifications to</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>User selection coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="border-t border-gray-100 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-white border-gray-200 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
