"use client"

import { useEffect, useState, useRef } from "react"

interface AnimatedCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  formatter?: (value: number) => string
}

export function AnimatedCounter({
  value,
  duration = 800,
  prefix = "",
  suffix = "",
  decimals = 0,
  formatter,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const startTime = useRef<number | null>(null)
  const frameId = useRef<number | null>(null)

  useEffect(() => {
    if (value === displayValue && displayValue !== 0) return

    startTime.current = null

    const animate = (timestamp: number) => {
      if (startTime.current === null) startTime.current = timestamp
      const elapsed = timestamp - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplayValue(Math.round(value * eased * 10 ** decimals) / 10 ** decimals)

      if (progress < 1) {
        frameId.current = requestAnimationFrame(animate)
      }
    }

    frameId.current = requestAnimationFrame(animate)
    return () => {
      if (frameId.current) cancelAnimationFrame(frameId.current)
    }
  }, [value, duration, decimals])

  const formatted = formatter
    ? formatter(displayValue)
    : displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })

  return (
    <span>
      {prefix}{formatted}{suffix}
    </span>
  )
}
