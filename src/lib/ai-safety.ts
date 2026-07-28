import fs from 'fs'
import path from 'path'

const LOG_DIR = path.join(process.cwd(), 'logs')
const LOG_FILE = path.join(LOG_DIR, 'ai-safety.jsonl')

const FORBIDDEN_PATTERNS = [
  /\b(how\s+to\s+(harm|kill|hurt|attack|abuse|drugs?|weapons?|explosive|suicide|self.?harm))\b/i,
  /\b(generate\s+(harmful|illegal|offensive|inappropriate|explicit)\s+(content|image|text))\b/i,
  /\b(sexual|porn|nsfw|explicit\s+content|hentai|adult\s+content)\b/i,
  /\b(hate\s+speech|discriminat(e|ion)|racist|sexist|slur)\b/i,
  /\b(personal\s+(data|info|information|details)\s+of\s+(anyone|someone|a\s+person))\b/i,
  /\b(crack|hack|cracked|pirate|illegal\s+download|copyright\s+infringement)\b/i,
]

const EDUCATIONAL_KEYWORDS = [
  'math', 'algebra', 'geometry', 'calculus', 'statistic', 'arithmetic',
  'science', 'physics', 'chemistry', 'biology', 'earth science', 'environment',
  'english', 'kiswahili', 'grammar', 'literature', 'reading', 'writing', 'vocabulary',
  'history', 'geography', 'civics', 'government', 'economics', 'sociology',
  'computer', 'programming', 'coding', 'technology', 'ict',
  'art', 'music', 'physical education', 'pe',
  'lesson', 'exam', 'test', 'quiz', 'assignment', 'homework', 'study', 'revision',
  'cbc', 'competency', 'curriculum', 'kicd', 'kcse', 'kcpe', 'grade', 'class',
  'teacher', 'student', 'tutor', 'tutoring', 'teaching', 'learning',
  'career', 'profession', 'job', 'skill', 'vocational',
  'fraction', 'decimal', 'equation', 'formula', 'theorem',
  'sentence', 'paragraph', 'essay', 'composition', 'comprehension',
  'solar system', 'cell', 'force', 'energy', 'gravity', 'magnetism',
  'noun', 'verb', 'adjective', 'adverb', 'tense', 'pronoun',
  'addition', 'subtraction', 'multiplication', 'division',
]

export interface SafetyCheck {
  passed: boolean
  reason?: string
  category?: 'non_educational' | 'harmful' | 'personal_info' | 'other'
}

export interface SafetyViolation {
  timestamp: string
  userId: string
  userRole: string
  input: string
  output?: string
  reason: string
  category: string
  route?: string
}

function getSafeLogDir(): string {
  if (!fs.existsSync(LOG_DIR)) {
    try { fs.mkdirSync(LOG_DIR, { recursive: true }) } catch (e) { console.warn('[AISafety] Failed to create log dir:', e) }
  }
  return LOG_DIR
}

export function checkInput(input: string): SafetyCheck {
  if (!input || input.trim().length < 3) return { passed: true }
  const lower = input.toLowerCase()

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(lower)) {
      return { passed: false, reason: `Flagged by pattern: ${pattern}`, category: 'harmful' }
    }
  }

  const hasEducational = EDUCATIONAL_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()))
  if (!hasEducational && lower.split(/\s+/).length > 4) {
    return { passed: false, reason: 'Query does not appear educational', category: 'non_educational' }
  }

  return { passed: true }
}

export function hasEducationalContext(messages: Array<{ role: string; content: string }>): boolean {
  const allText = messages.map(m => m.content).join(' ').toLowerCase()
  const keywordCount = EDUCATIONAL_KEYWORDS.filter(kw => allText.includes(kw.toLowerCase())).length
  return keywordCount >= 2
}

export function buildSafeSystemPrompt(basePrompt: string): string {
  return `${basePrompt}

RESPONSIBILITY GUIDELINES — You must follow these:
1. Keep all responses appropriate for a classroom environment with students aged 5-18
2. If asked something clearly non-educational, politely respond: "I'm designed to help with educational topics. Please ask me something related to teaching, learning, or your school subjects."
3. Never generate harmful, explicit, or inappropriate content
4. Never share personal information of real individuals
5. Stay focused on the Kenyan CBC curriculum and educational context at all times
6. Always use Kenyan examples, contexts and resources when relevant
7. Reference CBC core competencies (communication and collaboration, critical thinking and problem solving, creativity and imagination, citizenship, digital literacy, learning to learn)
8. Reference CBC values (respect, responsibility, love, peace, unity, patriotism, integrity, honesty)
9. Use KICD format for lesson plans: strand, sub-strand, specific learning outcomes, key inquiry questions, core competencies, values, PCIs, learning resources, assessment methods
10. If a question could have both educational and non-educational interpretations, answer the educational angle`
}

export async function logViolation(violation: Omit<SafetyViolation, 'timestamp'>): Promise<void> {
  const safeDir = getSafeLogDir()
  const entry: SafetyViolation = { ...violation, timestamp: new Date().toISOString() }
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n')
  } catch (err) {
    console.error('Failed to log safety violation:', err)
  }
}

export function getViolations(limit = 50): SafetyViolation[] {
  try {
    if (!fs.existsSync(LOG_FILE)) return []
    const data = fs.readFileSync(LOG_FILE, 'utf-8')
    const lines = data.trim().split('\n').filter(Boolean)
    return lines.slice(-limit).map(l => JSON.parse(l)).reverse()
  } catch (e) { console.warn('[AISafety] Failed to read violations:', e)
    return []
  }
}
