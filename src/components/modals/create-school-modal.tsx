"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog"
import { 
  X, 
  Save, 
  School,
  Loader2
} from "lucide-react"

interface CreateSchoolModalProps {
  isOpen: boolean
  onClose: () => void
  onSchoolCreated?: (schoolData: any) => void
}

export function CreateSchoolModal({ isOpen, onClose, onSchoolCreated }: CreateSchoolModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name || !formData.address) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields (Name and Address)",
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        const newSchool = await response.json()
        toast({
          variant: "default",
          title: "School Created",
          description: "New school has been created successfully!",
        })
        
        // Reset form
        setFormData({
          name: '',
          address: '',
          phone: '',
          email: '',
          website: ''
        })
        
        if (onSchoolCreated) {
          onSchoolCreated(newSchool)
        }
        
        onClose()
      } else {
        const errorData = await response.json()
        toast({
          variant: "destructive",
          title: "Creation Failed",
          description: errorData.error || 'Failed to create school',
        })
      }
    } catch (error) {
      console.error('Error creating school:', error)
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "Failed to create school. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        website: ''
      })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl [&>button]:hidden">
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <School className="w-6 h-6 text-blue-600" />
              <DialogTitle className="text-xl font-semibold text-gray-900">Add New School</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={loading}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <DialogDescription className="sr-only">Create a new school</DialogDescription>
        </DialogHeader>

        <form id="create-school-form" onSubmit={handleSubmit} className="contents">
          <DialogBody className="space-y-6 mt-1">
            {/* School Information */}
            <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <School className="w-5 h-5 text-blue-600" />
                  <span>School Information</span>
                </CardTitle>
                <CardDescription>Basic school details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">School Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Nairobi Primary School"
                    required
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Full school address"
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+254 700 000 000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="info@schoolname.com"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.schoolname.com"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </DialogBody>

          <DialogFooter className="border-t border-gray-200 bg-gray-50">
            <Button variant="outline" onClick={handleClose} disabled={loading} className="px-5 py-2.5 text-sm font-medium">
              Cancel
            </Button>
            <Button 
              type="submit"
              form="create-school-form"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-5 py-2.5 text-sm font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create School
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
