'use client'

import { useState } from 'react'
import { PublicNav } from '@/components/ui/public-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BookOpen, ArrowRight, CheckCircle, Users, Brain, School, GraduationCap,
  UserCog, FileText, BarChart3, MessageSquare, CreditCard, Settings,
  ClipboardList, Sparkles, Globe, Shield, Layers, UserPlus, BookMarked,
  Clock, Target, Star, ChevronRight, Search, Play, Download, Upload,
  Link as LinkIcon, Eye, Edit3, Trash2, RefreshCw, Bell, Calendar
} from 'lucide-react'
import Link from 'next/link'

interface Step {
  icon: any
  title: string
  desc: string
}

interface Feature {
  icon: any
  title: string
  desc: string
  steps: Step[]
}

interface RoleSection {
  role: string
  icon: any
  color: string
  badge: string
  summary: string
  features: Feature[]
}

const ROLES: RoleSection[] = [
  {
    role: 'School Admin',
    icon: School,
    color: 'from-emerald-500 to-teal-600',
    badge: 'Administration',
    summary: 'Manage your school, teachers, students, classes, and subscriptions from one central dashboard.',
    features: [
      {
        icon: Layers,
        title: 'Class & Grade Management',
        desc: 'Create and organize classes, assign teachers, and manage grade levels.',
        steps: [
          { icon: School, title: 'Create a Class', desc: 'Navigate to Classes → Create Class. Enter the class name, grade level, and select subjects offered.' },
          { icon: UserPlus, title: 'Assign Teachers', desc: 'From the class detail page, click Assign Teacher. Select from your registered teachers list.' },
          { icon: Users, title: 'Manage Students', desc: 'View all students in a class, transfer between classes, or archive graduated students.' },
          { icon: Settings, title: 'Configure Subjects', desc: 'Go to Settings → Subjects to add, edit, or remove subjects offered at your school.' },
        ]
      },
      {
        icon: UserCog,
        title: 'Teacher Management',
        desc: 'Onboard, manage, and support your teaching staff.',
        steps: [
          { icon: UserPlus, title: 'Add a Teacher', desc: 'Go to Teachers → Add Teacher. Enter their details — name, email, phone, subjects, and assigned classes.' },
          { icon: Edit3, title: 'Edit Teacher Profile', desc: 'Click any teacher card to edit their information, reassign subjects, or update class rosters.' },
          { icon: Eye, title: 'Monitor Activity', desc: 'View teacher login history, content created, and student engagement metrics in the teacher detail view.' },
          { icon: Trash2, title: 'Remove a Teacher', desc: 'Use the actions menu on a teacher card to deactivate or remove. Deactivated teachers retain their data.' },
        ]
      },
      {
        icon: UserPlus,
        title: 'Student Enrollment',
        desc: 'Enroll students individually or in bulk, manage their profiles and class assignments.',
        steps: [
          { icon: Upload, title: 'Bulk Enrollment', desc: 'Go to Students → Bulk Enroll. Download the CSV template, fill in student data, and upload. The system will create accounts and assign classes.' },
          { icon: UserPlus, title: 'Single Enrollment', desc: 'Click Add Student, fill in name, grade, and optional parent contact. The student gets login credentials.' },
          { icon: Users, title: 'Assign to Classes', desc: 'Select students and use the Assign to Class action to move them into the appropriate class group.' },
          { icon: Search, title: 'Search & Filter', desc: 'Use the search bar to find students by name or ID. Filter by class, grade level, or enrollment status.' },
        ]
      },
      {
        icon: BarChart3,
        title: 'Reports & Analytics',
        desc: 'Track school-wide performance, engagement, and usage metrics.',
        steps: [
          { icon: BarChart3, title: 'Dashboard Overview', desc: 'Your dashboard shows active teachers, total students, class counts, and recent activity at a glance.' },
          { icon: Target, title: 'Performance Reports', desc: 'View aggregated student performance across classes and subjects. Export reports as PDF or CSV.' },
          { icon: Star, title: 'Engagement Metrics', desc: 'See which teachers and classes are most active. Monitor AI tool usage and content creation trends.' },
          { icon: Clock, title: 'Usage History', desc: 'Access login logs, feature usage stats, and subscription consumption data in the analytics section.' },
        ]
      },
      {
        icon: CreditCard,
        title: 'Subscription & Billing',
        desc: 'Manage your school subscription, renew plans, and view billing history.',
        steps: [
          { icon: CreditCard, title: 'View Current Plan', desc: 'Go to Settings → Billing to see your active subscription, renewal date, and plan details.' },
          { icon: RefreshCw, title: 'Renew Subscription', desc: 'Click Renew Subscription, select a package, and confirm. The new period starts immediately after the current one ends.' },
          { icon: Eye, title: 'Billing History', desc: 'View all past invoices, payment records, and subscription changes in the Billing section.' },
          { icon: Settings, title: 'Update Payment Method', desc: 'Change your payment method or update billing contact information from the Billing settings page.' },
        ]
      },
      {
        icon: Globe,
        title: 'School Settings',
        desc: 'Configure school-wide preferences, branding, and security settings.',
        steps: [
          { icon: School, title: 'School Profile', desc: 'Update school name, address, logo, and contact information in Settings → School Profile.' },
          { icon: Shield, title: 'Security', desc: 'Set password policies, session timeouts, and two-factor authentication requirements.' },
          { icon: Bell, title: 'Notifications', desc: 'Configure automated notifications for new enrollments, teacher activity, and subscription alerts.' },
          { icon: Settings, title: 'System Preferences', desc: 'Set default grade scales, academic terms, holiday schedules, and curriculum frameworks used by your school.' },
        ]
      },
    ]
  },
  {
    role: 'Teacher',
    icon: GraduationCap,
    color: 'from-blue-500 to-purple-600',
    badge: 'Teaching',
    summary: 'Create AI-powered lesson plans, manage classes, track student progress, and communicate with parents.',
    features: [
      {
        icon: FileText,
        title: 'AI Lesson Plans',
        desc: 'Generate comprehensive lesson plans with AI assistance in seconds.',
        steps: [
          { icon: Sparkles, title: 'Generate a Lesson Plan', desc: 'Go to Lesson Plans → Create New. Enter the subject, grade, topic, and learning objectives. Click Generate with AI.' },
          { icon: Edit3, title: 'Customize Content', desc: 'The AI generates a full plan. You can edit any section — objectives, activities, assessments, materials.' },
          { icon: Download, title: 'Download & Export', desc: 'Export as PDF, Word (.docx), or PowerPoint (.pptx). Perfect for sharing or printing.' },
          { icon: Eye, title: 'View Saved Plans', desc: 'Browse, search, and filter your saved lesson plans. Click any plan to view, edit, or download again.' },
        ]
      },
      {
        icon: BookMarked,
        title: 'Schemes of Work',
        desc: 'Plan your entire term or year with AI-generated schemes of work.',
        steps: [
          { icon: Sparkles, title: 'Generate Scheme', desc: 'Go to Schemes of Work → Create New. Specify subject, grade, term duration, and topics.' },
          { icon: Edit3, title: 'Review & Refine', desc: 'The AI proposes a week-by-week breakdown. Adjust topics, add learning outcomes, or reorder weeks.' },
          { icon: Download, title: 'Export Scheme', desc: 'Download your scheme as PDF or Word document for curriculum submission or sharing.' },
          { icon: Eye, title: 'Manage Schemes', desc: 'View all your schemes in one place. Duplicate, edit, or archive past schemes.' },
        ]
      },
      {
        icon: Users,
        title: 'Class & Student Management',
        desc: 'Organize your classes, track student progress, and manage enrollment.',
        steps: [
          { icon: Users, title: 'View My Classes', desc: 'Your dashboard shows assigned classes. Click a class to see enrolled students and their details.' },
          { icon: Search, title: 'Student Profiles', desc: 'Click any student name to view their profile, progress, assignments, and engagement history.' },
          { icon: BarChart3, title: 'Track Progress', desc: 'The Progress tab shows performance trends, AI insights, and areas needing attention for each student.' },
          { icon: UserPlus, title: 'Enroll New Students', desc: 'From a class page, click Enroll Student. Fill in their details or select from unenrolled students.' },
        ]
      },
      {
        icon: ClipboardList,
        title: 'Assignments & Assessments',
        desc: 'Create, distribute, and grade assignments with AI assistance.',
        steps: [
          { icon: Sparkles, title: 'Create Assignment', desc: 'Go to Assignments → Create. Use AI to generate questions or write your own. Set due dates and pass marks.' },
          { icon: Eye, title: 'Review Submissions', desc: 'View all submissions in one place. See who submitted on time, late, or hasn\'t submitted yet.' },
          { icon: Star, title: 'Grade with AI', desc: 'Use the AI grading assistant to evaluate open-ended responses. Review and adjust grades before publishing.' },
          { icon: Download, title: 'Export Results', desc: 'Download grade sheets as CSV or PDF. Share results with students and parents.' },
        ]
      },
      {
        icon: Brain,
        title: 'AI Tools Suite',
        desc: 'Leverage advanced AI tools for teaching, content creation, and student support.',
        steps: [
          { icon: Sparkles, title: 'Hope AI Assistant', desc: 'Your 24/7 teaching assistant. Ask questions about pedagogy, get activity ideas, or brainstorm lesson hooks.' },
          { icon: Star, title: 'AI Quiz Generator', desc: 'Generate multiple-choice, short-answer, or essay questions on any topic. Adjust difficulty levels.' },
          { icon: Eye, title: 'Image Generation', desc: 'Create custom educational images and diagrams to enhance your teaching materials.' },
          { icon: Target, title: 'AI Tutor', desc: 'Students can interact with the AI tutor for personalized help. Track which students use it and what they ask.' },
        ]
      },
      {
        icon: MessageSquare,
        title: 'Communication',
        desc: 'Stay connected with students, parents, and colleagues.',
        steps: [
          { icon: MessageSquare, title: 'Send Messages', desc: 'Go to Messages. Select recipients — individual students, whole classes, or parents.' },
          { icon: Bell, title: 'Announcements', desc: 'Create class-wide announcements that appear on student dashboards and trigger notifications.' },
          { icon: Users, title: 'Parent Communication', desc: 'The Parents tab shows connected parents. Send updates, schedule alerts, or share progress reports.' },
          { icon: Calendar, title: 'Schedule Updates', desc: 'Set up recurring updates — weekly progress summaries, assignment reminders, or event notifications.' },
        ]
      },
    ]
  },
  {
    role: 'Student',
    icon: BookOpen,
    color: 'from-orange-500 to-red-500',
    badge: 'Learning',
    summary: 'Access assignments, track your progress, use the AI tutor, and stay connected with your teachers.',
    features: [
      {
        icon: BarChart3,
        title: 'Student Dashboard',
        desc: 'Your personalized hub for all learning activities.',
        steps: [
          { icon: Eye, title: 'Overview at a Glance', desc: 'See upcoming assignments, recent grades, new messages, and your overall progress right on the dashboard.' },
          { icon: Star, title: 'Recent Activity', desc: 'View your latest submissions, teacher feedback, and achievements in the activity feed.' },
          { icon: Target, title: 'Progress Summary', desc: 'Quickly see your performance trends and areas where you\'re excelling or need improvement.' },
          { icon: Bell, title: 'Notifications', desc: 'Get notified about new assignments, grades published, and messages from teachers.' },
        ]
      },
      {
        icon: ClipboardList,
        title: 'Assignments',
        desc: 'View, complete, and submit your assignments.',
        steps: [
          { icon: Eye, title: 'View Assignments', desc: 'Go to Assignments to see all pending, submitted, and graded work. Filter by subject or due date.' },
          { icon: Edit3, title: 'Complete & Submit', desc: 'Click an assignment to view instructions. Complete your work and submit it directly through the platform.' },
          { icon: Eye, title: 'View Grades', desc: 'Once graded, see your score, teacher comments, and answer feedback in the assignment detail view.' },
          { icon: Download, title: 'Download Materials', desc: 'Download any assignment materials, resources, or reference files provided by your teacher.' },
        ]
      },
      {
        icon: Brain,
        title: 'AI Tutor',
        desc: 'Get personalized help from the AI tutor whenever you need it.',
        steps: [
          { icon: Play, title: 'Start a Session', desc: 'Go to AI Tutor. Type your question or select a topic you\'re studying. The AI will guide you step by step.' },
          { icon: Star, title: 'Practice Questions', desc: 'Ask the AI tutor to generate practice questions on any subject. Get instant feedback on your answers.' },
          { icon: Target, title: 'Study Help', desc: 'Stuck on a concept? Explain what you\'re learning and the AI tutor will help you understand it better.' },
          { icon: Eye, title: 'Session History', desc: 'Review your past tutoring sessions. The AI remembers context so you can continue where you left off.' },
        ]
      },
      {
        icon: BarChart3,
        title: 'Progress & Reports',
        desc: 'Track your learning journey with detailed progress insights.',
        steps: [
          { icon: Target, title: 'Performance Dashboard', desc: 'View your grades across all subjects, trend lines showing improvement over time, and subject strengths.' },
          { icon: Star, title: 'Achievements', desc: 'Earn badges for consistency, improvement, and academic excellence. Share them with your parents.' },
          { icon: Eye, title: 'Teacher Feedback', desc: 'Read personalized feedback from teachers on your assignments and overall performance.' },
          { icon: Download, title: 'Download Reports', desc: 'Download your progress reports to share with parents or keep for your records.' },
        ]
      },
      {
        icon: MessageSquare,
        title: 'Messages & Communication',
        desc: 'Stay connected with your teachers and receive important updates.',
        steps: [
          { icon: MessageSquare, title: 'Send Messages', desc: 'Go to Messages to contact your teachers directly. Ask questions about assignments or lessons.' },
          { icon: Bell, title: 'Class Announcements', desc: 'View announcements from your teachers in the Notifications section. Important updates appear at the top.' },
          { icon: Calendar, title: 'Schedule', desc: 'Check your class schedule, upcoming assignment due dates, and school events in one place.' },
          { icon: Eye, title: 'Read Receipts', desc: 'See when teachers have read your messages. Get notified when you receive a reply.' },
        ]
      },
    ]
  },
  {
    role: 'Parent',
    icon: Users,
    color: 'from-pink-500 to-rose-600',
    badge: 'Parenting',
    summary: 'Monitor your children\'s academic progress, communicate with teachers, and stay informed about school activities.',
    features: [
      {
        icon: BarChart3,
        title: 'Parent Dashboard',
        desc: 'A consolidated view of all your children\'s academic activities.',
        steps: [
          { icon: Eye, title: 'Overview Dashboard', desc: 'See all your children\'s recent grades, upcoming assignments, and teacher messages in one place.' },
          { icon: Star, title: 'Activity Feed', desc: 'View a chronological feed of new grades, assignment submissions, and teacher communications.' },
          { icon: Bell, title: 'Notifications', desc: 'Get real-time alerts when your child submits work, receives a grade, or a teacher sends a message.' },
          { icon: Calendar, title: 'School Calendar', desc: 'View school events, exam schedules, and holidays relevant to your children\'s classes.' },
        ]
      },
      {
        icon: Eye,
        title: 'Monitor Progress',
        desc: 'Track each child\'s academic performance and learning journey in detail.',
        steps: [
          { icon: Target, title: 'Subject Performance', desc: 'Click on any child to see their performance breakdown by subject. Identify strengths and areas needing support.' },
          { icon: BarChart3, title: 'Trend Graphs', desc: 'View performance trends over time — weekly, monthly, or term-by-term comparisons.' },
          { icon: Star, title: 'AI Insights', desc: 'Get AI-generated insights about your child\'s learning patterns, engagement levels, and suggested focus areas.' },
          { icon: Download, title: 'Download Reports', desc: 'Download comprehensive progress reports for each child to keep for your records or share with tutors.' },
        ]
      },
      {
        icon: MessageSquare,
        title: 'Teacher Communication',
        desc: 'Stay in direct contact with your children\'s teachers.',
        steps: [
          { icon: MessageSquare, title: 'Send Messages', desc: 'Go to Messages, select your child, then select their teacher. Send questions, updates, or concerns directly.' },
          { icon: Eye, title: 'Teacher Updates', desc: 'Receive scheduled updates from teachers about classroom activities, upcoming tests, and your child\'s progress.' },
          { icon: Bell, title: 'Alert Preferences', desc: 'Configure which notifications you want to receive — grade alerts, attendance issues, or general announcements.' },
          { icon: Calendar, title: 'Schedule Meetings', desc: 'Request parent-teacher meetings directly through the platform. View upcoming scheduled meetings.' },
        ]
      },
      {
        icon: ClipboardList,
        title: 'Assignments & Submissions',
        desc: 'See what your children are working on and how they\'re performing.',
        steps: [
          { icon: Eye, title: 'View Assignments', desc: 'See all current and past assignments for each child. Filter by subject, status, or due date.' },
          { icon: Star, title: 'Submission Status', desc: 'Check whether assignments are pending, submitted, or overdue. Get notified about upcoming deadlines.' },
          { icon: Eye, title: 'Graded Work', desc: 'View completed and graded assignments with teacher feedback and scores.' },
          { icon: Download, title: 'Download Materials', desc: 'Access and download assignment materials, study guides, and reference resources.' },
        ]
      },
      {
        icon: School,
        title: 'School Connection',
        desc: 'Stay informed about school activities and your children\'s school life.',
        steps: [
          { icon: School, title: 'School Information', desc: 'View school details, contact information, and important announcements from the administration.' },
          { icon: Calendar, title: 'Events Calendar', desc: 'View upcoming school events, parent-teacher conferences, holidays, and exam schedules.' },
          { icon: Users, title: 'Multiple Children', desc: 'If you have multiple children enrolled, switch between their profiles to view individual progress.' },
          { icon: Settings, title: 'Account Settings', desc: 'Update your profile, notification preferences, and communication settings from the Settings page.' },
        ]
      },
    ]
  }
]

function RoleTab({ active, role, icon: Icon, color, onClick }: {
  active: boolean; role: string; icon: any; color: string; onClick: () => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`relative flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
        active
          ? `bg-gradient-to-r ${color} text-white shadow-lg shadow-black/10 scale-[1.02]`
          : 'bg-white/60 text-gray-600 hover:bg-white hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        active ? 'bg-white/20' : `bg-gradient-to-br ${color} bg-clip-text`
      }`}>
        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-transparent'}`} />
      </div>
      <span>{role}</span>
      {hover && !active && (
        <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3" />
      )}
    </button>
  )
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <Card className="border border-gray-200/80 bg-white/70 backdrop-blur-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <feature.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">{feature.title}</CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-0.5">{feature.desc}</CardDescription>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          <div className="border-t border-gray-100 pt-4 space-y-4">
            {feature.steps.map((step, si) => (
              <div key={si} className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                    <step.icon className="w-4 h-4 text-white" />
                  </div>
                  {si < feature.steps.length - 1 && (
                    <div className="w-px flex-1 bg-gradient-to-b from-blue-300 to-transparent min-h-[24px] mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">{step.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default function FeatureGuidePage() {
  const [activeRole, setActiveRole] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const current = ROLES[activeRole]

  const filteredFeatures = current.features.filter(f =>
    !searchQuery ||
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.steps.some(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      <div className="max-w-full overflow-x-auto">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-pink-400/10 to-rose-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <PublicNav />

        {/* Hero */}
        <section className="relative z-10 container mx-auto px-4 pt-32 pb-16 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                Complete Feature Guide
              </span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
              Everything you need to know about using ElimuNova AI — from creating classes and enrolling students to generating lesson plans and tracking progress.
            </p>

            {/* Role Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mb-8">
              {ROLES.map((r, i) => (
                <RoleTab
                  key={r.role}
                  active={activeRole === i}
                  role={r.role}
                  icon={r.icon}
                  color={r.color}
                  onClick={() => setActiveRole(i)}
                />
              ))}
            </div>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${current.role.toLowerCase()} features...`}
                className="w-full h-12 pl-11 pr-4 bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="relative z-10 pb-24">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              {/* Role Header */}
              <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r ${current.color} text-white text-sm font-semibold mb-2 shadow-lg`}>
                <current.icon className="w-4 h-4" />
                <span>{current.badge}</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{current.role} Guide</h2>
              <p className="text-gray-500 mb-10 max-w-2xl">{current.summary}</p>

              {filteredFeatures.length === 0 ? (
                <div className="text-center py-16 bg-white/40 rounded-2xl border border-dashed border-gray-200">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium mb-1">No features found</p>
                  <p className="text-gray-400 text-sm">Try a different search term or browse the tabs above.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-5">
                  {filteredFeatures.map((feature, i) => (
                    <FeatureCard key={feature.title} feature={feature} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative z-10 pb-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5 border border-blue-200/50 rounded-3xl p-10 text-center">
              <BookOpen className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Need More Help?</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Can't find what you're looking for? Check our other resources or contact support.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/help">
                  <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full px-6">
                    Help Center
                  </Button>
                </Link>
                <Link href="/help/getting-started">
                  <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full px-6">
                    Getting Started
                  </Button>
                </Link>
                <Link href="/help/best-practices">
                  <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full px-6">
                    Best Practices
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
