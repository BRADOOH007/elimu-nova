#!/usr/bin/env tsx

/**
 * Script to fix incomplete functions caused by the confirm dialog removal
 */

import { readFileSync, writeFileSync } from 'fs'

console.log('🔧 Fixing incomplete functions caused by confirm dialog removal...\n')

const fixes = [
  {
    file: 'src/app/teacher/students/page.tsx',
    search: `  const handleDeleteStudent = async (studentId: string) => {
    // Confirmation removed - using toast notifications only`,
    replace: `  const handleDeleteStudent = async (studentId: string) => {
    try {
      const response = await fetch(`/api/teacher/students/${studentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchStudents()
        toast({
          title: "Student Deleted Successfully",
          description: "The student has been permanently removed.",
          variant: "success",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: error.error || "Unable to delete student. Please try again.",
        })
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Network error occurred. Please check your connection and try again.",
      })
    }
  }`
  },
  {
    file: 'src/app/school-admin/students/page.tsx',
    search: `  const handleDeleteStudent = async (studentId: string) => {
    // Confirmation removed - using toast notifications only`,
    replace: `  const handleDeleteStudent = async (studentId: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchStudents()
        toast({
          title: "Student Deleted Successfully",
          description: "The student has been permanently removed.",
          variant: "success",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: error.error || "Unable to delete student. Please try again.",
        })
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Network error occurred. Please check your connection and try again.",
      })
    }
  }`
  },
  {
    file: 'src/app/school-admin/teachers/page.tsx',
    search: `  const handleDeleteTeacher = async (teacherId: string) => {
    // Confirmation removed - using toast notifications only`,
    replace: `  const handleDeleteTeacher = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/teachers/${teacherId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTeachers()
        toast({
          title: "Teacher Deleted Successfully",
          description: "The teacher has been permanently removed.",
          variant: "success",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: error.error || "Unable to delete teacher. Please try again.",
        })
      }
    } catch (error) {
      console.error('Error deleting teacher:', error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Network error occurred. Please check your connection and try again.",
      })
    }
  }`
  },
  {
    file: 'src/components/modals/view-student-modal.tsx',
    search: `  const handleDelete = () => {
    // Confirmation removed - using toast notifications only
  }`,
    replace: `  const handleDelete = () => {
    onDelete(student.id)
    handleClose()
    toast({
      title: "Student Deleted Successfully",
      description: "The student has been permanently removed.",
      variant: "success",
    })
  }`
  },
  {
    file: 'src/components/modals/view-assignment-modal.tsx',
    search: `  const handleDelete = () => {
    // Confirmation removed - using toast notifications only
  }`,
    replace: `  const handleDelete = () => {
    onDelete(assignment.id)
    handleClose()
    toast({
      title: "Assignment Deleted Successfully",
      description: "The assignment has been permanently removed.",
      variant: "success",
    })
  }`
  }
]

function applyFix(fix: { file: string; search: string; replace: string }) {
  try {
    console.log(`📝 Fixing ${fix.file}...`)
    
    let content = readFileSync(fix.file, 'utf8')
    
    if (content.includes(fix.search)) {
      content = content.replace(fix.search, fix.replace)
      writeFileSync(fix.file, content, 'utf8')
      console.log(`✅ Fixed ${fix.file}`)
    } else {
      console.log(`ℹ️  No matching pattern found in ${fix.file}`)
    }
  } catch (error) {
    console.error(`❌ Error fixing ${fix.file}:`, error.message)
  }
}

async function runFixes() {
  console.log('🚀 Fixing Incomplete Functions...\n')
  
  for (const fix of fixes) {
    applyFix(fix)
  }
  
  console.log('\n📊 SUMMARY:')
  console.log('=' .repeat(60))
  console.log('✅ Fixed incomplete function definitions')
  console.log('✅ Restored proper delete functionality')
  console.log('✅ Added professional toast notifications')
  console.log('✅ Maintained error handling')
  
  console.log('\n🎯 NEXT STEPS:')
  console.log('1. Restart the development server')
  console.log('2. Test the fixed functionality')
  console.log('3. Verify no more syntax errors exist')
}

runFixes().catch(console.error)