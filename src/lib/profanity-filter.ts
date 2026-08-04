const BLOCKED_WORDS = [
  'fuck', 'shit', 'asshole', 'bastard', 'bitch', 'cunt', 'dick', 'damn',
  'whore', 'slut', 'piss', 'cock', 'pussy', 'nigga', 'nigger', 'faggot',
  'retard', 'motherfucker', 'dumbass', 'jackass', 'douche', 'twat',
  'wanker', 'bollocks', 'arse', 'bloody', 'bugger', 'sod',
]

const BLOCKED_PATTERNS = [
  /\bf[\*@$#%!]ck\b/i,
  /\bsh[\*@$#%!]t\b/i,
  /\bb[\*@$#%!]tch\b/i,
  /\b[a@][s\$][s\$]\b/i,
  /\bd[\*@$#%!]ck\b/i,
  /\bf[\*@$#%!]g\b/i,
  /\bn[\*@$#%!]gg[ae][r]\b/i,
]

export function filterProfanity(text: string): { filtered: string; flagged: boolean; words: string[] } {
  if (!text) return { filtered: text, flagged: false, words: [] }

  let flagged = false
  const foundWords: string[] = []
  let filtered = text

  for (const word of BLOCKED_WORDS) {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi')
    if (regex.test(filtered)) {
      flagged = true
      foundWords.push(word)
      filtered = filtered.replace(regex, '****')
    }
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(filtered)) {
      flagged = true
      filtered = filtered.replace(pattern, '****')
    }
  }

  return { filtered, flagged, words: [...new Set(foundWords)] }
}

export function containsProfanity(text: string): boolean {
  return filterProfanity(text).flagged
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
