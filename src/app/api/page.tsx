import { PublicNav } from "@/components/ui/public-nav"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code, BookOpen, Zap, Shield, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function APIPage() {
  const endpoints = [
    {
      method: "POST",
      path: "/api/ai/generate-lesson-plan",
      description: "Generate AI-powered lesson plans",
      parameters: ["subject", "grade", "topic", "duration", "objectives"]
    },
    {
      method: "POST", 
      path: "/api/ai/generate-scheme-of-work",
      description: "Create comprehensive schemes of work",
      parameters: ["subject", "grade", "term", "topics", "duration"]
    },
    {
      method: "POST",
      path: "/api/ai/alexa-chat",
      description: "Chat with Hope AI assistant",
      parameters: ["message", "context"]
    },
    {
      method: "GET",
      path: "/api/lesson-plans",
      description: "Retrieve lesson plans",
      parameters: ["teacherId", "subject", "grade"]
    }
  ]

  const features = [
    {
      icon: Code,
      title: "RESTful API",
      description: "Clean, intuitive REST API endpoints for all functionality"
    },
    {
      icon: Zap,
      title: "Real-time AI",
      description: "Access our AI models in real-time for instant responses"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee"
    },
    {
      icon: BookOpen,
      title: "Comprehensive Docs",
      description: "Detailed documentation with examples and SDKs"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      <div className="max-w-full overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl elimunova-animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-rose-600/20 rounded-full blur-3xl elimunova-animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header */}
      <PublicNav />

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-32 pb-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="elimunova-text-gradient-rainbow">ElimuNova AI</span>
            <br />
            <span className="elimunova-text-gradient">API Documentation</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Integrate our AI-powered educational tools into your applications with our 
            comprehensive REST API and SDKs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="elimunova-button text-lg px-8 py-4">
              <Code className="mr-2 h-5 w-5" />
              Get API Key
            </Button>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="elimunova-glass border-0 text-lg px-8 py-4 hover:bg-white/20">
                View Full Docs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="elimunova-text-gradient">API Features</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to build powerful educational applications
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={feature.title} className="elimunova-card-gradient group hover:scale-105 transition-all duration-300 border-0">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="elimunova-text-gradient-blue">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-white/50 to-blue-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="elimunova-text-gradient">API Endpoints</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our comprehensive API endpoints for all AI features
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {endpoints.map((endpoint, index) => (
              <Card key={endpoint.path} className="elimunova-card-gradient border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded text-sm font-medium ${
                        endpoint.method === 'GET' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {endpoint.method}
                      </div>
                      <code className="text-lg font-mono text-gray-800">{endpoint.path}</code>
                    </div>
                  </div>
                  <CardDescription className="text-base mt-2">
                    {endpoint.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Parameters:</h4>
                    <div className="flex flex-wrap gap-2">
                      {endpoint.parameters.map((param, paramIndex) => (
                        <span key={paramIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                          {param}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="elimunova-card-gradient border-0">
              <CardHeader>
                <CardTitle className="elimunova-text-gradient-blue">Quick Start Example</CardTitle>
                <CardDescription>
                  Generate a lesson plan with just a few lines of code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
                  <pre className="text-green-400 text-sm">
{`// Generate a lesson plan
const response = await fetch('/api/ai/generate-lesson-plan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    subject: 'Mathematics',
    grade: 'Grade 5',
    topic: 'Fractions',
    duration: 45,
    objectives: [
      'Understand basic fraction concepts',
      'Add and subtract simple fractions'
    ]
  })
});

const lessonPlan = await response.json();
console.log(lessonPlan);`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SDKs */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-white/50 to-blue-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="elimunova-text-gradient">SDKs & Libraries</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Use our official SDKs to integrate ElimuNova AI into your applications
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="elimunova-card-gradient group hover:scale-105 transition-all duration-300 border-0">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Code className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="elimunova-text-gradient-blue">JavaScript/Node.js</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="mb-4">
                  Official SDK for JavaScript and Node.js applications
                </CardDescription>
                <Button className="elimunova-button w-full">
                  Install Package
                </Button>
              </CardContent>
            </Card>

            <Card className="elimunova-card-gradient group hover:scale-105 transition-all duration-300 border-0">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Code className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="elimunova-text-gradient-blue">Python</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="mb-4">
                  Python SDK for data science and educational applications
                </CardDescription>
                <Button className="elimunova-button w-full">
                  Install Package
                </Button>
              </CardContent>
            </Card>

            <Card className="elimunova-card-gradient group hover:scale-105 transition-all duration-300 border-0">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Code className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="elimunova-text-gradient-blue">PHP</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="mb-4">
                  PHP SDK for web applications and content management systems
                </CardDescription>
                <Button className="elimunova-button w-full">
                  Install Package
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 elimunova-gradient-rainbow">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Build?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Get your API key and start building amazing educational applications today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="elimunova-button-secondary text-lg px-8 py-4">
              Get API Key
            </Button>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-lg px-8 py-4">
                View Documentation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Logo variant="black" className="mb-4" />
              <p className="text-gray-400">
                Transforming education with AI-powered tools for teachers and students.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 elimunova-text-gradient-blue">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/#features" className="hover:elimunova-text-gradient transition-all duration-300">Features</Link></li>
                <li><Link href="/pricing" className="hover:elimunova-text-gradient transition-all duration-300">Pricing</Link></li>
                <li><Link href="/api" className="hover:elimunova-text-gradient transition-all duration-300">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 elimunova-text-gradient-blue">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:elimunova-text-gradient transition-all duration-300">Help Center</Link></li>
                <li><Link href="/contact" className="hover:elimunova-text-gradient transition-all duration-300">Contact Us</Link></li>
                <li><Link href="/docs" className="hover:elimunova-text-gradient transition-all duration-300">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 elimunova-text-gradient-blue">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:elimunova-text-gradient transition-all duration-300">About</Link></li>
                <li><Link href="/privacy" className="hover:elimunova-text-gradient transition-all duration-300">Privacy</Link></li>
                <li><Link href="/terms" className="hover:elimunova-text-gradient transition-all duration-300">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} ElimuNova AI. All rights reserved.</p>
            <p className="mt-2">
              Developed by{' '}
              <a 
                href="https://infinititechsolutions.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="elimunova-text-gradient hover:underline transition-all duration-300"
              >
                InfinitiTech Solutions
              </a>
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  )
}
