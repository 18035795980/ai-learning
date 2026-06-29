import type { ReactNode } from 'react'

interface ChatContainerProps {
  title: string
  children: ReactNode
  footer: ReactNode
}

const ChatContainer = ({
  title,
  children,
  footer,
}: ChatContainerProps) => {
  return (
    <main className="chat-shell">
      <section className="chat-panel" aria-label="聊天界面">
        <header className="chat-header">
          {title}
        </header>

        <div className="chat-body">{children}</div>

        <footer className="chat-footer">{footer}</footer>
      </section>
    </main>
  )
}
export default ChatContainer