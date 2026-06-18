import { PublicLayout } from '@/components/ui/public-layout'
import { Brain, Users, Target, Heart, Award, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

const team = [
  { name: 'Dr. Mary Mwangi',  role: 'CEO & Co-Founder',            description: 'Engineering and technology instructor.',                       image: '/team/mary-mwangi.jpg'    },
  { name: 'Joseph Mwaura',    role: 'CTO & Co-Founder',            description: 'AI engineer with expertise in educational technology.',         image: '/team/joseph-mwaura.jpg'  },
  { name: 'Ezekiel Manyara',  role: 'School Director & Co-Founder', description: 'Technology specialist and school administrator.',              image: '/team/ezekiel-manyara.jpg' },
]

const values = [
  { icon: Brain,  title: 'Innovation',   description: 'We continuously push the boundaries of what\'s possible in educational technology.' },
  { icon: Users,  title: 'Collaboration', description: 'We believe in the power of teachers, students, and technology working together.'   },
  { icon: Target, title: 'Excellence',   description: 'We strive for the highest quality in everything we create and deliver.'             },
  { icon: Heart,  title: 'Empathy',      description: 'We understand the challenges educators face and design solutions with care.'        },
]

const stats = [
  { v: '50K+', l: 'Students Impacted'    },
  { v: '1M+',  l: 'Lesson Plans Created' },
  { v: '95%',  l: 'Teacher Satisfaction' },
  { v: '24/7', l: 'AI Support'           },
]

export default function AboutPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3 h-3" />
          Our Story
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
          About{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ElimuNova AI
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          We're on a mission to transform education through the power of artificial intelligence —
          making quality education accessible to everyone, everywhere.
        </p>
      </section>

      {/* Mission + Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-purple-500" />
              <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">Our Mission</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-5">
              AI that works alongside human creativity.
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              At ElimuNova AI, we believe every teacher deserves powerful tools to create engaging,
              personalised learning experiences. Our AI-powered platform lets educators focus on
              what they do best — inspiring and guiding students.
            </p>
            <p className="text-slate-400 leading-relaxed mb-8">
              We're building the future of education, where artificial intelligence unlocks the
              full potential of every learner.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Trusted by 10,000+ Educators</p>
                <p className="text-xs text-slate-400">Across 50+ countries worldwide</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div key={s.l} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 text-center">
                <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                  {s.v}
                </div>
                <div className="text-slate-400 text-sm">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-8 bg-purple-500" />
              <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">Our Values</span>
              <div className="h-px w-8 bg-purple-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-white">The principles that guide us</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v) => (
              <div key={v.title} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 hover:border-slate-600 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4">
                  <v.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">{v.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="border-t border-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-8 bg-purple-500" />
              <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">The Team</span>
              <div className="h-px w-8 bg-purple-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-white">The people behind Elimu Nova</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {team.map((m) => (
              <div key={m.name} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 text-center hover:border-slate-600 transition-colors">
                <div className="w-24 h-24 mx-auto mb-4 relative overflow-hidden rounded-full border-2 border-slate-700">
                  <Image src={m.image} alt={m.name} fill className="object-cover" sizes="96px" />
                </div>
                <h3 className="font-bold text-white mb-1">{m.name}</h3>
                <p className="text-purple-400 text-sm font-medium mb-3">{m.role}</p>
                <p className="text-slate-400 text-sm">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="border-t border-slate-800 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-8 bg-purple-500" />
            <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">Our Story</span>
            <div className="h-px w-8 bg-purple-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-8">How it all started</h2>
          <div className="space-y-5 text-slate-400 leading-relaxed text-base">
            <p>
              ElimuNova AI was born from a simple observation: teachers were spending countless hours
              on administrative tasks instead of focusing on what they love most — teaching and inspiring students.
            </p>
            <p>
              Our founders, Dr. Mary Mwangi and Joseph Mwaura, connected at an education technology conference
              where they discovered a shared commitment to transforming learning through AI. With years of
              experience in academia and technology, they recognised AI's potential to deliver sustainable,
              data-driven solutions to education's biggest challenges.
            </p>
            <p>
              Today, we proudly serve thousands of educators worldwide, equipping them with tools to deliver
              engaging, personalised, and impactful learning experiences.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-800 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Join our mission</h2>
          <p className="text-slate-400 mb-8">
            Be part of the educational revolution. Start your journey with ElimuNova AI today.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-full px-8 shadow-lg shadow-purple-500/30">
              Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}
