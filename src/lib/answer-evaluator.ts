export function evaluateAnswer(userAnswer: any, correctAnswer: any, type?: string): boolean {
  if (userAnswer === undefined || userAnswer === null) return false
  if (correctAnswer === undefined || correctAnswer === null) return false

  if (type === 'mcq' || type === 'multiple_choice' || type === 'true_false') {
    // Compare as strings after trimming — handles '0', 0, 'A', etc.
    return String(userAnswer).trim() === String(correctAnswer).trim()
  }

  const userStr = normalizeForComparison(String(userAnswer))
  const correctStr = normalizeForComparison(String(correctAnswer))
  if (!userStr || !correctStr) return false

  return userStr === correctStr || userStr.includes(correctStr) || correctStr.includes(userStr)
}

function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\s,._-]+/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

export function getFeedback(isCorrect: boolean, correctAnswer: string, userAnswer: string): string {
  if (isCorrect) return '✓ Correct! Well done.'
  return `Not quite. The correct answer is: ${correctAnswer}`
}
