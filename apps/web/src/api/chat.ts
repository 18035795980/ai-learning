// 当前文件只负责fetch()  axios（）请求后端

import type { ChatApiMessage, ChatStreamEvent } from '@type/chat'
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

export async function chatApi(
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
