import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { ArrowRight, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FOOTER_LINKS = [
  {
    title: 'Product',
    links: [
      { label: 'Features',  to: '/#features' },
      { label: 'Pricing',   to: '/pricing'   },
      { label: 'Demo',      to: '/demo'      },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center',    to: '/help'    },
      { label: 'Contact Us',     to: '/contact' },
      { label: 'Documentation',  to: '/docs'    },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About',    to: '/about'   },
      { label: 'Schools',  to: '/pricing' },
      { label: 'Privacy',  to: '/privacy' },
      { label: 'Terms',    to: '/terms'   },
    ],
  },
]

export function PublicFooter() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-white">
      {/* CTA strip */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-lg font-bold text-white">Ready to transform your school?</p>
            <p className="text-slate-400 text-sm mt-1">Join thousands of educators already using Elimu Nova.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs">Platform live · 24/7 uptime</span>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl px-5 h-10 text-sm shadow-lg shadow-purple-500/20">
                Get Started Free <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo variant="white" size="lg" className="mb-4" />
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              The AI-powered cloud school platform built for teachers, school owners and learners worldwide.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {['Nairobi', 'London', 'USA'].map((city) => (
                <span key={city} className="flex items-center gap-1 text-slate-500 text-xs">
                  <Globe className="h-3 w-3 text-purple-500" />{city}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.to}
                      className="text-slate-400 text-sm hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} ElimuNova AI. All rights reserved.
          </p>
          <p className="text-slate-500 text-sm">
            Developed by{' '}
            <a
              href="https://infinititechsolutions.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              InfinitiTech Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
