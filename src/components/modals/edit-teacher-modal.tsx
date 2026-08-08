"use client"

import { useState, useEffect } from 'react'
import {
  AdminModal,
  AdminModalFooter,
  AdminFormField,
  adminInputClass,
} from "@/components/ui/admin-modal"
import { Loader2, User, Mail, Phone, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Teacher {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  status: string
}

interface EditTeacherModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  teacher: Teacher | null
}

export function EditTeacherModal({ isOpen, onClose, onSuccess, teacher }: EditTeacherModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    isActive: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    if (teacher) {
      const nameParts = teacher.name.split(' ')
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: teacher.email,
        phone: teacher.phone || '',
        address: teacher.address || '',
        isActive: teacher.status === 'Active'
      })
    }
  }, [teacher])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/school-admin/teachers/${teacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        toast({ title: "Success", description: "Teacher updated successfully" })
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update teacher')
      }
    } catch (error) {
      console.error('Error updating teacher:', error)
      setError('Failed to update teacher')
    } finally { setLoading(false) }
  }

  const handleClose = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', isActive: true })
    setError('')
    onClose()
  }

  if (!teacher) return null

  return (
    <AdminModal
      open={isOpen} onClose={handleClose}
      title="Edit Teacher"
      subtitle="Update teacher information and settings"
      icon={<User />}
      size="md"
      footer={<AdminModalFooter onCancel={handleClose} submitLabel="Update Teacher" loading={loading} type="submit" />}
    >
      <form id="edit-teacher-form" onSubmit={handleSubmit} className="space-y-5">

        <div className="grid grid-cols-2 gap-4">
          <AdminFormField label="First Name" htmlFor="et-first">
            <input id="et-first" name="firstName" type="text" autoComplete="off"
              value={formData.firstName} onChange={handleInputChange}
              placeholder="Enter first name" className={adminInputClass} required />
          </AdminFormField>
          <AdminFormField label="Last Name" htmlFor="et-last">
            <input id="et-last" name="lastName" type="text" autoComplete="off"
              value={formData.lastName} onChange={handleInputChange}
              placeholder="Enter last name" className={adminInputClass} required />
          </AdminFormField>
        </div>

        <AdminFormField label="Email Address" htmlFor="et-email">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input id="et-email" name="email" type="email" autoComplete="off"
              value={formData.email} onChange={handleInputChange}
              placeholder="Enter email address" className={`${adminInputClass} pl-9`} required />
          </div>
        </AdminFormField>

        <AdminFormField label="Phone Number" htmlFor="et-phone">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input id="et-phone" name="phone" type="tel" autoComplete="off"
              value={formData.phone} onChange={handleInputChange}
              placeholder="Enter phone number" className={`${adminInputClass} pl-9`} />
          </div>
        </AdminFormField>

        <AdminFormField label="Address" htmlFor="et-addr">
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <textarea id="et-addr" name="address" autoComplete="off"
              value={formData.address} onChange={handleInputChange}
              placeholder="Enter address" rows={3}
              className={`${adminInputClass} pl-9 resize-none`} />
          </div>
        </AdminFormField>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="isActive" checked={formData.isActive}
            onChange={handleInputChange}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
          <span className="text-sm text-slate-700">Active Status</span>
        </label>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
        )}
      </form>
    </AdminModal>
  )
}
