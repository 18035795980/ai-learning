import { useAutoScroll } from '@/hooks/useAutoScroll'
import MessageItem from './MessageItem'

import type { ChatMessage } from '@type/chat'

interface MessageListProps {
  messages: ChatMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  const { containerRef, bottomRef, hasNewMessage, scrollToBottom } = useAutoScroll({
    dependency: messages,
  })

  if (messages.length === 0) {
    return (
      <section className="message-list message-list--empty" aria-live="polite">
        <p>还没有消息，先发一句试试。</p>
      </section>
    )
  }

  return (
    <div className="message-list-wrap">
      <section className="message-list" aria-live="polite" ref={containerRef}>
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        <div ref={bottomRef} aria-hidden="true" />
      </section>
      {hasNewMessage ? (
        <button
          type="button"
          className="message-list__new-message"
          onClick={scrollToBottom}
        >
          有新消息
        </button>
      ) : null}
    </div>
  )
}
