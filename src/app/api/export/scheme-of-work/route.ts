import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { schemeOfWorkId, format, content: requestContent, title, subject, grade, term, topic, duration, lessonsPerWeek, lessonDuration, topics: topicsList } = body

    console.log('Export request:', { schemeOfWorkId, format, hasRequestContent: !!requestContent, topics: topicsList })

    if (!format) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if we have direct content or need to fetch from database
    if (requestContent && title && subject && grade) {
      // Get teacher information for direct content export
      let teacher
      try {
        teacher = await prisma.teacher.findFirst({
          where: { userId: session.user.id },
          include: {
            user: true
          }
        })
      } catch (error) {
        console.error('Error fetching teacher for direct export:', error)
        teacher = null
      }

      // Create structured topics from the raw content and topics list
      const structuredTopics = (topicsList || []).map((topicTitle: string, index: number) => ({
        id: `topic-${index}`,
        title: topicTitle,
        description: '',
        weekNumber: Math.floor(index / (lessonsPerWeek || 5)) + 1,
        lessonNumber: (index % (lessonsPerWeek || 5)) + 1,
        objectives: [],
        activities: [],
        resources: [],
        assessment: '',
        duration: lessonDuration || 45
      }))

      // Create a mock scheme of work object with teacher info
      const mockSchemeOfWork = {
          title,
          subject,
          grade,
          term,
          duration,
        lessonsPerWeek: lessonsPerWeek || 5,
        lessonDuration: lessonDuration || 45,
        topics: structuredTopics,
        teacher: teacher || {
          user: {
            firstName: 'Teacher',
            lastName: 'User'
          }
        }
      }

      // Direct content export (like lesson plans)
      if (format === 'pdf') {
        const htmlContent = generateProfessionalHTML(mockSchemeOfWork, requestContent, requestContent)
        
        return new NextResponse(htmlContent, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scheme_of_work.html`,
          },
        })
      } else if (format === 'word') {
        const htmlContent = generateProfessionalWordHTML(mockSchemeOfWork, requestContent, requestContent)
        
        return new NextResponse(htmlContent, {
          headers: {
            'Content-Type': 'application/msword; charset=utf-8',
            'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scheme_of_work.doc`,
          },
        })
      }
    }

    // Database-based export (existing functionality)
    if (!schemeOfWorkId) {
      return NextResponse.json({ error: 'Missing schemeOfWorkId for database export' }, { status: 400 })
    }

    // Check if user is a teacher or student
    let teacher, student
    try {
      teacher = await prisma.teacher.findFirst({
      where: { userId: session.user.id }
    })

      student = await prisma.student.findFirst({
        where: { userId: session.user.id }
      })
    } catch (error) {
      console.error('Error fetching user data:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!teacher && !student) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get scheme of work with topics
    let schemeOfWork
    try {
      if (teacher) {
        // Teacher can access their own schemes
        console.log('Fetching scheme for teacher:', teacher.id)
        schemeOfWork = await prisma.schemeOfWork.findFirst({
      where: {
        id: schemeOfWorkId,
        teacherId: teacher.id
      },
      include: {
        teacher: {
          include: {
            user: true
          }
        }
      }
    })
      } else if (student) {
        // Student can access shared schemes
        console.log('Fetching shared scheme for student:', student.id)
        const sharedScheme = await prisma.sharedSchemeOfWork.findFirst({
          where: {
            schemeOfWorkId: schemeOfWorkId,
            studentId: student.id
          },
          include: {
            schemeOfWork: {
              include: {
                teacher: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        })
        schemeOfWork = sharedScheme?.schemeOfWork
      }
    } catch (error) {
      console.error('Error fetching scheme of work:', error)
      return NextResponse.json({ error: 'Failed to fetch scheme of work' }, { status: 500 })
    }

    if (!schemeOfWork) {
      return NextResponse.json({ error: 'Scheme of work not found' }, { status: 404 })
    }

    // Get topics for the scheme of work
    let topics: any[] = []
    try {
      console.log('Fetching topics for scheme:', schemeOfWorkId)
      topics = await prisma.schemeTopic.findMany({
        where: { schemeOfWorkId: schemeOfWorkId },
        orderBy: [
          { weekNumber: 'asc' },
          { lessonNumber: 'asc' }
        ]
      })
      console.log('Found topics:', topics.length)
    } catch (error) {
      console.error('Error fetching topics:', error)
      // Continue without topics rather than failing completely
      topics = []
    }

    // Combine the data
    const schemeWithTopics = {
      ...schemeOfWork,
      topics
    }

    let content: any = {}
    let rawContent = ''
    try {
      content = schemeOfWork.content ? JSON.parse(schemeOfWork.content) : {}
      // Extract the raw content string for parsing
      rawContent = content.generatedContent || schemeOfWork.content || ''
      console.log('Parsed content:', { hasGeneratedContent: !!content.generatedContent, contentLength: rawContent.length })
    } catch (error) {
      console.error('Error parsing content:', error)
      content = {}
      rawContent = schemeOfWork.content || ''
    }

    try {
    if (format === 'pdf') {
      // Generate professional HTML for PDF conversion
        console.log('Generating PDF for scheme:', schemeOfWork.title)
      const htmlContent = generateProfessionalHTML(schemeWithTopics, content, rawContent)
      
      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${schemeOfWork.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-scheme-of-work.html"`
        }
      })
    } else if (format === 'word') {
      // Generate professional HTML that can be opened in Word
        console.log('Generating Word document for scheme:', schemeOfWork.title)
      const wordContent = generateProfessionalWordHTML(schemeWithTopics, content, rawContent)
      
      return new NextResponse(wordContent, {
        headers: {
          'Content-Type': 'application/msword',
          'Content-Disposition': `attachment; filename="${schemeOfWork.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-scheme-of-work.doc"`
        }
      })
      }
    } catch (error) {
      console.error('Error generating HTML content:', error)
      return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Error generating export:', error)
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 })
  }
}

function parseContentToStructuredHTML(content: string): string {
  if (!content) return ''
  
  // Handle bold text with ** markers
  let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // Handle italic text with * markers (but not **)
  formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  
  // Clean up any remaining standalone asterisks
  formatted = formatted.replace(/(?<!\*)\*(?!\*)(?![^*]*\*)/g, '')
  
  return formatted
}

function parseSchemeContent(content: string, lessonsPerWeek: number = 5, lessonDuration: number = 45): any[] {
  if (!content) return []
  
  const weeks: any[] = []
  const lines = content.split('\n').filter(line => line.trim())
  
  let currentWeek: any = null
  let currentLesson: any = null
  let weekNumber = 1
  let lessonNumber = 1
  let currentSection = ''
  
  console.log('Debug - Starting to parse content with', lines.length, 'lines')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Debug logging for first 30 lines
    if (i < 30) {
      console.log(`Debug parsing line ${i}:`, line)
    }
    
    // Check for week headers (Week 1:, Week 2:, etc.)
    if (line.match(/^\*\*Week\s+\d+/i) || line.match(/^Week\s+\d+/i) || line.match(/^#{1,3}\s*Week\s+\d+/i)) {
      // Save previous week if exists
      if (currentWeek && currentWeek.lessons.length > 0) {
        weeks.push(currentWeek)
      }
      
      // Extract week number
      const weekMatch = line.match(/Week\s+(\d+)/i)
      weekNumber = weekMatch ? parseInt(weekMatch[1]) : weekNumber
      
      console.log('Debug - Found week header:', line, 'Week number:', weekNumber)
      
      // Start new week
      currentWeek = {
        weekNumber,
        lessons: []
      }
      lessonNumber = 1
      currentLesson = null
      currentSection = ''
    }
    // Check for lesson headers (Lesson X:, Topic:, or numbered lessons)
    else if (line.match(/^\*\*Lesson\s+\d+/i) || 
             line.match(/^Lesson\s+\d+/i) || 
             line.match(/^\*\*Topic:/i) || 
             line.match(/^Topic:/i) ||
             line.match(/^#{3,4}\s*Lesson/i) ||
             line.match(/^\d+\.\s*\*\*.*\*\*$/)) {
      
      console.log('Debug - Found lesson header:', line)
      
      // Extract lesson title
      let topicTitle = line
        .replace(/^\*\*Lesson\s+\d+:\s*/i, '')
        .replace(/^Lesson\s+\d+:\s*/i, '')
        .replace(/^\*\*Topic:\s*/i, '')
        .replace(/^Topic:\s*/i, '')
        .replace(/^#{3,4}\s*/i, '')
        .replace(/^\d+\.\s*/i, '')
        .replace(/^\*\*|\*\*$/g, '')
        .trim()
      
      console.log('Debug - Extracted lesson title:', topicTitle)
      
      // If we don't have a current week, create one
      if (!currentWeek) {
        currentWeek = {
          weekNumber: weekNumber,
          lessons: []
        }
      }
      
      // If we have a previous lesson, save it
      if (currentLesson) {
        currentWeek.lessons.push(currentLesson)
        lessonNumber++
      }
      
      // Start new lesson
      currentLesson = {
        lessonNumber,
        title: topicTitle || `Lesson ${lessonNumber}`,
        objectives: [],
        activities: [],
        resources: [],
        assessment: [],
        duration: lessonDuration
      }
      currentSection = ''
    }
    // Check for section headers
    else if (line.match(/^\*\*Objectives?:/i) || line.match(/^Objectives?:/i) || line.match(/^Learning Objectives?:/i)) {
      currentSection = 'objectives'
      console.log('Debug - Found objectives section')
    }
    else if (line.match(/^\*\*Teaching Activities:/i) || line.match(/^Teaching Activities:/i) || line.match(/^Activities:/i)) {
      currentSection = 'activities'
      console.log('Debug - Found activities section')
    }
    else if (line.match(/^\*\*Resources/i) || line.match(/^Resources/i) || line.match(/^Materials:/i)) {
      currentSection = 'resources'
      console.log('Debug - Found resources section')
    }
    else if (line.match(/^\*\*Assessment:/i) || line.match(/^Assessment:/i) || line.match(/^Evaluation:/i)) {
      currentSection = 'assessment'
      console.log('Debug - Found assessment section')
    }
    // Process content based on current section
    else if (currentLesson && currentSection && line.trim()) {
      // Clean up the line
      let cleanLine = line
        .replace(/^[-•*]\s*/, '')  // Remove bullet points
        .replace(/^\d+\.\s*/, '')  // Remove numbers
        .trim()
      
      if (cleanLine) {
        console.log(`Debug - Adding to ${currentSection}:`, cleanLine)
        
        switch (currentSection) {
          case 'objectives':
            currentLesson.objectives.push(cleanLine)
            break
          case 'activities':
            currentLesson.activities.push(cleanLine)
            break
          case 'resources':
            currentLesson.resources.push(cleanLine)
            break
          case 'assessment':
            currentLesson.assessment.push(cleanLine)
            break
        }
      }
    }
    // If we have a lesson but no specific section, try to extract content
    else if (currentLesson && line.trim() && !line.match(/^\*\*/)) {
      // This might be general lesson content - add to activities if no specific section
      if (!currentSection) {
        const cleanLine = line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim()
        if (cleanLine && cleanLine.length > 10) { // Only add substantial content
          currentLesson.activities.push(cleanLine)
          console.log('Debug - Adding general content to activities:', cleanLine)
        }
      }
    }
  }
  
  // Save the last lesson and week
  if (currentLesson && currentWeek) {
    currentWeek.lessons.push(currentLesson)
  }
  if (currentWeek && currentWeek.lessons.length > 0) {
    weeks.push(currentWeek)
  }
  
  console.log('Debug - Final parsed weeks:', weeks.length)
  console.log('Debug - Weeks structure:', JSON.stringify(weeks, null, 2))
  
  return weeks
}

function generateProfessionalHTML(schemeOfWork: any, content: any, requestContent?: string) {
  const topicsByWeek = groupTopicsByWeek(schemeOfWork.topics)
  const parsedWeeks = requestContent ? parseSchemeContent(requestContent, schemeOfWork.lessonsPerWeek || 5, schemeOfWork.lessonDuration || 45) : []
  
  console.log('Debug - requestContent length:', requestContent?.length || 0)
  console.log('Debug - parsedWeeks length:', parsedWeeks.length)
  console.log('Debug - first 500 chars of content:', requestContent?.substring(0, 500))
  console.log('Debug - parsedWeeks:', JSON.stringify(parsedWeeks, null, 2))
  
  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${schemeOfWork.title}</title>
          <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
          color: #2d3748;
          background: #ffffff;
          font-size: 14px;
        }
        
        .container {
          max-width: 210mm;
              margin: 0 auto;
          padding: 20mm;
          background: white;
            }
        
            .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
          border-radius: 12px;
              margin-bottom: 30px;
              text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
        
            .header h1 {
              margin: 0;
          font-size: 2.2em;
          font-weight: 700;
          margin-bottom: 10px;
        }
        
        .header .subtitle {
          margin: 0;
          font-size: 1.1em;
          opacity: 0.95;
          font-weight: 300;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .info-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        
        .info-card h3 {
          color: #667eea;
          font-size: 0.9em;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        
        .info-card p {
          font-size: 1.1em;
          font-weight: 500;
          color: #2d3748;
        }
        
        .objectives {
          background: #f0fff4;
          padding: 25px;
          border-radius: 8px;
          border-left: 4px solid #48bb78;
          margin-bottom: 30px;
        }
        
        .objectives h2 {
          color: #2f855a;
          font-size: 1.3em;
          margin-bottom: 15px;
          font-weight: 600;
        }
        
        .objectives ul {
          list-style: none;
          padding-left: 0;
        }
        
        .objectives li {
          padding: 8px 0;
          padding-left: 25px;
          position: relative;
          color: #2d3748;
        }
        
        .objectives li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #48bb78;
              font-weight: bold;
            }
        
        .objectives strong {
          font-weight: bold;
          color: #2f855a;
        }
        
        .objectives em {
          font-style: italic;
          color: #555;
        }
        
        .content-section {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 8px;
          border-left: 4px solid #667eea;
          margin-bottom: 30px;
        }
        
        .content-section h2 {
          color: #2d3748;
          font-size: 1.3em;
          margin-bottom: 15px;
          font-weight: 600;
        }
        
        .content-body {
          color: #4a5568;
          line-height: 1.7;
        }
        
        .content-body strong {
          font-weight: bold;
          color: #2d3748;
        }
        
        .content-body em {
          font-style: italic;
          color: #555;
            }
        
        .weekly-schedule {
          margin-bottom: 30px;
        }
        
        .weekly-schedule h2 {
          color: #2d3748;
          font-size: 2em;
          margin-bottom: 30px;
          font-weight: 700;
          text-align: center;
          position: relative;
          padding: 20px;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border-radius: 12px;
          border-left: 6px solid #667eea;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        
        .week {
          margin-bottom: 35px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          background: white;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .week:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
        }
        
        .week-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .week-header h3 {
          margin: 0;
          font-weight: 700;
          font-size: 1.3em;
        }
        
        .week-meta {
          background: rgba(255, 255, 255, 0.2);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.9em;
          font-weight: 500;
        }
        
        .lessons {
          background: white;
        }
        
        .lesson {
          padding: 25px;
          border-bottom: 1px solid #f1f5f9;
          position: relative;
        }
        
        .lesson:last-child {
          border-bottom: none;
        }
        
        .lesson::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(180deg, #667eea, #764ba2);
        }
        
        .lesson-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .lesson-title {
          font-weight: 700;
          color: #2d3748;
          font-size: 1.3em;
          flex: 1;
          line-height: 1.4;
        }
        
        .lesson-meta {
          color: #718096;
          font-size: 0.9em;
          background: linear-gradient(135deg, #f7fafc, #edf2f7);
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          font-weight: 500;
        }
        
        .lesson-description {
          color: #4a5568;
          margin-bottom: 20px;
          line-height: 1.7;
          font-size: 1.05em;
        }
        
        .lesson-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 25px;
          margin-top: 20px;
        }
        
        .detail-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        
        .detail-section h4 {
          color: #2d3748;
          font-size: 1em;
          margin-bottom: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .detail-section .icon {
          font-size: 1.2em;
        }
        
        .detail-section ul {
          list-style: none;
          padding: 0;
        }
        
        .detail-section li {
          padding: 4px 0;
          padding-left: 15px;
          position: relative;
          color: #4a5568;
          font-size: 0.9em;
        }
        
        .detail-section li:before {
          content: "•";
          position: absolute;
          left: 0;
          color: #667eea;
        }
        
        .detail-section strong {
          font-weight: bold;
          color: #2d3748;
        }
        
        .detail-section em {
          font-style: italic;
          color: #555;
        }
        
        .lesson-description strong {
          font-weight: bold;
          color: #2d3748;
        }
        
        .lesson-description em {
          font-style: italic;
          color: #555;
        }
        
            .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
              text-align: center;
          color: #718096;
          font-size: 0.9em;
        }
        
        .footer .logo {
          font-weight: 600;
          color: #667eea;
        }
        
            @media screen and (max-width: 768px) {
          body {
            font-size: 13px;
          }
          
          .container {
            padding: 15px;
            max-width: 100%;
          }
          
          .header {
            padding: 20px 15px;
            border-radius: 8px;
          }
          
          .header h1 {
            font-size: 1.5em;
          }
          
          .header .subtitle {
            font-size: 0.95em;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .info-card {
            padding: 15px;
          }
          
          .objectives {
            padding: 15px;
          }
          
          .objectives h2 {
            font-size: 1.1em;
          }
          
          .content-section {
            padding: 15px;
          }
          
          .content-section h2 {
            font-size: 1.1em;
          }
          
          .weekly-schedule h2 {
            font-size: 1.4em;
            margin-bottom: 15px;
          }
          
          .week {
            margin-bottom: 20px;
            border-radius: 8px;
          }
          
          .week-header {
            padding: 15px;
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }
          
          .week-header h3 {
            font-size: 1.1em;
          }
          
          .week-meta {
            align-self: flex-start;
          }
          
          .lesson {
            padding: 15px;
          }
          
          .lesson::before {
            width: 3px;
          }
          
          .lesson-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 15px;
            padding-bottom: 10px;
          }
          
          .lesson-title {
            font-size: 1.05em;
          }
          
          .lesson-meta {
            font-size: 0.85em;
            padding: 6px 12px;
          }
          
          .lesson-description {
            font-size: 0.95em;
            margin-bottom: 15px;
          }
          
          .lesson-details {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          
          .detail-section {
            padding: 15px;
          }
          
          .detail-section h4 {
            font-size: 0.95em;
          }
          
          .detail-section li {
            font-size: 0.85em;
            padding: 3px 0;
          }
          
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            font-size: 0.85em;
          }
        }
        
        @media screen and (max-width: 480px) {
          body {
            font-size: 12px;
          }
          
          .container {
            padding: 10px;
          }
          
          .header {
            padding: 15px 10px;
          }
          
          .header h1 {
            font-size: 1.3em;
          }
          
          .header .subtitle {
            font-size: 0.9em;
          }
          
          .info-card {
            padding: 12px;
          }
          
          .objectives {
            padding: 12px;
          }
          
          .content-section {
            padding: 12px;
          }
          
          .weekly-schedule h2 {
            font-size: 1.2em;
          }
          
          .week-header {
            padding: 12px;
          }
          
          .lesson {
            padding: 12px;
          }
          
          .detail-section {
            padding: 12px;
          }
        }
        
            @media print {
          body { margin: 0; }
          .container { padding: 15mm; }
          .week { page-break-inside: avoid; }
          .lesson { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
      <div class="container">
          <div class="header">
          <h1>${schemeOfWork.title}</h1>
          <p class="subtitle">${schemeOfWork.subject} • ${schemeOfWork.grade}</p>
        </div>
        
        <div class="info-grid">
          <div class="info-card">
            <h3>Subject</h3>
            <p>${schemeOfWork.subject}</p>
          </div>
          <div class="info-card">
            <h3>Grade Level</h3>
            <p>${schemeOfWork.grade}</p>
          </div>
          <div class="info-card">
            <h3>Duration</h3>
            <p>${schemeOfWork.duration || 'N/A'} weeks</p>
          </div>
        </div>
        
        ${schemeOfWork.objectives ? `
        <div class="objectives">
          <h2>Learning Objectives</h2>
          <ul>
            ${schemeOfWork.objectives.split(';').map((obj: string) => `<li>${parseContentToStructuredHTML(obj.trim())}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        <div class="weekly-schedule">
          <h2>📚 Weekly Lesson Schedule</h2>
          ${(parsedWeeks.length > 0 || Object.keys(topicsByWeek).length > 0) ? '' : '<p style="text-align: center; color: #718096; padding: 40px;">No topics or lessons have been added to this scheme of work yet.</p>'}
          ${parsedWeeks.length > 0 ? parsedWeeks.map((week: any) => `
            <div class="week">
              <div class="week-header">
                <h3>Week ${week.weekNumber}</h3>
                <div class="week-meta">${week.lessons.length} lessons</div>
              </div>
              <div class="lessons">
                ${week.lessons.map((lesson: any) => `
                  <div class="lesson">
                    <div class="lesson-header">
                      <div class="lesson-title">${lesson.title}</div>
                      <div class="lesson-meta">Lesson ${lesson.lessonNumber} • ${lesson.duration} minutes</div>
                    </div>
                    <div class="lesson-details">
                      ${lesson.objectives.length > 0 ? `
                        <div class="detail-section">
                          <h4><i class="icon">🎯</i> Learning Objectives</h4>
                          <ul>
                            ${lesson.objectives.map((obj: string) => `<li>${parseContentToStructuredHTML(obj)}</li>`).join('')}
                          </ul>
                        </div>
                      ` : ''}
                      ${lesson.activities.length > 0 ? `
                        <div class="detail-section">
                          <h4><i class="icon">📚</i> Teaching Activities</h4>
                          <ul>
                            ${lesson.activities.map((activity: string) => `<li>${parseContentToStructuredHTML(activity)}</li>`).join('')}
                          </ul>
                        </div>
                      ` : ''}
                      ${lesson.resources.length > 0 ? `
                        <div class="detail-section">
                          <h4><i class="icon">📋</i> Resources & Materials</h4>
                          <ul>
                            ${lesson.resources.map((resource: string) => `<li>${parseContentToStructuredHTML(resource)}</li>`).join('')}
                          </ul>
                        </div>
                      ` : ''}
                      ${lesson.assessment.length > 0 ? `
                        <div class="detail-section">
                          <h4><i class="icon">📊</i> Assessment</h4>
                          <ul>
                            ${lesson.assessment.map((assess: string) => `<li>${parseContentToStructuredHTML(assess)}</li>`).join('')}
                          </ul>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('') : ''}
          
          ${Object.keys(topicsByWeek).length > 0 ? Object.entries(topicsByWeek).map(([week, topics]: [string, any]) => `
            <div class="week">
              <div class="week-header">
                <h3>Week ${week}</h3>
                <div class="week-meta">${topics.length} lesson${topics.length !== 1 ? 's' : ''}</div>
              </div>
              <div class="lessons">
                ${topics.map((topic: any) => `
                  <div class="lesson">
                    <div class="lesson-header">
                      <div class="lesson-title">${topic.title || 'Untitled Lesson'}</div>
                      <div class="lesson-meta">Lesson ${topic.lessonNumber} • ${topic.duration || 45} minutes</div>
                    </div>
                    ${topic.description ? `<div class="lesson-description">${parseContentToStructuredHTML(topic.description)}</div>` : ''}
                    <div class="lesson-details">
                      ${topic.objectives && topic.objectives.length > 0 ? `
                        <div class="detail-section">
                          <h4><span class="icon">🎯</span> Learning Objectives</h4>
                          <ul>
                            ${topic.objectives.map((obj: string) => `<li>${parseContentToStructuredHTML(obj)}</li>`).join('')}
                          </ul>
                        </div>
                      ` : ''}
                      ${topic.activities && topic.activities.length > 0 ? `
                        <div class="detail-section">
                          <h4><span class="icon">📚</span> Teaching Activities</h4>
                          <ul>
                            ${topic.activities.map((activity: string) => `<li>${parseContentToStructuredHTML(activity)}</li>`).join('')}
                          </ul>
                        </div>
                      ` : ''}
                      ${topic.resources && topic.resources.length > 0 ? `
                        <div class="detail-section">
                          <h4><span class="icon">📋</span> Resources & Materials</h4>
                          <ul>
                            ${topic.resources.map((resource: string) => `<li>${parseContentToStructuredHTML(resource)}</li>`).join('')}
                          </ul>
                        </div>
                      ` : ''}
                      ${topic.assessment ? `
                        <div class="detail-section">
                          <h4><span class="icon">📊</span> Assessment</h4>
                          <p>${parseContentToStructuredHTML(topic.assessment)}</p>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('') : ''}
          </div>
        
        ${parsedWeeks.length === 0 && requestContent ? `
        <div class="content-section">
          <h2>Scheme of Work Content</h2>
          <div class="content-body">
            ${parseContentToStructuredHTML(requestContent)}
          </div>
        </div>
        ` : ''}
        
          <div class="footer">
          <p>Generated by <span class="logo">ElimuNova AI</span></p>
          <p>Prepared by: ${schemeOfWork.teacher?.user?.firstName || 'Teacher'} ${schemeOfWork.teacher?.user?.lastName || 'User'}</p>
        </div>
          </div>
        </body>
        </html>
      `
}

function generateProfessionalWordHTML(schemeOfWork: any, content: any, requestContent?: string) {
  const topicsByWeek = groupTopicsByWeek(schemeOfWork.topics)
  const parsedWeeks = requestContent ? parseSchemeContent(requestContent, schemeOfWork.lessonsPerWeek || 5, schemeOfWork.lessonDuration || 45) : []
  
  return `
        <!DOCTYPE html>
        <html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
        <head>
          <meta charset="UTF-8">
          <meta name="ProgId" content="Word.Document">
          <meta name="Generator" content="Microsoft Word">
          <meta name="Originator" content="Microsoft Word">
      <title>${schemeOfWork.title}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
        @page {
          size: 8.5in 11in;
          margin: 1in 1in 1in 1in;
          mso-header-margin: 0.5in;
          mso-footer-margin: 0.5in;
          mso-paper-source: 0;
        }
        
        @page Section1 {
          size: 595.3pt 841.9pt;
          margin: 72pt 72pt 72pt 72pt;
          mso-header-margin: 36pt;
          mso-footer-margin: 36pt;
          mso-paper-source: 0;
        }
        
        div.Section1 {
          page: Section1;
        }
        
        body { 
          font-family: 'Calibri', 'Arial', sans-serif; 
          margin: 0;
          padding: 0;
          line-height: 1.6;
          color: #2d3748;
          font-size: 11pt;
        }
        
        .document-container {
          width: 595.3pt;
          margin: 0 auto;
          padding: 72pt;
          background: white;
        }
        h1 { 
          color: #667eea; 
          border-bottom: 3px solid #667eea; 
          padding-bottom: 15px; 
          font-size: 2em;
          margin-bottom: 20px;
        }
        h2 { 
          color: #2d3748; 
          font-size: 1.4em; 
          margin-top: 30px; 
          margin-bottom: 15px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
        }
        h3 { 
          color: #667eea; 
          font-size: 1.2em; 
          margin-top: 25px; 
          margin-bottom: 10px;
        }
        .subtitle { 
          color: #718096; 
          margin-bottom: 30px; 
          font-size: 1.1em;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .info-table td {
          padding: 12px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .info-table td:first-child {
          font-weight: bold;
          color: #667eea;
          width: 30%;
        }
        .week-section {
          margin-bottom: 25px;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
        }
        .week-header {
          background: #667eea;
          color: white;
          padding: 15px;
          font-weight: bold;
          font-size: 1.1em;
        }
        .lesson {
          padding: 15px;
          border-bottom: 1px solid #f1f5f9;
        }
        .lesson:last-child {
          border-bottom: none;
        }
        .lesson-title {
          font-weight: bold;
          color: #2d3748;
          margin-bottom: 8px;
        }
        .lesson-meta {
          color: #718096;
          font-size: 0.9em;
          margin-bottom: 10px;
        }
        .lesson-details {
          margin-top: 10px;
        }
        .detail-section {
          margin-bottom: 15px;
        }
        .detail-section h4 {
          color: #667eea;
          font-size: 1em;
          margin-bottom: 5px;
        }
        .detail-section ul {
          margin: 0;
          padding-left: 20px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #718096;
          font-size: 0.9em;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
          </style>
        </head>
        <body>
        <div class="Section1">
        <div class="document-container">
      <h1>${schemeOfWork.title}</h1>
      <p class="subtitle">${schemeOfWork.subject} • ${schemeOfWork.grade}</p>
      
      <table class="info-table">
        <tr>
          <td>Subject</td>
          <td>${schemeOfWork.subject}</td>
        </tr>
        <tr>
          <td>Grade Level</td>
          <td>${schemeOfWork.grade}</td>
        </tr>
        <tr>
          <td>Duration</td>
          <td>${schemeOfWork.duration || 'N/A'} weeks</td>
        </tr>
        <tr>
          <td>Teacher</td>
          <td>${schemeOfWork.teacher?.user?.firstName || 'Teacher'} ${schemeOfWork.teacher?.user?.lastName || 'User'}</td>
        </tr>
      </table>
      
      ${schemeOfWork.objectives ? `
      <h2>Learning Objectives</h2>
      <ul>
        ${schemeOfWork.objectives.split(';').map((obj: string) => `<li>${obj.trim()}</li>`).join('')}
      </ul>
      ` : ''}
      
      <h2>Weekly Lesson Schedule</h2>
      ${parsedWeeks.length > 0 ? parsedWeeks.map((week: any) => `
        <div class="week-section">
          <div class="week-header">
            <h3>Week ${week.weekNumber}</h3>
            <div class="week-meta">${week.lessons.length} lessons</div>
          </div>
          ${week.lessons.map((lesson: any) => `
            <div class="lesson">
              <div class="lesson-header">
                <div class="lesson-title">${lesson.title}</div>
                <div class="lesson-meta">Lesson ${lesson.lessonNumber} • ${lesson.duration} minutes</div>
              </div>
              <div class="lesson-details">
                ${lesson.objectives.length > 0 ? `
                  <div class="detail-section">
                    <h4>🎯 Learning Objectives</h4>
                    <ul>
                      ${lesson.objectives.map((obj: string) => `<li>${parseContentToStructuredHTML(obj)}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
                ${lesson.activities.length > 0 ? `
                  <div class="detail-section">
                    <h4>📚 Teaching Activities</h4>
                    <ul>
                      ${lesson.activities.map((activity: string) => `<li>${parseContentToStructuredHTML(activity)}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
                ${lesson.resources.length > 0 ? `
                  <div class="detail-section">
                    <h4>📋 Resources & Materials</h4>
                    <ul>
                      ${lesson.resources.map((resource: string) => `<li>${parseContentToStructuredHTML(resource)}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
                ${lesson.assessment.length > 0 ? `
                  <div class="detail-section">
                    <h4>📊 Assessment</h4>
                    <ul>
                      ${lesson.assessment.map((assess: string) => `<li>${parseContentToStructuredHTML(assess)}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `).join('') : Object.entries(topicsByWeek).map(([week, topics]: [string, any]) => `
        <div class="week-section">
          <div class="week-header">
            <h3>Week ${week}</h3>
            <div class="week-meta">${topics.length} lessons</div>
          </div>
          ${topics.map((topic: any) => `
            <div class="lesson">
              <div class="lesson-header">
              <div class="lesson-title">${topic.title}</div>
              <div class="lesson-meta">Lesson ${topic.lessonNumber} • ${topic.duration} minutes</div>
              </div>
              <div class="lesson-details">
                ${topic.description ? `<p>${parseContentToStructuredHTML(topic.description)}</p>` : ''}
                ${topic.objectives.length > 0 ? `
                  <div class="detail-section">
                    <h4>🎯 Learning Objectives</h4>
                    <ul>
                      ${topic.objectives.map((obj: string) => `<li>${parseContentToStructuredHTML(obj)}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
                ${topic.activities.length > 0 ? `
                  <div class="detail-section">
                    <h4>📚 Teaching Activities</h4>
                    <ul>
                      ${topic.activities.map((activity: string) => `<li>${parseContentToStructuredHTML(activity)}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
                ${topic.resources.length > 0 ? `
                  <div class="detail-section">
                    <h4>📋 Resources & Materials</h4>
                    <ul>
                      ${topic.resources.map((resource: string) => `<li>${parseContentToStructuredHTML(resource)}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
                ${topic.assessment ? `
                  <div class="detail-section">
                    <h4>📊 Assessment</h4>
                    <p>${parseContentToStructuredHTML(topic.assessment)}</p>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}
      
      ${parsedWeeks.length === 0 && requestContent ? `
      <h2>Scheme of Work Content</h2>
      <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
        ${parseContentToStructuredHTML(requestContent)}
      </div>
      ` : ''}
      
      <div class="footer">
        <p><strong>Generated by ElimuNova AI</strong></p>
        <p>Prepared by: ${schemeOfWork.teacher?.user?.firstName || 'Teacher'} ${schemeOfWork.teacher?.user?.lastName || 'User'}</p>
      </div>
        </div>
        </div>
        </body>
        </html>
      `
}

function groupTopicsByWeek(topics: any[]) {
  if (!topics || topics.length === 0) {
    return {}
  }
  return topics.reduce((acc, topic) => {
    const week = topic.weekNumber.toString()
    if (!acc[week]) {
      acc[week] = []
    }
    acc[week].push(topic)
    return acc
  }, {})
}