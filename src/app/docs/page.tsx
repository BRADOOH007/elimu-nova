'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Code, Server, Database, Cpu, FileText, ExternalLink } from 'lucide-react'

const SECTIONS = [
  { title: 'Getting Started', icon: BookOpen, color: 'from-blue-500 to-blue-600', links: [
    { label: 'API Overview', href: '/api' },
    { label: 'Authentication', href: '/docs#auth' },
  ]},
  { title: 'Core APIs', icon: Server, color: 'from-purple-500 to-purple-600', links: [
    { label: 'AI Generation', href: '/docs#ai' },
    { label: 'Curriculum', href: '/docs#curriculum' },
    { label: 'Messages', href: '/docs#messages' },
    { label: 'Notifications', href: '/docs#notifications' },
  ]},
  { title: 'Data Models', icon: Database, color: 'from-emerald-500 to-emerald-600', links: [
    { label: 'Prisma Schema', href: '/docs#schema' },
    { label: 'Schools', href: '/docs#schools' },
    { label: 'Students', href: '/docs#students' },
  ]},
  { title: 'AI Services', icon: Cpu, color: 'from-orange-500 to-orange-600', links: [
    { label: 'OpenRouter AI', href: '/docs#openrouter' },
    { label: 'Image Generation', href: '/docs#images' },
    { label: 'Spaced Repetition', href: '/docs#sm2' },
  ]},
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-3">Documentation</h1>
          <p className="text-slate-300 text-lg">EduGeniusnAI Platform API & Developer Guide</p>
          <div className="mt-6 flex gap-3">
            <Link href="/api" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-colors">
              <Code className="w-4 h-4" /> Browse API Routes
            </Link>
            <a href="#getting-started" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors">
              <BookOpen className="w-4 h-4" /> Start Reading
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        <section id="getting-started">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Getting Started</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {SECTIONS.map(section => (
              <Card key={section.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center text-white`}>
                      <section.icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.links.map(link => (
                      <li key={link.label}>
                        <Link href={link.href} className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5">
                          <ExternalLink className="w-3 h-3" /> {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="auth">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Authentication</h2>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-3 text-slate-600 text-sm leading-relaxed">
              <p>All API routes use NextAuth session-based authentication. The <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-600 font-mono text-xs">route()</code> middleware wrapper handles auth, subscription checks, and rate limiting.</p>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto"><code>{`// Example: protected route
export const GET = route({}, async (req, { user }) => {
  // user.id, user.role, user.email available
  return NextResponse.json({ id: user.id })
})

// Skip subscription check (freemium-safe routes)
export const GET = route({ skipSubscriptionCheck: true }, async (req, { user }) => {
  // ...
})

// Role-restricted
export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  // ...only TEACHER role can access
})`}</code></pre>
            </CardContent>
          </Card>
        </section>

        <section id="ai">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">AI Generation</h2>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-3 text-slate-600 text-sm leading-relaxed">
              <p>AI endpoints use OpenRouter AI (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-600 font-mono text-xs">OpenAIAI</code> class from <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-600 font-mono text-xs">src/lib/openrouter-ai.ts</code>).</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><code className="bg-slate-100 px-1 rounded text-xs">POST /api/ai/generate-content</code> — Rubrics, PowerPoint, Assignments, Exams, Projects</li>
                <li><code className="bg-slate-100 px-1 rounded text-xs">POST /api/ai/lesson-plan</code> — Smart lesson plan generation</li>
                <li><code className="bg-slate-100 px-1 rounded text-xs">POST /api/ai/socratic-tutor</code> — Guided Socratic hints</li>
                <li><code className="bg-slate-100 px-1 rounded text-xs">POST /api/ai/writing-coach</code> — Writing feedback</li>
                <li><code className="bg-slate-100 px-1 rounded text-xs">POST /api/ai/diagram</code> — Educational diagrams</li>
                <li><code className="bg-slate-100 px-1 rounded text-xs">POST /api/ai/presentation</code> — Auto presentations</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section id="curriculum">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Curriculum API</h2>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-3 text-slate-600 text-sm leading-relaxed">
              <p>Kenya CBC curriculum endpoints:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><code className="bg-slate-100 px-1 rounded text-xs">GET /api/curriculum/strands?subject=...&grade=...</code> — Strands for subject+grade</li>
                <li><code className="bg-slate-100 px-1 rounded text-xs">GET /api/curriculum/substrands?strandId=...</code> — Substrands for a strand</li>
                <li><code className="bg-slate-100 px-1 rounded text-xs">GET /api/curriculum/auto-populate?subject=...&grade=...</code> — Auto-populate topic suggestions</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section id="notifications">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Notifications & Messages</h2>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-3 text-slate-600 text-sm leading-relaxed">
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><code className="bg-slate-100 px-1 rounded text-xs">GET /api/notifications</code> — List notifications (supports unreadOnly, countOnly, limit, offset)</li>
                <li><code className="bg-slate-100 px-1 rounded text-xs">POST /api/notifications/send</code> — Broadcast to users by role/school</li>
                <li><code className="bg-slate-100 px-1 rounded text-xs">PATCH /api/notifications/:id/read</code> — Mark single as read</li>
                <li><code className="bg-slate-100 px-1 rounded text-xs">PATCH /api/notifications/mark-all-read</code> — Mark all as read</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section id="academic-calendar">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Academic Calendar</h2>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-3 text-slate-600 text-sm leading-relaxed">
              <p>Auto-populated with Kenya term defaults on first access:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Term 1: Jan 5 — Apr 4 (13 weeks, half-term Feb 23-27)</li>
                <li>Term 2: Apr 28 — Jul 25 (13 weeks, half-term Jun 2-6)</li>
                <li>Term 3: Sep 2 — Nov 1 (11 weeks, half-term Oct 13-17)</li>
              </ul>
              <p>Admin pages can fetch via <code className="bg-slate-100 px-1 rounded text-xs">/api/academic-calendar?year=YYYY</code></p>
            </CardContent>
          </Card>
        </section>

        <section id="sm2">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Spaced Repetition (SM-2)</h2>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-3 text-slate-600 text-sm leading-relaxed">
              <p>Students review content on an automatically-scheduled interval using the SM-2 algorithm:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><code className="bg-slate-100 px-1 rounded text-xs">GET /api/student/review-schedule</code> — Today&apos;s review queue</li>
                <li><code className="bg-slate-100 px-1 rounded text-xs">POST /api/student/review-schedule</code> — Submit review (updates ease factor)</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section id="openrouter">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">OpenRouter AI Provider</h2>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-3 text-slate-600 text-sm leading-relaxed">
              <p>Multi-provider AI with key rotation. API keys can be added comma-separated for automatic rotation. Admin UI at <Link className="text-blue-600" href="/super-admin/api-keys">/super-admin/api-keys</Link>.</p>
            </CardContent>
          </Card>
        </section>

        <section className="pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">EduGeniusnAI Documentation — powered by the team</p>
        </section>
      </div>
    </div>
  )
}