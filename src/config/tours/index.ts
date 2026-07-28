import { TEACHER_TOUR } from './teacher-tour'
import { STUDENT_TOUR } from './student-tour'
import { SCHOOL_ADMIN_TOUR } from './school-admin-tour'
import { PARENT_TOUR } from './parent-tour'

type TourConfig = { id: string; steps: import('@/components/tour/TourProvider').TourStep[] }

export const TOUR_CONFIGS: Record<string, TourConfig> = {
  TEACHER: TEACHER_TOUR,
  STUDENT: STUDENT_TOUR,
  SCHOOL_ADMIN: SCHOOL_ADMIN_TOUR,
  PARENT: PARENT_TOUR,
}
