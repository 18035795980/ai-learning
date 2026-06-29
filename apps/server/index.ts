import dotenv from 'dotenv'
import cors from 'cors'
import express from 'express'
import OpenAI from 'openai'

dotenv.config({
  path: new URL('../../.env', import.meta.url),
})

const app = express()
const port = Number(process.env.PORT ?? 3000)
const model = process.env.OPENAI_MODEL ?? 'deepseek-ai/DeepSeek-V3'
const apiKey = process.env.OPENAI_API_KEY
const baseURL = process.env.OPENAI_BASE_URL

const client = new OpenAI({
  apiKey,
  baseURL,
})

type ChatRole = 'user' | 'assistant'

interface ChatMessage {
  role: ChatRole
  content: string
}

interface ChatRequestBody {
  message?: string
  messages?: ChatMessage[]
}

interface StreamEvent {
  type: 'chunk' | 'done' | 'error'
  content?: string
  error?: string
}

function normalizeMessages(
  incomingMessages: ChatMessage[] | undefined,
  latestMessage: string,
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const history =
    incomingMessages?.filter(
      (message) =>
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string' &&
        message.content.trim().length > 0,
    ) ?? []

  if (history.length > 0) {
    return history.map((message) => ({
      role: message.role,
      content: message.content,
    }))
  }

  return [
    {
      role: 'user',
      content: latestMessage,
    },
  ]
}

function writeSseEvent(res: express.Response, payload: StreamEvent) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}

app.use(cors())
app.use(express.json())

app.get('/', (_req, res) => {
  res.json({
    message: 'Express server is running.',
  })
})

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    model,
  })
})

app.post('/api/chat', async (req, res) => {
  let streamStarted = false

  try {
    if (!apiKey) {
      res.status(500).json({
        error: 'Missing OPENAI_API_KEY',
      })
      return
    }

    const { message, messages }: ChatRequestBody = req.body
    const latestMessage = message?.trim()

    if (!latestMessage) {
      res.status(400).json({
        error: 'message is required',
      })
      return
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()
    streamStarted = true

    const stream = await client.chat.completions.create({
      model,
      messages: normalizeMessages(messages, latestMessage),
      stream: true,
    })
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      console.log('content:', chunk.choices[0])
      if (!content) {
        continue
      }

      writeSseEvent(res, {
        type: 'chunk',
        content,
      })
    }

    writeSseEvent(res, {
      type: 'done',
    })
    res.end()
  } catch (error) {
    console.error('Chat request failed:', error)

    if (!streamStarted) {
      res.status(500).json({
        error: 'chat request failed',
      })
      return
    }

    writeSseEvent(res, {
      type: 'error',
      error: 'chat request failed',
    })
    res.end()
  }
})

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
// async function chat() {
//   while (true) {
//     const question = await rl.question('你: ');

//     if (question === 'exit') {
//       rl.close();
//       break;
//     }

//     messages.push({
//       role: 'user',
//       content: question,
//     });

//     const response = await client.chat.completions.create({
//       model: 'deepseek-ai/DeepSeek-V3',
//       messages,
//     });

//     const answer = response?.choices?.[0]?.message.content ?? '';

//     console.log('\nAI:', answer);
//     console.log('\n-------------------\n');

//     messages.push({
//       role: 'assistant',
//       content: answer,
//     });
//     console.dir(messages, {
//       depth: null,
//     });
//     console.log('当前消息数:', messages.length);
//   }
// }
// chat();
// async function main() {
//   const response = await client.chat.completions.create({
//     model: 'deepseek-ai/DeepSeek-V3',
//     messages: [
//       {
//         role: 'user',
//         content: '我叫jenna',
//       },
//       {
//         role: 'assistant',
//         content: '好的，我记住了，你叫jenna',
//       },
//       {
//         role: 'user',
//         content: '我叫什么名字？',
//       },
//     ]
//   });
// console.dir(response, {
//   depth: null,
// });
//   console.log(response.choices[0].message.content);
// }

// main();
