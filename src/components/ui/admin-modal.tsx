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

/* ──── ADMIN-MODAL UNIFIED PREMIUM WRAPPER ────
   All School Admin modals share this container. It enforces:
   · Fixed backdrop with blur
   · Rounded box with shadow + border
   · Structured header (icon, title, subtitle, close X)
   · Proper body padding with overflow
   · Sticky footer with cancel + primary CTA

   Usage (minimal):
   <AdminModal open={isOpen} onClose={onClose} title="Enroll Teacher" subtitle="Add a new teacher to your school." icon={<UserPlus />}>
     <form>...</form>
   </AdminModal>

   Usage (with footer actions):
   <AdminModal {...props} footer={
     <AdminModalFooter onCancel={onClose} onSubmit={handleSubmit} submitLabel="Save" loading={isLoading} />
   }>
     <form>...</form>
   </AdminModal>

   The footer can also be overridden entirely by passing a custom footer element.
   The "max-w" size can be set via the size prop: 'sm' | 'md' | 'lg' | 'xl' | '2xl'.
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
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'lg',
  className,
}: AdminModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-lg w-full max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl p-0",
          sizeMap[size],
          className
        )}
      >
        {/* ── HEADER ── */}
        <div className="relative border-b border-slate-100 p-6 sm:px-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
              <DialogTitle className="text-xl font-semibold text-slate-900">
                {title}
              </DialogTitle>
              {subtitle && (
                <DialogDescription className="text-sm text-slate-500 mt-0.5">
                  {subtitle}
                </DialogDescription>
              )}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="overflow-y-auto p-6 sm:p-8 max-h-[calc(90vh-180px)] space-y-4">
          {children}
        </div>

        {/* ── FOOTER ── */}
        {footer && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8 flex justify-end items-center gap-3 rounded-b-2xl">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ──── ADMIN FORM INPUT ────
   A unified label + input/textarea/select pattern for AdminModal bodies.
   Use AdminFormInput for text/email/tel, AdminFormTextarea for textareas.
*/

interface AdminFormFieldProps {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

export function AdminFormField({ label, htmlFor, required, error, children }: AdminFormFieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
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
  "w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"

/* ──── ADMIN MODAL FOOTER ────
   Renders Cancel + Primary action in the footer area.
*/

interface AdminModalFooterProps {
  onCancel: () => void
  onSubmit?: () => void
  submitLabel?: string
  loading?: boolean
  disabled?: boolean
  /** Pass "submit" if this is inside a <form> and should type="submit" */
  type?: "button" | "submit"
}

export function AdminModalFooter({
  onCancel,
  onSubmit,
  submitLabel = "Save",
  loading = false,
  disabled = false,
  type = "button",
}: AdminModalFooterProps) {
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type={type}
        onClick={onSubmit}
        disabled={disabled || loading}
        className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 px-5 py-2 text-sm font-medium text-white shadow-sm transition disabled:opacity-50 inline-flex items-center gap-2"
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
