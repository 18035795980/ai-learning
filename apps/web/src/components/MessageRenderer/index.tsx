// 负责
// Markdown
// Code Block
// Table
// Latex
// Mermaid
// Thinking
// 引用
// Tool Calling

// 以后所有 AI 内容展示，都在这里

import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

import CodeBlock from "./markdown/CodeBlock"

import type { ChatMessage } from '@type/chat'

const MARKDOWN_PREVIEW = `# ChatGPT

这是 **Markdown**。

## Code

\`\`\`ts
const name = "GPT";
console.log(name);
\`\`\`

- React
- TypeScript
- Node
`

interface MessageRendererProps {
  message: ChatMessage
}

export default function MessageRenderer({
  message,
}: MessageRendererProps) {
  void message

  // 临时写死一段 Markdown，便于直接验证渲染效果。
  const content = MARKDOWN_PREVIEW

  return <>
    {/* <span className="message-role">
      {message.role === 'user' ? 'You' : 'Assistant'}
    </span>
    {message.content} */}
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]} // 这是给 Markdown 解析器加插件。这里的 remarkGfm 表示启用 GitHub Flavored Markdown 支持
      rehypePlugins={[rehypeHighlight]} // 这是给 HTML 渲染器加插件。这里的 rehypeHighlight 表示启用代码块亮亮
      components={{
        code: CodeBlock, // 所有的代码快都经过 CodeBlock 组件渲染
      }}
    >
      {content}
    </ReactMarkdown>
  </>
}


// MessageRenderer
//         │
//         ├──────────────┐
//         │              │
//       Markdown     HTML
//         │
//  ┌──────┼──────────────┐
//  │      │      │       │
// Code  Link  Image  Table
//  │
// CopyButton
