export function formatTeacherName(name?: string | null): string {
  if (!name) return 'Tr. / Mwalimu'
  const cleaned = name.replace(/^(Tr\.|Teacher|Mwalimu)\s+/i, '').trim()
  if (!cleaned) return 'Tr. / Mwalimu'
  return `Tr. ${cleaned}`
}

export function formatTime(iso?: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function formatDate(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export function sanitizeText(text?: string | null): string {
  if (!text) return ''
  return text
    .replace(/ÃƒÆ'Ã†â€™Ãƒâ€šÃ‚Â¢/g, '')
    .replace(/ÃƒÆ'Ã¢â‚¬Â¡/g, '')
    .replace(/ÃƒÆ'Ã†â€™/g, "'")
    .replace(/Ãƒâ€šÃ‚Â/g, '')
    .replace(/Ã¢â‚¬â€/g, '-')
    .replace(/Ã¢â‚¬Â/g, '"')
    .replace(/Ã‚Â·/g, '·')
    .replace(/Â/g, '')
    .trim()
}

export function formatCurrency(amount: number, currency?: string): string {
  const c = (currency || 'USD').toUpperCase()
  const locale = c === 'KES' ? 'en-KE' : 'en-US'
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: c }).format(amount)
  } catch {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }
}
