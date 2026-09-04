'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Sparkles,
  CheckCircle,
  Brain,
  Calendar,
  BarChart3,
  Mail,
  Code,
  Target,
  TrendingUp,
  Users,
  Award,
  ClipboardList,
  School,
  ClipboardCheck,
  PenTool,
  Timer,
  Lightbulb,
  Route,
  Menu,
  X,
  Zap,
  Globe,
  Star,
  ChevronDown,
  MessageSquare,
  BookMarked,
  LayoutDashboard,
  Heart,
  AlertCircle,
  Compass,
  ShieldCheck,
  Server,
  Lock,
  CreditCard,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
  Facebook,
  MapPin,
  UserPlus,
  Rocket,
  Settings2,
} from "lucide-react";
import Link from "next/link"
import ParentProgressMockup from "@/components/landing/ParentProgressMockup"
import { Logo } from "@/components/ui/logo";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleIndex, setRoleIndex] = useState(0);
  const [studentTestimonialIndex, setStudentTestimonialIndex] = useState(0);
  const [teacherTestimonialIndex, setTeacherTestimonialIndex] = useState(0);

  const studentTestimonials = [
    { name: "Mercy K.", grade: "Grade 7", school: "Hopewell STEM Academy", quote: "Elimu Nova explains things in a way I actually understand. My Maths grade jumped two levels in one term — I never thought that was possible!", initial: "M" },
    { name: "Theophilus Boaz", grade: "Grade 7", school: "Hopewell STEM Academy", quote: "The AI tutor is like having a personal teacher who never gets tired. I can ask the same question ten times and it still explains patiently!", initial: "T" },
    { name: "Brian Githae", grade: "Grade 8", school: "Hopewell STEM Academy", quote: "I used to struggle with Science concepts, but Elimu Nova breaks them down with real examples I can relate to. My confidence has grown so much!", initial: "B" },
    { name: "Perminus Mbugua", grade: "Grade 8", school: "Hopewell STEM Academy", quote: "The quizzes after each topic really help me know what I've understood and what I need to review. It's like having a study buddy 24/7!", initial: "P" },
    { name: "Rita Wanjiku", grade: "Grade 7", school: "Hopewell STEM Academy", quote: "I love how the AI remembers what I've learned and connects new topics to things I already know. Learning finally makes sense!", initial: "R" },
    { name: "Patricia Mary", grade: "Grade 7", school: "Hopewell STEM Academy", quote: "Before Elimu Nova, I was afraid to ask questions in class. Now I can ask anything privately and actually enjoy studying!", initial: "P" },
    { name: "Shadrack Kipgogei", grade: "Grade 7", school: "Hopewell STEM Academy", quote: "The interactive lessons make studying feel like an adventure. I went from dreading homework to actually looking forward to it!", initial: "S" },
    { name: "Peter Lukuma", grade: "Grade 8", school: "Hopewell STEM Academy", quote: "My parents can see my progress in real-time. It motivates me to keep pushing because I know they're proud of my improvement!", initial: "P" },
  ];

  const teacherTestimonials = [
    { name: "Kairu Samuel", subject: "Science Teacher", school: "Hopewell STEM Academy", quote: "Before Elimu Nova, I spent weekends preparing lessons and marking. Now I finish everything during school hours and actually have time for my students." },
    { name: "James Muema", subject: "Mathematics Teacher", school: "Hopewell STEM Academy", quote: "The auto-marking feature is a game-changer. I upload 40 papers and get detailed feedback for each student in minutes. It's incredible!" },
    { name: "Md. Diana Chelagat", subject: "Integrated Science Teacher", school: "Hopewell STEM Academy", quote: "Elimu Nova helps me create differentiated lesson plans for mixed-ability classes. Every student gets content at their level — it's magical!" },
    { name: "Ruth Muchiri", subject: "Kiswahili Teacher", school: "Hopewell STEM Academy", quote: "The AI-generated schemes of work are curriculum-aligned and save me hours of planning. I can focus on what matters — teaching!" },
    { name: "Timothy Gachoka", subject: "Social Studies Teacher", school: "Hopewell STEM Academy", quote: "I've seen my students' engagement double since we started using Elimu Nova. The interactive lessons keep them hooked and curious!" },
  ];

  const roles = [
    {
      label: "Students",
      headline: "Learn anything, at your own pace.",
      sub: "An AI tutor that knows your syllabus, explains every concept clearly, and never runs out of patience.",
      color: "from-emerald-400 to-teal-400",
      cta: "Start Learning Free",
      ctaTo: "/auth",
      accent: "emerald",
    },
    {
      label: "Teachers",
      headline: "Teach more. Mark less.",
      sub: "Generate lesson plans, exams and marking schemes in seconds. Let AI handle the admin while you inspire.",
      color: "from-blue-400 to-indigo-400",
      cta: "See Teacher Tools",
      ctaTo: "/auth",
      accent: "blue",
    },
    {
      label: "Parents",
      headline: "Never miss your child's growth.",
      sub: "Real-time insights and AI-powered alerts keep you connected to your child's education — every single day.",
      color: "from-pink-400 to-purple-400",
      cta: "Parent Dashboard",
      ctaTo: "/parent/dashboard",
      accent: "pink",
    },
    {
      label: "Schools",
      headline: "A smarter school starts here.",
      sub: "Timetables, teacher allocation, student progress and parent reports — all automated and in one dashboard.",
      color: "from-violet-400 to-purple-400",
      cta: "Request a Demo",
      ctaTo: "/contact",
      accent: "violet",
    },
  ];

  // Auto-rotate roles every 3.5 s
  useEffect(() => {
    const t = setInterval(() => setRoleIndex((i) => (i + 1) % roles.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Auto-rotate student testimonials every 4 s
  useEffect(() => {
    const t = setInterval(() => setStudentTestimonialIndex((i) => (i + 1) % studentTestimonials.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Auto-rotate teacher testimonials every 4.5 s
  useEffect(() => {
    const t = setInterval(() => setTeacherTestimonialIndex((i) => (i + 1) % teacherTestimonials.length), 4500);
    return () => clearInterval(t);
  }, []);

  const activeRole = roles[roleIndex];

  const chatMessages = [
    { from: "student", text: "Explain photosynthesis simply." },
    { from: "ai", text: "Sure! Plants use sunlight to turn water + CO₂ into glucose and oxygen. It's how they make their own food 🌿" },
    { from: "student", text: "Give me a quiz question on it." },
    { from: "ai", text: "What gas do plants release during photosynthesis?\nA) CO₂  B) O₂  C) N₂  D) H₂" },
  ];

  return (
    <div className="min-h-screen bg-white font-sans" suppressHydrationWarning>
      {/* ── NAVBAR ── */}
      <header suppressHydrationWarning className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <Logo variant="white" size="lg" />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { to: "/about",   label: "About"   },
                { to: "/pricing", label: "Pricing" },
                { to: "/contact", label: "Contact" },
              ].map((n) => (
                <Link
                  key={n.to}
                  href={n.to}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {n.label}
                </Link>
              ))}
              <a
                href="#faq"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                FAQ
              </a>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/auth/signin">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-full px-5 shadow-md shadow-purple-200"
                >
                  Sign In <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu — full-width slide-down panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {[
                { to: "/about",   label: "About"   },
                { to: "/pricing", label: "Pricing" },
                { to: "/contact", label: "Contact" },
              ].map((item) => (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-base font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 text-base font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                FAQ
              </a>
            </div>
            <div className="max-w-7xl mx-auto px-4 pb-5 pt-2 border-t border-slate-100">
              <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl py-3">
                  Sign In <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="pt-16">
        {/* ── HERO ── */}
        <section className="relative z-0 overflow-hidden bg-gradient-to-br from-[#0f172a] via-indigo-950 to-[#0f172a] min-h-[95vh] flex items-center">
          {/* Grid texture overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
          {/* Glow orbs */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 w-full">
            <div className="grid lg:grid-cols-[1fr_480px] gap-12 lg:gap-16 items-center">

              {/* ── LEFT: Role-switching copy ── */}
              <div>
                {/* Audience pill tabs */}
                <div className="flex items-center gap-2 mb-8 flex-wrap">
                  {roles.map((r, i) => (
                    <button
                      key={r.label}
                      onClick={() => setRoleIndex(i)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 ${
                        i === roleIndex
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-purple-500/30"
                          : "bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                  <Zap className="h-3 w-3" />
                  AI-Powered Cloud School Platform
                </div>

                {/* Animated headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-white leading-[1.1] tracking-tight mb-4">
                  <span className={`bg-gradient-to-r ${activeRole.color} bg-clip-text text-transparent transition-all duration-500`}>
                    {activeRole.headline.split(",")[0]}{activeRole.headline.includes(",") ? "," : ""}
                  </span>
                  {activeRole.headline.includes(",") && (
                    <><br />{activeRole.headline.split(",").slice(1).join(",")}</>
                  )}
                </h1>

                <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-xl transition-all duration-500">
                  {activeRole.sub}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  <Link href="/auth/signup">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-slate-900 font-bold rounded-full px-8 shadow-lg shadow-purple-500/30 text-base text-white">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Start Free Trial
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button size="lg" className="bg-white/10 border border-white/20 text-white hover:bg-white/20 font-semibold rounded-full px-8">
                      Watch Demo
                    </Button>
                  </Link>
                </div>

                {/* Trust chips */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: Globe, text: "20+ Curricula" },
                    { icon: CheckCircle, text: "Multi-region" },
                    { icon: CheckCircle, text: "50K+ Lessons" },
                    { icon: CheckCircle, text: "Free to start" },
                  ].map(({ icon: Icon, text }) => (
                    <span key={text} className="flex items-center gap-1.5 text-slate-400 text-sm">
                      <Icon className="h-3.5 w-3.5 text-purple-400" />{text}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── RIGHT: AI chat mockup ── */}
              <div className="hidden lg:block">
                <div className="rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden">
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-700">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">Elimu Nova AI Tutor</p>
                      <span className="flex items-center gap-1 text-purple-400 text-[10px] font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                        Online · Always ready
                      </span>
                    </div>
                    <div className="ml-auto flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-purple-500/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500/70" />
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="p-4 space-y-3 min-h-[240px]">
                    {chatMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.from === "student" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        m.from === "student"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm"
                          : "bg-slate-700 text-slate-100 rounded-bl-sm"
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                    {/* Typing indicator */}
                    <div className="flex justify-start">
                      <div className="bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>

                  {/* Input bar */}
                  <div className="px-4 py-3 bg-slate-900 border-t border-slate-700 flex items-center gap-2">
                    <div className="flex-1 bg-slate-700 rounded-xl px-3 py-2 text-slate-400 text-sm">Ask anything about your lesson…</div>
                    <button className="h-8 w-8 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <ArrowRight className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Floating feature cards */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { icon: BookMarked, label: "Curriculum Aligned", c: "text-purple-400 bg-purple-500/10" },
                    { icon: LayoutDashboard, label: "Teacher Dashboard", c: "text-blue-400 bg-blue-500/10" },
                    { icon: MessageSquare, label: "Parent Dashboard", c: "text-pink-400 bg-pink-500/10" },
                  ].map((f) => (
                    <div key={f.label} className={`rounded-xl border border-white/10 p-3 flex flex-col items-center gap-1.5 ${f.c}`}>
                      <f.icon className="h-4 w-4" />
                      <span className="text-[10px] font-semibold text-slate-300 text-center leading-tight">{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-600 animate-bounce">
            <ChevronDown className="h-5 w-5" />
          </div>
        </section>

        {/* ── TRUST BAR — regions & reach ── */}
        <section className="bg-slate-900 border-y border-slate-800 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-7">
              Trusted by schools & educators worldwide
            </p>
            {/* Region chips */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-600 mr-1">Across</span>
              {[
                { code: "🇰🇪", label: "Kenya" },
                { code: "🇬🇧", label: "United Kingdom" },
                { code: "🇺🇸", label: "United States" },
                { code: "🇿🇦", label: "South Africa" },
                { code: "🇮🇳", label: "India" },
              ].map((r) => (
                <span key={r.label} className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/50 px-3.5 py-1.5 text-xs text-slate-300">
                  <span className="text-sm">{r.code}</span> {r.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── GLOBAL METRICS BAND ── */}
        <section className="relative bg-[#0a0f1e] border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x lg:divide-white/10">
              {[
                { v: "20+", label: "Curricula", sub: "CBC · Common Core · Cambridge · IGCSE · IB · CBSE · CAPS" },
                { v: "5", label: "Countries", sub: "Kenya · US · UK · India · South Africa" },
                { v: "50K+", label: "Lessons", sub: "Generated and growing daily" },
                { v: "99.9%", label: "Uptime", sub: "Cloud-native, always available" },
              ].map((s) => (
                <div key={s.label} className="text-center lg:px-8 py-4">
                  <div className="text-3xl md:text-4xl font-bold text-white tracking-tight tabular-nums">
                    {s.v}
                  </div>
                  <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-300/90">
                    {s.label}
                  </div>
                  <div className="mt-2 text-xs text-slate-500 leading-snug max-w-[180px] mx-auto">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-16 lg:py-20 bg-[#0f172a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px w-8 bg-purple-500" />
                <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">How it works</span>
                <div className="h-px w-8 bg-purple-500" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">A simpler classroom, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">in three steps</span></h2>
              <p className="text-slate-400 text-base">Whether you're a learner, teacher, parent or school — getting started is the same simple path.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-10 md:gap-6">
              {[
                { icon: UserPlus, step: "01", title: "Create your account", desc: "Pick your role and set up your profile. Schools onboard and import their whole class list in one go.", speed: "1 min" },
                { icon: Settings2, step: "02", title: "Set your curriculum", desc: "Tell us your syllabus, grade and region. Lessons, exams and plans adapt automatically to your framework.", speed: "2 min" },
                { icon: Rocket, step: "03", title: "Start learning & teaching", desc: "Generate lessons, mark work and track progress from day one. The AI gets smarter with every use.", speed: "Instant" },
              ].map((s) => (
                <div key={s.step} className="relative rounded-2xl border border-white/10 bg-slate-800/40 p-6 hover:border-purple-500/40 transition-colors">
                  <div className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-0.5 text-[11px] font-bold text-white">{s.step}</div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                    <s.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-2">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                    <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> {s.speed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOR STUDENTS ── */}
        <section id="features" className="py-20 lg:py-28 bg-[#0f172a] relative overflow-hidden">
          {/* Background accents */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Header */}
            <div className="max-w-2xl mb-16">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px w-8 bg-purple-500" />
                <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">For Learners, Worldwide</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-5">
                One AI tutor.<br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Every curriculum.</span>
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                From Nairobi to New York, the AI adapts to each learner's syllabus, pace and learning style —
                with personalised 1:1 tutoring available any time, in any timezone.
              </p>
            </div>

            {/* Feature cards grid — bento layout for a distinctive, non-template look */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4">
              {[
                {
                  icon: Sparkles,
                  title: "Ask Anything, Anytime",
                  desc: "A friendly tutor that turns any question into a clear, step-by-step explanation — day or night. Ask in class, at home, or on the bus and get an answer instantly.",
                  grad: "from-purple-500 to-violet-500",
                  glow: "group-hover:shadow-purple-500/20",
                  num: "01",
                  span: "lg:col-span-3",
                },
                {
                  icon: BookOpen,
                  title: "Every Curriculum, One Place",
                  desc: "CBC, Cambridge, Common Core, NGSS, TEKS, GED, IGCSE, IB and more — lessons built for each framework.",
                  grad: "from-blue-500 to-cyan-500",
                  glow: "group-hover:shadow-blue-500/20",
                  num: "02",
                  span: "lg:col-span-3",
                },
                {
                  icon: Code,
                  title: "Learn to Build",
                  desc: "From your first line of code to real projects, with a mentor that explains each step as you go.",
                  grad: "from-violet-500 to-purple-500",
                  glow: "group-hover:shadow-violet-500/20",
                  num: "03",
                  span: "lg:col-span-2",
                },
                {
                  icon: TrendingUp,
                  title: "See Your Growth",
                  desc: "Clear, visual progress reports that show exactly what you've mastered and what's next.",
                  grad: "from-blue-500 to-purple-500",
                  glow: "group-hover:shadow-blue-500/20",
                  num: "04",
                  span: "lg:col-span-2",
                },
                {
                  icon: Calendar,
                  title: "Live Classrooms",
                  desc: "Join real-time lessons and interact directly — with a tutor who answers your questions in the moment.",
                  grad: "from-pink-500 to-purple-500",
                  glow: "group-hover:shadow-pink-500/20",
                  num: "05",
                  span: "lg:col-span-2",
                },
                {
                  icon: ClipboardList,
                  title: "Practice That Adapts",
                  desc: "Exercises tuned to your level, with instant feedback and hints the moment you get stuck.",
                  grad: "from-teal-500 to-emerald-500",
                  glow: "group-hover:shadow-teal-500/20",
                  num: "06",
                  span: "lg:col-span-3",
                },
                {
                  icon: GraduationCap,
                  title: "Plan Your Path",
                  desc: "Discover courses and subjects that match your strengths and what you want to achieve.",
                  grad: "from-purple-500 to-blue-500",
                  glow: "group-hover:shadow-purple-500/20",
                  num: "07",
                  span: "lg:col-span-2",
                },
                {
                  icon: Brain,
                  title: "Remembers You",
                  desc: "The more you learn, the better it tailors everything to how you think and what you need.",
                  grad: "from-fuchsia-500 to-pink-500",
                  glow: "group-hover:shadow-fuchsia-500/20",
                  num: "08",
                  span: "lg:col-span-1",
                },
              ].map((f, idx) => (
                <div
                  key={f.title}
                  className={"group relative bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl " + f.glow + " hover:border-slate-600 " + f.span}
                  style={{ animationDelay: idx * 80 + "ms" }}
                >
                  {/* Top gradient line */}
                  <div className={"absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r " + f.grad + " opacity-0 group-hover:opacity-100 transition-opacity duration-300"} />
                  {/* Background glow on hover */}
                  <div className={"absolute inset-0 bg-gradient-to-br " + f.grad + " opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 rounded-2xl"} />

                  <div className="relative h-full flex flex-col">
                    {/* Number + icon row */}
                    <div className="flex items-start justify-between mb-5">
                      <div className={"w-11 h-11 rounded-xl bg-gradient-to-br " + f.grad + " flex items-center justify-center shadow-lg"}>
                        <f.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-slate-700 text-xs font-bold tabular-nums">{f.num}</span>
                    </div>

                    <h3 className="font-bold text-white text-base mb-2 group-hover:text-white transition-colors">{f.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">{f.desc}</p>

                    {/* Arrow that appears on hover */}
                    <div className="mt-auto pt-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                      <span className={"text-xs font-semibold bg-gradient-to-r " + f.grad + " bg-clip-text text-transparent"}>Explore</span>
                      <ArrowRight className="h-3 w-3 text-purple-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Student testimonial */}
            <div className="mt-12 relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-violet-600/20 backdrop-blur-sm" />
              <div className="absolute inset-0 border border-purple-500/20 rounded-2xl" />
              <div className="relative flex gap-4 sm:gap-6 items-start p-6 sm:p-8" key={studentTestimonialIndex}>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white font-extrabold flex items-center justify-center text-lg flex-shrink-0 shadow-lg transition-all duration-500">{studentTestimonials[studentTestimonialIndex].initial}</div>
                <div>
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-purple-400 text-purple-400" />)}
                  </div>
                  <p className="text-slate-200 text-base italic leading-relaxed mb-3 transition-opacity duration-500">
                    "{studentTestimonials[studentTestimonialIndex].quote}"
                  </p>
                  <p className="text-purple-300 font-semibold text-sm transition-opacity duration-500">{studentTestimonials[studentTestimonialIndex].name} — {studentTestimonials[studentTestimonialIndex].grade} Student, {studentTestimonials[studentTestimonialIndex].school}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOR TEACHERS ── */}
        <section id="teachers" className="py-20 lg:py-28 bg-slate-950 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              <div className="lg:sticky lg:top-24">
                <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">For Educators</span>
                <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight text-white">
                  Teach more.<br />
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Mark less.</span>
                </h2>
                <p className="mt-4 text-slate-400 text-base leading-relaxed">
                  Teachers across every curriculum save hours weekly. Elimu Nova automates the repetitive
                  work — planning, notes, exams and marking — so you can focus on what only a great teacher can do.
                </p>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  {[{ v: "12h+", l: "Saved / week" }, { v: "94%", l: "Syllabus coverage" }, { v: "3×", l: "Faster marking" }].map((s) => (
                    <div key={s.l} className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                      <div className="text-2xl font-extrabold text-purple-400">{s.v}</div>
                      <div className="text-slate-400 text-xs mt-1">{s.l}</div>
                    </div>
                  ))}
                </div>

                <blockquote className="mt-8 border-l-2 border-purple-500 pl-5" key={teacherTestimonialIndex}>
                  <p className="text-slate-300 italic leading-relaxed transition-opacity duration-500">
                    "{teacherTestimonials[teacherTestimonialIndex].quote}"
                  </p>
                  <footer className="mt-2 text-purple-400 font-semibold text-sm transition-opacity duration-500">
                    — {teacherTestimonials[teacherTestimonialIndex].name}, {teacherTestimonials[teacherTestimonialIndex].subject} · {teacherTestimonials[teacherTestimonialIndex].school}
                  </footer>
                </blockquote>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Timer, title: "Planning, Done in Minutes", desc: "Draft lesson plans with objectives, activities and assessments built for your curriculum — no overnight prep." },
                  { icon: PenTool, title: "Notes & Slides on Demand", desc: "Turn any lesson into polished notes or a presentation you can use right in class." },
                  { icon: ClipboardCheck, title: "Exams in Seconds", desc: "Build exams with answer schemes, mixing structured, essay and multiple-choice formats." },
                  { icon: BarChart3, title: "Grading That Helps", desc: "Mark submissions fast and get per-student feedback you can act on immediately." },
                  { icon: Target, title: "Rubrics That Understand", desc: "Track achievement levels with built-in rubrics aligned to real classroom practice." },
                  { icon: Lightbulb, title: "Ideas When You Need Them", desc: "Get suggestions for support, enrichment and revision based on how your class is doing." },
                ].map((f) => (
                  <div key={f.title} className="flex gap-4 p-5 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-purple-700/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                      <f.icon className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">{f.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FOR PARENTS ── */}
        <section id="parents" className="relative overflow-hidden bg-slate-950 py-20 lg:py-28">
          {/* Background texture + glows */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
          <div className="absolute top-1/4 left-0 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Top label + headline */}
            <div className="max-w-xl mb-14">
              <div className="inline-flex items-center gap-2.5 bg-pink-500/20 border border-pink-500/40 text-pink-300 text-lg font-bold px-6 py-2.5 rounded-full mb-6">
                <Heart className="h-5 w-5" /> For Parents & Guardians
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-4">
                See the whole picture,<br />
                <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">not just report cards.</span>
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                Real-time insights and early alerts keep you connected to your child's learning — across every
                subject, every day, wherever you are.
              </p>
            </div>

            {/* Main grid: features left, mockup right */}
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

              {/* Left: stats + feature list */}
              <div className="space-y-8">
                {/* Stat pills */}
                <div className="flex flex-wrap gap-4">
                  {[
                    { val: "92%", desc: "Parents more engaged", from: "from-pink-500", to: "to-purple-500" },
                    { val: "3× Faster", desc: "Problem detection", from: "from-purple-500", to: "to-blue-500" },
                  ].map((s) => (
                    <div key={s.val} className="flex-1 min-w-[140px] relative rounded-2xl overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${s.from} ${s.to} opacity-15`} />
                      <div className="relative border border-white/10 rounded-2xl p-5">
                        <div className={`text-3xl font-extrabold bg-gradient-to-r ${s.from} ${s.to} bg-clip-text text-transparent mb-1`}>{s.val}</div>
                        <p className="text-slate-400 text-xs font-medium">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feature rows */}
                <div className="space-y-3">
                  {[
                    { icon: BarChart3, title: "Live Progress Dashboard", desc: "See today's lessons, quiz scores and study time at a glance.", grad: "from-blue-500 to-cyan-400" },
                    { icon: AlertCircle, title: "Early Warning Alerts", desc: "AI flags struggles weeks before report cards — so you can act fast.", grad: "from-orange-500 to-purple-400" },
                    { icon: TrendingUp, title: "Subject Growth Trends", desc: "Track improvement across all subjects with easy visual analytics.", grad: "from-emerald-500 to-teal-400" },
                    { icon: Compass, title: "Career Pathway Guidance", desc: "Personalised university and career recommendations based on strengths.", grad: "from-purple-500 to-violet-400" },
                  ].map((f) => (
                    <div key={f.title} className="group flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/10 hover:border-white/15 transition-all duration-200">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${f.grad} flex items-center justify-center shadow-lg`}>
                        <f.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm mb-0.5">{f.title}</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Testimonial */}
                <div className="rounded-2xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-white/10 p-5">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-purple-400 text-purple-400" />)}
                  </div>
                  <p className="text-slate-300 text-sm italic leading-relaxed mb-4">
                    "I used to wait for termly report cards. Now I check the dashboard weekly and act immediately when my child needs help. Absolute game-changer."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-extrabold text-white text-sm">H</div>
                    <div>
                      <p className="text-white font-semibold text-sm">Hekima Praise</p>
                      <p className="text-slate-500 text-xs">Grade 8 Parent · Nairobi Excellence Academy</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: mockup */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-sm">
                  <div className="relative">
                    {/* Glow behind card */}
                    <div className="absolute -inset-4 bg-gradient-to-br from-pink-500/30 to-purple-500/20 rounded-3xl blur-2xl" />
                    <div className="relative">
                      <ParentProgressMockup />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 justify-center bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <p className="text-slate-400 text-xs">Updates live as your child learns</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOR SCHOOLS ── */}
        <section id="schools" className="py-20 lg:py-28 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-purple-600 text-xs font-bold uppercase tracking-widest">For Schools & Districts</span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Run a modern school, anywhere in the world.</h2>
              <p className="mt-4 text-slate-500 text-base leading-relaxed">
                Automate timetables, teacher allocation and reporting with an operating system built for education —
                from a single classroom to a national network.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {[
                { v: "23", l: "Schools onboarded", c: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
                { v: "35%", l: "Mean score improvement", c: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                { v: "40%", l: "Less admin work", c: "text-violet-600", bg: "bg-violet-50 border-violet-100" },
                { v: "15K+", l: "Students learning", c: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
              ].map((s) => (
                <div key={s.l} className={`rounded-xl border p-5 text-center ${s.bg}`}>
                  <div className={`text-3xl font-extrabold ${s.c}`}>{s.v}</div>
                  <div className="text-slate-500 text-xs mt-1">{s.l}</div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: Users, title: "Smart Teacher Allocation", desc: "AI matches teachers to classes based on specialisation, workload and student needs." },
                { icon: Calendar, title: "Auto Timetable Generation", desc: "Conflict-free timetables in minutes. Handles complex constraints and teacher preferences." },
                { icon: TrendingUp, title: "Real-Time Academic Tracking", desc: "Monitor every student across all subjects. Identify at-risk learners early and track interventions." },
                { icon: Award, title: "Competency-Based Assessment", desc: "Built-in rubrics for authentic assessment. Track core competencies alongside academics." },
              ].map((f) => (
                <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md hover:border-purple-200 transition-all">
                  <div className="h-11 w-11 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* school testimonial */}
            <div className="mt-12 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 flex gap-4 sm:gap-6 items-start shadow-sm">
              <div className="h-12 w-12 rounded-full bg-purple-700 text-white font-extrabold flex items-center justify-center text-lg flex-shrink-0">D</div>
              <div>
                <p className="text-slate-700 text-base italic leading-relaxed mb-3">
                  "Elimu Nova has transformed how we operate. Our teachers are more empowered, parents are actively involved, and student performance has improved remarkably in just one academic year."
                </p>
                <p className="text-slate-900 font-semibold text-sm">Md. Purity — Principal, Hopewell STEM Academy</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMPARISON ── */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-purple-600 text-xs font-bold uppercase tracking-widest">The Difference</span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Built for every learner, globally</h2>
              <p className="mt-3 text-slate-500 text-base">One platform that works from pre-primary to adult education — in any curriculum.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  title: "Traditional Learning",
                  highlight: false,
                  items: [
                    { ok: false, t: "One-size-fits-all teaching" },
                    { ok: false, t: "No after-school support" },
                    { ok: false, t: "Hard to track progress" },
                    { ok: false, t: "Marking takes days" },
                    { ok: false, t: "No digital resources" },
                  ],
                },
                {
                  title: "Other EdTech Platforms",
                  highlight: false,
                  items: [
                    { ok: false, t: "Not aligned to local curricula" },
                    { ok: false, t: "Generic AI not curriculum-trained" },
                    { ok: false, t: "No school admin tools" },
                    { ok: false, t: "No parent visibility" },
                  ],
                },
                {
                  title: "With Elimu Nova",
                  highlight: true,
                  badge: "Best Choice",
                  items: [
                    { ok: true, t: "AI adapts to each learner" },
                    { ok: true, t: "24/7 personalised tutoring" },
                    { ok: true, t: "Multi-curriculum coverage" },
                    { ok: true, t: "Instant AI marking" },
                    { ok: true, t: "Complete school management suite" },
                  ],
                },
              ].map((col) => (
                <div key={col.title} className={`relative rounded-2xl p-6 border ${col.highlight ? "bg-gradient-to-r from-blue-600 to-purple-600 border-purple-800 shadow-xl shadow-purple-200" : "bg-slate-50 border-slate-200"}`}>
                  {col.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide">{col.badge}</span>
                  )}
                  <h3 className={`font-bold text-base mb-5 ${col.highlight ? "text-white" : "text-slate-900"}`}>{col.title}</h3>
                  <ul className="space-y-3">
                    {col.items.map((item) => (
                      <li key={item.t} className="flex items-start gap-2.5">
                        {item.ok
                          ? <CheckCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${col.highlight ? "text-blue-200" : "text-purple-500"}`} />
                          : <X className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-400" />
                        }
                        <span className={`text-sm ${col.highlight ? "text-blue-50" : "text-slate-600"}`}>{item.t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS BAND ── */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center text-white">
              {[
                { v: "20+", l: "Curricula", s: "CBC · Cambridge · US · IGCSE · IB" },
                { v: "15+", l: "Subjects", s: "Fully covered" },
                { v: "24/7", l: "Available", s: "Learn anytime" },
                { v: "100%", l: "Curriculum-aligned", s: "Contextual examples" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-4xl font-extrabold mb-1">{s.v}</div>
                  <div className="font-semibold text-white/90 text-sm">{s.l}</div>
                  <div className="text-white/60 text-xs mt-0.5">{s.s}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-20 lg:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="max-w-2xl mx-auto text-center mb-14">
              <span className="text-purple-600 text-xs font-bold uppercase tracking-widest">Got questions?</span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Frequently asked questions
              </h2>
              <p className="mt-4 text-slate-500 text-base">
                Can't find what you're looking for?{" "}
                <Link href="/contact" className="text-purple-600 font-semibold hover:underline">
                  Contact our team →
                </Link>
              </p>
            </div>

            {/* Two-column grid of FAQs */}
            <div className="grid lg:grid-cols-2 gap-4">
              {[
                {
                  q: "What is Elimu Nova?",
                  a: "Elimu Nova is an AI-powered cloud school platform that brings together students, teachers, parents and school admins. It delivers personalised tutoring, curriculum-aligned lessons, smart assessments and real-time progress insights — all in one place.",
                },
                {
                  q: "Who is Elimu Nova for?",
                  a: "Elimu Nova serves students (K-12), teachers, parents and school admins. Each role gets a dedicated dashboard tailored to their needs — from AI tutoring for learners to timetabling and analytics for school administrators.",
                },
                {
                  q: "Which curricula does Elimu Nova support?",
                  a: "We support 20+ frameworks including Kenya's CBC (PP1–Grade 12), Cambridge International & GCSE (UK), Common Core, NGSS, TEKS, Florida B.E.S.T., California and New York State standards (US), GED/HiSET & AP, plus IGCSE, IB, CAPS, CBSE, NERDC and more. Lessons are built for each framework — never generic content.",
                },
                {
                  q: "How does the AI tutor work?",
                  a: "Students ask questions. The AI delivers personalised, curriculum-aligned explanations that adapt to each learner's level, pace and learning style. It's available 24/7 — no waiting for a teacher.",
                },
                {
                  q: "What tools do teachers get?",
                  a: "Teachers get AI-generated lesson plans, teaching notes, PowerPoint slides, instant exam and marking-scheme generation, auto-marking, competency-based rubrics, and a real-time class progress dashboard.",
                },
                {
                  q: "How do parents use Elimu Nova?",
                  a: "Parents get a dedicated dashboard showing their child's daily learning activity, quiz scores, subject progress trends, and early alerts when the AI detects a learning gap — weeks before a report card.",
                },
                {
                  q: "How do schools get started?",
                  a: "Request a demo through the School Admin Portal. Our team onboards your school, imports your timetable and class structure, and sets up all teacher and student accounts. Most schools are live within 48 hours.",
                },
                {
                  q: "Is there a free plan?",
                  a: "Yes. Students can sign up and start learning for free. Schools and teachers subscribe to unlock full AI tools, unlimited exam generation, admin dashboards and detailed reporting.",
                },
                {
                  q: "How secure is student data?",
                  a: "All data is encrypted in transit and at rest. We follow strict data-privacy practices and never share student data with third parties. School admins control what data is accessible and to whom.",
                },
              ].map((faq, i) => (
                <details
                  key={i}
                  className="group bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden open:border-purple-200 open:bg-purple-50/20 transition-colors"
                >
                  <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none select-none">
                    <span className="font-semibold text-slate-900 text-sm leading-snug">{faq.q}</span>
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-white border border-slate-200 group-open:border-purple-300 group-open:bg-purple-100 flex items-center justify-center transition-colors">
                      <ChevronDown className="h-3.5 w-3.5 text-slate-500 group-open:text-purple-600 group-open:rotate-180 transition-transform duration-200" />
                    </span>
                  </summary>
                  <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 group-open:border-purple-100 pt-4">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-20 lg:py-28 bg-gradient-to-br from-[#0f172a] via-indigo-950 to-[#0f172a]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Star className="h-3 w-3" /> Trusted across 6 countries
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">Ready to transform learning?</h2>
            <p className="text-slate-400 text-lg mb-8">Start free today. No credit card required. Cancel anytime.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-slate-900 font-bold rounded-full px-8 shadow-lg shadow-purple-500/30 text-white">
                  Start Learning Free <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" className="bg-slate-200 text-slate-900 hover:bg-slate-300 font-semibold rounded-full px-8">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#080e1a] text-white relative overflow-hidden">
        {/* Top border accent */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

        {/* Subtle background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Brand row */}
          <div className="pt-14 grid md:grid-cols-[1.4fr_2fr] gap-10 items-start">
            {/* Brand column */}
            <div className="space-y-5">
              <Logo variant="black" size="md" />
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                The AI-powered cloud school platform for every learner — from pre-primary to adult
                education, across 20+ curricula and 6 regions.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-2">
                {[
                  { icon: Facebook, label: "Facebook" },
                  { icon: Twitter, label: "Twitter" },
                  { icon: Linkedin, label: "LinkedIn" },
                  { icon: Youtube, label: "YouTube" },
                  { icon: Instagram, label: "Instagram" },
                ].map((s) => (
                  <a
                    key={s.label}
                    href="#"
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-purple-600 hover:border-purple-600 transition-all"
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
              {/* Live status */}
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400 text-xs">All systems operational</span>
              </div>
            </div>

            {/* Nav columns — 4-across */}
            <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            {[
              {
                title: "Platform",
                links: [
                  { label: "For Learners", to: "/auth" },
                  { label: "For Educators", to: "/auth" },
                  { label: "For Schools", to: "/auth" },
                  { label: "For Parents", to: "/auth" },
                  { label: "Pricing", to: "/pricing" },
                ],
              },
              {
                title: "Curricula",
                links: [
                  { label: "CBC (PP1–Grade 12)", to: "/contact" },
                  { label: "Cambridge & GCSE", to: "/contact" },
                  { label: "US: Common Core · NGSS · TEKS", to: "/contact" },
                  { label: "GED/HiSET & AP", to: "/contact" },
                  { label: "IGCSE, IB & more", to: "/contact" },
                ],
              },
              {
                title: "Resources",
                links: [
                  { label: "FAQ", to: "#faq" },
                  { label: "About Us", to: "/about" },
                  { label: "Contact", to: "/contact" },
                  { label: "Request a Demo", to: "/contact" },
                ],
              },
              {
                title: "Trust & Compliance",
                links: [
                  { label: "Privacy Policy", to: "/privacy" },
                  { label: "Terms of Service", to: "/terms" },
                  { label: "Data Security", to: "/contact" },
                  { label: "Accessibility", to: "/contact" },
                  { label: "Trust Center", to: "/contact" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-white font-semibold text-xs uppercase tracking-widest mb-5">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.to}
                        className="text-slate-400 hover:text-purple-400 text-sm transition-colors duration-200"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            </div>{/* close nav grid */}
          </div>{/* close brand row */}

          {/* Trust / compliance strip */}
          <div className="border-t border-slate-800/60 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { icon: ShieldCheck, text: "Privacy-first · GDPR ready" },
              { icon: Lock, text: "Encrypted at rest & transit" },
              { icon: Server, text: "99.9% uptime SLA" },
              { icon: CreditCard, text: "Secure payments" },
            ].map((t) => (
              <div key={t.text} className="flex items-center gap-2.5 text-slate-400 text-xs">
                <t.icon className="h-4 w-4 text-purple-400 shrink-0" />
                <span>{t.text}</span>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="text-slate-500 text-xs">© 2026 Elimu Nova. All rights reserved.</p>
                <span className="text-slate-700">·</span>
                <Link href="/privacy" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">Privacy</Link>
                <span className="text-slate-700">·</span>
                <Link href="/terms" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">Terms</Link>
              </div>
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <MapPin className="h-3.5 w-3.5" /> Nairobi · London · New York
                </span>
                <Link href="/contact" className="flex items-center gap-1.5 text-slate-500 hover:text-purple-400 text-xs transition-colors">
                  <Mail className="h-3.5 w-3.5" /> support@elimunova.com
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
