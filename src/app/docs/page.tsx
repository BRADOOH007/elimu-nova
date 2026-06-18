import { PublicLayout } from '@/components/ui/public-layout'
import { BookOpen, Code, Zap, Users, ArrowRight, Sparkles } from 'lucide-react'

const SECTIONS = [
  {
    title: 'Getting Started',
    description: 'Learn the basics and set up your account',
    icon: BookOpen,
    grad: 'from-blue-600 to-purple-600',
    articles: ['Quick Start Guide', 'Account Setup', 'First Lesson Plan', 'Understanding the Dashboard'],
  },
  {
    title: 'AI Features',
    description: 'Master our AI-powered tools',
    icon: Zap,
    grad: 'from-purple-600 to-pink-600',
    articles: ['Lesson Plan Generator', 'Scheme of Work Creator', 'Hope AI Assistant', 'Assignment Generator'],
  },
  {
    title: 'API Reference',
    description: 'Integrate with our API',
    icon: Code,
    grad: 'from-pink-600 to-rose-600',
    articles: ['Authentication', 'Endpoints', 'SDKs', 'Rate Limits'],
  },
  {
    title: 'User Management',
    description: 'Manage users and permissions',
    icon: Users,
    grad: 'from-rose-600 to-orange-600',
    articles: ['Adding Students', 'Teacher Management', 'School Administration', 'Role Permissions'],
  },
]

export default function DocsPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3 h-3" />
          Documentation
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
          Everything you need to{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            know.
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Comprehensive documentation to help you get the most out of ElimuNova AI.
        </p>
      </section>

      {/* Sections */}
      <section className="border-t border-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-5">
            {SECTIONS.map((s) => (
              <div key={s.title} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 hover:border-slate-500 hover:-translate-y-0.5 transition-all">
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center`}>
                    <s.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{s.title}</h3>
                    <p className="text-slate-400 text-sm">{s.description}</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-5">
                  {s.articles.map((a) => (
                    <li key={a} className="flex items-center gap-2 text-slate-400 text-sm hover:text-slate-200 transition-colors cursor-pointer">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
                <button className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                  View all in {s.title} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
