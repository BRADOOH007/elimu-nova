'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Wand2, BookOpen, FileText, Zap, Sparkles } from 'lucide-react';

const subjects = [
  'Mathematics', 'English', 'Kiswahili', 'Science and Technology',
  'Social Studies', 'Creative Arts', 'Physical Education',
  'Agriculture and Nutrition', 'Home Science', 'Religious Education'
];

const gradeLevels = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];

interface ExamData {
  examTitle: string;
  description: string;
  subject: string;
  gradeLevel: string;
  curriculum: string;
  numberOfQuestions: number;
  difficulty: string;
  totalMarks: number;
  duration: number;
  includeDiagrams: boolean;
  topics: string;
  focusAreas: string;
}

export function AIExamGenerator() {
  const [examData, setExamData] = useState<ExamData>({
    examTitle: '',
    description: '',
    subject: '',
    gradeLevel: '',
    curriculum: 'CBC',
    numberOfQuestions: 25,
    difficulty: 'medium',
    totalMarks: 100,
    duration: 90,
    includeDiagrams: true,
    topics: '',
    focusAreas: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!examData.examTitle || !examData.subject || !examData.gradeLevel) {
      alert('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedExam(data.examContent);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to generate exam');
      }
    } catch (error) {
      console.error('Error generating exam:', error);
      alert('An error occurred while generating the exam');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl">
          <Brain className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-700 bg-clip-text text-transparent">
          AI Exam Generator
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Create comprehensive, curriculum-aligned exams with AI-powered questions and marking schemes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="standard" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="standard">Standard Generator</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
            </TabsList>

            <TabsContent value="standard" className="space-y-6">
              <Card className="border-2 border-purple-100 bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-3 text-purple-800">
                    <Wand2 className="w-6 h-6" />
                    Exam Configuration
                  </CardTitle>
                  <CardDescription>Set up your exam basics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="examTitle" className="flex items-center gap-2 text-purple-900 font-semibold">
                        <BookOpen className="w-4 h-4" />
                        Exam Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="examTitle"
                        value={examData.examTitle}
                        onChange={(e) => setExamData(prev => ({ ...prev, examTitle: e.target.value }))}
                        placeholder="e.g., Grade 4 Mathematics End of Term 1"
                        className="bg-white border-purple-200 focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-purple-900 font-semibold">Subject <span className="text-red-500">*</span></Label>
                      <Select 
                        value={examData.subject} 
                        onValueChange={(v) => setExamData(prev => ({ ...prev, subject: v }))}
                      >
                        <SelectTrigger className="bg-white border-purple-200 focus:ring-2 focus:ring-purple-400">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(subject => (
                            <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-purple-900 font-semibold">Description</Label>
                    <Textarea
                      id="description"
                      value={examData.description}
                      onChange={(e) => setExamData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Briefly describe what this exam covers..."
                      rows={3}
                      className="bg-white border-purple-200 focus:ring-2 focus:ring-purple-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gradeLevel" className="text-purple-900 font-semibold">Grade Level <span className="text-red-500">*</span></Label>
                      <Select 
                        value={examData.gradeLevel} 
                        onValueChange={(v) => setExamData(prev => ({ ...prev, gradeLevel: v }))}
                      >
                        <SelectTrigger className="bg-white border-purple-200 focus:ring-2 focus:ring-purple-400">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {gradeLevels.map(grade => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="curriculum" className="text-purple-900 font-semibold">Curriculum</Label>
                      <Select 
                        value={examData.curriculum} 
                        onValueChange={(v) => setExamData(prev => ({ ...prev, curriculum: v }))}
                      >
                        <SelectTrigger className="bg-white border-purple-200 focus:ring-2 focus:ring-purple-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CBC">CBC (Kenya)</SelectItem>
                          <SelectItem value="8-4-4">8-4-4 System</SelectItem>
                          <SelectItem value="Cambridge">Cambridge International</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="difficulty" className="text-purple-900 font-semibold">Difficulty</Label>
                      <Select 
                        value={examData.difficulty} 
                        onValueChange={(v) => setExamData(prev => ({ ...prev, difficulty: v }))}
                      >
                        <SelectTrigger className="bg-white border-purple-200 focus:ring-2 focus:ring-purple-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numberOfQuestions" className="text-purple-900 font-semibold">Questions</Label>
                      <Input
                        id="numberOfQuestions"
                        type="number"
                        min="5"
                        max="100"
                        value={examData.numberOfQuestions}
                        onChange={(e) => setExamData(prev => ({ ...prev, numberOfQuestions: Number(e.target.value) || 25 }))}
                        className="bg-white border-purple-200 focus:ring-2 focus:ring-purple-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="totalMarks" className="text-purple-900 font-semibold">Total Marks</Label>
                      <Input
                        id="totalMarks"
                        type="number"
                        min="10"
                        max="200"
                        value={examData.totalMarks}
                        onChange={(e) => setExamData(prev => ({ ...prev, totalMarks: Number(e.target.value) || 100 }))}
                        className="bg-white border-purple-200 focus:ring-2 focus:ring-purple-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-purple-900 font-semibold">Duration (min)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="30"
                        max="180"
                        value={examData.duration}
                        onChange={(e) => setExamData(prev => ({ ...prev, duration: Number(e.target.value) || 90 }))}
                        className="bg-white border-purple-200 focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="topics" className="text-purple-900 font-semibold">Topics (comma-separated)</Label>
                      <Textarea
                        id="topics"
                        value={examData.topics}
                        onChange={(e) => setExamData(prev => ({ ...prev, topics: e.target.value }))}
                        placeholder="e.g., Fractions, Decimals, Geometry"
                        rows={2}
                        className="bg-white border-purple-200 focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="focusAreas" className="text-purple-900 font-semibold">Focus Areas</Label>
                      <Textarea
                        id="focusAreas"
                        value={examData.focusAreas}
                        onChange={(e) => setExamData(prev => ({ ...prev, focusAreas: e.target.value }))}
                        placeholder="e.g., Problem Solving, Critical Thinking"
                        rows={2}
                        className="bg-white border-purple-200 focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>

                  <div className="border-t border-purple-100 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <Label htmlFor="includeDiagrams" className="text-base font-semibold text-purple-900">
                            Include Diagrams & Illustrations
                          </Label>
                          <p className="text-sm text-gray-600">AI will create visual aids for better understanding</p>
                        </div>
                      </div>
                      <Switch
                        id="includeDiagrams"
                        checked={examData.includeDiagrams}
                        onCheckedChange={(checked) => setExamData(prev => ({ ...prev, includeDiagrams: checked }))}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-semibold shadow-xl"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                          Generating Exam...
                        </>
                      ) : (
                        <>
                          <Brain className="w-5 h-5 mr-3" />
                          Generate AI Exam with Marking Scheme
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <Card className="border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50 to-cyan-50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-3 text-blue-800">
                    <Zap className="w-6 h-6" />
                    Advanced Settings
                  </CardTitle>
                  <CardDescription>Fine-tune your exam generation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-600">Advanced features coming soon! Use the standard tab for now.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <Card className="border-2 border-green-100 bg-gradient-to-br from-white via-green-50 to-emerald-50 shadow-lg sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-3 text-green-800">
                <FileText className="w-6 h-6" />
                Preview
              </CardTitle>
              <CardDescription>Your exam will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedExam ? (
                <div className="bg-white rounded-xl border border-green-200 p-4 shadow-inner">
                  <p className="text-sm font-mono text-gray-700 whitespace-pre-wrap">{generatedExam}</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full mx-auto flex items-center justify-center mb-4">
                    <FileText className="w-12 h-12 text-green-600 opacity-50" />
                  </div>
                  <p className="text-gray-500 text-lg">Your generated exam will appear here</p>
                  <p className="text-sm text-gray-400 mt-2">Fill in the details and click generate</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
