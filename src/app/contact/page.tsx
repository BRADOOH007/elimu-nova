'use client'

import { PublicLayout } from '@/components/ui/public-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Calendar, Sparkles } from 'lucide-react'
import Link from 'next/link'

const INFO = [
  {
    icon: Mail,
    title: 'Email Address',
    content: <a href="mailto:info@infinititechsolutions.org" className="text-blue-400 hover:text-blue-300 transition-colors">info@infinititechsolutions.org</a>,
    grad: 'from-blue-600 to-purple-600',
  },
  {
    icon: Phone,
    title: 'Phone / WhatsApp',
    content: (
      <div className="space-y-1">
        <a href="tel:+254791269918" className="block text-blue-400 hover:text-blue-300 transition-colors">+254 791 269 918</a>
        <button onClick={() => window.open('https://wa.me/254791269918?text=Hello! I need help with ElimuNova AI platform.', '_blank')} className="text-green-400 hover:text-green-300 text-sm transition-colors">💬 Chat on WhatsApp</button>
      </div>
    ),
    grad: 'from-purple-600 to-pink-600',
  },
  {
    icon: MapPin,
    title: 'Office',
    content: <span className="text-slate-300">Nakuru, Kenya</span>,
    grad: 'from-pink-600 to-rose-600',
  },
  {
    icon: Clock,
    title: 'Business Hours',
    content: (
      <div className="space-y-0.5 text-slate-300 text-sm">
        <p>Mon – Fri: 8:00 AM – 6:00 PM EAT</p>
        <p>Sat: 9:00 AM – 4:00 PM EAT</p>
        <p>Sun: Closed</p>
      </div>
    ),
    grad: 'from-rose-600 to-red-600',
  },
]

export default function ContactPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3 h-3" />
          Get in touch
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
          Contact{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Us
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          We'd love to hear from you. Send us a message and we'll respond within 24 hours.
        </p>
      </section>

      {/* Form + Info */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Form */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-1">Send us a Message</h2>
            <p className="text-slate-400 text-sm mb-6">Fill out the form and we'll get back to you within 24 hours.</p>
            <form className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">First Name</label>
                  <Input type="text" placeholder="First name" className="h-11 bg-slate-900/60 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Last Name</label>
                  <Input type="text" placeholder="Last name" className="h-11 bg-slate-900/60 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                <Input type="email" placeholder="email@example.com" className="h-11 bg-slate-900/60 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Subject</label>
                <Input type="text" placeholder="What's this about?" className="h-11 bg-slate-900/60 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Message</label>
                <textarea rows={5} placeholder="Tell us how we can help..." className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-600 text-white placeholder:text-slate-500 rounded-lg text-sm focus:outline-none focus:border-purple-500 resize-none" required />
              </div>
              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl">
                <Send className="mr-2 h-4 w-4" /> Send Message
              </Button>
            </form>
          </div>

          {/* Info */}
          <div className="space-y-5">
            {INFO.map((item) => (
              <div key={item.title} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 flex items-start gap-4 hover:border-slate-600 transition-colors">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.grad} flex items-center justify-center shrink-0`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  {item.content}
                </div>
              </div>
            ))}

            {/* Quick support */}
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4">Quick Support</h3>
              <div className="space-y-3">
                <Link href="/help">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-700/50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Browse Help Center</p>
                      <p className="text-xs text-slate-400">Find answers to common questions</p>
                    </div>
                  </div>
                </Link>
                <button onClick={() => window.open('https://wa.me/254791269918?text=Hello! I need help with ElimuNova AI platform.', '_blank')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-700/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">Start Live Chat</p>
                    <p className="text-xs text-slate-400">Get instant help via WhatsApp</p>
                  </div>
                </button>
                <Link href="/demo">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-700/50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Schedule a Demo</p>
                      <p className="text-xs text-slate-400">Book a personalised walkthrough</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
