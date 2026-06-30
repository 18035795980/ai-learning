import type { ComponentPropsWithoutRef } from 'react'

type CodeBlockProps = ComponentPropsWithoutRef<'code'>

export default function CodeBlock(props: CodeBlockProps) {
  return <code {...props} />
}