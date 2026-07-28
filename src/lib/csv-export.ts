import { NextResponse } from 'next/server'

function escapeCsvValue(value: unknown): string {
  const str = value == null ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function toCsv(
  rows: Record<string, unknown>[],
  columns: { key: string; label: string }[]
): string {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(',')
  const body = rows
    .map((row) => columns.map((c) => escapeCsvValue(row[c.key])).join(','))
    .join('\r\n')
  return `${header}\r\n${body}\r\n`
}

export function csvResponse(csv: string, filename: string): NextResponse {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
