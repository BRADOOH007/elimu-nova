'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Users,
  Copy,
  Printer,
  Check,
  UserMinus,
  Send,
  Mail,
  Phone,
  RefreshCw
} from 'lucide-react'

type Role = 'TEACHER' | 'STUDENT' | 'PARENT'

interface Credential {
  id: string
  firstName: string
  lastName: string
  username: string
  password: string
  admissionNumber?: string
  email?: string
  phone?: string
}

export default function CredentialGenerator() {
  const [role, setRole] = useState<Role>('STUDENT')
  const [count, setCount] = useState(5)
  const [showPrintMode, setShowPrintMode] = useState(false)
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [schoolName] = useState('Demo School')
  const [sendingIndex, setSendingIndex] = useState<number | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Simple password generator (adjective + noun + number)
  const generateSimplePassword = () => {
    const adjectives = ['Blue', 'Green', 'Happy', 'Brave', 'Swift', 'Bright', 'Calm', 'Bold']
    const nouns = ['Lion', 'Star', 'River', 'Eagle', 'Mountain', 'Sunrise', 'Ocean', 'Forest']
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const num = Math.floor(100 + Math.random() * 900)
    return `${adj}${noun}${num}`
  }

  const generateUsername = (firstName: string, lastName: string) => {
    const base = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
    const randomSuffix = Math.random().toString(36).substring(2, 5)
    return `${base}.${randomSuffix}@${schoolName.toLowerCase().replace(/\s+/g, '')}.edu`
  }

  const generateAdmissionNumber = () => {
    const year = new Date().getFullYear().toString().slice(-2)
    const randomNum = Math.floor(10000 + Math.random() * 90000)
    return `${schoolName.substring(0, 2).toUpperCase()}${year}${randomNum}`
  }

  const generateCredentials = () => {
    const newCreds: Credential[] = []
    const rolePrefix = ['Amina', 'David', 'Fatima', 'John', 'Aisha', 'Michael', 'Zainab', 'Daniel']
    const roleSuffix = ['Okafor', 'Mutua', 'Kipchoge', 'Omondi', 'Nguyen', 'Williams', 'Smith', 'Jones']

    for (let i = 0; i < count; i++) {
      const firstName = rolePrefix[Math.floor(Math.random() * rolePrefix.length)]
      const lastName = roleSuffix[Math.floor(Math.random() * roleSuffix.length)]
      newCreds.push({
        id: Math.random().toString(36).substr(2, 9),
        firstName,
        lastName,
        username: generateUsername(firstName, lastName),
        password: generateSimplePassword(),
        admissionNumber: role === 'STUDENT' ? generateAdmissionNumber() : undefined
      })
    }
    setCredentials(newCreds)
  }

  const removeCredential = (id: string) => {
    setCredentials(credentials.filter(c => c.id !== id))
  }

  const updateCredential = (id: string, field: keyof Credential, value: string) => {
    setCredentials(
      credentials.map(c =>
        c.id === id ? { ...c, [field]: value } : c
      )
    )
  }

  const copyAll = async () => {
    const text = credentials
      .map(
        (c, i) =>
          `${i + 1}. ${c.firstName} ${c.lastName} | Username: ${c.username} | Password: ${c.password}`
      )
      .join('\n')
    await navigator.clipboard.writeText(text)
    alert('All credentials copied to clipboard')
  }

  const copySingle = async (index: number) => {
    const c = credentials[index]
    const text = `${c.firstName} ${c.lastName} | Username: ${c.username} | Password: ${c.password}`
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handlePrint = () => {
    setShowPrintMode(true)
    setTimeout(() => window.print(), 100)
  }

  const sendViaEmail = async (index: number) => {
    const c = credentials[index]
    if (!c.email) {
      alert('Please enter an email address first!')
      return
    }
    setSendingIndex(index)
    // Simulate sending email
    setTimeout(() => {
      alert(`Credentials sent to ${c.email}!`)
      setSendingIndex(null)
    }, 1500)
  }

  const sendViaPhone = async (index: number) => {
    const c = credentials[index]
    if (!c.phone) {
      alert('Please enter a phone number first!')
      return
    }
    setSendingIndex(index)
    // Simulate sending SMS
    setTimeout(() => {
      alert(`Credentials sent to ${c.phone}!`)
      setSendingIndex(null)
    }, 1500)
  }

  useEffect(() => {
    if (!showPrintMode) return
    const afterPrint = () => setShowPrintMode(false)
    window.addEventListener('afterprint', afterPrint)
    return () => window.removeEventListener('afterprint', afterPrint)
  }, [showPrintMode])

  if (showPrintMode) {
    return (
      <div className="p-8 max-w-4xl mx-auto print:p-2">
        <h1 className="text-2xl font-bold mb-4">{schoolName} - New User Credentials</h1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Password</TableHead>
              {role === 'STUDENT' && <TableHead>Admission No.</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {credentials.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  {c.firstName} {c.lastName}
                </TableCell>
                <TableCell>{c.username}</TableCell>
                <TableCell>{c.password}</TableCell>
                {role === 'STUDENT' && <TableCell>{c.admissionNumber}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="w-6 h-6" />
              Credential Generator
            </CardTitle>
            <CardDescription>
              Create login credentials for new users and send them via email or SMS
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(val) => setRole(val as Role)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="PARENT">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="count">Count</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-24"
              />
            </div>
            <Button onClick={generateCredentials} className="gap-2">
              <Users className="w-4 h-4" />
              Generate
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {credentials.length > 0 && (
          <>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={copyAll} className="gap-2">
                <Copy className="w-4 h-4" />
                Copy All
              </Button>
              <Button onClick={handlePrint} variant="outline" className="gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Password</TableHead>
                    {role === 'STUDENT' && <TableHead>Admission No.</TableHead>}
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credentials.map((cred, index) => (
                    <TableRow key={cred.id}>
                      <TableCell>
                        <Input
                          value={cred.firstName}
                          onChange={(e) =>
                            updateCredential(cred.id, 'firstName', e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={cred.lastName}
                          onChange={(e) =>
                            updateCredential(cred.id, 'lastName', e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono">
                        <Input
                          value={cred.username}
                          onChange={(e) =>
                            updateCredential(cred.id, 'username', e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          <Input
                            value={cred.password}
                            onChange={(e) =>
                              updateCredential(cred.id, 'password', e.target.value)
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              updateCredential(
                                cred.id,
                                'password',
                                generateSimplePassword()
                              )
                            }}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      {role === 'STUDENT' && (
                        <TableCell className="font-mono">
                          <Input
                            value={cred.admissionNumber || ''}
                            onChange={(e) =>
                              updateCredential(
                                cred.id,
                                'admissionNumber',
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={cred.email || ''}
                          onChange={(e) =>
                            updateCredential(
                              cred.id,
                              'email',
                              e.target.value
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="tel"
                          placeholder="+254712345678"
                          value={cred.phone || ''}
                          onChange={(e) =>
                            updateCredential(
                              cred.id,
                              'phone',
                              e.target.value
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copySingle(index)}
                            disabled={copiedIndex === index}
                          >
                            {copiedIndex === index ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => sendViaEmail(index)}
                            disabled={sendingIndex === index}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => sendViaPhone(index)}
                            disabled={sendingIndex === index}
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCredential(cred.id)}
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
