'use client'

import { useSchoolInfo } from '@/hooks/use-school-info'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IndependentUserWelcome } from '@/components/onboarding/independent-user-welcome'
import { SubscriptionAlert } from '@/components/subscription/subscription-alert'
import { 
  BookOpen, 
  Users, 
  FileText, 
  BarChart3, 
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  MessageSquare,
  Brain,
  ClipboardList,
  Download,
  Upload,
  Eye,
  Edit,
  MoreHorizontal,
  Calendar,
  AlertCircle,
  MapPin,
  Activity,
  Trash2,
  Mail,
  Bell,
  Award,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  duration: number;
  location: string | null;
  status: string;
  attendees?: any;
  creator: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  // Progress info
  progress: number;
  progressText: string;
  daysUntil: number;
  hoursUntil: number;
  minutesUntil: number;
  isUpcoming: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  isThisWeek: boolean;
}

interface DashboardStats {
  totalStudents: {
    value: number;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral' | 'warning';
  };
  activeLessonPlans: {
    value: number;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral' | 'warning';
  };
  pendingAssignments: {
    value: number;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral' | 'warning';
  };
  completedThisWeek: {
    value: number;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral' | 'warning';
  };
}

interface RecentActivity {
  id: string;
  type: string;
  action: string;
  description: string;
  time: string;
  user: string;
  metadata?: any;
}

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const { schoolInfo, isIndependent, loading: schoolInfoLoading } = useSchoolInfo()
  const { unreadCount } = useUnreadMessages()
  // Fresh name from DB — overrides the stale JWT name
  const [displayName, setDisplayName] = useState<string>('')
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [aiAlerts, setAiAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Fetch dashboard stats with retry on DB connection errors
  useEffect(() => {
    // Fetch fresh name from DB so profile changes reflect immediately
    const fetchProfile = async () => {
      if (!session?.user?.id) return
      try {
        const res = await fetch(`/api/user-profile?userId=${session.user.id}`)
        if (res.ok) {
          const p = await res.json()
          setDisplayName(`${p.firstName || ''} ${p.lastName || ''}`.trim())
        }
      } catch { /* silent */ }
    }
    fetchProfile()
  }, [session?.user?.id])

  // Fetch dashboard stats with retry on DB connection errors
  useEffect(() => {
    const fetchStats = async (attempt = 0) => {
      try {
        const response = await fetch('/api/teacher/dashboard-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setRecentActivities(data.recentActivities || []);
        } else if (response.status >= 500 && attempt < 2) {
          // Retry on server errors (DB connection drops)
          setTimeout(() => fetchStats(attempt + 1), 1500 * (attempt + 1));
          return;
        } else {
          // Use zero-value fallback so dashboard always renders
          setStats({
            totalStudents:    { value: 0, change: 'Unable to load', changeType: 'neutral' },
            activeLessonPlans:{ value: 0, change: 'Unable to load', changeType: 'neutral' },
            pendingAssignments:{ value: 0, change: 'Unable to load', changeType: 'neutral' },
            completedThisWeek:{ value: 0, change: 'Unable to load', changeType: 'neutral' },
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        if (attempt < 2) {
          setTimeout(() => fetchStats(attempt + 1), 1500 * (attempt + 1));
          return;
        }
        setStats({
          totalStudents:    { value: 0, change: 'Connection error', changeType: 'neutral' },
          activeLessonPlans:{ value: 0, change: 'Connection error', changeType: 'neutral' },
          pendingAssignments:{ value: 0, change: 'Connection error', changeType: 'neutral' },
          completedThisWeek:{ value: 0, change: 'Connection error', changeType: 'neutral' },
        });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch upcoming meetings
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await fetch('/api/teacher/meetings?limit=1');
        if (response.ok) {
          const data = await response.json();
          // Filter out completed meetings to ensure they disappear
          const activeMeetings = (data.upcomingMeetings || []).filter((meeting: Meeting) => 
            meeting.status !== 'COMPLETED' && meeting.status !== 'CANCELLED'
          );
          setMeetings(activeMeetings);
        }
      } catch (error) {
        console.error('Error fetching meetings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  // Format date for display
  const formatMeetingDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays < 7) {
      return `In ${diffDays} days`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Format time for display
  const formatMeetingTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Activity CRUD functions
  const refreshActivities = async () => {
    setActivityLoading(true);
    try {
      const response = await fetch('/api/activities?limit=3');
      if (response.ok) {
        const data = await response.json();
        setRecentActivities(data.activities);
      }
    } catch (error) {
      console.error('Error refreshing activities:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  const deleteActivity = async (activityId: string) => {
    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        // Remove from local state
        setRecentActivities(prev => prev.filter(activity => activity.id !== activityId));
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  const updateActivity = async (activityId: string, updates: Partial<RecentActivity>) => {
    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        // Refresh activities
        await refreshActivities();
      }
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  // Fetch today's schedule
  useEffect(() => {
    const fetchSchedule = async () => {
      setScheduleLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/teacher/schedules?date=${today}&limit=10&sortOrder=asc`);
        if (res.ok) {
          const data = await res.json();
          setTodaySchedule(data.schedules || []);
        }
      } catch { /* silent */ }
      finally { setScheduleLoading(false); }
    };
    fetchSchedule();
  }, []);

  // Fetch AI insights/alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      setAlertsLoading(true);
      try {
        const res = await fetch('/api/teacher/analytics/ai-insights?period=7');
        if (res.ok) {
          const data = await res.json();
          setAiAlerts((data.insights || []).filter((i: any) => i.priority === 'high' || i.priority === 'medium').slice(0, 5));
        }
      } catch { /* silent */ }
      finally { setAlertsLoading(false); }
    };
    fetchAlerts();
  }, []);

  // Fetch recent submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      setSubmissionsLoading(true);
      try {
        const res = await fetch('/api/assignments?limit=5');
        if (res.ok) {
          const data = await res.json();
          setRecentSubmissions(data.assignments || data.submissions || []);
        }
      } catch { /* silent */ }
      finally { setSubmissionsLoading(false); }
    };
    fetchSubmissions();
  }, []);

  // Check if this is a new independent user
  useEffect(() => {
    if (!schoolInfoLoading && isIndependent && !localStorage.getItem('independent-teacher-onboarded')) {
      setShowOnboarding(true)
    }
  }, [isIndependent, schoolInfoLoading])

  const handleOnboardingComplete = () => {
    localStorage.setItem('independent-teacher-onboarded', 'true')
    setShowOnboarding(false)
  }

  const quickActions = [
    {
      title: 'My Students',
      description: 'View and manage your students',
      icon: Users,
      href: '/teacher/students',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Create Lesson Plan',
      description: 'Generate AI-powered lesson plans',
      icon: BookOpen,
      href: '/teacher/lesson-plans/create',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'AI Tools',
      description: 'Generate images & presentations',
      icon: Brain,
      href: '/teacher/ai-tools',
      color: 'from-indigo-500 to-purple-600'
    },
    {
      title: 'Generate Scheme of Work',
      description: 'Create comprehensive schemes',
      icon: ClipboardList,
      href: '/teacher/schemes-of-work',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Ask Hope AI',
      description: 'Get instant teaching support',
      icon: Sparkles,
      href: '/teacher/alexa',
      color: 'from-pink-500 to-pink-600'
    }
  ]

  // Show onboarding for new independent users
  if (showOnboarding && session?.user) {
    return (
      <IndependentUserWelcome 
        userRole="TEACHER"
        userName={displayName || session.user.name || 'Teacher'}
        onComplete={handleOnboardingComplete}
      />
    )
  }

  return (
    <div>
      {/* Subscription Alert */}
      <SubscriptionAlert />

      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {(displayName || session?.user?.name || 'Teacher').split(' ')[0]}!
        </h1>
        <p className="text-gray-600">
          {isIndependent 
            ? "Welcome to your independent teaching workspace! Create lesson plans, manage content, and use AI tools without school restrictions."
            : schoolInfo?.school?.name 
              ? `Here's what's happening at ${schoolInfo.school.name} today.`
              : "Here's what's happening in your classroom today."
          }
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsLoading ? (
          // Loading skeleton for all cards
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="bg-gradient-to-br from-white via-gray-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="mt-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalStudents.value ?? 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className={`mt-4 flex items-center text-sm ${
                  stats?.totalStudents.changeType === 'positive' ? 'text-green-600' :
                  stats?.totalStudents.changeType === 'negative' ? 'text-red-600' :
                  stats?.totalStudents.changeType === 'warning' ? 'text-orange-600' :
                  'text-gray-500'
                }`}>
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>{stats?.totalStudents.change ?? '—'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white via-green-50 to-emerald-50 shadow-lg backdrop-blur-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Lesson Plans</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.activeLessonPlans.value ?? 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className={`mt-4 flex items-center text-sm ${
                  stats?.activeLessonPlans.changeType === 'positive' ? 'text-green-600' :
                  stats?.activeLessonPlans.changeType === 'negative' ? 'text-red-600' :
                  stats?.activeLessonPlans.changeType === 'warning' ? 'text-orange-600' :
                  'text-gray-600'
                }`}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>{stats?.activeLessonPlans.change ?? '—'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white via-purple-50 to-violet-50 shadow-lg backdrop-blur-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Assignments</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.pendingAssignments.value ?? 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className={`mt-4 flex items-center text-sm ${
                  stats?.pendingAssignments.changeType === 'positive' ? 'text-green-600' :
                  stats?.pendingAssignments.changeType === 'negative' ? 'text-red-600' :
                  stats?.pendingAssignments.changeType === 'warning' ? 'text-orange-600' :
                  'text-gray-600'
                }`}>
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{stats?.pendingAssignments.change ?? '—'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white via-pink-50 to-rose-50 shadow-lg backdrop-blur-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed This Week</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.completedThisWeek.value ?? 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className={`mt-4 flex items-center text-sm ${
                  stats?.completedThisWeek.changeType === 'positive' ? 'text-green-600' :
                  stats?.completedThisWeek.changeType === 'negative' ? 'text-red-600' :
                  stats?.completedThisWeek.changeType === 'warning' ? 'text-orange-600' :
                  'text-gray-600'
                }`}>
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-xs">{stats?.completedThisWeek.change ?? '—'}</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="bg-gradient-to-br from-white via-gray-50 to-blue-50 shadow-lg backdrop-blur-sm border-0 hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer h-full">
                <CardContent className="p-6 h-full">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <Plus className="w-5 h-5 text-gray-400 ml-auto" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Today's Schedule + AI Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Today's Schedule */}
        <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Today's Schedule
              </CardTitle>
              <Link href="/teacher/calendar">
                <Button variant="ghost" size="sm" className="text-xs">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {scheduleLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-200 rounded-lg animate-pulse" />)}
              </div>
            ) : todaySchedule.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No classes scheduled today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todaySchedule.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-blue-100">
                    <div className="w-14 text-center shrink-0">
                      <p className="text-xs font-bold text-blue-600">
                        {new Date(item.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {item.class && <span>{item.class.name}</span>}
                        {item.location && <><span>·</span><MapPin className="w-3 h-3" />{item.location}</>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      item.type === 'CLASS' ? 'bg-blue-100 text-blue-700' :
                      item.type === 'EXAM' ? 'bg-red-100 text-red-700' :
                      'bg-green-100 text-green-700'
                    }`}>{item.type}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights / Alerts */}
        <Card className="bg-gradient-to-br from-white via-amber-50 to-orange-50 shadow-lg backdrop-blur-sm border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-amber-600" />
                AI Insights
              </CardTitle>
              <Link href="/teacher/analytics">
                <Button variant="ghost" size="sm" className="text-xs">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-200 rounded-lg animate-pulse" />)}
              </div>
            ) : aiAlerts.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No alerts — everything looks good</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {aiAlerts.map((alert: any, i: number) => (
                  <div key={alert.id || i} className={`flex gap-3 p-3 rounded-xl border ${
                    alert.priority === 'high' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
                  }`}>
                    {alert.priority === 'high'
                      ? <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    }
                    <div>
                      <p className="text-sm font-medium text-gray-800">{alert.title || alert.type}</p>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions + Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-white via-green-50 to-emerald-50 shadow-lg backdrop-blur-sm border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                Recent Submissions
              </CardTitle>
              <Link href="/teacher/assignments">
                <Button variant="ghost" size="sm" className="text-xs">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {submissionsLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-200 rounded-lg animate-pulse" />)}
              </div>
            ) : recentSubmissions.length === 0 ? (
              <div className="text-center py-6">
                <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent submissions</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSubmissions.slice(0, 4).map((sub: any) => (
                  <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-green-100">
                    <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{sub.title}</p>
                      <p className="text-xs text-gray-500">{sub.subject} · {sub.studentName || 'Student'}</p>
                    </div>
                    {sub.grade !== null && sub.grade !== undefined && (
                      <span className="text-sm font-bold text-green-600">{Math.round(sub.grade)}%</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-purple-50 to-violet-50 shadow-lg backdrop-blur-sm border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-600" />
                Messages
              </CardTitle>
              <Link href="/teacher/messages">
                <Button variant="ghost" size="sm" className="text-xs">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {session ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/70 border border-purple-100">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'No unread messages'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {unreadCount > 0 ? 'Check your inbox for new messages' : 'All caught up!'}
                    </p>
                  </div>
                </div>
                <Link href="/teacher/messages">
                  <Button variant="outline" size="sm" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Open Messages
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Mail className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading messages...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshActivities}
              disabled={activityLoading}
              className="edugenius-glass"
            >
              {activityLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <Activity className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>
        <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-6">
            {statsLoading || activityLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-48"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recent activity</p>
                <p className="text-sm text-gray-500 mt-2">Your activities will appear here</p>
                <Button 
                  onClick={refreshActivities}
                  className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Refresh Activities
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm rounded-lg hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.metadata?.activityType === 'lesson_plan' ? 'bg-blue-100' :
                        activity.metadata?.activityType === 'scheme_of_work' ? 'bg-orange-100' :
                        activity.metadata?.activityType === 'assignment' ? 'bg-purple-100' :
                        activity.type === 'STUDENT_ENROLLED' ? 'bg-green-100' :
                        activity.type === 'MEETING_SCHEDULED' ? 'bg-pink-100' :
                        activity.type === 'USER_LOGIN' ? 'bg-indigo-100' :
                        'bg-gray-100'
                      }`}>
                        {activity.metadata?.activityType === 'lesson_plan' ? <BookOpen className="w-5 h-5 text-blue-600" /> :
                        activity.metadata?.activityType === 'scheme_of_work' ? <FileText className="w-5 h-5 text-orange-600" /> :
                        activity.metadata?.activityType === 'assignment' ? <ClipboardList className="w-5 h-5 text-purple-600" /> :
                        activity.type === 'STUDENT_ENROLLED' ? <Users className="w-5 h-5 text-green-600" /> :
                        activity.type === 'MEETING_SCHEDULED' ? <Calendar className="w-5 h-5 text-pink-600" /> :
                        activity.type === 'USER_LOGIN' ? <Activity className="w-5 h-5 text-indigo-600" /> :
                        <Activity className="w-5 h-5 text-gray-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>
                            {new Date(activity.time).toLocaleDateString()} at {new Date(activity.time).toLocaleTimeString()}
                          </span>
                          <span className="text-xs text-gray-400">by {activity.user}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {activity.action}
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deleteActivity(activity.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Meetings */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Upcoming Meetings</h2>
          <Link href="/teacher/meetings">
            <Button variant="outline" className="edugenius-glass">
              <Eye className="w-4 h-4 mr-2" />
              View All
            </Button>
          </Link>
        </div>
        <Card className="bg-gradient-to-br from-white via-green-50 to-emerald-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">Loading meetings...</span>
              </div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No upcoming meetings scheduled</p>
                <p className="text-sm text-gray-500 mt-2">Check back later for new meetings</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-white/70 to-green-50/70 backdrop-blur-sm rounded-lg hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        meeting.isToday ? 'bg-red-500' :
                        meeting.isTomorrow ? 'bg-orange-500' :
                        meeting.isThisWeek ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}>
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{meeting.title}</p>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              meeting.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                              meeting.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' :
                              meeting.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                              meeting.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {meeting.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              meeting.isToday ? 'bg-red-100 text-red-800' :
                              meeting.isTomorrow ? 'bg-orange-100 text-orange-800' :
                              meeting.isThisWeek ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {meeting.progressText}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatMeetingDate(meeting.date)} at {formatMeetingTime(meeting.time)}
                          </span>
                          {meeting.location && (
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {meeting.location}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {meeting.duration} min
                          </span>
                        </div>

                        {/* Progress Bar */}
                        {meeting.status === 'SCHEDULED' && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Meeting Progress</span>
                              <span>{meeting.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  meeting.isToday ? 'bg-red-500' :
                                  meeting.isTomorrow ? 'bg-orange-500' :
                                  meeting.isThisWeek ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${meeting.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {meeting.description && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{meeting.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            Created by {meeting.creator.firstName} {meeting.creator.lastName}
                          </p>
                          {meeting.attendees && (
                            <p className="text-xs text-gray-500">
                              {Array.isArray(meeting.attendees) ? meeting.attendees.length : 0} attendees
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
