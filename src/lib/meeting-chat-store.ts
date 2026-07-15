interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderType: 'teacher' | 'student' | 'system'
  content: string
  timestamp: string
}

const chatHistory = new Map<string, ChatMessage[]>()

export function addMessage(meetingId: string, msg: ChatMessage): void {
  const history = chatHistory.get(meetingId) || []
  history.push(msg)
  chatHistory.set(meetingId, history)
}

export function getMessages(meetingId: string): ChatMessage[] {
  return chatHistory.get(meetingId) || []
}
