import { PublicLayout } from '@/components/ui/public-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Eye, Lock, Database } from 'lucide-react'
import { Sparkles } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="h-3 w-3" />
          Legal
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
          Privacy{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Policy
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Your privacy is important to us. Learn how we collect, use, and protect your information.
        </p>
        <p className="text-slate-500 text-sm mt-4">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="space-y-6">
          {[
            {
              title: "Information We Collect",
              description: "We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This includes account information (name, email, school details), educational content (lesson plans, assignments, student work), usage data (how you interact with our platform), and communication data (support requests, feedback)."
            },
            {
              title: "How We Use Your Information",
              description: "We use the information we collect to provide, maintain, and improve our services. This includes providing and personalizing our AI-powered educational tools, generating lesson plans, schemes of work, and assignments, tracking student progress and providing analytics, communicating with you about our services, and ensuring platform security and preventing fraud."
            },
            {
              title: "Data Security",
              description: "We implement appropriate technical and organizational measures to protect your data. These include end-to-end encryption for all data, role-based access permissions, and enterprise-grade data centers.",
              features: [
                { icon: Lock, title: "Encryption", description: "End-to-end encryption for all data" },
                { icon: Shield, title: "Access Control", description: "Role-based access permissions" },
                { icon: Database, title: "Secure Storage", description: "Enterprise-grade data centers" }
              ]
            },
            {
              title: "Your Rights",
              description: "You have the right to access and download your data, correct inaccurate information, delete your account and data, opt out of marketing communications, and request data portability."
            },
            {
              title: "Contact Us",
              description: "If you have any questions about this Privacy Policy, please contact us at info@infinititechsolutions.org or at our address in Nakuru, Kenya."
            }
          ].map((item, i) => (
            <Card key={i} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white text-xl">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 leading-relaxed">
                  {item.description}
                </p>
                {item.features && (
                  <div className="grid sm:grid-cols-3 gap-4 mt-4">
                    {item.features.map((feature, j) => (
                      <div key={j} className="text-center p-4 bg-slate-800 border border-slate-700 rounded-xl">
                        <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <feature.icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                        <p className="text-sm text-slate-400">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  )
}
