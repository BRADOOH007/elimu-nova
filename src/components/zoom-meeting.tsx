'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, AlertCircle, Video, VideoOff } from 'lucide-react'
import { getZoomClientModule } from '@/lib/zoom-loader'

interface ZoomMeetingProps {
  meetingNumber: string
  passWord?: string
  userName: string
  userEmail?: string
  role: number
  sdkKey: string
  signature: string
  onLeave?: () => void
}

type ConnectionStatus = 'idle' | 'loading' | 'joining' | 'joined' | 'error' | 'left'

export default function ZoomMeeting({
  meetingNumber,
  passWord,
  userName,
  userEmail,
  role,
  sdkKey,
  signature,
  onLeave,
}: ZoomMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<any>(null)
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current || !meetingNumber || !signature || !sdkKey) return

    let cancelled = false

    const joinMeeting = async () => {
      setStatus('loading')
      try {
        const clientModule = await getZoomClientModule()
        const client = clientModule.createClient()
        clientRef.current = client

        if (cancelled) return
        setStatus('joining')

        await client.init({
          zoomAppRoot: containerRef.current!,
          language: 'en-US',
        })

        if (cancelled) return

        await client.join({
          sdkKey,
          signature,
          meetingNumber: String(meetingNumber),
          password: passWord || '',
          userName,
          userEmail: userEmail || '',
        })

        if (cancelled) return
        setStatus('joined')
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setStatus('error')
          setError(err instanceof Error ? err.message : 'Failed to join Zoom meeting')
        }
      }
    }

    joinMeeting()

    return () => {
      cancelled = true
      if (clientRef.current) {
        try {
          clientRef.current.leaveMeeting()
        } catch (e) { console.warn('[Zoom] Leave meeting (cleanup):', e) }
        clientRef.current = null
      }
    }
  }, [meetingNumber, signature, sdkKey, passWord, userName, userEmail])

  const handleLeave = () => {
    if (clientRef.current) {
      try {
        clientRef.current.leaveMeeting()
      } catch (e) { console.warn('[Zoom] Leave meeting (handleLeave):', e) }
      clientRef.current = null
    }
    setStatus('left')
    onLeave?.()
  }

  if (status === 'error') {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to join meeting</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <Button onClick={handleLeave} variant="outline" className="text-white border-gray-600">
            <VideoOff className="w-4 h-4 mr-2" /> Close
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (status === 'loading' || status === 'joining') {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white font-medium">
            {status === 'loading' ? 'Initializing Zoom...' : 'Joining meeting...'}
          </p>
          <p className="text-gray-400 text-sm mt-1">Meeting: {meetingNumber}</p>
        </CardContent>
      </Card>
    )
  }

  if (status === 'left') {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-12 text-center">
          <VideoOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-white font-medium">You left the meeting</p>
          <Button onClick={() => setStatus('idle')} className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600">
            <Video className="w-4 h-4 mr-2" /> Rejoin
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full rounded-lg overflow-hidden" style={{ minHeight: '400px' }} />
      {status === 'joined' && (
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLeave}
            className="bg-red-600 hover:bg-red-700 shadow-lg"
          >
            <VideoOff className="w-4 h-4 mr-2" /> Leave Meeting
          </Button>
        </div>
      )}
    </div>
  )
}
