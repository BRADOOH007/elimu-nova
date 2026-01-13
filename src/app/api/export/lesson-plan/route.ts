import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, title, subject, grade, topic, duration, format } = body

    if (!content || !format) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (format === 'pdf') {
      // Generate PDF using HTML to PDF conversion
      const htmlContent = generateHTMLContent(content, title, subject, grade, topic, duration)
      
      // Return HTML that can be printed as PDF
      const response = new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_lesson_plan.html"`,
        },
      })
      
      return response
    } else if (format === 'word') {
      // Generate Word document using HTML format that Word can open
      const htmlContent = generateWordHTMLContent(content, title, subject, grade, topic, duration)
      
      const response = new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'application/msword; charset=utf-8',
          'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_lesson_plan.doc"`,
        },
      })
      
      return response
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use "pdf" or "word"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error generating document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateHTMLContent(content: string, title: string, subject: string, grade: string, topic: string, duration: number): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.7;
            color: #2c3e50;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        
        .document-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            position: relative;
        }
        
        .document-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 50px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .header h1 {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 15px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            letter-spacing: -0.5px;
            position: relative;
            z-index: 1;
        }
        
        .header .subtitle {
            font-size: 18px;
            opacity: 0.95;
            font-weight: 400;
            position: relative;
            z-index: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .header .subtitle .badge {
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 500;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
        }
        
        .content-wrapper {
            padding: 50px 40px;
            background: white;
        }
        
        .lesson-overview {
            background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 40px;
            border: 1px solid #e1e8ff;
            position: relative;
        }
        
        .lesson-overview::before {
            content: '📚';
            position: absolute;
            top: -15px;
            left: 30px;
            background: white;
            padding: 10px;
            border-radius: 50%;
            font-size: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .lesson-overview h2 {
            color: #667eea;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            margin-top: 10px;
        }
        
        .overview-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .overview-item {
            background: white;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .overview-item .label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #667eea;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .overview-item .value {
            font-size: 16px;
            font-weight: 500;
            color: #2c3e50;
        }
        
        .content {
            font-size: 16px;
            line-height: 1.8;
        }
        
        .content h1 {
            font-size: 28px;
            font-weight: 700;
            color: #2c3e50;
            margin: 40px 0 20px 0;
            padding: 20px 0;
            border-bottom: 3px solid #667eea;
            position: relative;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .content h1::before {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 0;
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #667eea, #764ba2);
        }
        
        .content h2 {
            font-size: 22px;
            font-weight: 600;
            color: #34495e;
            margin: 30px 0 15px 0;
            padding-left: 20px;
            border-left: 4px solid #667eea;
            background: linear-gradient(135deg, #f8f9ff 0%, transparent 100%);
            padding: 15px 20px;
            border-radius: 0 10px 10px 0;
        }
        
        .content h3 {
            font-size: 18px;
            font-weight: 600;
            color: #2c3e50;
            margin: 25px 0 12px 0;
            position: relative;
            padding-left: 25px;
        }
        
        .content h3::before {
            content: '▶';
            position: absolute;
            left: 0;
            color: #667eea;
            font-size: 14px;
        }
        
        .content h4 {
            font-size: 16px;
            font-weight: 600;
            color: #667eea;
            margin: 20px 0 10px 0;
        }
        
        .content p {
            margin: 15px 0;
            text-align: justify;
            color: #34495e;
        }
        
        .content ul, .content ol {
            margin: 20px 0;
            padding-left: 0;
        }
        
        .content li {
            margin: 12px 0;
            padding: 12px 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            list-style: none;
            position: relative;
            transition: all 0.3s ease;
        }
        
        .content ul li::before {
            content: '✓';
            position: absolute;
            left: -15px;
            top: 50%;
            transform: translateY(-50%);
            background: #667eea;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
        }
        
        .content ol {
            counter-reset: item;
        }
        
        .content ol li::before {
            content: counter(item);
            counter-increment: item;
            position: absolute;
            left: -15px;
            top: 50%;
            transform: translateY(-50%);
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
        }
        
        .content strong {
            font-weight: 600;
            color: #2c3e50;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .content em {
            font-style: italic;
            color: #7f8c8d;
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 4px;
        }
        
        .lesson-section {
            background: white;
            border: 1px solid #e1e8ff;
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            position: relative;
            overflow: hidden;
        }
        
        .lesson-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
        }
        
        .highlight-box {
            background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
            border: 1px solid #fecaca;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            position: relative;
        }
        
        .highlight-box::before {
            content: '💡';
            position: absolute;
            top: -12px;
            left: 20px;
            background: white;
            padding: 8px;
            border-radius: 50%;
            font-size: 20px;
        }
        
        .time-indicator {
            display: inline-block;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .footer {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid #e1e8ff;
        }
        
        .footer .logo {
            font-size: 24px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }
        
        .footer .tagline {
            color: #6c757d;
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .footer .meta {
            color: #adb5bd;
            font-size: 12px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .footer .meta .item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        @media print {
            body { 
                background: white;
                padding: 0;
            }
            .document-container {
                box-shadow: none;
                border-radius: 0;
                max-width: none;
            }
            .header { 
                page-break-inside: avoid;
                background: #667eea !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            .content { 
                font-size: 12px;
                line-height: 1.5;
            }
            .lesson-section {
                page-break-inside: avoid;
                margin: 15px 0;
                box-shadow: none;
            }
            .content h1, .content h2, .content h3 {
                page-break-after: avoid;
            }
            .footer {
                page-break-inside: avoid;
            }
        }
        
        @media (max-width: 768px) {
            body {
                padding: 20px 10px;
            }
            .header {
                padding: 30px 20px;
            }
            .header h1 {
                font-size: 28px;
            }
            .content-wrapper {
                padding: 30px 20px;
            }
            .overview-grid {
                grid-template-columns: 1fr;
            }
            .footer {
                padding: 20px;
            }
            .footer .meta {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="document-container">
        <div class="header">
            <h1>${title}</h1>
            <div class="subtitle">
                <span class="badge">${subject}</span>
                <span class="badge">Grade ${grade}</span>
                <span class="badge">${duration} minutes</span>
            </div>
        </div>
        
        <div class="content-wrapper">
            <div class="lesson-overview">
                <h2>Lesson Overview</h2>
                <div class="overview-grid">
                    <div class="overview-item">
                        <div class="label">Subject</div>
                        <div class="value">${subject}</div>
                    </div>
                    <div class="overview-item">
                        <div class="label">Grade Level</div>
                        <div class="value">${grade}</div>
                    </div>
                    <div class="overview-item">
                        <div class="label">Topic</div>
                        <div class="value">${topic}</div>
                    </div>
                    <div class="overview-item">
                        <div class="label">Duration</div>
                        <div class="value">${duration} minutes</div>
                    </div>
                </div>
            </div>
            
            <div class="content">
                ${parseContentToStructuredHTML(content)}
            </div>
        </div>
        
        <div class="footer">
            <div class="logo">ElimuNova AI</div>
            <div class="tagline">Professional Lesson Planning Platform</div>
            <div class="meta">
                <div class="item">
                    <span>📅</span>
                    <span>Generated on ${new Date().toLocaleDateString()}</span>
                </div>
                <div class="item">
                    <span>🕒</span>
                    <span>${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="item">
                    <span>🤖</span>
                    <span>AI-Powered Content</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `
}

function generateWordHTMLContent(content: string, title: string, subject: string, grade: string, topic: string, duration: number): string {
  // Parse content to extract structured information
  const structuredContent = parseContentToStructuredHTML(content)
  
  return `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <meta name="ProgId" content="Word.Document">
    <meta name="Generator" content="Microsoft Word 15">
    <meta name="Originator" content="Microsoft Word 15">
    <title>${title}</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>90</w:Zoom>
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
            font-size: 11pt;
            line-height: 1.4;
            color: #000000;
            margin: 0;
            padding: 0;
            background: white;
        }
        
        .document-container {
            width: 595.3pt;
            margin: 0 auto;
            padding: 72pt;
            background: white;
        }
        .header {
            text-align: center;
            margin-bottom: 30pt;
            border-bottom: 3pt solid #2F5496;
            padding-bottom: 15pt;
        }
        .header h1 {
            font-size: 24pt;
            font-weight: bold;
            color: #2F5496;
            margin: 0 0 10pt 0;
            text-transform: uppercase;
            letter-spacing: 1pt;
        }
        .header .subtitle {
            font-size: 14pt;
            color: #404040;
            margin-top: 10pt;
        }
        .header .subtitle strong {
            color: #2F5496;
            font-weight: bold;
        }
        .lesson-info {
            background: #F2F2F2;
            border: 1pt solid #D0D0D0;
            border-radius: 5pt;
            padding: 15pt;
            margin: 20pt 0;
        }
        .lesson-info h3 {
            margin-top: 0;
            color: #2F5496;
            font-size: 14pt;
            font-weight: bold;
        }
        .lesson-info p {
            margin: 5pt 0;
            font-size: 11pt;
        }
        .content {
            font-size: 11pt;
            line-height: 1.4;
        }
        .content h1 {
            font-size: 18pt;
            font-weight: bold;
            color: #2F5496;
            margin: 25pt 0 15pt 0;
            border-bottom: 2pt solid #4472C4;
            padding-bottom: 5pt;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
        }
        .content h2 {
            font-size: 16pt;
            font-weight: bold;
            color: #404040;
            margin: 20pt 0 10pt 0;
            border-left: 4pt solid #4472C4;
            padding-left: 10pt;
        }
        .content h3 {
            font-size: 14pt;
            font-weight: bold;
            color: #404040;
            margin: 15pt 0 8pt 0;
        }
        .content h4 {
            font-size: 12pt;
            font-weight: bold;
            color: #2F5496;
            margin: 12pt 0 6pt 0;
        }
        .content p {
            margin: 8pt 0;
            text-align: justify;
        }
        .content ul, .content ol {
            margin: 10pt 0;
            padding-left: 20pt;
        }
        .content li {
            margin: 4pt 0;
            line-height: 1.4;
        }
        .content strong {
            font-weight: bold;
            color: #2F5496;
        }
        .content em {
            font-style: italic;
            color: #404040;
        }
        .content pre {
            white-space: pre-wrap;
            font-family: 'Calibri', 'Arial', sans-serif;
            margin: 0;
            background: #F8F9FA;
            padding: 12pt;
            border-left: 4pt solid #4472C4;
            border-radius: 3pt;
            font-size: 10pt;
        }
        .footer {
            margin-top: 30pt;
            text-align: center;
            font-size: 9pt;
            color: #666666;
            border-top: 1pt solid #CCCCCC;
            padding-top: 12pt;
        }
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
<div class="Section1">
<div class="document-container">
    <div class="header">
        <h1>Lesson Plan</h1>
        <div class="subtitle">
            <strong>Subject:</strong> ${subject} | 
            <strong>Grade:</strong> ${grade} | 
            <strong>Topic:</strong> ${topic} | 
            <strong>Duration:</strong> ${duration} minutes
        </div>
    </div>
    
    <div class="lesson-info">
        <h3>Lesson Overview</h3>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Grade Level:</strong> ${grade}</p>
        <p><strong>Topic:</strong> ${topic}</p>
        <p><strong>Duration:</strong> ${duration} minutes</p>
        <p><strong>Date Created:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="content">
        ${structuredContent}
    </div>
    
    <div class="footer">
        <p>Generated by ElimuNova AI - Professional Lesson Planning Platform</p>
        <p>Created on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>
</div>
</div>
</body>
</html>
  `
}

function parseContentToStructuredHTML(content: string): string {
  const lines = content.split('\n').filter(line => line.trim())
  let html = ''
  let inList = false
  let listType = ''
  let inSection = false
  let sectionCount = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (!line) {
      if (inList) {
        html += `</${listType}>\n`
        inList = false
      }
      if (inSection) {
        html += '</div>\n'
        inSection = false
      }
      html += '<br>\n'
      continue
    }
    
    // Check for main headings (usually numbered or in caps, or with ** markers)
    if (line.match(/^\d+\.?\s+[A-Z][A-Z\s]+$/) || 
        line.match(/^[A-Z][A-Z\s]{10,}$/) ||
        line.match(/^(LESSON|OBJECTIVES|MATERIALS|ACTIVITIES|ASSESSMENT|HOMEWORK|NOTES|INTRODUCTION|CONCLUSION|EVALUATION|PROCEDURE|CLOSURE|REFLECTION|TIME|DURATION|RESOURCES)/i) ||
        line.match(/^\*\*.*\*\*$/) ||
        line.match(/^\d+\.\s+\*\*.*\*\*$/) ||
        line.match(/^#{1,2}\s+/)) {
      
      if (inList) {
        html += `</${listType}>\n`
        inList = false
      }
      if (inSection) {
        html += '</div>\n'
      }
      
      sectionCount++
      let headingText = line.replace(/^\d+\.?\s*/, '').trim()
      // Remove ** markers and # markers from headings
      headingText = headingText.replace(/^\*\*|\*\*$/g, '').replace(/^#{1,2}\s*/, '')
      
      // Add emoji icons for common sections
      const sectionIcons = {
        'lesson information': '📋',
        'learning objectives': '🎯',
        'objectives': '🎯',
        'materials needed': '📚',
        'materials': '📚',
        'resources': '📚',
        'lesson activities': '🎭',
        'activities': '🎭',
        'procedure': '📝',
        'introduction': '🚀',
        'main activity': '⚡',
        'practice': '💪',
        'conclusion': '🏁',
        'assessment': '📊',
        'evaluation': '📊',
        'homework': '📝',
        'extension': '🌟',
        'teacher notes': '👨‍🏫',
        'notes': '📌'
      }
      
      const iconKey = headingText.toLowerCase()
      const icon = Object.keys(sectionIcons).find(key => iconKey.includes(key))
      const sectionIcon = icon ? sectionIcons[icon] : '📖'
      
      html += `<div class="lesson-section">
                <h1>${sectionIcon} ${headingText}</h1>\n`
      inSection = true
    }
    // Check for subheadings
    else if (line.match(/^[A-Z][a-z\s]+:$/) || 
             line.match(/^\d+\.\d+\.?\s+[A-Z]/) ||
             line.match(/^[A-Z][a-z\s]{5,}:/) ||
             line.match(/^(Learning|Teaching|Student|Teacher|Assessment|Activity|Material|Objective|Goal|Outcome)/i) ||
             line.match(/^#{3,4}\s+/)) {
      
      if (inList) {
        html += `</${listType}>\n`
        inList = false
      }
      
      let headingText = line.replace(/^\d+\.\d+\.?\s*/, '').replace(':', '').replace(/^#{3,4}\s*/, '').trim()
      
      // Check if this looks like a timed activity
      const timeMatch = headingText.match(/\((\d+)\s*min/i)
      if (timeMatch) {
        const timeIndicator = `<span class="time-indicator">${timeMatch[1]} min</span>`
        headingText = headingText.replace(/\s*\(\d+\s*min[^)]*\)/i, '') + timeIndicator
      }
      
      html += `<h2>${headingText}</h2>\n`
    }
    // Check for sub-subheadings
    else if (line.match(/^\*\*[^*]+\*\*$/) && !line.match(/^\*\*[A-Z\s]{10,}\*\*$/)) {
      if (inList) {
        html += `</${listType}>\n`
        inList = false
      }
      
      const headingText = line.replace(/^\*\*|\*\*$/g, '').trim()
      html += `<h3>${headingText}</h3>\n`
    }
    // Check for bullet points or numbered lists
    else if (line.match(/^[-•*]\s/) || line.match(/^\d+\.\s/)) {
      const listTag = line.match(/^\d+\.\s/) ? 'ol' : 'ul'
      
      if (!inList || listType !== listTag) {
        if (inList) {
          html += `</${listType}>\n`
        }
        html += `<${listTag}>\n`
        inList = true
        listType = listTag
      }
      
      let itemText = line.replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, '').trim()
      
      // Apply formatting to list items
      itemText = itemText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      itemText = itemText.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
      
      // Clean up any remaining standalone asterisks in list items
      itemText = itemText.replace(/(?<!\*)\*(?!\*)(?![^*]*\*)/g, '')
      
      // Highlight time indicators in list items
      itemText = itemText.replace(/\((\d+)\s*min[^)]*\)/gi, '<span class="time-indicator">$1 min</span>')
      
      // Make certain keywords bold in list items
      const keywords = ['Objective', 'Objectives', 'Materials', 'Activity', 'Activities', 'Assessment', 'Homework', 'Notes', 'Duration', 'Grade', 'Subject', 'Topic', 'Learning', 'Teaching', 'Student', 'Teacher', 'Goal', 'Outcome', 'Introduction', 'Conclusion', 'Evaluation', 'Lesson', 'Time', 'Resources', 'Procedure', 'Evaluation', 'Closure', 'Reflection']
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'gi')
        itemText = itemText.replace(regex, '<strong>$1</strong>')
      })
      
      html += `<li>${itemText}</li>\n`
    }
    // Regular paragraphs
    else {
      if (inList) {
        html += `</${listType}>\n`
        inList = false
      }
      
      // Check if this is a special highlight box
      if (line.match(/^(Note|Important|Tip|Warning|Remember):/i)) {
        let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        formattedLine = formattedLine.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
        html += `<div class="highlight-box">${formattedLine}</div>\n`
        continue
      }
      
      // Check if line contains bold text (text between ** or in caps)
      let formattedLine = line
      
      // Handle bold text with ** markers
      formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      // Handle italic text with * markers (but not **)
      formattedLine = formattedLine.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
      
      // Handle single asterisks at the beginning of lines (common in lesson plans)
      if (formattedLine.match(/^\*\s/)) {
        formattedLine = formattedLine.replace(/^\*\s/, '<strong>•</strong> ')
      }
      
      // Clean up any remaining standalone asterisks that weren't caught
      formattedLine = formattedLine.replace(/(?<!\*)\*(?!\*)(?![^*]*\*)/g, '')
      
      // Highlight time indicators
      formattedLine = formattedLine.replace(/\((\d+)\s*min[^)]*\)/gi, '<span class="time-indicator">$1 min</span>')
      
      // Make certain keywords bold
      const keywords = ['Objective', 'Objectives', 'Materials', 'Activity', 'Activities', 'Assessment', 'Homework', 'Notes', 'Duration', 'Grade', 'Subject', 'Topic', 'Learning', 'Teaching', 'Student', 'Teacher', 'Goal', 'Outcome', 'Introduction', 'Conclusion', 'Evaluation', 'Lesson', 'Time', 'Resources', 'Procedure', 'Evaluation', 'Closure', 'Reflection']
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'gi')
        formattedLine = formattedLine.replace(regex, '<strong>$1</strong>')
      })
      
      html += `<p>${formattedLine}</p>\n`
    }
  }
  
  if (inList) {
    html += `</${listType}>\n`
  }
  if (inSection) {
    html += '</div>\n'
  }
  
  return html
}
