'use client'

import { Card, CardContent } from '@/components/ui/card'
import { School, Mail } from 'lucide-react'

export default function StudentBilling() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-600 mt-1">Billing is managed by your school administrator.</p>
      </div>
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg border-0">
        <CardContent className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <School className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Billing Managed by School Admin</h2>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Your school administrator manages all billing and subscription details. 
            Please contact them with any billing-related questions.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Mail className="w-4 h-4" />
            <span>Contact your school administrator for assistance</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
