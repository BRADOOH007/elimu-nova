'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, User, BookOpen, TrendingUp, Zap } from 'lucide-react'

export function AICareerConsultant() {
  const [formData, setFormData] = useState({
    grade: '',
    subjectStrengths: '',
    subjectWeaknesses: '',
    interests: '',
    skills: '',
    futureGoals: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!formData.grade || !formData.interests) {
      alert('Please fill in grade and interests at minimum!')
      return
    }

    setIsGenerating(true)

    try {
      const { OpenAI } = await import('openai')
      const apiKey = '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'
      
      const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
      })

      const systemPrompt = `You are an expert career guidance counselor for Kenyan students. Provide personalized, culturally relevant career advice based on CBC curriculum and Kenyan job market. Focus on:
- Career pathways in Kenya
- Required subjects and grades
- Local universities and colleges
- Scholarship opportunities
- Skills development
- Practical, actionable advice`

      const userPrompt = `Provide career guidance for a student with the following profile:
- Grade Level: ${formData.grade}
- Strong Subjects: ${formData.subjectStrengths || 'Not specified'}
- Weak Subjects: ${formData.subjectWeaknesses || 'Not specified'}
- Interests: ${formData.interests}
- Current Skills: ${formData.skills || 'Not specified'}
- Future Goals: ${formData.futureGoals || 'Not specified'}

Structure your response with:
1. Recommended Career Pathways (3-5 options)
2. Subject Selection Advice
3. Key Skills to Develop
4. Recommended Institutions in Kenya
5. Scholarship Opportunities
6. Actionable Next Steps`

      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      })

      const advice = completion.choices[0]?.message?.content || ''
      setResults(advice)
    } catch (error) {
      console.error('Error generating career advice:', error)
      alert('Failed to generate career advice')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
          AI Career Consultant
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Get personalized career guidance tailored to your strengths, interests, and goals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-2 border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-purple-50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-3 text-indigo-800">
                <User className="w-6 h-6" />
                Your Profile
              </CardTitle>
              <CardDescription>Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade" className="text-indigo-900 font-semibold">Grade Level *</Label>
                  <Select 
                    value={formData.grade} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, grade: v }))}
                  >
                    <SelectTrigger className="bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-400">
                      <SelectValue placeholder="Select your grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                        <SelectItem key={g} value={`Grade ${g}`}>Grade {g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subjectStrengths" className="text-indigo-900 font-semibold">Strong Subjects</Label>
                  <Textarea
                    id="subjectStrengths"
                    value={formData.subjectStrengths}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectStrengths: e.target.value }))}
                    placeholder="e.g., Mathematics, Physics, Chemistry..."
                    className="bg-white border-indigo-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subjectWeaknesses" className="text-indigo-900 font-semibold">Weak Subjects</Label>
                  <Textarea
                    id="subjectWeaknesses"
                    value={formData.subjectWeaknesses}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectWeaknesses: e.target.value }))}
                    placeholder="e.g., English Literature, History..."
                    className="bg-white border-indigo-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests" className="text-indigo-900 font-semibold">Your Interests *</Label>
                <Textarea
                  id="interests"
                  value={formData.interests}
                  onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
                  placeholder="e.g., Coding, Medicine, Engineering, Art, Business, Music..."
                  className="bg-white border-indigo-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills" className="text-indigo-900 font-semibold">Current Skills</Label>
                <Textarea
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="e.g., Programming, Public Speaking, Leadership, Writing..."
                  className="bg-white border-indigo-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="futureGoals" className="text-indigo-900 font-semibold">Future Goals</Label>
                <Textarea
                  id="futureGoals"
                  value={formData.futureGoals}
                  onChange={(e) => setFormData(prev => ({ ...prev, futureGoals: e.target.value }))}
                  placeholder="Where do you see yourself in 5-10 years?"
                  className="bg-white border-indigo-200"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg font-semibold shadow-xl"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3" />
                    Analyzing Your Profile...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-3" />
                    Get Career Guidance
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-2 border-purple-100 bg-gradient-to-br from-white via-purple-50 to-pink-50 shadow-lg sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-3 text-purple-800">
                <TrendingUp className="w-6 h-6" />
                Your Career Guidance
              </CardTitle>
              <CardDescription>Personalized advice will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              {results ? (
                <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-inner max-h-[700px] overflow-y-auto">
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{results}</div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mx-auto flex items-center justify-center mb-4">
                    <BookOpen className="w-12 h-12 text-purple-600 opacity-50" />
                  </div>
                  <p className="text-gray-500 text-lg">Fill out your profile to get started</p>
                  <p className="text-sm text-gray-400 mt-2">Our AI will analyze and provide personalized career paths</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
