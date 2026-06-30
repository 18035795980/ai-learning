import { type FormEvent, type KeyboardEvent, useState } from 'react'

interface InputBoxProps {
  onSend: (value: string) => void | Promise<void>
  onStopGenerating: () => void
  disabled?: boolean
  isGenerating?: boolean
}

export function InputBox({
  onSend,
  onStopGenerating,
  disabled = false,
  isGenerating = false,
}: InputBoxProps) {
  const [value, setValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isLocked = disabled || isSubmitting

  const submit = async () => {
    const trimmed = value.trim()

    if (!trimmed || isLocked) {
      return
    }

    setIsSubmitting(true)
    setValue('')

    try {
      await onSend(trimmed)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <form className="input-box" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="chat-input">
        输入消息
      </label>
      <textarea
        id="chat-input"
        className="input-box__field"
        rows={3}
        placeholder="输入你的问题，按 Enter 发送，Shift + Enter 换行"
        value={value}
        disabled={isLocked}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="input-box__actions">
        <p>当前阶段已接入 SSE 流式对话，服务端会持续推送模型生成的文本片段。</p>
        <div className="input-box__buttons">
          {isGenerating ? (
            <button
              type="button"
              className="input-box__button input-box__button--secondary"
              onClick={onStopGenerating}
            >
              停止生成
            </button>
          ) : null}
          <button
            type="submit"
            className="input-box__button"
            disabled={isLocked || !value.trim()}
          >
            {isLocked ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </form>
  )
}
