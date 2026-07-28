'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Loader2, Share2 } from 'lucide-react'

interface SavedPresentation {
  id: string
  title: string
  subject: string
  grade: string
  topic: string
  slideCount: number
  duration: number
  difficulty: string
  isShared: boolean
  createdAt: string
  updatedAt: string
}

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  presentationToShare: SavedPresentation | null
  students: any[]
  classes: any[]
  selectedStudents: string[]
  selectedClass: string
  isSharing: boolean
  onSelectedStudentsChange: (ids: string[]) => void
  onSelectedClassChange: (id: string) => void
  onShare: () => void
}

export function ShareModal({
  open, onOpenChange, presentationToShare, students, classes,
  selectedStudents, selectedClass, isSharing,
  onSelectedStudentsChange, onSelectedClassChange, onShare,
}: ShareModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Presentation</DialogTitle>
          <DialogDescription>
            Share &ldquo;{presentationToShare?.title}&rdquo; with your students
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Share with Class</Label>
            <Select value={selectedClass} onValueChange={onSelectedClassChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No class selected</SelectItem>
                {classes.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Or Share with Individual Students</Label>
            <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
              {students.length === 0 ? (
                <p className="text-sm text-gray-500">No students found</p>
              ) : (
                students.map((student: any) => (
                  <div key={student.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={student.id}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onSelectedStudentsChange([...selectedStudents, student.id])
                        } else {
                          onSelectedStudentsChange(selectedStudents.filter((id: string) => id !== student.id))
                        }
                      }}
                    />
                    <Label htmlFor={student.id} className="text-sm">
                      {student.user?.firstName} {student.user?.lastName}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
              disabled={isSharing}
            >
              Cancel
            </Button>
            <Button
              onClick={onShare}
              disabled={isSharing || (!selectedClass || selectedClass === 'none') && selectedStudents.length === 0}
              className="flex-1"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
