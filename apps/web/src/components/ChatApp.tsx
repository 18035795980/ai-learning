import { useChat } from '../hooks/useChat'
import ChatContainer from './ChatContainer'
import { InputBox } from './InputBox'
import { MessageList } from './MessageList'

export function ChatApp() {
  const {
    messages,
    isSending,
    sendMessage,
    stopGenerating,
  } = useChat()
  return (
    <ChatContainer
      title="Streaming Chat UI"
      footer={
        <InputBox
          onSend={sendMessage}
          onStopGenerating={stopGenerating}
          disabled={isSending}
          isGenerating={isSending}
        />
      }
    >
      <MessageList messages={messages} />
    </ChatContainer>
  )
}
