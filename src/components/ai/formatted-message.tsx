"use client"

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot } from 'lucide-react'

interface FormattedMessageProps {
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

export function FormattedMessage({ content, role, timestamp }: FormattedMessageProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
          <p className="whitespace-pre-wrap">{content}</p>
          <p className="text-xs opacity-80 mt-1">
            {timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 shadow-md border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold text-gray-700">AI Tutor</span>
        </div>
        
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Headings
              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-gray-900 mb-3 mt-4" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-gray-900 mb-2 mt-3" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-2" {...props} />,
              
              // Paragraphs
              p: ({ node, ...props }) => <p className="text-gray-700 mb-3 leading-relaxed" {...props} />,
              
              // Lists
              ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 mb-3 text-gray-700" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-gray-700" {...props} />,
              li: ({ node, ...props }) => <li className="ml-2" {...props} />,
              
              // Code blocks
              code: ({ node, inline, ...props }: any) => 
                inline ? (
                  <code className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-sm font-mono" {...props} />
                ) : (
                  <code className="block bg-gray-800 text-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto mb-3" {...props} />
                ),
              pre: ({ node, ...props }) => <pre className="mb-3" {...props} />,
              
              // Blockquotes
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-3 bg-blue-50 text-gray-700 italic" {...props} />
              ),
              
              // Strong/Bold
              strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,
              
              // Emphasis/Italic
              em: ({ node, ...props }) => <em className="italic text-gray-800" {...props} />,
              
              // Links
              a: ({ node, ...props }) => (
                <a className="text-blue-600 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer" {...props} />
              ),
              
              // Tables
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto mb-3">
                  <table className="min-w-full border-collapse border border-gray-300" {...props} />
                </div>
              ),
              thead: ({ node, ...props }) => <thead className="bg-gray-100" {...props} />,
              th: ({ node, ...props }) => <th className="border border-gray-300 px-3 py-2 text-left font-semibold" {...props} />,
              td: ({ node, ...props }) => <td className="border border-gray-300 px-3 py-2" {...props} />,
              
              // Horizontal rule
              hr: ({ node, ...props }) => <hr className="my-4 border-gray-300" {...props} />,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          {timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
