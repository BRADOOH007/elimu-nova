import { toast } from 'sonner'

export function confirmToast({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}: {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: string
}): Promise<boolean> {
  return new Promise((resolve) => {
    const id = toast(
      <div className="flex flex-col gap-1.5 py-1">
        <p className="font-semibold text-sm text-gray-900">{title}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
          <button
            className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            onClick={() => { toast.dismiss(id); resolve(true) }}
          >
            {confirmLabel}
          </button>
          <button
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            onClick={() => { toast.dismiss(id); resolve(false) }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>,
      { duration: 999999999, position: 'top-center' }
    )
  })
}
