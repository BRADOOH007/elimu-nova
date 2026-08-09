"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

/* ──── ADMIN-MODAL — Unified Premium Wrapper for all Admin Modals ────
   Enforces: backdrop-blur overlay, rounded-2xl shadow border box, 
   structured header (icon + title + subtitle + X close), 
   padded body with overflow, sticky footer with cancel + action.

   size: 'sm' | 'md' | 'lg' | 'xl' | '2xl'   (default: 'lg')
*/

interface AdminModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

const sizeMap: Record<string, string> = {
  sm:  'max-w-sm',
  md:  'max-w-md',
  lg:  'max-w-lg',
  xl:  'max-w-xl',
  '2xl': 'max-w-2xl',
}

export function AdminModal({
  open, onClose, title, subtitle, icon, children, footer,
  size = 'lg', className,
}: AdminModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn("max-w-lg w-full max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl", sizeMap[size], className)}
      >
        {/* ── HEADER ── */}
        <div className="relative p-6 pb-4 border-b border-slate-100 bg-white shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
            <span className="sr-only">Close</span>
          </button>

          <div className="flex items-start gap-4">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                {React.cloneElement(icon as React.ReactElement<any>, {
                  className: cn("w-5 h-5 text-white", (icon as React.ReactElement<any>).props?.className),
                })}
              </div>
            )}
            <div className="min-w-0 pr-8">
              <DialogTitle className="text-xl font-semibold text-slate-900">{title}</DialogTitle>
              {subtitle && (
                <DialogDescription className="text-sm text-slate-500 mt-1">{subtitle}</DialogDescription>
              )}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {children}
        </div>

        {/* ── FOOTER ── */}
        {footer && (
          <div className="p-4 sm:px-6 border-t border-slate-100 bg-slate-50/80 flex justify-end items-center gap-3 shrink-0 rounded-b-2xl">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ──── ADMIN FORM FIELD ──── */
interface AdminFormFieldProps {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

export function AdminFormField({ label, htmlFor, required, error, children }: AdminFormFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

export const adminInputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"

/* ──── ADMIN MODAL FOOTER ──── */
interface AdminModalFooterProps {
  onCancel: () => void
  onSubmit?: () => void
  submitLabel?: string
  loading?: boolean
  disabled?: boolean
  type?: "button" | "submit"
}

export function AdminModalFooter({
  onCancel, onSubmit, submitLabel = "Save", loading = false, disabled = false, type = "button",
}: AdminModalFooterProps) {
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type={type}
        onClick={onSubmit}
        disabled={disabled || loading}
        className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition disabled:opacity-50 inline-flex items-center gap-2"
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {submitLabel}
      </button>
    </>
  )
}
