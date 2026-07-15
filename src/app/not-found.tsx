import Link from 'next/link'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <Logo size="sm" variant="white" />
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6">
            <FileQuestion className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">404</h1>
          <p className="text-gray-500 text-sm mb-2">Page not found</p>
          <p className="text-gray-400 text-xs mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
          <Link href="/">
            <Button className="h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl px-8">
              <Home className="w-4 h-4 mr-2" />
              Go home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
