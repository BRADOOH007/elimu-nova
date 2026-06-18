'use client'

import { PublicLayout } from '@/components/ui/public-layout'
import { Button } from '@/components/ui/button'
import { Search, BookOpen, MessageCircle, Video, FileText, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

const FAQS = [
  { q: 'How do I create my first lesson plan?',   a: 'Navigate to the Lesson Plans section, click "Create New", fill in the subject, grade, and topic details, then click "Generate with AI".' },
  { q: 'Can I edit AI-generated content?',         a: 'Yes! All AI-generated content is fully editable. You can modify lesson plans, schemes of work, and assignments to fit your specific needs.' },
  { q: 'How does the Hope AI assistant work?',     a: 'Hope is your personal AI teaching assistant. Simply type your questions about teaching, lesson planning, or classroom management, and get instant, helpful responses.' },
  { q: 'Is my data secure?',                       a: 'Absolutely. We use enterprise-grade security with end-to-end encryption to protect all your educational data and student information.' },
]

const RESOURCES = [
  { icon: BookOpen,      title: 'Getting Started Guide', description: 'Learn the basics of using ElimuNova AI',        type: 'Guide',     href: '/help/getting-started'   },
  { icon: Video,         title: 'Video Tutorials',       description: 'Watch step-by-step video tutorials',            type: 'Video',     href: '/help/video-tutorials'   },
  { icon: FileText,      title: 'Best Practices',        description: 'Tips and tricks for effective teaching',        type: 'Article',   href: '/help/best-practices'    },
  { icon: MessageCircle, title: 'Community Forum',       description: 'Connect with other educators',                  type: 'Community', href: '/help/community'         },
]

export default function HelpPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3 h-3" />
          Help Center
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
          How can we{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            help you?
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
          Find answers to your questions and learn how to get the most out of ElimuNova AI.
        </p>
        {/* Search */}
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
          <input
            type="text"
            placeholder="Search help articles, tutorials and guides..."
            className="w-full h-12 pl-11 pr-4 bg-slate-800/60 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
      </section>

      {/* Resources */}
      <section className="border-t border-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-8 bg-purple-500" />
              <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">Quick Resources</span>
              <div className="h-px w-8 bg-purple-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-white">Get started quickly</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {RESOURCES.map((r) => (
              <Link key={r.title} href={r.href}>
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 hover:border-slate-500 hover:-translate-y-0.5 transition-all cursor-pointer h-full">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4">
                    <r.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">{r.type}</span>
                  <h3 className="font-bold text-white mt-1 mb-2">{r.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{r.description}</p>
                  <span className="inline-flex items-center text-xs text-blue-400 font-medium">
                    View resource <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-800 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-8 bg-purple-500" />
              <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">FAQ</span>
              <div className="h-px w-8 bg-purple-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-white">Common questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 hover:border-slate-600 transition-colors">
                <h3 className="font-semibold text-white mb-3">{faq.q}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still need help */}
      <section className="border-t border-slate-800 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-extrabold text-white mb-3">Still need help?</h2>
            <p className="text-slate-400 mb-8">Our support team is here to help you succeed.</p>
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              {[
                { icon: MessageCircle, title: 'Live Chat',     desc: 'Instant help from our team'       },
                { icon: FileText,      title: 'Email Support', desc: 'Send us a detailed message'       },
                { icon: Video,         title: 'Video Call',    desc: 'Schedule a 1-on-1 session'        },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  <p className="text-slate-400 text-xs mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-full px-8">
                  Contact Support <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full px-8" onClick={() => window.open('https://wa.me/254791269918?text=Hello! I need help with ElimuNova AI platform.', '_blank')}>
                Start Live Chat
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
