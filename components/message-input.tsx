"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { ArrowUpIcon, Square } from "lucide-react"
import { AnimatePresence, m } from "framer-motion"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface MessageInputProps {
  onSubmit: (message: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  variant?: "landing" | "chat"
  autoFocus?: boolean
  isExecutingPlan?: boolean
}

export interface MessageInputRef {
  textareaElement: HTMLTextAreaElement | null
}

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(({
  onSubmit,
  disabled = false,
  placeholder = "Ask anything...",
  className,
  variant = "chat",
  autoFocus = false,
  isExecutingPlan = false,
}, ref) => {
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Show stop icon only when executing/loading AND input is empty
  const showStopIcon = isExecutingPlan && input.trim() === ""

  // Expose the textarea element to parent components
  useImperativeHandle(ref, () => ({
    textareaElement: textareaRef.current,
  }))

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSubmit(input)
      setInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  if (variant === "landing") {
    return (
      <form
        onSubmit={handleSubmit}
        className={cn(
          "w-full max-w-lg message-input-transition bg-muted/50 rounded-lg p-3",
          className
        )}
      >
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            autoFocus
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[56px] text-lg resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 flex-shrink-0 mb-px transition-all duration-300 relative"
            disabled={!showStopIcon && !input.trim()}
          >
            <AnimatePresence initial={false}>
              {showStopIcon ? (
                <m.div
                  key="stop"
                  initial={{ scale: 0, rotate: 90, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <Square className="h-5 w-5" />
                </m.div>
              ) : (
                <m.div
                  key="arrow"
                  initial={{ scale: 0, rotate: 90, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <ArrowUpIcon className="h-5 w-5" />
                </m.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "message-input-transition bg-muted/50 rounded-lg p-3",
        className
      )}
    >
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={input}
          autoFocus
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[60px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10 flex-shrink-0 mb-px transition-all duration-300 relative"
          disabled={!showStopIcon && !input.trim()}
        >
          <AnimatePresence initial={false}>
            {showStopIcon ? (
              <m.div
                key="stop"
                initial={{ scale: 0, rotate: 90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <Square className="h-5 w-5" />
              </m.div>
            ) : (
              <m.div
                key="arrow"
                initial={{ scale: 0, rotate: 90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <ArrowUpIcon className="h-5 w-5" />
              </m.div>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </form>
  )
})

MessageInput.displayName = "MessageInput"
