export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
}

export interface ChatApiMessage {
  role: MessageRole
  content: string
}

export interface ChatStreamEvent {
  type: 'chunk' | 'done' | 'error'
  content?: string
  error?: string
}
