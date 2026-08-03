'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GitBranch, Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface SkillNode {
  id: string
  name: string
  subject: string
  masteryScore: number
  masteryLevel: string
  x: number
  y: number
  prerequisites: string[]
}

interface KnowledgeMapProps {
  subject?: string
  onSelectSkill?: (skill: string) => void
}

const LEVEL_COLORS: Record<string, string> = {
  NOT_STARTED: '#d1d5db',
  BEGINNER: '#3b82f6',
  DEVELOPING: '#f59e0b',
  PROFICIENT: '#22c55e',
  MASTERED: '#a855f7',
}

export function KnowledgeMap({ subject = 'Mathematics', onSelectSkill }: KnowledgeMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<SkillNode[]>([])
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [hoveredNode, setHoveredNode] = useState<SkillNode | null>(null)

  useEffect(() => {
    fetchSkills()
  }, [subject])

  useEffect(() => {
    if (nodes.length > 0) drawMap()
  }, [nodes, zoom, hoveredNode])

  const fetchSkills = async () => {
    setLoading(true)
    try {
      // Fetch mastery data and prerequisites
      const [masteryRes, prereqRes] = await Promise.all([
        fetch(`/api/student/mastery?subject=${encodeURIComponent(subject)}`),
        fetch(`/api/student/prerequisites?subject=${encodeURIComponent(subject)}`).catch(() => null),
      ])

      let masteries: any[] = []
      if (masteryRes.ok) {
        const d = await masteryRes.json()
        masteries = d.masteries || []
      }

      let prereqs: any[] = []
      if (prereqRes?.ok) {
        const d = await prereqRes.json()
        prereqs = d.prerequisites || []
      }

      // Build nodes with positions
      const skillNodes: SkillNode[] = masteries.map((m: any, i: number) => {
        const angle = (i / masteries.length) * Math.PI * 2
        const radius = 150
        return {
          id: m.id,
          name: m.unitName,
          subject: m.subject,
          masteryScore: m.masteryScore,
          masteryLevel: m.masteryLevel,
          x: 300 + Math.cos(angle) * radius,
          y: 250 + Math.sin(angle) * radius,
          prerequisites: prereqs
            .filter((p: any) => p.skillName === m.unitName)
            .map((p: any) => p.prerequisiteName),
        }
      })

      // If no mastery data, create placeholder nodes from common topics
      if (skillNodes.length === 0) {
        const topics = getTopicsForSubject(subject)
        skillNodes.push(...topics.map((t, i) => {
          const angle = (i / topics.length) * Math.PI * 2
          const radius = 150
          return {
            id: `topic-${i}`,
            name: t,
            subject,
            masteryScore: 0,
            masteryLevel: 'NOT_STARTED',
            x: 300 + Math.cos(angle) * radius,
            y: 250 + Math.sin(angle) * radius,
            prerequisites: i > 0 ? [topics[i - 1]] : [],
          }
        }))
      }

      setNodes(skillNodes)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const drawMap = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.scale(zoom, zoom)

    // Draw prerequisite connections
    for (const node of nodes) {
      for (const prereqName of node.prerequisites) {
        const prereqNode = nodes.find(n => n.name === prereqName)
        if (prereqNode) {
          ctx.beginPath()
          ctx.moveTo(prereqNode.x, prereqNode.y)
          ctx.lineTo(node.x, node.y)
          ctx.strokeStyle = '#e2e8f0'
          ctx.lineWidth = 2
          ctx.stroke()

          // Arrow
          const angle = Math.atan2(node.y - prereqNode.y, node.x - prereqNode.x)
          const midX = (prereqNode.x + node.x) / 2
          const midY = (prereqNode.y + node.y) / 2
          ctx.beginPath()
          ctx.moveTo(midX + 6 * Math.cos(angle), midY + 6 * Math.sin(angle))
          ctx.lineTo(midX - 4 * Math.cos(angle - Math.PI / 4), midY - 4 * Math.sin(angle - Math.PI / 4))
          ctx.lineTo(midX - 4 * Math.cos(angle + Math.PI / 4), midY - 4 * Math.sin(angle + Math.PI / 4))
          ctx.closePath()
          ctx.fillStyle = '#94a3b8'
          ctx.fill()
        }
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const isHovered = hoveredNode?.id === node.id
      const radius = isHovered ? 28 : 22
      const color = LEVEL_COLORS[node.masteryLevel] || LEVEL_COLORS.NOT_STARTED

      // Glow effect
      if (isHovered) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius + 6, 0, Math.PI * 2)
        ctx.fillStyle = color + '30'
        ctx.fill()
      }

      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = isHovered ? '#1e293b' : '#fff'
      ctx.lineWidth = isHovered ? 3 : 2
      ctx.stroke()

      // Score text
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${isHovered ? 12 : 10}px system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${node.masteryScore}%`, node.x, node.y)

      // Name label
      ctx.fillStyle = '#475569'
      ctx.font = `${isHovered ? 'bold ' : ''}11px system-ui`
      ctx.fillText(node.name.length > 18 ? node.name.slice(0, 16) + '…' : node.name, node.x, node.y + radius + 14)
    }

    ctx.restore()
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    for (const node of nodes) {
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      if (dist < 25) {
        onSelectSkill?.(node.name)
        return
      }
    }
  }

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    for (const node of nodes) {
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      if (dist < 25) {
        setHoveredNode(node)
        canvas.style.cursor = 'pointer'
        return
      }
    }
    setHoveredNode(null)
    canvas.style.cursor = 'default'
  }

  function getTopicsForSubject(subj: string): string[] {
    const map: Record<string, string[]> = {
      Mathematics: ['Whole Numbers', 'Fractions', 'Decimals', 'Measurement', 'Geometry', 'Algebra', 'Data Handling'],
      English: ['Grammar', 'Reading', 'Writing', 'Vocabulary', 'Comprehension'],
      Science: ['Living Things', 'Energy', 'Forces', 'Materials', 'Earth Science'],
      'Social Studies': ['Our Country', 'Resources', 'Government', 'Citizenship'],
    }
    return map[subj] || ['Topic 1', 'Topic 2', 'Topic 3', 'Topic 4']
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitBranch className="h-5 w-5" /> Knowledge Map
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => setZoom(z => Math.min(2, z + 0.2))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => setZoom(z => Math.max(0.4, z - 0.2))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => { setZoom(1); fetchSkills() }}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              width={600}
              height={500}
              className="w-full border border-gray-100 rounded-xl bg-gradient-to-br from-slate-50 to-white"
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMove}
              onMouseLeave={() => setHoveredNode(null)}
            />
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
              {Object.entries(LEVEL_COLORS).map(([level, color]) => (
                <div key={level} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-gray-500 capitalize">{level.replace('_', ' ').toLowerCase()}</span>
                </div>
              ))}
            </div>
            {hoveredNode && (
              <div className="mt-2 p-2 bg-slate-50 rounded-lg text-center">
                <p className="text-sm font-semibold text-slate-800">{hoveredNode.name}</p>
                <p className="text-xs text-gray-500">{hoveredNode.masteryScore}% mastery · {hoveredNode.prerequisites.length} prerequisites</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
