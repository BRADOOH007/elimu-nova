"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { COUNTRIES, getCurriculaByCountry } from '@/lib/curricula'
import { Settings, Save, User, Bell, Palette, Globe, Shield, Key } from "lucide-react"

interface UserPreferences {
  id?: string
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  emailNotifications: boolean
  pushNotifications: boolean
  country: string
  curriculum: string
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
  userEmail: string
}

export function SettingsModal({ isOpen, onClose, userId, userName, userEmail }: SettingsModalProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    emailNotifications: true,
    pushNotifications: true,
    country: '',
    curriculum: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchPreferences()
    }
  }, [isOpen, userId])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user-preferences?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...preferences
        })
      })
      if (response.ok) {
        // Show success message or close modal
        onClose()
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-x-hidden">
        <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
          <DialogTitle className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            Settings
          </DialogTitle>
          <DialogDescription>Manage your account preferences</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
              <p className="mt-2 text-slate-500">Loading settings...</p>
            </div>
          ) : (
            <>
              <div className="bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Profile Information</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="userName">Full Name</Label>
                    <Input id="userName" value={userName} disabled className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="userEmail">Email Address</Label>
                    <Input id="userEmail" value={userEmail} disabled className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Appearance Settings */}
              <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="w-5 h-5 text-purple-600" />
                    <span>Appearance</span>
                  </CardTitle>
                  <CardDescription>Customize your interface</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={preferences.theme}
                      onValueChange={(value) => handlePreferenceChange('theme', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Language & Region */}
              <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-orange-600" />
                    <span>Language & Region</span>
                  </CardTitle>
                  <CardDescription>Set your country and curriculum</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={preferences.country}
                      onValueChange={(value) => {
                        setPreferences(prev => ({
                          ...prev,
                          country: value,
                          curriculum: '',
                        }))
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.flag} {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="curriculum">Curriculum</Label>
                    <Select
                      value={preferences.curriculum}
                      onValueChange={(value) => handlePreferenceChange('curriculum', value)}
                      disabled={!preferences.country}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={preferences.country ? 'Select curriculum' : 'Select a country first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {getCurriculaByCountry(preferences.country).map((cur) => (
                          <SelectItem key={cur.id} value={cur.id}>
                            {cur.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      <p className="text-sm text-gray-600">
                        Language is automatically determined by subject selection. 
                        Swahili is only used for Kiswahili subjects, all other content is in English.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-green-600" />
                    <span>Notifications</span>
                  </CardTitle>
                  <CardDescription>Manage your notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pushNotifications">Push Notifications</Label>
                      <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={preferences.pushNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange('pushNotifications', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* System Settings */}
              <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-orange-600" />
                    <span>System</span>
                  </CardTitle>
                  <CardDescription>Timezone preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(value) => handlePreferenceChange('timezone', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Africa/Nairobi">Nairobi (EAT)</SelectItem>
                        <SelectItem value="Africa/Dar_es_Salaam">Dar es Salaam (EAT)</SelectItem>
                        <SelectItem value="Africa/Kampala">Kampala (EAT)</SelectItem>
                        <SelectItem value="Africa/Lagos">Lagos (WAT)</SelectItem>
                        <SelectItem value="Africa/Johannesburg">Johannesburg (SAST)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                        <SelectItem value="America/New_York">New York (EST)</SelectItem>
                        <SelectItem value="America/Chicago">Chicago (CST)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Los Angeles (PST)</SelectItem>
                        <SelectItem value="Asia/Kolkata">Kolkata (IST)</SelectItem>
                        <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="px-5 py-2.5 text-sm font-medium">Cancel</Button>
          <Button onClick={savePreferences} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 rounded-lg px-5 py-2.5 text-sm font-medium transition-all">
            {saving ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
