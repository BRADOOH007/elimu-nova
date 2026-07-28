"use client"

import { toast as sonnerToast } from 'sonner'
import type { ToastActionElement } from "@/components/ui/toast"

type Toast = {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
  icon?: React.ReactNode
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

function toast(props: Toast) {
  const { title, description, variant, duration, icon, position, action } = props
  
  const opts: any = {}
  if (description) opts.description = description
  if (duration) opts.duration = duration
  if (icon) opts.icon = icon
  if (position) opts.position = position
  
  if (variant === 'destructive') {
    return sonnerToast.error(title as string, opts)
  }
  if (variant === 'success') {
    return sonnerToast.success(title as string, opts)
  }
  if (action) {
    opts.action = action
  }
  return sonnerToast(title as string, opts)
}

function useToast() {
  return {
    toasts: [],
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) sonnerToast.dismiss(toastId)
      else sonnerToast.dismiss()
    },
  }
}

export { useToast, toast }
