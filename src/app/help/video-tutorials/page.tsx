"use client"

import { PublicNav } from "@/components/ui/public-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, ArrowRight, Play, Clock, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function VideoTutorialsPage() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const tutorials = [
    {
      title: "AI Lesson Plan Generator",
      description: "Watch how our AI creates detailed, engaging lesson plans in seconds. Learn to input your subject, grade level, and topic to generate comprehensive lesson plans.",
      duration: "3:45",
      category: "Lesson Planning",
      thumbnail: "/videos/lesson-plan-poster.jpg",
      videoUrl: "/videos/lesson-plan-demo.mp4"
    },
    {
      title: "Hope AI Assistant",
      description: "Experience real-time AI assistance for all your teaching needs. See how Hope AI can answer questions, provide teaching tips, and help with curriculum planning.",
      duration: "2:30",
      category: "AI Tools",
      thumbnail: "/videos/hope-ai-poster.jpg",
      videoUrl: "/videos/hope-ai-demo.mp4"
    },
    {
      title: "Student Management",
      description: "See how easy it is to track student progress and manage assignments. Learn to organize classes, monitor performance, and communicate with students.",
      duration: "4:15",
      category: "Classroom Management",
      thumbnail: "/videos/student-management-poster.jpg",
      videoUrl: "/videos/student-management-demo.mp4"
    }
  ]

  const categories = ["All", "Basics", "Lesson Planning", "AI Tools", "Classroom Management", "Curriculum Planning", "Advanced"]

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
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Video className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="elimunova-text-gradient-rainbow">Video Tutorials</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Watch step-by-step video guides to master ElimuNova AI and enhance your teaching experience
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <section className="relative z-10 pb-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={category === "All" ? "default" : "outline"}
                  className={category === "All" ? "elimunova-button" : "elimunova-glass border-0 hover:bg-white/20"}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Video Grid */}
        <section className="relative z-10 py-10">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tutorials.map((tutorial, index) => (
                <Card key={index} className="elimunova-card-gradient group hover:scale-105 transition-all duration-300 cursor-pointer border-0">
                  <div className="relative">
                    {selectedVideo === tutorial.videoUrl ? (
                      <div className="aspect-video rounded-t-lg overflow-hidden">
                        <video
                          controls
                          autoPlay
                          className="w-full h-full object-cover"
                          poster={tutorial.thumbnail}
                        >
                          <source src={tutorial.videoUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : (
                      <div 
                        className="aspect-video bg-cover bg-center rounded-t-lg flex items-center justify-center cursor-pointer"
                        style={{ backgroundImage: `url(${tutorial.thumbnail})` }}
                        onClick={() => setSelectedVideo(tutorial.videoUrl)}
                      >
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Play className="w-8 h-8 text-blue-600 ml-1" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {tutorial.duration}
                    </div>
                    <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                      {tutorial.category}
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="elimunova-text-gradient-blue text-lg">{tutorial.title}</CardTitle>
                    <CardDescription>
                      {tutorial.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full elimunova-glass"
                      onClick={() => setSelectedVideo(selectedVideo === tutorial.videoUrl ? null : tutorial.videoUrl)}
                    >
                      {selectedVideo === tutorial.videoUrl ? 'Close Video' : 'Watch Video'}
                      <Play className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="relative z-10 py-20 bg-gradient-to-b from-white/50 to-blue-50/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                <span className="elimunova-text-gradient">Need More Help?</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button size="lg" className="elimunova-button text-lg px-8 py-4">
                    Contact Support
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