"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Send } from "lucide-react"
import { flushSync } from "react-dom"
import { v4 as uuid } from "uuid"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { MessageInput } from "@/components/message-input"
import { Workflow } from "@/components/types"
import { ButterflowWorkflowVisualization } from "@/components/workflow-visualization"

interface LangChainMessageContent {
  type: "text"
  text: string
}

interface LangChainMessage {
  id?: string
  type: "human" | "ai" | "system" | "tool"
  content: string | LangChainMessageContent[]
  tool_call_id?: string
  complete?: boolean
}

const LandingInput = ({
  onSubmit,
  pendingMessage,
}: {
  onSubmit: (message: string) => void
  pendingMessage?: string
}) => {
  return (
    <div className="h-[calc(100vh-70px)] flex flex-col items-center justify-center p-4">
      <h1 className="mb-8 text-4xl font-bold">Workflow AI</h1>
      <div className="relative w-full max-w-lg">
        {pendingMessage && (
          <div className="absolute left-0 top-0 z-10 w-full pointer-events-none first-message-transition">
            <div className="px-3 py-2 first-message-content-transition">
              <p className="m-0 whitespace-pre-wrap text-base leading-normal md:text-sm">{pendingMessage}</p>
            </div>
          </div>
        )}
        <MessageInput
          onSubmit={onSubmit}
          placeholder={pendingMessage ? "" : "Ask anything..."}
          variant="landing"
          autoFocus
        />
      </div>
    </div>
  )
}

// Chat message component
const Message = ({
  message,
  index,
  isFirstMessage,
}: {
  message: LangChainMessage
  index: number
  isFirstMessage?: boolean
}) => {
  const isAi = message.type === "ai"

  return (
    <div
      className={cn(
        "flex w-full gap-2 p-4",
        isAi ? "bg-muted/50" : "bg-background",
        isFirstMessage && !isAi && "first-message-transition"
      )}
      key={message.id}
    >
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
          isAi ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {isAi ? "AI" : "Y"}
      </div>
      <div
        className={cn(
          "flex-1",
          isFirstMessage && !isAi && "first-message-content-transition"
        )}
      >
        {typeof message.content === "string" ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : (
          <p className="whitespace-pre-wrap text-sm">
            {message.content.map((c) => c.text).join("")}
          </p>
        )}
      </div>
    </div>
  )
}

const ChatInterface = ({
  messages,
  isLoading,
  onSendMessage,
  workflow,
}: {
  messages: LangChainMessage[]
  isLoading: boolean
  onSendMessage: (message: string) => void
  workflow: Workflow | null
}) => {
  const [showMobileView, setShowMobileView] = useState<"chat" | "workflow">(
    "chat"
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isLoading])

  const hasWorkflow = workflow !== null

  // These values control the animation positions and widths
  const leftPaneWidth = hasWorkflow ? "40%" : "min(100%, 800px)"
  const leftPaneTranslate = hasWorkflow ? "0%" : "0%"
  const rightPaneWidth = hasWorkflow ? "60%" : "0%"
  const rightPaneOpacity = hasWorkflow ? 1 : 0
  const rightPaneTranslate = hasWorkflow ? "0%" : "5%"

  return (
    <div className="h-[calc(100vh-70px)] w-full px-4 py-2 md:px-8">
      {/* Mobile Toggle - Only on mobile */}
      <div className="mb-2 flex md:hidden">
        <Button
          variant={showMobileView === "chat" ? "default" : "outline"}
          onClick={() => setShowMobileView("chat")}
          className="flex-1 rounded-none"
        >
          Chat
        </Button>
        <Button
          variant={showMobileView === "workflow" ? "default" : "outline"}
          onClick={() => setShowMobileView("workflow")}
          className="flex-1 rounded-none"
          disabled={!hasWorkflow}
        >
          Workflow
          {hasWorkflow && <Badge className="ml-2">1</Badge>}
        </Button>
      </div>

      {/* Main two-pane layout container */}
      <div className="relative h-[calc(100%-40px)] w-full md:h-full overflow-hidden">
        {/* Left pane - Chat */}
        <div
          className={cn(
            "absolute left-0 top-0 h-full transition-all duration-500 ease-in-out flex",
            showMobileView === "workflow" ? "hidden md:flex" : "flex"
          )}
          style={{
            width: hasWorkflow ? '40%' : 'min(100%, 800px)',
            transform: hasWorkflow
              ? 'translateX(0)'
              : 'translateX(calc((100vw - min(100%, 800px) - 4rem) / 2))',
          }}
        >
          <Card className="flex h-full w-full flex-col overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle>Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col overflow-hidden pb-0">
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-2">
                {messages.map((message, i) => (
                  <Message
                    key={i}
                    message={message}
                    index={i}
                    isFirstMessage={i === 0}
                  />
                ))}
                {isLoading && "..."}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <MessageInput
                onSubmit={onSendMessage}
                disabled={isLoading}
                placeholder="Type your message..."
                variant="chat"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right pane - Workflow visualization */}
        <div
          className={cn(
            "absolute top-0 h-full transition-all duration-500 ease-in-out flex",
            showMobileView === "chat" ? "hidden md:flex" : "flex"
          )}
          style={{
            left: hasWorkflow ? 'calc(40% + 1rem)' : '100%',
            width: hasWorkflow ? 'calc(60% - 1rem)' : 'calc(60% - 1rem)',
            opacity: hasWorkflow ? 1 : 0,
          }}
        >
          {workflow && (
            <Card className="flex h-full w-full flex-col overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle>Workflow Diagram</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 pt-2">
                <ButterflowWorkflowVisualization
                  workflow={{ workflow }}
                  tasks={[]}
                />
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
  const [chatStarted, setChatStarted] = useState(false)
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
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
      await new Promise(resolve => setTimeout(resolve, 50))

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
      const aiMessage: LangChainMessage = {
        id: uuid(),
        type: "ai",
        content:
          "I've created a workflow based on your request. You can see it visualized on the right.",
      }

      // Simulate workflow data (in real implementation, this would come from the streamWorkflow function)
      const mockWorkflow: Workflow = {
        version: "1.0",
        nodes: [
          {
            id: "start",
            name: "Start Node",
            type: "automatic",
            steps: [],
          },
          {
            id: "process",
            name: "Process Data",
            type: "automatic",
            depends_on: ["start"],
            steps: [],
          },
          {
            id: "decision",
            name: "Make Decision",
            type: "manual",
            depends_on: ["process"],
            steps: [],
          },
          {
            id: "success",
            name: "Success Path",
            type: "automatic",
            depends_on: ["decision"],
            steps: [],
          },
          {
            id: "failure",
            name: "Failure Path",
            type: "automatic",
            depends_on: ["decision"],
            steps: [],
          },
          {
            id: "end",
            name: "End Node",
            type: "automatic",
            depends_on: ["success", "failure"],
            steps: [],
          },
        ],
      }

      setMessages((prev) => [...prev, aiMessage])
      setWorkflow(mockWorkflow)
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
        <LandingInput onSubmit={handleSendMessage} pendingMessage={pendingMessage} />
      ) : (
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          workflow={workflow}
        />
      )}
    </section>
  )
}
