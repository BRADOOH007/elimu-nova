'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Presentation, Calendar, User, BookOpen, GraduationCap, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'