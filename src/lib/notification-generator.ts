import { prisma } from './prisma'

export interface NotificationData {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  userId: string
}

export class NotificationGenerator {
  // Generate notification when student completes an assignment
  static async assignmentCompleted(studentId: string, assignmentTitle: string) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          teacher: {
            include: {
              user: true
            }
          }
        }
      })

      if (!student || !student.teacher) return

      const notification: NotificationData = {
        title: 'Assignment Submitted',
        message: `${student.user.firstName} ${student.user.lastName} has submitted "${assignmentTitle}"`,
        type: 'info',
        userId: student.teacher.userId
      }

      await this.createNotification(notification)
    } catch (error) {
      console.error('Error generating assignment completion notification:', error)
    }
  }

  // Generate notification when student starts a study session
  static async studySessionStarted(studentId: string, subject: string, duration: number) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          teacher: {
            include: {
              user: true
            }
          }
        }
      })

      if (!student || !student.teacher) return

      const notification: NotificationData = {
        title: 'Study Session Started',
        message: `${student.user.firstName} ${student.user.lastName} started studying ${subject} for ${duration} minutes`,
        type: 'info',
        userId: student.teacher.userId
      }

      await this.createNotification(notification)
    } catch (error) {
      console.error('Error generating study session notification:', error)
    }
  }

  // Generate notification when student asks AI tutor for help
  static async aiTutorHelpRequested(studentId: string, question: string, subject?: string) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          teacher: {
            include: {
              user: true
            }
          }
        }
      })

      if (!student || !student.teacher) return

      const subjectText = subject ? ` in ${subject}` : ''
      const notification: NotificationData = {
        title: 'AI Tutor Help Requested',
        message: `${student.user.firstName} ${student.user.lastName} asked for help${subjectText}: "${question.substring(0, 100)}${question.length > 100 ? '...' : ''}"`,
        type: 'info',
        userId: student.teacher.userId
      }

      await this.createNotification(notification)
    } catch (error) {
      console.error('Error generating AI tutor notification:', error)
    }
  }

  // Generate notification when student's grade improves significantly
  static async gradeImprovement(studentId: string, subject: string, oldGrade: number, newGrade: number) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          teacher: {
            include: {
              user: true
            }
          }
        }
      })

      if (!student || !student.teacher) return

      const improvement = newGrade - oldGrade
      const notification: NotificationData = {
        title: 'Grade Improvement',
        message: `${student.user.firstName} ${student.user.lastName} improved in ${subject} from ${oldGrade}% to ${newGrade}% (+${improvement}%)`,
        type: 'success',
        userId: student.teacher.userId
      }

      await this.createNotification(notification)
    } catch (error) {
      console.error('Error generating grade improvement notification:', error)
    }
  }

  // Generate notification when student is falling behind
  static async studentFallingBehind(studentId: string, reason: string) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          teacher: {
            include: {
              user: true
            }
          }
        }
      })

      if (!student || !student.teacher) return

      const notification: NotificationData = {
        title: 'Student Needs Attention',
        message: `${student.user.firstName} ${student.user.lastName} may need extra support: ${reason}`,
        type: 'warning',
        userId: student.teacher.userId
      }

      await this.createNotification(notification)
    } catch (error) {
      console.error('Error generating falling behind notification:', error)
    }
  }

  // Generate notification when student achieves a milestone
  static async milestoneAchieved(studentId: string, milestone: string) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          teacher: {
            include: {
              user: true
            }
          }
        }
      })

      if (!student || !student.teacher) return

      const notification: NotificationData = {
        title: 'Milestone Achieved',
        message: `${student.user.firstName} ${student.user.lastName} achieved: ${milestone}`,
        type: 'success',
        userId: student.teacher.userId
      }

      await this.createNotification(notification)
    } catch (error) {
      console.error('Error generating milestone notification:', error)
    }
  }

  // Generate notification for overdue assignments
  static async overdueAssignment(studentId: string, assignmentTitle: string, daysOverdue: number) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          teacher: {
            include: {
              user: true
            }
          }
        }
      })

      if (!student || !student.teacher) return

      const notification: NotificationData = {
        title: 'Overdue Assignment',
        message: `${student.user.firstName} ${student.user.lastName} has an overdue assignment: "${assignmentTitle}" (${daysOverdue} days overdue)`,
        type: 'warning',
        userId: student.teacher.userId
      }

      await this.createNotification(notification)
    } catch (error) {
      console.error('Error generating overdue assignment notification:', error)
    }
  }

  // Generate notification for low study time
  static async lowStudyTime(studentId: string, currentHours: number, targetHours: number) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          teacher: {
            include: {
              user: true
            }
          }
        }
      })

      if (!student || !student.teacher) return

      const notification: NotificationData = {
        title: 'Low Study Time',
        message: `${student.user.firstName} ${student.user.lastName} has only studied ${currentHours} hours this week (target: ${targetHours} hours)`,
        type: 'warning',
        userId: student.teacher.userId
      }

      await this.createNotification(notification)
    } catch (error) {
      console.error('Error generating low study time notification:', error)
    }
  }

  // Private method to create notification
  private static async createNotification(notification: NotificationData) {
    try {
      await prisma.notification.create({
        data: {
          title: notification.title,
          message: notification.message,
          type: notification.type,
          userId: notification.userId
        }
      })
    } catch (error) {
      console.error('Error creating notification:', error)
    }
  }

  // Generate daily summary notifications
  static async generateDailySummary(teacherId: string) {
    try {
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
        include: {
          user: true,
          students: {
            include: {
              user: true,
              analytics: true
            }
          }
        }
      })

      if (!teacher) return

      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      // Get yesterday's activity
      const studySessions = await prisma.studySession.findMany({
        where: {
          studentId: {
            in: teacher.students.map(s => s.id)
          },
          startTime: {
            gte: yesterday,
            lt: today
          }
        },
        include: {
          student: {
            include: {
              user: true
            }
          }
        }
      })

      const aiTutorSessions = await prisma.aITutorSession.findMany({
        where: {
          studentId: {
            in: teacher.students.map(s => s.id)
          },
          createdAt: {
            gte: yesterday,
            lt: today
          }
        },
        include: {
          student: {
            include: {
              user: true
            }
          }
        }
      })

      // Generate summary
      const totalStudyTime = studySessions.reduce((total, session) => total + session.duration, 0)
      const activeStudents = new Set(studySessions.map(s => s.studentId)).size
      const aiHelpRequests = aiTutorSessions.length

      const notification: NotificationData = {
        title: 'Daily Student Activity Summary',
        message: `Yesterday's activity: ${activeStudents} students studied for ${Math.round(totalStudyTime / 60)} hours, ${aiHelpRequests} AI tutor requests. Check individual student progress for details.`,
        type: 'info',
        userId: teacher.userId
      }

      await this.createNotification(notification)
    } catch (error) {
      console.error('Error generating daily summary:', error)
    }
  }
}
