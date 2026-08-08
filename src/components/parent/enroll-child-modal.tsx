"use client"

import { useState } from 'react'
import { AdminModal, AdminFormField, adminInputClass } from "@/components/ui/admin-modal"
import { UserPlus, Plus, Trash2, CheckCircle, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface ChildForm {
  firstName: string
  lastName: string
  grade: string
}

interface EnrollChildModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const GRADES = ['PP1','PP2','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']

function previewUsername(first: string, last: string) {
  return first && last ? `${first.toLowerCase()}.${last.toLowerCase()}` : ''
}

export default function EnrollChildModal({ isOpen, onClose, onSuccess }: EnrollChildModalProps) {
  const [count, setCount] = useState(1)
  const [children, setChildren] = useState<ChildForm[]>([{ firstName: '', lastName: '', grade: '' }])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Array<{ name: string; username: string; email: string; password: string }>>([])
  const [showPwd, setShowPwd] = useState<Record<number, boolean>>({})
  const { toast } = useToast()

  const updateCount = (n: number) => {
    const newCount = Math.max(1, Math.min(5, n))
    setCount(newCount)
    setChildren(prev => {
      const updated = [...prev]
      while (updated.length < newCount) updated.push({ firstName: '', lastName: '', grade: '' })
      return updated.slice(0, newCount)
    })
  }

  const updateChild = (index: number, field: keyof ChildForm, value: string) => {
    setChildren(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  const handleSubmit = async () => {
    const valid = children.filter(c => c.firstName.trim() && c.lastName.trim())
    if (valid.length === 0) { toast({ title: 'Error', description: 'Please fill in at least one child\'s name', variant: 'destructive' }); return }

    setLoading(true)
    const created: any[] = []
    for (const child of valid) {
      try {
        const res = await fetch('/api/parent/enroll-child', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName: child.firstName.trim(), lastName: child.lastName.trim(), grade: child.grade || undefined }),
        })
        if (res.ok) {
          const d = await res.json()
          created.push({ name: `${child.firstName} ${child.lastName}`, username: d.credentials.username, email: d.credentials.email, password: d.credentials.password })
        }
      } catch { /* continue */ }
    }

    setLoading(false)
    if (created.length > 0) {
      setResults(created)
      toast({ title: 'Success', description: `${created.length} child account(s) created` })
    } else {
      toast({ title: 'Error', description: 'Failed to create accounts', variant: 'destructive' })
    }
  }

  const copyAll = () => {
    const text = results.map(r => `Name: ${r.name}\nUsername: ${r.username}\nPassword: ${r.password}\nEmail: ${r.email}`).join('\n\n')
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied', description: 'Credentials copied to clipboard' })
  }

  return (
    <AdminModal open={isOpen} onClose={onClose} title="Enroll Your Children" subtitle="Create accounts for your children — they can sign in immediately." icon={<UserPlus />} size="lg"
      footer={results.length > 0 ? (
        <div className="flex gap-2 w-full justify-end">
          <button onClick={copyAll} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"><Copy className="w-4 h-4" />Copy All</button>
          <button onClick={() => { onSuccess(); onClose() }} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-sm font-medium text-white shadow-sm transition">Done</button>
        </div>
      ) : (
        <div className="flex gap-2 w-full justify-end">
          <button onClick={onClose} disabled={loading} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-sm font-medium text-white shadow-sm transition disabled:opacity-50 flex items-center gap-2">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Enroll {children.filter(c => c.firstName.trim()).length || count} Child{count > 1 ? 'ren' : ''}
          </button>
        </div>
      )}
    >
      {results.length > 0 ? (
        <div className="space-y-4">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-slate-900">{results.length} Account{results.length > 1 ? 's' : ''} Created</h3>
            <p className="text-sm text-slate-500 mt-1">Share these credentials securely. Children can sign in immediately.</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 text-center">
            You have 14 days free. After the trial, a subscription is required to continue using Elimu Nova.
          </div>
          {results.map((r, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
              <p className="text-sm font-semibold text-slate-800">{r.name}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-500">Username:</span> <code className="font-mono text-indigo-600">{r.username}</code></div>
                <div><span className="text-slate-500">Password:</span>
                  <span className="inline-flex items-center gap-1">
                    <code className="font-mono">{showPwd[i] ? r.password : '\u2022'.repeat(r.password.length)}</code>
                    <button onClick={() => setShowPwd(prev => ({ ...prev, [i]: !prev[i] }))} className="text-slate-400 hover:text-slate-600">
                      {showPwd[i] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </span>
                </div>
                <div className="col-span-2"><span className="text-slate-500">Email:</span> <code className="font-mono text-xs text-slate-600">{r.email}</code></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Number of Children</label>
            <div className="flex items-center gap-2">
              <button onClick={() => updateCount(count - 1)} className="w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-lg font-bold">−</button>
              <span className="text-lg font-bold text-slate-900 w-8 text-center">{count}</span>
              <button onClick={() => updateCount(count + 1)} className="w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-lg font-bold">+</button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Enroll up to 5 children at once</p>
          </div>

          {children.map((child, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">Child {i + 1}</p>
                {count > 1 && <button onClick={() => { setChildren(prev => prev.filter((_, idx) => idx !== i)); setCount(prev => prev - 1) }} className="text-xs text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <AdminFormField label="First Name" htmlFor={`child-${i}-first`}>
                  <input id={`child-${i}-first`} type="text" autoComplete="off" placeholder="e.g. James"
                    value={child.firstName} onChange={e => updateChild(i, 'firstName', e.target.value)}
                    className={adminInputClass} />
                </AdminFormField>
                <AdminFormField label="Last Name" htmlFor={`child-${i}-last`}>
                  <input id={`child-${i}-last`} type="text" autoComplete="off" placeholder="e.g. Williams"
                    value={child.lastName} onChange={e => updateChild(i, 'lastName', e.target.value)}
                    className={adminInputClass} />
                </AdminFormField>
              </div>
              {child.firstName && child.lastName && (
                <div className="bg-white border border-indigo-100 rounded-lg p-2">
                  <p className="text-[10px] font-medium text-slate-500">Username: <code className="font-mono text-indigo-600">{previewUsername(child.firstName, child.lastName)}</code></p>
                </div>
              )}
              <AdminFormField label="Grade Level" htmlFor={`child-${i}-grade`}>
                <select id={`child-${i}-grade`} value={child.grade} onChange={e => updateChild(i, 'grade', e.target.value)}
                  className={adminInputClass}>
                  <option value="">Select grade...</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </AdminFormField>
            </div>
          ))}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
            <span className="text-base">💡</span>
            <span>Your children can sign in immediately with the credentials shown after enrollment. <strong>14-day free trial</strong> — subscription required after. Children never see billing.</span>
          </div>
        </div>
      )}
    </AdminModal>
  )
}
