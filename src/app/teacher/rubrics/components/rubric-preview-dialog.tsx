'use client'

import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Rubric {
  id: string
  title: string
  content: string
  subject: string
  grade: string
  topic: string
  metadata: any
  createdAt: string
  updatedAt: string
}

interface RubricPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rubric: Rubric | null
}

export function RubricPreviewDialog({ open, onOpenChange, rubric }: RubricPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Rubric Preview</DialogTitle>
          <DialogDescription>
            Preview your rubric before editing or exporting
          </DialogDescription>
        </DialogHeader>

        {rubric && (
          <DialogBody className="space-y-6 mt-1">
            {(() => {
              const rubricData = typeof rubric.content === 'string'
                ? JSON.parse(rubric.content)
                : rubric.content

              return (
                <>
                  <div className="text-center border-b border-gray-200 pb-4">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{rubricData.title}</h2>
                    <p className="text-gray-600">{rubricData.subject} • {rubricData.grade}</p>
                    {rubricData.description && (
                      <p className="text-gray-700 mt-2">{rubricData.description}</p>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border-0">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border-0 px-4 py-2 text-left font-semibold">Criteria</th>
                          {rubricData.performanceLevels?.map((level: any) => (
                            <th key={level.id} className="border-0 px-4 py-2 text-center font-semibold">
                              {level.name}
                              <br />
                              <span className="text-sm text-gray-600">({level.score} pts)</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rubricData.criteria?.map((criterion: any) => (
                          <tr key={criterion.id}>
                            <td className="border-0 px-4 py-2">
                              <div className="font-semibold">{criterion.title}</div>
                              <div className="text-sm text-gray-600 mt-1">{criterion.description}</div>
                              <div className="text-xs text-gray-500 mt-1">Weight: {criterion.weight}</div>
                            </td>
                            {rubricData.performanceLevels?.map((level: any) => (
                              <td key={level.id} className="border-0 px-4 py-2 text-center">
                                <div className="text-sm text-gray-700">{level.description}</div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-right text-lg font-semibold">
                    Total Points: {rubricData.totalPoints || 100}
                  </div>
                </>
              )
            })()}
          </DialogBody>
        )}
      </DialogContent>
    </Dialog>
  )
}
