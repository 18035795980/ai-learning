import 'dotenv/config'
import OpenAI from 'openai'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
})

const rl = readline.createInterface({
  input,
  output,
})
const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
async function chat() {
  while (true) {
    const question = await rl.question('你: ')

    if (question === 'exit') {
      rl.close()
      break
    }

    messages.push({
      role: 'user',
      content: question,
    })

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'deepseek-ai/DeepSeek-V3',
      messages,
    })

    const answer = response?.choices?.[0]?.message.content ?? ''

    console.log('\nAI:', answer)
    console.log('\n-------------------\n')

    messages.push({
      role: 'assistant',
      content: answer,
    })
    console.dir(messages, {
      depth: null,
    })
    console.log('当前消息数:', messages.length)
  }
}
chat()
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
