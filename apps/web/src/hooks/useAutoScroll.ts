import { useCallback, useEffect, useRef, useState } from 'react'

import type { RefObject } from 'react'

const AUTO_SCROLL_THRESHOLD = 48

interface UseAutoScrollOptions<T> {
  dependency: T
}

interface UseAutoScrollResult {
  containerRef: RefObject<HTMLElement | null>
  bottomRef: RefObject<HTMLDivElement | null>
  isAtBottom: boolean
  hasNewMessage: boolean
  scrollToBottom: () => void
}

export function useAutoScroll<T>({
  dependency,
}: UseAutoScrollOptions<T>): UseAutoScrollResult {
  const containerRef = useRef<HTMLElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const shouldAutoScrollRef = useRef(true)
  const previousDependencyRef = useRef(dependency)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [hasNewMessage, setHasNewMessage] = useState(false)

  const scrollToBottom = useCallback(() => {
    shouldAutoScrollRef.current = true
    setIsAtBottom(true)
    setHasNewMessage(false)
    bottomRef.current?.scrollIntoView({
      block: 'end',
      behavior: 'smooth',
    })
  }, [])

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const updateAutoScrollState = () => {
      const distanceToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight

      const nextIsAtBottom = distanceToBottom <= AUTO_SCROLL_THRESHOLD

      shouldAutoScrollRef.current = nextIsAtBottom
      setIsAtBottom(nextIsAtBottom)

      if (nextIsAtBottom) {
        setHasNewMessage(false)
      }
    }

    updateAutoScrollState()
    container.addEventListener('scroll', updateAutoScrollState)

    return () => {
      container.removeEventListener('scroll', updateAutoScrollState)
    }
  }, [])

  useEffect(() => {
    const hasDependencyChanged = previousDependencyRef.current !== dependency
    previousDependencyRef.current = dependency

    if (!hasDependencyChanged) {
      return
    }

    if (!shouldAutoScrollRef.current) {
      setHasNewMessage(true)
      return
    }

    bottomRef.current?.scrollIntoView({
      block: 'end',
    })
  }, [dependency])

  return {
    containerRef,
    bottomRef,
    isAtBottom,
    hasNewMessage,
    scrollToBottom,
  }
}
