"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { animate } from "framer-motion"
import { flushSync } from "react-dom"
import { v4 as uuid } from "uuid"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { MessageInput, MessageInputRef } from "@/components/message-input"

const PHRASES = [
  "landing page to launch...",
  "data visualization tool",
  "MVP for my startup",
  "prototype to validate my idea",
]

const PREFIX = "Let's build a "

const TypewriterInput = ({
  onSubmit,
}: {
  onSubmit: (message: string) => void
}) => {
  const inputRef = useRef<MessageInputRef>(null)
  const [prefixComplete, setPrefixComplete] = useState(false)
  const stoppedRef = useRef(false)

  useEffect(() => {
    let stopped = false

    const runAnimation = async () => {
      const textarea = inputRef.current?.textareaElement
      if (!textarea) return

      // 1. Type prefix once
      if (!prefixComplete && !stopped && !stoppedRef.current) {
        await animate(0, PREFIX.length, {
          duration: PREFIX.length * 0.075,
          ease: "linear",
          onUpdate: (latest) => {
            if (!stopped && !stoppedRef.current && textarea) {
              const chars = Math.floor(latest)
              textarea.placeholder = PREFIX.slice(0, chars)
            }
          },
        })
        if (!stopped && !stoppedRef.current) setPrefixComplete(true)
      }

      // 2. Infinite phrase loop
      let phraseIdx = 0
      while (!stopped && !stoppedRef.current) {
        const phrase = PHRASES[phraseIdx]
        const fullText = PREFIX + phrase

        // TYPE: animate forward
        await animate(PREFIX.length, fullText.length, {
          duration: phrase.length * 0.075,
          ease: "linear",
          onUpdate: (latest) => {
            if (!stopped && !stoppedRef.current && textarea) {
              const chars = Math.floor(latest)
              textarea.placeholder = fullText.slice(0, chars)
            }
          },
        })

        // WAIT: 2 second pause
        if (!stopped && !stoppedRef.current)
          await new Promise((r) => setTimeout(r, 2000))

        // DELETE: animate backward
        await animate(fullText.length, PREFIX.length, {
          duration: phrase.length * 0.05,
          ease: "linear",
          onUpdate: (latest) => {
            if (!stopped && !stoppedRef.current && textarea) {
              const chars = Math.floor(latest)
              textarea.placeholder = fullText.slice(0, chars)
            }
          },
        })

        phraseIdx = (phraseIdx + 1) % PHRASES.length
      }
    }

    runAnimation()
    return () => {
      stopped = true
    }
  }, [prefixComplete])

  const handleSubmit = useCallback(
    (message: string) => {
      // Stop animation and clear placeholder
      stoppedRef.current = true
      if (inputRef.current?.textareaElement) {
        inputRef.current.textareaElement.placeholder = ""
      }
      onSubmit(message)
    },
    [onSubmit]
  )

  return (
    <MessageInput
      ref={inputRef}
      onSubmit={handleSubmit}
      placeholder={""}
      variant="landing"
      autoFocus
    />
  )
}

type SubStep = {
  title: string
  status: "pending" | "in_progress" | "completed"
}

type PlanStep = {
  id: string
  idx?: number
  title: string
  substeps?: SubStep[]
  status: "pending" | "in_progress" | "completed"
}

type LangChainMessageContent =
  | {
      type: "text"
      text: string
    }
  | {
      type: "plan"
      content: []
    }

interface LangChainMessage {
  id?: string
  type: "human" | "ai" | "system" | "tool"
  content: string | LangChainMessageContent | PlanStep[]
  tool_call_id?: string
  complete?: boolean
}

async function* planWorkflow(): AsyncGenerator<
  { id: string; status: "in_progress" | "completed"; substepIndex?: number },
  void,
  unknown
> {
  for await (const step of plan) {
    yield await new Promise<{ id: string; status: "in_progress" }>((resolve) =>
      setTimeout(() => resolve({ id: step.id, status: "in_progress" }), 100)
    )

    // Process substeps if they exist
    if (step.substeps) {
      for (let i = 0; i < step.substeps.length; i++) {
        yield await new Promise<{
          id: string
          status: "in_progress"
          substepIndex: number
        }>((resolve) =>
          setTimeout(
            () =>
              resolve({ id: step.id, status: "in_progress", substepIndex: i }),
            2000
          )
        )
      }
    }

    yield await new Promise<{ id: string; status: "completed" }>((resolve) =>
      setTimeout(() => resolve({ id: step.id, status: "completed" }), 2000)
    )
  }
}

const plan: Omit<PlanStep, "status">[] = [
  {
    id: uuid(),
    idx: 0,
    title: "Setting up database schema",
    substeps: [
      { title: "Creating database configuration", status: "pending" as const },
      { title: "Applying database migrations", status: "pending" as const },
      { title: "Seeding initial data", status: "pending" as const },
    ],
  },
  {
    id: uuid(),
    idx: 1,
    title: "Creating search interface",
    substeps: [
      { title: "Writing `src/lib/search.tsx`", status: "pending" as const },
      { title: "Adding search input component", status: "pending" as const },
      {
        title: "Implementing autocomplete feature",
        status: "pending" as const,
      },
    ],
  },
  {
    id: uuid(),
    idx: 2,
    title: "Implement search functionality",
    substeps: [
      { title: "Setting up search API endpoint", status: "pending" as const },
      { title: "Adding search indexing", status: "pending" as const },
    ],
  },
  {
    id: uuid(),
    title: "Api integration",
    substeps: [
      { title: "Configuring API client", status: "pending" as const },
      { title: "Adding authentication middleware", status: "pending" as const },
      { title: "Testing API endpoints", status: "pending" as const },
    ],
  },
  {
    id: uuid(),
    idx: 3,
    title: "Building and verifying project",
    substeps: [
      { title: "Running type checks", status: "pending" as const },
      { title: "Run `npm run build`", status: "pending" as const },
      { title: "Verifying production build", status: "pending" as const },
    ],
  },
  {
    id: uuid(),
    idx: 4,
    title: "Deploying app",
    substeps: [
      {
        title: "Setting up deployment configuration",
        status: "pending" as const,
      },
      { title: "Deploying to production", status: "pending" as const },
      { title: "Running smoke tests", status: "pending" as const },
    ],
  },
]

// Helper function to parse text with backticks and render as code
const parseTextWithCode = (text: string) => {
  const parts = text.split(/(`[^`]+`)/)
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      const code = part.slice(1, -1)
      return (
        <code
          key={index}
          className="ml-1 px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs"
        >
          {code}
        </code>
      )
    }
    return <span key={index}>{part}</span>
  })
}

const PlanMessage = ({
  planMessage,
  onPlanComplete,
}: {
  planMessage: PlanStep[]
  onPlanComplete?: () => void
}) => {
  const [planSteps, setPlanSteps] = useState<PlanStep[]>(planMessage)
  const planRef = useRef(planWorkflow())

  useEffect(() => {
    const trackPlan = async () => {
      for await (const update of planRef.current) {
        setPlanSteps((prev) => {
          const updated = prev.map((s) => {
            if (s.id === update.id) {
              // If substepIndex is provided, update that specific substep
              if (update.substepIndex !== undefined && s.substeps) {
                const substepIndex = update.substepIndex
                const newSubsteps = s.substeps.map((sub, idx) => {
                  if (idx === substepIndex) {
                    return { ...sub, status: "in_progress" as const }
                  } else if (idx < substepIndex) {
                    return { ...sub, status: "completed" as const }
                  }
                  return sub
                })
                return { ...s, substeps: newSubsteps }
              }
              // Update main step status
              const newStep = { ...s, status: update.status }
              // If step is completed, mark all substeps as completed
              if (update.status === "completed" && s.substeps) {
                newStep.substeps = s.substeps.map((sub) => ({
                  ...sub,
                  status: "completed" as const,
                }))
              }
              return newStep
            }
            return s
          })
          // Check if all steps are completed
          if (updated.every((s) => s.status === "completed")) {
            onPlanComplete?.()
          }
          return updated
        })
      }
    }

    trackPlan()
  }, [onPlanComplete])

  return (
    <div className="w-full max-w-md">
      <div className="mb-3 flex items-center gap-2 animate-[slideIn_0.4s_ease-out]">
        <svg
          className="h-5 w-5 text-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
        <span className="text-sm font-medium">Plan</span>
      </div>
      <div className="space-y-3">
        {planSteps.map((step, index) => (
          <div
            key={step.id}
            className="space-y-1 animate-[slideIn_0.4s_ease-out]"
            style={{
              animationDelay: `${index * 0.1 + 0.2}s`,
              animationFillMode: "both",
            }}
          >
            <div className="flex items-start gap-2">
              <div className="mt-1 flex-shrink-0">
                {step.status === "completed" ? (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                    <svg
                      className="h-2.5 w-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                ) : step.status === "in_progress" ? (
                  <div className="flex h-4 w-4 items-center justify-center">
                    <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  </div>
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm transition-colors duration-500",
                  step.status === "completed"
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
            {step.substeps &&
              step.substeps.length > 0 &&
              step.status !== "pending" && (
                <div className="ml-6 space-y-1">
                  {step.substeps
                    .filter((substep) => substep.status === "in_progress")
                    .map((substep) => (
                      <div
                        key={substep.title}
                        className="flex items-center gap-2 animate-[fadeIn_0.4s_ease-in]"
                        style={{
                          animationFillMode: "both",
                        }}
                      >
                        <svg
                          className={cn(
                            "h-3 w-3 transition-colors duration-500",
                            substep.status === "completed"
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6"
                          />
                        </svg>
                        <span
                          className={cn(
                            "text-xs transition-colors duration-500",
                            substep.status === "completed"
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {parseTextWithCode(substep.title)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
          </div>
        ))}

        {/* Plan Completed Message */}
        {planSteps.every((step) => step.status === "completed") && (
          <div
            className="mt-4 flex items-center gap-2 pt-2 animate-[slideIn_0.4s_ease-out]"
            style={{
              animationDelay: `${planSteps.length * 0.1}s`,
              animationFillMode: "both",
            }}
          >
            <div className="relative h-4 w-5 flex-shrink-0">
              <svg
                className="absolute left-0 h-4 w-4 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <svg
                className="absolute left-1.5 h-4 w-4 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-green-600">
              Plan completed
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

const LandingInput = ({
  onSubmit,
  pendingMessage,
}: {
  onSubmit: (message: string) => void
  pendingMessage?: string
}) => {
  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col items-center justify-center p-4">
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-bold mb-2">What do you want to build?</h1>
        <p className="text-muted-foreground">
          Prompt, run, edit, and deploy changes
        </p>
      </div>
      <div className="relative w-full max-w-lg">
        {pendingMessage && (
          <div className="absolute left-0 top-0 z-10 w-full pointer-events-none px-3 py-2">
            <p
              className="m-0 whitespace-pre-wrap text-sm"
              style={{ viewTransitionName: "first-message-text" }}
            >
              {pendingMessage}
            </p>
          </div>
        )}
        <TypewriterInput onSubmit={onSubmit} />
      </div>
    </div>
  )
}

// Thinking indicator component
const ThinkingIndicator = ({
  isCreatingPlan,
}: {
  isCreatingPlan?: boolean
}) => {
  const clipboardPath =
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
  const lightbulbPath =
    "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"

  const iconPath = isCreatingPlan ? clipboardPath : lightbulbPath

  return (
    <div className="flex items-center gap-2 text-muted-foreground animate-[fadeIn_0.3s_ease-in] transition-all duration-500 mb-6">
      <div className="relative w-5 h-5">
        {/* Base icon */}
        <svg
          className="w-5 h-5 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={iconPath}
          />
        </svg>
        {/* Bright overlay with glare animation */}
        <svg
          className="absolute inset-0 w-5 h-5 text-gray-300 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{
            clipPath: "inset(0 100% 0 0)",
            animation: "glare 2s ease-in-out infinite",
          }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={iconPath}
          />
        </svg>
      </div>
      <span className="text-sm">
        {isCreatingPlan ? "Creating a plan..." : "Thinking..."}
      </span>
    </div>
  )
}

// Streaming text component for AI messages
const StreamingText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, 20) // 20ms per character for smooth streaming

      return () => clearTimeout(timer)
    }
  }, [currentIndex, text])

  return <>{displayedText}</>
}

// Chat message component
const Message = ({
  message,
  index,
  onPlanComplete,
}: {
  message: LangChainMessage
  index: number
  onPlanComplete?: () => void
}) => {
  const isAi = message.type === "ai"
  const isFirstMessage = index === 0

  // Check if this is a plan message (array content)
  const isPlanMessage = Array.isArray(message.content)

  // Get the text content from the message
  const getTextContent = () => {
    if (typeof message.content === "string") {
      return message.content
    }
    if (typeof message.content === "object" && "text" in message.content) {
      return message.content.text
    }
    return ""
  }

  const textContent = getTextContent()
  const shouldStream = isAi && textContent && !isPlanMessage

  return (
    <div
      className={cn(
        "flex w-full mb-6",

        !isAi && "justify-end"
      )}
      key={message.id}
    >
      <div>
        {isPlanMessage ? (
          <PlanMessage
            planMessage={message.content as PlanStep[]}
            onPlanComplete={onPlanComplete}
          />
        ) : (
          <p
            className={cn(
              "whitespace-pre-wrap",
              "text-sm",
              "rounded-xl",
              "flex items-center",

              !isAi ? "bg-muted/90 py-2 px-3" : "bg-background"
            )}
            style={
              isFirstMessage && !isAi
                ? { viewTransitionName: "first-message-text" }
                : {}
            }
          >
            {shouldStream ? <StreamingText text={textContent} /> : textContent}
          </p>
        )}
      </div>
    </div>
  )
}

const ChatInterface = ({
  messages,
  isLoading,
  isCreatingPlan,
  onSendMessage,
  plan,
  isPlanCompleted,
  onPlanComplete,
}: {
  messages: LangChainMessage[]
  isLoading: boolean
  isCreatingPlan: boolean
  onSendMessage: (message: string) => void
  plan: PlanStep[] | null
  isPlanCompleted: boolean
  onPlanComplete: () => void
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isLoading])

  const hasPlan = plan !== null

  // Show stop icon when loading (waiting for response or executing plan)
  const isExecutingPlan = isLoading || (plan !== null && !isPlanCompleted)

  return (
    <div className="h-[calc(100vh-70px)] w-full px-4 py-8 pb-4 md:px-8">
      {/* Main two-pane layout container */}
      <div className="relative h-full w-full overflow-hidden">
        {/* Left pane - Chat */}
        <div
          className="absolute left-0 top-0 h-full transition-all duration-500 ease-in-out flex"
          style={{
            width: hasPlan ? "40%" : "min(100%, 800px)",
            transform: hasPlan
              ? "translateX(0)"
              : "translateX(calc((100vw - min(100%, 800px) - 4rem) / 2))",
          }}
        >
          <Card className="flex h-full w-full flex-col overflow-hidden border-none">
            <CardContent className="flex flex-1 flex-col overflow-hidden pb-0">
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto py-2">
                {messages.map((message, i) => (
                  <Message
                    key={i}
                    message={message}
                    index={i}
                    onPlanComplete={onPlanComplete}
                  />
                ))}
                {isLoading && (
                  <ThinkingIndicator
                    key={isCreatingPlan ? "creating" : "thinking"}
                    isCreatingPlan={isCreatingPlan}
                  />
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <MessageInput
                onSubmit={onSendMessage}
                disabled={isLoading}
                placeholder="How can I help you?"
                variant="chat"
                isExecutingPlan={isExecutingPlan}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right pane - Workflow visualization */}
        <div
          className="absolute top-0 h-full transition-all duration-500 ease-in-out flex"
          style={{
            left: hasPlan ? "calc(40% + 1rem)" : "100%",
            width: hasPlan ? "calc(60% - 1rem)" : "calc(60% - 1rem)",
            opacity: hasPlan ? 1 : 0,
          }}
        >
          {plan && (
            <Card className="flex h-full w-full flex-col overflow-hidden">
              <CardContent className="flex h-full flex-col items-center justify-center p-6">
                <p className="text-center text-lg text-muted-foreground">
                  Your preview will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function IndexPage() {
  const [messages, setMessages] = useState<LangChainMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)
  const [chatStarted, setChatStarted] = useState(false)
  const [landingpagePlan, setLandingpagePlan] = useState<PlanStep[] | null>(
    null
  )
  const [isPlanCompleted, setIsPlanCompleted] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string>("")
  const _threadId = useRef(uuid())

  const handleSendMessage = async (content: string) => {
    // Add user message to chat
    const userMessage: LangChainMessage = {
      id: uuid(),
      type: "human",
      content,
    }

    // Set chat as started with View Transition
    if (!chatStarted) {
      // Show the pending message first
      setPendingMessage(content)

      // Small delay to ensure the pending message is rendered
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Check if View Transitions API is supported
      if ("startViewTransition" in document) {
        ;(document as any).startViewTransition(() => {
          flushSync(() => {
            setChatStarted(true)
            setMessages([userMessage])
            setPendingMessage("")
          })
        })
      } else {
        setChatStarted(true)
        setMessages([userMessage])
        setPendingMessage("")
      }
    } else {
      setMessages((prev) => [...prev, userMessage])
    }

    setIsLoading(true)

    try {
      // In a real implementation, this would call the streamWorkflow function
      // For now, we'll simulate a response after a delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate AI response
      const aiMessageText =
        "I'll help you build a landing page like google.com. This will be a fully-featured application with search history."
      const aiMessage: LangChainMessage = {
        id: uuid(),
        type: "ai",
        content: {
          type: "text",
          text: aiMessageText,
        },
      }

      // Simulate workflow data (in real implementation, this would come from the streamWorkflow function)
      const langingpagePlan: PlanStep[] = plan.map((s) => ({
        ...s,
        status: "pending" as const,
      }))

      setMessages((prev) => [...prev, aiMessage])

      // Wait for streaming animation to complete (20ms per character)
      const streamingDuration = aiMessageText.length * 20
      await new Promise((resolve) =>
        setTimeout(resolve, streamingDuration + 300)
      )

      // Now creating the plan
      setIsCreatingPlan(true)

      // Wait a bit to show "Creating a plan..." message
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Set the plan to trigger the right pane to appear
      setLandingpagePlan(langingpagePlan)
      setIsPlanCompleted(false)

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content: langingpagePlan,
        },
      ])

      setIsCreatingPlan(false)
    } catch (error) {
      console.error("Error sending message:", error)

      // Add error message
      const errorMessage: LangChainMessage = {
        id: uuid(),
        type: "ai",
        content:
          "Sorry, there was an error processing your request. Please try again.",
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section>
      {!chatStarted ? (
        <LandingInput
          onSubmit={handleSendMessage}
          pendingMessage={pendingMessage}
        />
      ) : (
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          isCreatingPlan={isCreatingPlan}
          onSendMessage={handleSendMessage}
          plan={landingpagePlan}
          isPlanCompleted={isPlanCompleted}
          onPlanComplete={() => setIsPlanCompleted(true)}
        />
      )}
    </section>
  )
}
