import './index.css'
// import 'highlight.js/styles/github.css' // 浅色系代码快颜色
import 'highlight.js/styles/github-dark.css' // 深色系代码快颜色

import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
