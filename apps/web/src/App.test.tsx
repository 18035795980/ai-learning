import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App', () => {
  it('renders empty chat state', () => {
    render(<App />)

    expect(screen.getByText('Streaming Chat UI')).toBeInTheDocument()
    expect(screen.getByText('还没有消息，先发一句试试。')).toBeInTheDocument()
  })

  it('streams response from node api and renders ai reply', async () => {
    const encoder = new TextEncoder()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode('data: {"type":"chunk","content":"这是"}\n\n'),
          )
          controller.enqueue(
            encoder.encode('data: {"type":"chunk","content":"来自流式 API 的测试回复"}\n\n'),
          )
          controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'))
          controller.close()
        },
      }),
    } as Response)

    render(<App />)

    fireEvent.change(screen.getByLabelText('输入消息'), {
      target: { value: '帮我总结一下这个页面' },
    })
    fireEvent.click(screen.getByRole('button', { name: '发送' }))

    expect(screen.getByText('帮我总结一下这个页面')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '帮我总结一下这个页面',
        messages: [
          {
            role: 'user',
            content: '帮我总结一下这个页面',
          },
        ],
      }),
    })

    expect(
      await screen.findByText('这是来自流式 API 的测试回复'),
    ).toBeInTheDocument()
  })

  it('renders readable error when api responds with html', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () =>
        '<!DOCTYPE html><html><body><pre>Cannot POST /api/chat</pre></body></html>',
    } as Response)

    render(<App />)

    fireEvent.change(screen.getByLabelText('输入消息'), {
      target: { value: '这次为什么失败了' },
    })
    fireEvent.click(screen.getByRole('button', { name: '发送' }))

    expect(
      await screen.findByText(
        '请求失败：接口返回了 HTML 页面。请检查前端代理端口和后端服务是否已启动到正确地址。',
      ),
    ).toBeInTheDocument()
  })

  it('disables send button and enter shortcut while waiting for ai response', async () => {
    let closeStream: (() => void) | undefined
    const encoder = new TextEncoder()

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          closeStream = () => {
            controller.enqueue(
              encoder.encode('data: {"type":"chunk","content":"处理中"}\n\n'),
            )
            controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'))
            controller.close()
          }
        },
      }),
    } as Response)

    render(<App />)

    const input = screen.getByLabelText('输入消息')

    fireEvent.change(input, {
      target: { value: '第一条消息' },
    })
    fireEvent.click(screen.getByRole('button', { name: '发送' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '发送中...' })).toBeDisabled()
      expect(screen.getByLabelText('输入消息')).toBeDisabled()
    })

    fireEvent.change(screen.getByLabelText('输入消息'), {
      target: { value: '第二条消息' },
    })
    fireEvent.keyDown(screen.getByLabelText('输入消息'), {
      key: 'Enter',
      code: 'Enter',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    if (closeStream) {
      closeStream()
    }

    expect(await screen.findByText('处理中')).toBeInTheDocument()
  })
})
