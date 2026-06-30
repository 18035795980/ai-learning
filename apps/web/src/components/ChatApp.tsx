import { useChat } from '../hooks/useChat'
import ChatContainer from './ChatContainer'
import { InputBox } from './InputBox'
import { MessageList } from './MessageList'

export function ChatApp() {
  const {
    messages,
    isSending,
    sendMessage,
  } = useChat()
  return (
    <ChatContainer
      title="Streaming Chat UI"
      footer={
        <InputBox onSend={sendMessage} disabled={isSending} />
      }
    >
      <MessageList messages={messages} />
    </ChatContainer>
  )
}
