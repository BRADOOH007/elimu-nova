import { NextRequest, NextResponse } from 'next/server'

// Stub PDF download — returns a placeholder message
// Replace with actual PDF generation (e.g., pdf-lib, puppeteer)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // In production, generate a real PDF here
  return NextResponse.json({ error: 'PDF generation not implemented yet', invoiceId: id }, { status: 501 })
}
