import { PublicLayout } from '@/components/ui/public-layout'
import { Button } from '@/components/ui/button'
import { Play, BookOpen, Users, Brain, Zap, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  { step: '01', title: 'Sign Up & Setup',         description: 'Create your account and set up your school profile in minutes.',                            icon: Users  },
  { step: '02', title: 'Generate Lesson Plans',   description: 'Use AI to create comprehensive, curriculum-aligned lesson plans.',                           icon: BookOpen },
  { step: '03', title: 'Create Schemes of Work',  description: 'Build detailed schemes of work for entire terms and subjects.',                              icon: Brain  },
  { step: '04', title: 'Engage with Hope AI',     description: 'Get instant help and support from your AI teaching assistant.',                              icon: Zap    },
]

const FEATURES = [
  { title: 'AI Lesson Plan Generator',  description: 'Watch how our AI creates detailed, engaging lesson plans in seconds.',          video: '/videos/lesson-plan-demo.mp4'        },
  { title: 'Student Management',        description: 'See how easy it is to track student progress and manage assignments.',            video: '/videos/student-management-demo.mp4' },
  { title: 'Hope AI Assistant',         description: 'Experience real-time AI assistance for all your teaching needs.',                video: '/videos/hope-ai-demo.mp4'            },
]

export default function DemoPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3 h-3" />
          See it in action
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
          Watch{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ElimuNova AI
          </span>
          {' '}in action
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
          See how our AI-powered platform transforms the way you create lesson plans,
          manage students, and enhance your teaching experience.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-full px-8 shadow-lg shadow-purple-500/30">
            <Play className="mr-2 h-4 w-4" /> Watch Full Demo
          </Button>
          <Link href="/auth/signup">
            <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full px-8">
              Try Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Steps */}
      <section className="border-t border-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-8 bg-purple-500" />
              <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">How It Works</span>
              <div className="h-px w-8 bg-purple-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-white">Get started in 4 simple steps</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s) => (
              <div key={s.step} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 hover:border-slate-600 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-slate-700 text-xs font-bold">{s.step}</span>
                </div>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive demos */}
      <section className="border-t border-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-8 bg-purple-500" />
              <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">Interactive Demo</span>
              <div className="h-px w-8 bg-purple-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-white">Experience key features live</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors">
                <div className="w-full h-48 bg-slate-900 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-xs">Demo Video</p>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-slate-400 text-sm">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personal demo */}
      <section className="border-t border-slate-800 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-8 sm:p-10 text-center">
            <h2 className="text-2xl font-extrabold text-white mb-3">Want a personal demo?</h2>
            <p className="text-slate-400 mb-8">
              Schedule a one-on-one session with our education specialists to see how
              ElimuNova AI can transform your school.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              {[
                { icon: Users,    title: 'Personalised',    desc: 'Tailored to your specific needs'   },
                { icon: Brain,    title: 'Expert Guidance', desc: 'Learn from education specialists'  },
                { icon: Zap,      title: 'Quick Setup',     desc: 'Get started in 30 minutes'         },
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
                  Schedule Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full px-8">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
