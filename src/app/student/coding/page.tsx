'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Code2, Globe, Gamepad2, Brain, Send, Loader2, ExternalLink,
  ArrowLeft, Sparkles, Lightbulb, RefreshCw, CheckCircle,
  BookOpen, Target, Zap, ChevronRight, X
} from 'lucide-react'

/* ─────────────────────────── Types ─────────────────────────── */
type Track = 'scratch' | 'web' | 'ai-kids'

interface Message { role: 'user' | 'assistant'; content: string }

interface Lesson {
  id: number; title: string; description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  practiceUrl?: string; content: string
}

/* ─────────────────────────── Lesson data ───────────────────── */
const SCRATCH_LESSONS: Lesson[] = [
  { id: 1, title: 'Moving Sprites', description: 'Learn to move characters on screen', difficulty: 'Beginner', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'Use the **move 10 steps** block inside a **when green flag clicked** event. Change the number to move faster or slower. Try adding a **forever** loop to keep the sprite moving!' },
  { id: 2, title: 'Events & Inputs', description: 'React to keyboard and mouse input', difficulty: 'Beginner', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'Use **when [space] key pressed** blocks to respond to keyboard input. Each key can trigger a different action for your sprite.' },
  { id: 3, title: 'Loops & Repetition', description: 'Use loops to repeat actions', difficulty: 'Beginner', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'The **repeat 10** block runs code a fixed number of times. The **forever** block runs code continuously. Use **repeat until** to loop until a condition is true.' },
  { id: 4, title: 'Conditionals & Logic', description: 'Make decisions with if/else', difficulty: 'Intermediate', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'Use **if <condition> then** to run code only when something is true. Add **else** for an alternative path. Conditions can check touching a color, key pressed, or variable values.' },
  { id: 5, title: 'Variables & Score', description: 'Store and use data', difficulty: 'Intermediate', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'Create a variable called **score**. Use **set score to 0** at the start, then **change score by 1** each time the player succeeds. Display it on screen with the checkbox in the variables panel.' },
  { id: 6, title: 'Build a Game', description: 'Combine everything to make a game', difficulty: 'Advanced', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'Combine sprites, events, loops, conditionals and variables to build a complete game. Plan your game first: What is the goal? What are the rules? How does the player win or lose?' },
]

const WEB_LESSONS: Lesson[] = [
  { id: 1, title: 'Your First HTML Page', description: 'Build a webpage from scratch', difficulty: 'Beginner', content: '```html\n<!DOCTYPE html>\n<html>\n<head>\n  <title>My First Page</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <p>This is my first webpage.</p>\n</body>\n</html>\n```\nSave this as `index.html` and open it in a browser!' },
  { id: 2, title: 'Styling with CSS', description: 'Make your page look great', difficulty: 'Beginner', content: '```css\nbody { font-family: Arial; background: #f0f8ff; }\nh1   { color: #0066cc; }\np    { font-size: 18px; }\n```\nAdd this inside a `<style>` tag in your `<head>` section.' },
  { id: 3, title: 'JavaScript Basics', description: 'Make your page interactive', difficulty: 'Beginner', content: '```javascript\n// Show a message when button is clicked\nfunction sayHello() {\n  alert("Hello from JavaScript!");\n}\n```\nAdd a button: `<button onclick="sayHello()">Click me</button>`' },
  { id: 4, title: 'Variables & Functions', description: 'Store data and reuse code', difficulty: 'Intermediate', content: '```javascript\nlet name = "Alice";\nlet age  = 12;\n\nfunction greet(person) {\n  return "Hello, " + person + "!";\n}\n\nconsole.log(greet(name)); // Hello, Alice!\n```' },
  { id: 5, title: 'DOM Manipulation', description: 'Change the page with JavaScript', difficulty: 'Intermediate', content: '```javascript\n// Change text content\ndocument.getElementById("myText").innerText = "Updated!";\n\n// Change style\ndocument.getElementById("myBox").style.backgroundColor = "red";\n```' },
  { id: 6, title: 'Build a Calculator', description: 'A complete mini-project', difficulty: 'Advanced', content: 'Combine HTML forms, CSS styling, and JavaScript math functions to build a working calculator. Use `parseInt()` to convert text to numbers and display results in real time.' },
]

const AI_LESSONS: Lesson[] = [
  { id: 1, title: 'What is AI?', description: 'Understand artificial intelligence', difficulty: 'Beginner', content: 'AI is a computer program that can learn from examples and make decisions. Just like you learned to recognise cats by seeing many cats, an AI can too — but it needs thousands of examples!' },
  { id: 2, title: 'How Machines Learn', description: 'Training and patterns', difficulty: 'Beginner', content: 'Machines learn by looking at lots of examples and finding patterns. A spam filter learns which emails are spam by studying thousands of examples of spam and non-spam emails.' },
  { id: 3, title: 'Image Recognition', description: 'Teaching AI to see', difficulty: 'Intermediate', content: 'Tools like Teachable Machine (teachablemachine.withgoogle.com) let you train an AI to recognise images using your webcam — no code needed! Try training it to recognise hand gestures.' },
  { id: 4, title: 'Natural Language', description: 'AI that understands text', difficulty: 'Intermediate', content: 'AI can understand and generate human language. This is how chatbots, translation apps, and voice assistants work. They are trained on millions of sentences from books and websites.' },
  { id: 5, title: 'AI & Ethics', description: 'Using AI responsibly', difficulty: 'Advanced', content: 'AI can have biases if it is trained on biased data. It is important to ask: Is this fair? Is it accurate? Who benefits and who might be harmed? AI is a tool — humans must use it wisely.' },
  { id: 6, title: 'Build an AI Project', description: 'Create with AI tools', difficulty: 'Advanced', content: 'Use Teachable Machine, MIT App Inventor, or Scratch AI extensions to build a real project — a sign-language translator, a plant identifier, or an AI storyteller.' },
]

const TRACKS = [
  {
    id: 'scratch' as Track,
    title: 'Scratch Programming',
    subtitle: 'Block-based coding · Grades 1–12',
    desc: 'Build games and animations using colourful blocks — no typing needed.',
    icon: Gamepad2,
    grad: 'from-blue-600 to-indigo-600',
    bg:   'bg-blue-50',
    lessons: SCRATCH_LESSONS,
  },
  {
    id: 'web' as Track,
    title: 'Web Development',
    subtitle: 'HTML, CSS & JavaScript',
    desc: 'Create real websites from scratch and make them interactive with code.',
    icon: Globe,
    grad: 'from-green-600 to-emerald-600',
    bg:   'bg-green-50',
    lessons: WEB_LESSONS,
  },
  {
    id: 'ai-kids' as Track,
    title: 'AI for Kids',
    subtitle: 'Understand & create with AI',
    desc: 'Learn how artificial intelligence works and build your own AI projects.',
    icon: Brain,
    grad: 'from-purple-600 to-pink-600',
    bg:   'bg-purple-50',
    lessons: AI_LESSONS,
  },
]

/* ─────────────────────────── AI Tutor Panel ─────────────────── */
function AITutorPanel({ language, lessonTitle }: { language: string; lessonTitle: string }) {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Hi! I'm your coding tutor 🤖 Ask me anything about **${lessonTitle}** and I'll help you step by step.`
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setMessages(m => [...m, { role: 'user', content: text }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/student/coding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, language, lessonTitle }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: data.response || 'Sorry, try again!' }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, I had a connection issue. Try again!' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-slate-800">AI Coding Tutor</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm'
                : 'bg-slate-100 text-slate-800 rounded-bl-sm'
            }`}>
              <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-3 pb-2 flex gap-2 flex-wrap">
        {['Explain this simply', 'Give me an example', 'Give me a challenge'].map(p => (
          <button
            key={p}
            onClick={() => setInput(p)}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask your coding question..."
          className="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center disabled:opacity-50 transition-opacity"
        >
          {loading ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────── Lesson View ───────────────────── */
function LessonView({ lesson, track, onBack }: { lesson: Lesson; track: typeof TRACKS[0]; onBack: () => void }) {
  const Icon = track.icon

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-5 h-[calc(100vh-180px)]">
      {/* Left — lesson content */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-y-auto">
        <div className={`p-5 bg-gradient-to-r ${track.grad} rounded-t-2xl`}>
          <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to lessons
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{lesson.title}</h2>
              <p className="text-white/80 text-sm">{lesson.description}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="prose prose-slate max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-sm">{lesson.content}</pre>
          </div>

          {lesson.practiceUrl && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-blue-800 text-sm">Practice Zone</p>
                  <p className="text-blue-600 text-xs mt-0.5">Open the editor and try what you've learned</p>
                </div>
                <a
                  href={lesson.practiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <ExternalLink className="h-4 w-4" /> Open Editor
                </a>
              </div>
            </div>
          )}

          {/* Quick tips */}
          <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              <p className="font-semibold text-amber-800 text-sm">Pro Tip</p>
            </div>
            <p className="text-amber-700 text-sm">
              Stuck? Use the AI Tutor on the right — ask it to explain anything step by step, or ask for a challenge to test yourself!
            </p>
          </div>
        </div>
      </div>

      {/* Right — AI tutor */}
      <AITutorPanel language={track.title} lessonTitle={lesson.title} />
    </div>
  )
}

/* ─────────────────────────── Track View ───────────────────── */
function TrackView({ track, onBack }: { track: typeof TRACKS[0]; onBack: () => void }) {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const Icon = track.icon

  if (activeLesson) {
    return <LessonView lesson={activeLesson} track={track} onBack={() => setActiveLesson(null)} />
  }

  const diffColor = (d: string) => {
    if (d === 'Beginner')     return 'bg-green-100 text-green-700'
    if (d === 'Intermediate') return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${track.grad} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 text-lg">{track.title}</h2>
          <p className="text-slate-500 text-sm">{track.subtitle}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {track.lessons.map((lesson, idx) => (
          <button
            key={lesson.id}
            onClick={() => setActiveLesson(lesson)}
            className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-bold text-slate-400">{String(idx + 1).padStart(2, '0')}</span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${diffColor(lesson.difficulty)}`}>
                {lesson.difficulty}
              </span>
            </div>
            <h3 className="font-bold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">{lesson.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-3">{lesson.description}</p>
            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
              Start lesson <ChevronRight className="h-3 w-3" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────── Main Page ─────────────────────── */
export default function CodingStudioPage() {
  const { data: session } = useSession()
  const [activeTrack, setActiveTrack] = useState<typeof TRACKS[0] | null>(null)

  if (activeTrack) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <TrackView track={activeTrack} onBack={() => setActiveTrack(null)} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <Code2 className="h-3 w-3" /> AI Coding Studio
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          Learn to Code with{' '}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Guidance
          </span>
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Pick a track, work through hands-on lessons, and get instant help from your AI coding tutor at every step.
        </p>
      </div>

      {/* Track cards */}
      <div className="grid md:grid-cols-3 gap-5">
        {TRACKS.map(track => {
          const Icon = track.icon
          return (
            <button
              key={track.id}
              onClick={() => setActiveTrack(track)}
              className="text-left bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${track.grad} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <h2 className="font-bold text-slate-900 text-lg mb-1">{track.title}</h2>
              <p className="text-xs text-slate-400 font-medium mb-2">{track.subtitle}</p>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">{track.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{track.lessons.length} lessons</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-blue-600">
                  Start <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Feature highlights */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Sparkles, title: 'AI Pair Programmer',   desc: 'Get step-by-step guidance without being given the answer' },
          { icon: Target,   title: 'Curriculum-Aligned',   desc: 'Covers CBC, Cambridge and STEM coding standards'         },
          { icon: Zap,      title: 'Learn by Doing',       desc: 'Every lesson includes a live practice environment'       },
        ].map(f => (
          <div key={f.title} className="flex gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
              <f.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{f.title}</p>
              <p className="text-slate-500 text-xs mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
