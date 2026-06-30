// 只负责状态 useState useEffect 业务逻辑

import { useState } from 'react'

import { chatApi } from '../api/chat'

import type { ChatMessage } from '@type/chat'


export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)

  const sendMessage = async (content: string) => {
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

  return {
    messages,
    isSending,
    sendMessage,
  }
}
