import { PublicLayout } from '@/components/ui/public-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

export default function TermsPage() {
  return (
    <PublicLayout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="h-3 w-3" />
          Legal
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
          Terms of{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Service
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Please read these terms carefully before using our services.
        </p>
        <p className="text-slate-500 text-sm mt-4">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="space-y-6">
          {[
            {
              title: "Acceptance of Terms",
              description: "By accessing and using ElimuNova AI, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service."
            },
            {
              title: "Use License",
              description: "Permission is granted to temporarily use ElimuNova AI for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not modify or copy the materials, use the materials for any commercial purpose or for any public display, attempt to reverse engineer any software contained on the website, or remove any copyright or other proprietary notations from the materials."
            },
            {
              title: "User Responsibilities",
              description: "As a user of ElimuNova AI, you agree to provide accurate and complete information when creating your account, maintain the security of your account credentials, use the service in compliance with applicable laws and regulations, respect the intellectual property rights of others, and not use the service for any unlawful or prohibited activities."
            },
            {
              title: "AI-Generated Content",
              description: "Our AI-generated content is provided as a starting point and should be reviewed and customized by qualified educators. You acknowledge that AI-generated content may not be perfect or complete, you are responsible for reviewing and validating all content, content should be adapted to meet specific educational requirements, and we are not liable for the use or misuse of AI-generated content."
            },
            {
              title: "Limitation of Liability",
              description: "In no event shall ElimuNova AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on ElimuNova AI, even if ElimuNova AI or an authorized representative has been notified orally or in writing of the possibility of such damage."
            },
            {
              title: "Termination",
              description: "We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the service will cease immediately."
            },
            {
              title: "Changes to Terms",
              description: "We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect."
            },
            {
              title: "Contact Information",
              description: "If you have any questions about these Terms of Service, please contact us at info@infinititechsolutions.org or at our address in Nakuru, Kenya."
            }
          ].map((item, i) => (
            <Card key={i} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white text-xl">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  )
}
