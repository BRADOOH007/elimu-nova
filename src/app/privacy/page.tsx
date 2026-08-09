export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: August 2026</p>

        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-slate-800">1. Information We Collect</h2>
            <p className="text-slate-600">Elimu Nova collects only the information necessary to provide our educational services:</p>
            <ul className="list-disc pl-5 text-slate-600 space-y-1">
              <li>Account information (name, email, role) provided during signup</li>
              <li>Learning data (assignments, grades, study sessions, AI interactions)</li>
              <li>School affiliation data for school-connected accounts</li>
              <li>Payment information processed via Stripe (never stored on our servers)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800">2. Children's Privacy (COPPA Compliance)</h2>
            <p className="text-slate-600">Elimu Nova complies with the Children's Online Privacy Protection Act (COPPA). For student accounts:</p>
            <ul className="list-disc pl-5 text-slate-600 space-y-1">
              <li>Student accounts are created by parents, school administrators, or teachers</li>
              <li>Parents have full access to view, manage, and delete their children's data</li>
              <li>Parents can delete their child's entire profile and all associated data at any time</li>
              <li>We do not collect any unnecessary personal information from children</li>
              <li>Student data is never shared with third parties or used for advertising</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800">3. GDPR Compliance</h2>
            <p className="text-slate-600">For users in the European Union and United Kingdom:</p>
            <ul className="list-disc pl-5 text-slate-600 space-y-1">
              <li>Right to access — request a copy of your data at any time</li>
              <li>Right to erasure — delete your account and all associated data</li>
              <li>Right to rectification — correct inaccurate personal data</li>
              <li>Data is stored on secure Neon PostgreSQL servers in the AWS us-east-1 region</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800">4. Data Security</h2>
            <p className="text-slate-600">We implement industry-standard security measures:</p>
            <ul className="list-disc pl-5 text-slate-600 space-y-1">
              <li>All data encrypted in transit (HTTPS/TLS) and at rest</li>
              <li>Passwords hashed using bcrypt with 12 salt rounds</li>
              <li>Role-based access control (RBAC) for all API endpoints</li>
              <li>Rate limiting on authentication and AI endpoints</li>
              <li>Automated 72-hour activity log purging</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800">5. Contact</h2>
            <p className="text-slate-600">For privacy-related inquiries or data deletion requests, contact us at <strong>support@elimunova.com</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
