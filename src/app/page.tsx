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
} from "lucide-react";
import Link from "next/link"
import ParentProgressMockup from "@/components/landing/ParentProgressMockup"
import { Logo } from "@/components/ui/logo";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleIndex, setRoleIndex] = useState(0);

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

  const activeRole = roles[roleIndex];

  const chatMessages = [
    { from: "student", text: "Explain photosynthesis simply." },
    { from: "ai", text: "Sure! Plants use sunlight to turn water + CO₂ into glucose and oxygen. It's how they make their own food 🌿" },
    { from: "student", text: "Give me a quiz question on it." },
    { from: "ai", text: "What gas do plants release during photosynthesis?\nA) CO₂  B) O₂  C) N₂  D) H₂" },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <Logo variant="black" size="lg" />
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
                    { icon: CheckCircle, text: "Multi-curriculum" },
                    { icon: CheckCircle, text: "23+ Schools" },
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

        {/* ── TRUST BAR ── */}
        <section className="bg-slate-900 border-y border-slate-800 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Trusted by schools worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
              {["Nairobi", "London", "USA", "Johannesburg"].map((city) => (
                <span key={city} className="flex items-center gap-1.5 text-slate-400 text-sm font-medium">
                  <Globe className="h-3.5 w-3.5 text-purple-500" />{city}
                </span>
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
                <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">For Students</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-5">
                Everything you need<br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">to excel.</span>
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                Our AI adapts to each learner's pace, fills knowledge gaps, and builds confidence through personalised 1-on-1 tutoring — available any time, anywhere.
              </p>
            </div>

            {/* Feature cards grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Sparkles,
                  title: "AI Tutor",
                  desc: "Personalised explanations that instantly answer any question, never get tired.",
                  grad: "from-purple-500 to-violet-500",
                  glow: "group-hover:shadow-purple-500/20",
                  num: "01",
                },
                {
                  icon: BookOpen,
                  title: "Curriculum Courses",
                  desc: "CBC, 8-4-4, Cambridge and more — perfectly aligned to what learners need for exams.",
                  grad: "from-blue-500 to-cyan-500",
                  glow: "group-hover:shadow-blue-500/20",
                  num: "02",
                },
                {
                  icon: Code,
                  title: "AI Coding Studio",
                  desc: "Step-by-step programming with AI guidance. Build real projects ready for the digital economy.",
                  grad: "from-violet-500 to-purple-500",
                  glow: "group-hover:shadow-violet-500/20",
                  num: "03",
                },
                {
                  icon: TrendingUp,
                  title: "Progress Analytics",
                  desc: "Know your strengths and gaps. Track improvement over time with visual reports.",
                  grad: "from-blue-500 to-purple-500",
                  glow: "group-hover:shadow-blue-500/20",
                  num: "04",
                },
                {
                  icon: Calendar,
                  title: "Live Sessions",
                  desc: "Join qualified teachers in real-time lessons. Ask questions and get instant feedback.",
                  grad: "from-pink-500 to-purple-500",
                  glow: "group-hover:shadow-pink-500/20",
                  num: "05",
                },
                {
                  icon: ClipboardList,
                  title: "Smart Assignments",
                  desc: "AI-generated homework matched to your level with instant marking and explanations.",
                  grad: "from-teal-500 to-emerald-500",
                  glow: "group-hover:shadow-teal-500/20",
                  num: "06",
                },
                {
                  icon: GraduationCap,
                  title: "Career Pathways",
                  desc: "Discover your ideal career based on strengths. University and subject guidance from Grade 9.",
                  grad: "from-purple-500 to-blue-500",
                  glow: "group-hover:shadow-purple-500/20",
                  num: "07",
                },
                {
                  icon: Brain,
                  title: "Adaptive Learning",
                  desc: "The more you use it, the smarter it gets about your learning style, pace and knowledge gaps.",
                  grad: "from-fuchsia-500 to-pink-500",
                  glow: "group-hover:shadow-fuchsia-500/20",
                  num: "08",
                },
              ].map((f, idx) => (
                <div
                  key={f.title}
                  className={"group relative bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl " + f.glow + " hover:border-slate-600"}
                  style={{ animationDelay: idx * 80 + "ms" }}
                >
                  {/* Top gradient line */}
                  <div className={"absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r " + f.grad + " opacity-0 group-hover:opacity-100 transition-opacity duration-300"} />
                  {/* Background glow on hover */}
                  <div className={"absolute inset-0 bg-gradient-to-br " + f.grad + " opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 rounded-2xl"} />

                  <div className="relative">
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
                    <div className="mt-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
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
              <div className="relative flex gap-4 sm:gap-6 items-start p-6 sm:p-8">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white font-extrabold flex items-center justify-center text-lg flex-shrink-0 shadow-lg">M</div>
                <div>
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-purple-400 text-purple-400" />)}
                  </div>
                  <p className="text-slate-200 text-base italic leading-relaxed mb-3">
                    "Elimu Nova explains things in a way I actually understand. My Maths grade jumped two levels in one term — I never thought that was possible!"
                  </p>
                  <p className="text-purple-300 font-semibold text-sm">Mercy K. — Grade 7 Student, Hopewell STEM Academy</p>
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
                <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">For Teachers</span>
                <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">
                  Reduce prep work by <span className="text-purple-400">60%</span>.
                </h2>
                <p className="mt-4 text-slate-400 text-base leading-relaxed">
                  Schools report teachers saving 12+ hours weekly on lesson prep and marking. Elimu Nova handles the repetitive tasks so you can focus on inspiring learners.
                </p>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  {[{ v: "12h+", l: "Saved / week" }, { v: "94%", l: "Syllabus coverage" }, { v: "3×", l: "Faster marking" }].map((s) => (
                    <div key={s.l} className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                      <div className="text-2xl font-extrabold text-purple-400">{s.v}</div>
                      <div className="text-slate-400 text-xs mt-1">{s.l}</div>
                    </div>
                  ))}
                </div>

                <blockquote className="mt-8 border-l-2 border-purple-500 pl-5">
                  <p className="text-slate-300 italic leading-relaxed">
                    "Before Elimu Nova, I spent weekends preparing lessons and marking. Now I finish everything during school hours and actually have time for my students."
                  </p>
                  <footer className="mt-2 text-purple-400 font-semibold text-sm">
                    — Sarah M., Science Teacher · Hopewell STEM Academy
                  </footer>
                </blockquote>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Timer, title: "Clear Syllabus on Time", desc: "AI generates complete lesson plans with learning objectives, activities and assessments aligned to your curriculum in minutes." },
                  { icon: PenTool, title: "Auto-Generate Notes & Slides", desc: "Create professional teaching notes and PowerPoint presentations in seconds. Export to PDF or present directly." },
                  { icon: ClipboardCheck, title: "Instant Exam Generation", desc: "Curriculum-aligned exams with marking schemes in seconds. Supports structured, essay, and MCQ formats." },
                  { icon: BarChart3, title: "AI Auto-Marking", desc: "Submit student papers and receive instant grading with detailed feedback. Hours of marking done in minutes." },
                  { icon: Target, title: "Competency-Based Assessment", desc: "Built-in rubrics for authentic assessment. Track Exceeding, Meeting, Approaching and Beginning levels automatically." },
                  { icon: Lightbulb, title: "AI Teaching Assistant", desc: "Real-time suggestions for differentiated instruction and remediation strategies based on class performance data." },
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
              <div className="inline-flex items-center gap-2 bg-pink-500/15 border border-pink-500/30 text-pink-400 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
                <Heart className="h-3.5 w-3.5" /> For Parents & Guardians
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-4">
                Never miss a moment<br />
                <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">of your child's growth.</span>
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                Real-time insights and AI-powered alerts keep you connected to your child's education — not just at report time, but every single day.
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
              <span className="text-purple-600 text-xs font-bold uppercase tracking-widest">For Schools</span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Transform your school into a future-ready institution.</h2>
              <p className="mt-4 text-slate-500 text-base leading-relaxed">
                Pilot schools have seen 35% improvement in mean scores and 40% reduction in administrative workload.
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
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Why Elimu Nova is different</h2>
              <p className="mt-3 text-slate-500 text-base">The only AI platform built end-to-end for the modern classroom.</p>
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
                { v: "4+", l: "Curricula", s: "CBC · 8-4-4 · Cambridge · More" },
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
                  a: "We support CBC (PP1–Grade 12), 8-4-4 (Form 1–4), Cambridge International (Year 1–13), TVET/STEM programmes and more. Our AI is curriculum-trained for each framework, not just generic content.",
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
              <Star className="h-3 w-3" /> Join 15,000+ learners worldwide
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">Ready to transform learning?</h2>
            <p className="text-slate-400 text-lg mb-8">Start free today. No credit card required.</p>
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

        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/4 w-96 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main footer grid */}
          <div className="py-16 grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-12">

            {/* Brand column */}
            <div className="space-y-5">
              <Logo variant="white" size="md" />
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                The AI-powered cloud school platform built for teachers, school owners and learners worldwide.
              </p>
              <div className="flex items-center gap-1.5 mt-4">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400 text-xs">Platform live · 24/7 uptime</span>
              </div>
              <Link href="/auth/signup">
                <Button className="mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-slate-900 font-bold rounded-xl px-5 h-10 text-sm shadow-lg shadow-purple-500/20 text-white">
                  Get Started Free <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>

            {/* Nav columns */}
            {[
              {
                title: "Platform",
                links: [
                  { label: "AI Tutor", to: "/auth" },
                  { label: "AI Whiteboard", to: "/auth" },
                  { label: "Exam Generator", to: "/auth" },
                  { label: "Progress Analytics", to: "/auth" },
                ],
              },
              {
                title: "Curricula",
                links: [
                  { label: "CBC (PP1–Grade 12", to: "/contact" },
                  { label: "8-4-4 (Form 1–4", to: "/contact" },
                  { label: "Cambridge Int'l", to: "/contact" },
                  { label: "TVET & STEM", to: "/contact" },
                ],
              },
              {
                title: "Resources",
                links: [
                  { label: "FAQ", to: "#faq" },
                  { label: "About Us", to: "/about" },
                  { label: "Contact", to: "/contact" },
                ],
              },
              {
                title: "Schools",
                links: [
                  { label: "School Portal", to: "/auth" },
                  { label: "Request Demo", to: "/contact" },
                  { label: "Pricing", to: "/pricing" },
                  { label: "Onboarding", to: "/contact" },
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
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800 py-6">
            <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="text-slate-500 text-xs">© 2026 Elimu Nova. All rights reserved.</p>
                <span className="text-slate-700">·</span>
                <Link href="/contact" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">Privacy</Link>
                <span className="text-slate-700">·</span>
                <Link href="/contact" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">Terms</Link>
              </div>
              <div className="flex items-center gap-2">
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
