// 所有公共类型，后续项目统一引用
export interface Message {
  role: 'user' | 'assistant'
  content: string
}
