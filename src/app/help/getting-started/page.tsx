import { PublicNav } from "@/components/ui/public-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, ArrowRight, CheckCircle, Play, Users, Brain } from "lucide-react"
import Link from "next/link"

export default function GettingStartedPage() {
  const steps = [
    {
      icon: Users,
      title: "Create Your Account",
      description: "Sign up for ElimuNova AI and choose your role (Teacher, Student, or School Admin)",
      details: [
        "Visit the sign-up page and select your user type",
        "Fill in your basic information and school details",
        "Verify your email address to activate your account",
        "Complete your profile setup with subjects and grade levels"
      ]
    },
    {
      icon: Brain,
      title: "Explore AI Tools",
      description: "Discover the powerful AI-powered features available to enhance your teaching",
      details: [
        "Navigate to the AI Tools section in your dashboard",
        "Try generating your first lesson plan with AI assistance",
        "Explore scheme of work generation for curriculum planning",
        "Test the AI tutor for personalized student learning"
      ]
    },
    {
      icon: BookOpen,
      title: "Create Your First Content",
      description: "Start creating educational content with AI assistance",
      details: [
        "Click 'Create New' in the Lesson Plans section",
        "Enter your subject, grade level, and topic",
        "Let AI generate a comprehensive lesson plan",
        "Review and customize the content to fit your needs"
      ]
    },
    {
      icon: Play,
      title: "Start Teaching",
      description: "Begin using your AI-generated content in the classroom",
      details: [
        "Share lesson plans with students through the platform",
        "Use the AI tutor for personalized student support",
        "Track student progress and engagement",
        "Generate assessments and assignments automatically"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      <div className="max-w-full overflow-x-auto">
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
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="elimunova-text-gradient-rainbow">Getting Started Guide</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Learn how to get the most out of ElimuNova AI with this comprehensive step-by-step guide
            </p>
          </div>
        </section>

        {/* Steps Section */}
        <section className="relative z-10 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-12">
              {steps.map((step, index) => (
                <Card key={index} className="elimunova-card-gradient border-0">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <step.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-blue-600 mb-1">Step {index + 1}</div>
                        <CardTitle className="elimunova-text-gradient-blue">{step.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-base">
                      {step.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="relative z-10 py-20 bg-gradient-to-b from-white/50 to-blue-50/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">
                <span className="elimunova-text-gradient">Ready to Get Started?</span>
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signin">
                  <Button size="lg" className="elimunova-button text-lg px-8 py-4">
                    Sign Up Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/help">
                  <Button size="lg" variant="outline" className="elimunova-glass border-0 text-lg px-8 py-4 hover:bg-white/20">
                    Back to Help Center
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}