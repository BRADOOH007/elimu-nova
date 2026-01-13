"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Loader2 } from "lucide-react"

export interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  itemName: string
  isLoading?: boolean
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false
}: DeleteConfirmationDialogProps) {
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Delete operation failed:', error)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-white via-red-50 to-red-100 [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-red-800">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-700 mt-4">
            {description}
          </DialogDescription>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">
              You are about to permanently delete:
            </p>
            <p className="text-sm text-red-900 font-semibold mt-1">
              "{itemName}"
            </p>
            <p className="text-xs text-red-700 mt-2">
              This action cannot be undone.
            </p>
          </div>
        </DialogHeader>
        
        <DialogFooter className="flex flex-row justify-end space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={confirming || isLoading}
            className="min-w-[80px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={confirming || isLoading}
            className="min-w-[80px] bg-red-600 hover:bg-red-700 text-white"
          >
            {confirming || isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </div>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easier usage
export function useDeleteConfirmation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState<{
    onConfirm: () => void | Promise<void>
    title: string
    description: string
    itemName: string
  }>({
    onConfirm: () => {},
    title: '',
    description: '',
    itemName: ''
  })

  const showDeleteConfirmation = (
    title: string,
    description: string,
    itemName: string,
    onConfirm: () => void | Promise<void>
  ) => {
    setConfig({ title, description, itemName, onConfirm })
    setIsOpen(true)
  }

  const hideDeleteConfirmation = () => {
    setIsOpen(false)
    setIsLoading(false)
  }

  const DeleteConfirmationDialogComponent = () => (
    <DeleteConfirmationDialog
      isOpen={isOpen}
      onClose={hideDeleteConfirmation}
      onConfirm={config.onConfirm}
      title={config.title}
      description={config.description}
      itemName={config.itemName}
      isLoading={isLoading}
    />
  )

  return {
    showDeleteConfirmation,
    hideDeleteConfirmation,
    DeleteConfirmationDialog: DeleteConfirmationDialogComponent,
    isLoading
  }
}