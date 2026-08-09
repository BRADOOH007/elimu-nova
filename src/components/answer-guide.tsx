'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BookOpen, Clock, FileText, Lightbulb, ListChecks, PenTool, Play, Timer } from 'lucide-react'

interface GuideContentProps {
  type: 'assignment' | 'exam' | 'general'
  hasVideo?: boolean
}

export default function AnswerGuide({ type, hasVideo }: GuideContentProps) {
  const [open, setOpen] = useState(false)

  const guides = {
    assignment: {
      title: 'How to Complete Assignments',
      Icon: FileText,
      sections: [
        {
          icon: Play,
          title: '1. Watch the Video First',
          items: [
            hasVideo
              ? 'Watch the full video lecture before attempting any questions.'
              : 'Read through all the provided resources before starting.',
            'Take notes as you watch — write down key points and examples.',
            'Pause and rewind if you don\'t understand a concept.',
          ]
        },
        {
          icon: PenTool,
          title: '2. Answer Thoughtfully',
          items: [
            'Read each question carefully and understand what is being asked.',
            'Provide complete answers — show your working for calculations.',
            'Use proper grammar, punctuation, and formatting in your responses.',
            'Reference concepts from the lesson material where relevant.',
          ]
        },
        {
          icon: Lightbulb,
          title: '3. Review Before Submitting',
          items: [
            'Double-check all your answers before clicking Submit.',
            'Verify calculations and ensure your reasoning makes sense.',
            'You can save draft answers and return later before the due date.',
            'After submission, review your AI feedback to learn from mistakes.',
          ]
        },
        {
          icon: Clock,
          title: '4. Meeting Deadlines',
          items: [
            'Submit before the due date. Late submissions may not be accepted.',
            'Start early — don\'t wait until the last minute.',
            'If you need help, use the AI Tutor for guidance on difficult concepts.',
          ]
        },
      ]
    },
    exam: {
      title: 'How to Take Exams',
      Icon: Timer,
      sections: [
        {
          icon: Timer,
          title: '1. Before the Exam',
          items: [
            'Ensure you have a stable internet connection and a fully charged device.',
            'Find a quiet, distraction-free environment to focus.',
            'Have scratch paper, a pen/pencil, and a calculator ready if allowed.',
            'Do not open other tabs or applications — the exam monitors this.',
          ]
        },
        {
          icon: ListChecks,
          title: '2. During the Exam',
          items: [
            'Read through all questions first to understand what is expected.',
            'Answer the easy questions first, then return to the harder ones.',
            'Keep an eye on the timer — pace yourself.',
            'For multiple choice, eliminate obviously wrong answers first.',
            'For short answers, be clear and concise. Use key terminology.',
          ]
        },
        {
          icon: Clock,
          title: '3. Time Management',
          items: [
            'Allocate time proportionally — more marks = more time.',
            'If stuck on a question, flag it and move on. Come back if time permits.',
            'Leave 2-3 minutes at the end to review your answers.',
            'The exam auto-submits when the timer runs out — don\'t leave answers blank.',
          ]
        },
        {
          icon: BookOpen,
          title: '4. After Submission',
          items: [
            'Review your results and read the feedback for each question.',
            'Use the AI Revision feature to practice questions you got wrong.',
            'Study the correct answers to improve for the next exam.',
          ]
        },
      ]
    },
    general: {
      title: 'ElimuNova Answer Guide',
      Icon: BookOpen,
      sections: [
        {
          icon: Play,
          title: 'Watch & Learn',
          items: [
            'Always watch any attached videos fully before attempting questions.',
            'Take notes during video lectures.',
            'Use the pause and replay features to master concepts.',
          ]
        },
        {
          icon: PenTool,
          title: 'Write Clear Answers',
          items: [
            'Answer in complete sentences where applicable.',
            'Show your working for math and science problems.',
            'Reference the material you learned from.',
          ]
        },
        {
          icon: ListChecks,
          title: 'Multiple Choice Strategy',
          items: [
            'Eliminate clearly wrong options first.',
            'Look for absolute words like "always" or "never" — these are often traps.',
            'If unsure, go with your first instinct after reasoning through the options.',
          ]
        },
        {
          icon: Lightbulb,
          title: 'Get Help When Stuck',
          items: [
            'Use the AI Tutor to get help with difficult concepts.',
            'Review similar examples from your lesson materials.',
            'Re-watch relevant sections of the video if provided.',
          ]
        },
      ]
    }
  }

  const guide = guides[type]
  const Icon = guide.Icon

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 text-xs gap-1.5"
      >
        <BookOpen className="w-3.5 h-3.5" />
        Answer Guide
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-white border-0 shadow-2xl p-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                <Icon className="w-4 h-4 text-white" />
              </div>
              {guide.title}
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="pb-6 space-y-5">
            {guide.sections.map((section, i) => {
              const SecIcon = section.icon
              return (
                <div key={i} className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <SecIcon className="w-3 h-3 text-amber-600" />
                    </div>
                    {section.title}
                  </h3>
                  <ul className="space-y-1.5 pl-8">
                    {section.items.map((item, j) => (
                      <li key={j} className="text-[13px] text-gray-600 flex items-start gap-2">
                        <span className="text-amber-400 mt-1 shrink-0">&#8226;</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  )
}
