import { PublicNav } from "@/components/ui/public-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, ArrowRight, Users, Heart, Star, MessageSquare, ThumbsUp, Calendar } from "lucide-react"
import Link from "next/link"

export default function CommunityPage() {
  const forumCategories = [
    {
      icon: MessageSquare,
      title: "General Discussion",
      description: "Share ideas, ask questions, and connect with fellow educators",
      posts: 1247,
      members: 892
    },
    {
      icon: Star,
      title: "Feature Requests",
      description: "Suggest new features and improvements for ElimuNova AI",
      posts: 156,
      members: 234
    },
    {
      icon: ThumbsUp,
      title: "Success Stories",
      description: "Share your achievements and inspire other educators",
      posts: 89,
      members: 445
    },
    {
      icon: Calendar,
      title: "Events & Webinars",
      description: "Stay updated on upcoming training sessions and events",
      posts: 34,
      members: 567
    }
  ]

  const recentPosts = [
    {
      title: "How I increased student engagement by 40% using AI tutoring",
      author: "Sarah Johnson",
      category: "Success Stories",
      replies: 23,
      likes: 45,
      time: "2 hours ago"
    },
    {
      title: "Best practices for generating effective lesson plans",
      author: "Michael Chen",
      category: "General Discussion",
      replies: 18,
      likes: 32,
      time: "4 hours ago"
    },
    {
      title: "Request: Bulk assignment creation feature",
      author: "Emma Davis",
      category: "Feature Requests",
      replies: 12,
      likes: 28,
      time: "6 hours ago"
    },
    {
      title: "Upcoming webinar: Advanced AI Tools for Educators",
      author: "ElimuNova Team",
      category: "Events & Webinars",
      replies: 7,
      likes: 56,
      time: "1 day ago"
    }
  ]

  const communityStats = [
    { label: "Active Members", value: "2,847" },
    { label: "Total Posts", value: "1,526" },
    { label: "Questions Answered", value: "1,203" },
    { label: "Success Stories", value: "89" }
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
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="elimunova-text-gradient-rainbow">Community Forum</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Connect with fellow educators, share experiences, and learn from the ElimuNova AI community
            </p>
          </div>
        </section>

        {/* Community Stats */}
        <section className="relative z-10 pb-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {communityStats.map((stat, index) => (
                <Card key={index} className="elimunova-card-gradient border-0 text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl md:text-3xl font-bold elimunova-text-gradient-blue mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Forum Categories */}
        <section className="relative z-10 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="elimunova-text-gradient">Forum Categories</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Explore different topics and join conversations that interest you
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {forumCategories.map((category, index) => (
                <Card key={index} className="elimunova-card-gradient group hover:scale-105 transition-all duration-300 cursor-pointer border-0">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <category.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="elimunova-text-gradient-blue">{category.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription>
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                      <span>{category.posts} posts</span>
                      <span>{category.members} members</span>
                    </div>
                    <Button variant="outline" className="w-full elimunova-glass">
                      Join Discussion
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Posts */}
        <section className="relative z-10 py-20 bg-gradient-to-b from-white/50 to-blue-50/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  <span className="elimunova-text-gradient">Recent Discussions</span>
                </h2>
                <p className="text-xl text-gray-600">
                  See what the community is talking about
                </p>
              </div>
              
              <div className="space-y-6">
                {recentPosts.map((post, index) => (
                  <Card key={index} className="elimunova-card-gradient border-0 hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>by {post.author}</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {post.category}
                            </span>
                            <span>{post.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.replies} replies</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.likes} likes</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Join Community CTA */}
        <section className="relative z-10 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">
                <span className="elimunova-text-gradient">Join Our Community</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Connect with thousands of educators and start sharing your experiences today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signin">
                  <Button size="lg" className="elimunova-button text-lg px-8 py-4">
                    Join Community
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