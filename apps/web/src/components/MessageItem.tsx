// 当前组件负责：气泡、左右布局、avatar、时间
import MessageRenderer from './MessageRenderer'

import type { ChatMessage } from '@type/chat'

const MessageItem = ({ message }: { message: ChatMessage }) => {
  return (
    <div
      key={message.id}
      className={`message message--${message.role}`}
    >
      <MessageRenderer message={message} />
    </div>
  )
}

export default MessageItem
