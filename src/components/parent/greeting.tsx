"use client"

import { useSession } from "next-auth/react"

interface ParentGreetingProps {
  displayName: string
}

export default function ParentGreeting({ displayName }: ParentGreetingProps) {
  const { data: session } = useSession()
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Parent Overview</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Welcome back, {(displayName || session?.user?.name || "Parent").split(" ")[0]}
        </p>
      </div>
    </div>
  )
}
