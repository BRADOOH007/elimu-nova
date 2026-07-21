'use client'

import { useState, useEffect } from 'react'

export function ClientDate({ date, className }: { date: string | Date; className?: string }) {
  const [text, setText] = useState('')
  useEffect(() => { setText(new Date(date).toLocaleDateString()) }, [date])
  return <span className={className}>{text}</span>
}

export function ClientDateTime({ date, className }: { date: string | Date; className?: string }) {
  const [text, setText] = useState('')
  useEffect(() => { setText(new Date(date).toLocaleString()) }, [date])
  return <span className={className}>{text}</span>
}

export function ClientTime({ date, className }: { date: Date; className?: string }) {
  const [text, setText] = useState('')
  useEffect(() => { setText(date.toLocaleTimeString()) }, [date])
  return <span className={className}>{text}</span>
}

export function ClientRelativeTime({ date }: { date: string | Date }) {
  const [text, setText] = useState('')
  useEffect(() => {
    const d = new Date(date)
    const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60))
    if (diff < 1) setText('Just now')
    else if (diff < 24) setText(`${diff}h ago`)
    else setText(d.toLocaleDateString())
  }, [date])
  return <>{text}</>
}
