"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { ArrowUpIcon, Square } from "lucide-react"

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
            className="h-10 w-10 flex-shrink-0 mb-px transition-all duration-500 ease-in-out"
            disabled={!showStopIcon && !input.trim()}
          >
            {showStopIcon ? (
              <Square key="stop" className="h-5 w-5 icon-fade-in" />
            ) : (
              <ArrowUpIcon key="arrow" className="h-5 w-5 icon-fade-in" />
            )}
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
          className="h-10 w-10 flex-shrink-0 mb-px transition-all duration-500 ease-in-out"
          disabled={!showStopIcon && !input.trim()}
        >
          {showStopIcon ? (
            <Square key="stop" className="h-5 w-5 icon-fade-in" />
          ) : (
            <ArrowUpIcon key="arrow" className="h-5 w-5 icon-fade-in" />
          )}
        </Button>
      </div>
    </form>
  )
})

MessageInput.displayName = "MessageInput"
