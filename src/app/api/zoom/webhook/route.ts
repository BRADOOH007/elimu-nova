import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyZoomWebhook, parseZoomWebhookEvent } from '@/lib/zoom-webhook'
import { route } from '@/lib/api-middleware'
import { logger } from '@/lib/logger'

export const POST = route({ auth: 'none' }, async (req) => {
  const body = await req.text()
  const signatureHeader = req.headers.get('x-zm-signature') || req.headers.get('x-zm-tracking') || ''

  const event = parseZoomWebhookEvent(body)
  if (!event) {
    logger.warn('Failed to parse webhook body')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.event === 'endpoint.url_validation') {
    const parsed = JSON.parse(body) as { event: string; payload: { plainToken?: string } }
    const plainToken = parsed.payload?.plainToken
    if (plainToken) {
      const crypto = await import('crypto')
      const encryptedToken = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET || '')
        .update(plainToken)
        .digest('hex')
      logger.info('Webhook URL validation challenge', { plainToken })
      return NextResponse.json({ plainToken, encryptedToken })
    }
    return NextResponse.json({ error: 'Missing plainToken' }, { status: 400 })
  }

  if (process.env.ZOOM_WEBHOOK_SECRET) {
    const verified = await verifyZoomWebhook(body, signatureHeader)
    if (!verified) {
      logger.warn('Webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const { event: eventType, payload } = event
  const meetingId = String(payload.object.id)
  const meetingUuid = payload.object.uuid

  logger.info(`Webhook event: ${eventType}`, { meetingId, uuid: meetingUuid })

  const dbMeeting = await prisma.meeting.findFirst({ where: { zoomMeetingId: meetingId } })
  if (!dbMeeting) {
    logger.warn('No matching meeting found in DB', { meetingId })
    return NextResponse.json({ received: true })
  }

  switch (eventType) {
    case 'meeting.started':
      await prisma.meeting.update({
        where: { id: dbMeeting.id },
        data: { status: 'IN_PROGRESS', zoomProvider: 'auto' },
      })
      logger.info('Meeting marked IN_PROGRESS', { dbId: dbMeeting.id })
      break

    case 'meeting.ended':
      await prisma.meeting.update({
        where: { id: dbMeeting.id },
        data: { status: 'COMPLETED' },
      })
      logger.info('Meeting marked COMPLETED', { dbId: dbMeeting.id })
      break

    case 'recording.completed':
      const recordingFiles = payload.object.recording_files || []
      if (recordingFiles.length > 0) {
        await prisma.meeting.update({
          where: { id: dbMeeting.id },
          data: {
            zoomMeetingRecording: JSON.stringify(recordingFiles.map(f => ({
              id: f.id,
              fileType: f.file_type,
              downloadUrl: f.download_url,
              fileSize: f.file_size,
              recordingStart: f.recording_start,
              recordingEnd: f.recording_end,
            }))),
          },
        })
        logger.info('Recording files stored', { dbId: dbMeeting.id, count: recordingFiles.length })
      }
      break

    case 'meeting.participant_joined':
    case 'meeting.participant_left':
      logger.info('Participant event', { eventType, meetingId, participant: payload.object.participant?.user_name })
      break
  }

  return NextResponse.json({ received: true })
})

export const GET = route({ auth: 'none' }, async (req) => {
  const { searchParams } = new URL(req.url)
  const challenge = searchParams.get('challenge')
  if (challenge) {
    logger.info('Webhook validation challenge via GET', { challenge })
    return NextResponse.json({ challenge })
  }
  return NextResponse.json({ status: 'ok' })
})
