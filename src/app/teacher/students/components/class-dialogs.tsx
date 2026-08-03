'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, AlertTriangle, Trash2, Edit } from 'lucide-react'

const SUBJECTS = ['Mathematics','English','Kiswahili','Science','Social Studies','CRE','IRE','Agriculture','Physics','Chemistry','Biology','History','Geography','Business Studies','Computer Studies','Home Science','Art & Design']
const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4']

interface ClassForm {
  name: string
  subject: string
  grade: string
  description: string
}

interface ClassToDelete {
  name: string
  grade: string
  subject: string
  studentCount: number
}

interface EditClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: ClassForm
  onFormChange: (form: ClassForm) => void
  onSave: () => void
  saving: boolean
}

export function EditClassDialog({ open, onOpenChange, form, onFormChange, onSave, saving }: EditClassDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-4 w-4 text-blue-600" />
            Edit Class
          </DialogTitle>
          <DialogDescription>Update the details for this class.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Class Name *</label>
            <Input
              value={form.name}
              onChange={e => onFormChange({ ...form, name: e.target.value })}
              placeholder="e.g. Grade 4B"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Subject *</label>
              <select
                value={form.subject}
                onChange={e => onFormChange({ ...form, subject: e.target.value })}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select subject</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Grade *</label>
              <select
                value={form.grade}
                onChange={e => onFormChange({ ...form, grade: e.target.value })}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select grade</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
            <Textarea
              value={form.description}
              onChange={e => onFormChange({ ...form, description: e.target.value })}
              placeholder="Optional description..."
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={saving || !form.name.trim()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
            >
              {saving
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving&hellip;</>
                : <><Save className="h-4 w-4 mr-2" />Save Changes</>
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classToDelete: ClassToDelete | null
  onConfirm: () => void
  deleting: boolean
}

export function DeleteClassDialog({ open, onOpenChange, classToDelete, onConfirm, deleting }: DeleteClassDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Delete Class
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {classToDelete && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="font-semibold text-red-900 mb-1">{classToDelete.name}</p>
              <p className="text-sm text-red-700">
                {classToDelete.grade} &middot; {classToDelete.subject} &middot; {classToDelete.studentCount} student{classToDelete.studentCount !== 1 ? 's' : ''}
              </p>
            </div>
          )}
          <p className="text-sm text-slate-600">
            Deleting this class will <strong>unassign all students</strong> from it. The students themselves will not be deleted. You can re-create this class and re-enrol them afterwards.
          </p>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={deleting}
              variant="destructive"
              className="flex-1"
            >
              {deleting
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting&hellip;</>
                : <><Trash2 className="h-4 w-4 mr-2" />Delete Class</>
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
