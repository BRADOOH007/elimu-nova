import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({}, async (req, { user }) => {

    // Handle different user roles
    if (user.role === 'STUDENT') {
      // Get student record
      const student = await prisma.student.findUnique({
        where: { userId: user.id }
      })

      if (!student) {

        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }

      // Get lesson plans shared with this student
      const sharedLessonPlans = await prisma.sharedLessonPlan.findMany({
        where: {
          studentId: student.id,
          isActive: true
        },
        include: {
          lessonPlan: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true
                    }
                  }
                }
              }
            }
          },
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          sharedAt: 'desc'
        }
      })

      return NextResponse.json({
        sharedLessonPlans: sharedLessonPlans.map(shared => ({
          id: shared.id,
          lessonPlan: {
            id: shared.lessonPlan.id,
            title: shared.lessonPlan.title,
            subject: shared.lessonPlan.subject,
            grade: shared.lessonPlan.grade,
            content: shared.lessonPlan.content,
            createdAt: shared.lessonPlan.createdAt.toISOString(),
            updatedAt: shared.lessonPlan.updatedAt.toISOString()
          },
          teacher: {
            user: {
              firstName: shared.teacher.user.firstName,
              lastName: shared.teacher.user.lastName
            }
          },
          sharedAt: shared.sharedAt.toISOString(),
          isActive: shared.isActive
        }))
      })
    } else if (user.role === 'TEACHER') {
      // Get teacher record
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id }
      })

      if (!teacher) {

        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
      }

      // Get lesson plans created by this teacher
      const lessonPlans = await prisma.lessonPlan.findMany({
        where: {
          teacherId: teacher.id
        },
        include: {
          sharedWith: {
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return NextResponse.json({
        lessonPlans: lessonPlans.map(plan => ({
          id: plan.id,
          title: plan.title,
          subject: plan.subject,
          grade: plan.grade,
          content: plan.content,
          createdAt: plan.createdAt.toISOString(),
          updatedAt: plan.updatedAt.toISOString(),
          sharedWith: plan.sharedWith.map(shared => ({
            id: shared.id,
            student: {
              id: shared.student.id,
              name: `${shared.student.user.firstName} ${shared.student.user.lastName}`,
              email: shared.student.user.email
            },
            sharedAt: shared.sharedAt.toISOString(),
            isActive: shared.isActive
          }))
        }))
      })
    } else {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 403 })
    }
})

// POST endpoint to share a lesson plan with students
export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const body = await req.json()
    const { lessonPlanId, studentIds } = body

    if (!lessonPlanId || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json({ 
        error: 'Invalid request. lessonPlanId and studentIds array required' 
      }, { status: 400 })
    }

    // Verify the lesson plan belongs to this teacher
    const lessonPlan = await prisma.lessonPlan.findFirst({
      where: {
        id: lessonPlanId,
        teacherId: teacher.id
      }
    })

    if (!lessonPlan) {
      return NextResponse.json({ 
        error: 'Lesson plan not found or not owned by teacher' 
      }, { status: 404 })
    }

    // Share with each student
    const sharedRecords = await Promise.all(
      studentIds.map(studentId =>
        prisma.sharedLessonPlan.upsert({
          where: {
            lessonPlanId_studentId: {
              lessonPlanId,
              studentId
            }
          },
          update: {
            isActive: true,
            sharedAt: new Date()
          },
          create: {
            lessonPlanId,
            studentId,
            teacherId: teacher.id,
            isActive: true
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: `Lesson plan shared with ${sharedRecords.length} student(s)`,
      sharedCount: sharedRecords.length
    })
})
