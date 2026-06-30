// 只负责状态 useState useEffect 业务逻辑

import { useRef, useState } from 'react'

import { chatApi } from '../api/chat'

import type { ChatMessage } from '@type/chat'

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const stopGenerating = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
  }

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
    const abortController = new AbortController()
    abortControllerRef.current = abortController

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
        abortController.signal,
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
      if (isAbortError(error)) {
        setMessages((currentMessages) =>
          currentMessages.map((currentMessage) =>
            currentMessage.id === assistantMessageId
              ? {
                  ...currentMessage,
                  content: currentMessage.content || '已停止生成。',
                }
              : currentMessage,
          ),
        )
        return
      }

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
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
      setIsSending(false)
    }
  }

  return {
    messages,
    isSending,
    sendMessage,
    stopGenerating,
  }
}
