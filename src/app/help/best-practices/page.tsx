import { PublicNav } from "@/components/ui/public-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ArrowRight, Lightbulb, Target, Users, Brain, BookOpen, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function BestPracticesPage() {
  const practices = [
    {
      icon: Brain,
      title: "Maximizing AI-Generated Content",
      description: "Get the best results from AI-powered lesson planning and content creation",
      tips: [
        "Provide detailed context and learning objectives when generating content",
        "Review and customize AI-generated materials to match your teaching style",
        "Use specific grade levels and subject areas for more targeted results",
        "Iterate and refine prompts to improve content quality"
      ]
    },
    {
      icon: Users,
      title: "Effective Classroom Management",
      description: "Organize your digital classroom for optimal learning outcomes",
      tips: [
        "Create clear class structures with organized student groups",
        "Set up consistent naming conventions for assignments and materials",
        "Use the messaging system to maintain regular communication",
        "Track student progress regularly and provide timely feedback"
      ]
    },
    {
      icon: Target,
      title: "Personalized Learning Strategies",
      description: "Leverage AI to create individualized learning experiences",
      tips: [
        "Use AI tutor features to provide personalized support for struggling students",
        "Create differentiated assignments based on student ability levels",
        "Monitor individual progress and adjust learning paths accordingly",
        "Encourage students to use AI tools for self-directed learning"
      ]
    },
    {
      icon: BookOpen,
      title: "Curriculum Planning Excellence",
      description: "Design comprehensive and engaging curriculum with AI assistance",
      tips: [
        "Start with clear learning outcomes and work backwards",
        "Use scheme of work generators to ensure curriculum alignment",
        "Incorporate diverse teaching methods and assessment strategies",
        "Plan for regular review and adjustment of curriculum content"
      ]
    }
  ]

  const quickTips = [
    "Always review AI-generated content before using it in class",
    "Encourage student collaboration through platform features",
    "Use data insights to inform your teaching decisions",
    "Keep your content library organized with clear categories",
    "Regularly update your teaching materials based on student feedback",
    "Take advantage of automated grading to save time",
    "Create backup plans for technology-dependent lessons",
    "Stay updated with new AI features and tools"
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
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="elimunova-text-gradient-rainbow">Best Practices</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover proven strategies and tips to maximize your effectiveness with ElimuNova AI
            </p>
          </div>
        </section>

        {/* Best Practices Section */}
        <section className="relative z-10 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto space-y-12">
              {practices.map((practice, index) => (
                <Card key={index} className="elimunova-card-gradient border-0">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <practice.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="elimunova-text-gradient-blue text-xl">{practice.title}</CardTitle>
                        <CardDescription className="text-base mt-2">
                          {practice.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {practice.tips.map((tip, tipIndex) => (
                        <div key={tipIndex} className="flex items-start gap-3 p-4 bg-white/50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Tips Section */}
        <section className="relative z-10 py-20 bg-gradient-to-b from-white/50 to-blue-50/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  <span className="elimunova-text-gradient">Quick Tips</span>
                </h2>
                <p className="text-xl text-gray-600">
                  Essential tips for getting the most out of ElimuNova AI
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {quickTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-white/70 rounded-lg">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <span className="text-gray-700">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="relative z-10 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                <span className="elimunova-text-gradient">Ready to Apply These Practices?</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Start implementing these best practices in your teaching today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signin">
                  <Button size="lg" className="elimunova-button text-lg px-8 py-4">
                    Get Started
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