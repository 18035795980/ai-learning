import type { ChatMessage } from './ChatApp'

interface MessageListProps {
  messages: ChatMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <section className="message-list message-list--empty" aria-live="polite">
        <p>还没有消息，先发一句试试。</p>
      </section>
    )
  }

  return (
    <section className="message-list" aria-live="polite">
      {messages.map((message) => (
        <article
          key={message.id}
          className={`message message--${message.role}`}
          aria-label={`${message.role === 'user' ? '用户' : '助手'}消息`}
        >
          <span className="message-role">
            {message.role === 'user' ? 'You' : 'Assistant'}
          </span>
          <p>{message.content}</p>
        </article>
      ))}
    </section>
  )
}
