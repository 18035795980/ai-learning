import { useState } from 'react'
import ChatContainer from './ChatContainer'
import { InputBox } from './InputBox'
import { MessageList } from './MessageList'

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
}

interface ChatApiMessage {
  role: MessageRole
  content: string
}

interface ChatStreamEvent {
  type: 'chunk' | 'done' | 'error'
  content?: string
  error?: string
}

const initialMessages: ChatMessage[] = []

function parseJsonResponse(raw: string) {
  try {
    return raw ? (JSON.parse(raw) as { reply?: string; error?: string }) : null
  } catch {
    return null
  }
}

function parseSseEvent(block: string) {
  const data = block
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')

  if (!data) {
    return null
  }

  try {
    return JSON.parse(data) as ChatStreamEvent
  } catch {
    throw new Error('接口返回了无法解析的流式数据。')
  }
}

async function chatApi(
  input: string,
  messages: ChatApiMessage[],
  onChunk: (chunk: string) => void,
) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: input,
      messages,
    }),
  })

  if (!response.ok) {
    const raw = await response.text()
    const data = parseJsonResponse(raw)

    if (data?.error) {
      throw new Error(data.error)
    }

    if (raw.trim().startsWith('<!DOCTYPE') || raw.trim().startsWith('<html')) {
      throw new Error('接口返回了 HTML 页面。请检查前端代理端口和后端服务是否已启动到正确地址。')
    }

    throw new Error(`chat request failed: ${response.status} ${response.statusText}`)
  }

  if (!response.body) {
    throw new Error('接口没有返回可读取的流数据。')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let reply = ''

  const consumeEventBlock = (block: string) => {
    const event = parseSseEvent(block)

    if (!event) {
      return false
    }

    if (event.type === 'chunk') {
      const content = event.content ?? ''

      if (!content) {
        return false
      }

      reply += content
      onChunk(content)
      return false
    }

    if (event.type === 'error') {
      throw new Error(event.error ?? 'chat request failed')
    }

    return event.type === 'done'
  }

  while (true) {
    const { value, done } = await reader.read()

    buffer += decoder.decode(value, { stream: !done })

    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() ?? ''

    for (const block of blocks) {
      if (consumeEventBlock(block)) {
        return reply
      }
    }

    if (done) {
      break
    }
  }

  if (buffer.trim()) {
    consumeEventBlock(buffer)
  }

  return reply
}

export function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [isSending, setIsSending] = useState(false)

  const handleSend = async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || isSending) {
      return
    }
    // 用户发送的消息
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    }
    // ai 回复的消息占位符
    const assistantMessageId = crypto.randomUUID()
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    }
    const nextMessages = [...messages, userMessage]
    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      assistantPlaceholder,
    ])
    setIsSending(true)

    try {
      const reply = await chatApi(
        trimmed,
        nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        (chunk) => {
          setMessages((currentMessages) =>
            currentMessages.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    content: `${message.content}${chunk}`,
                  }
                : message,
            ),
          )
        },
      )

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: reply || 'AI 没有返回内容。',
              }
            : message,
        ),
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '请求 AI 服务失败，请稍后重试。'

      setMessages((currentMessages) =>
        currentMessages.map((currentMessage) =>
          currentMessage.id === assistantMessageId
            ? {
                ...currentMessage,
                content: `请求失败：${message}`,
              }
            : currentMessage,
        ),
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <ChatContainer
      title="Streaming Chat UI"
      footer={<InputBox onSend={handleSend} disabled={isSending} />}
    >
      <MessageList messages={messages} />
    </ChatContainer>
  )
}
