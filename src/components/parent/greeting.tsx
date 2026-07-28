"use client"

import { useSession } from "next-auth/react"
import { Sun, Moon, Sunrise } from "lucide-react"

interface ParentGreetingProps {
  displayName: string
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: "Good morning", icon: Sunrise }
  if (h < 17) return { text: "Good afternoon", icon: Sun }
  return { text: "Good evening", icon: Moon }
}

export default function ParentGreeting({ displayName }: ParentGreetingProps) {
  const { data: session } = useSession()
  const { text, icon: GreetIcon } = getGreeting()
  const name = (displayName || session?.user?.name || "Parent").split(" ")[0]

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
        <GreetIcon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-900">{text}, {name}</h1>
        <p className="text-sm text-slate-500">Here&apos;s your family&apos;s learning overview</p>
      </div>
    </div>
  )
}
