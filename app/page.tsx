'use client';
import Link from 'next/link';

import { siteConfig } from '@/config/site';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';
import { Workflow } from '@/components/types';
import { v4 as uuid } from 'uuid';
import { cn } from '@/lib/utils';
import { ButterflowWorkflowVisualization } from '@/components/workflow-visualization';
import { Badge } from '@/components/ui/badge';

interface LangChainMessageContent {
  type: 'text';
  text: string;
}

interface LangChainMessage {
  id?: string;
  type: 'human' | 'ai' | 'system' | 'tool';
  content: string | LangChainMessageContent[];
  tool_call_id?: string;
  complete?: boolean;
}

const LandingInput = ({
  onSubmit,
}: {
  onSubmit: (message: string) => void;
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <div className="h-[calc(100vh-70px)] flex flex-col items-center justify-center p-4">
      <h1 className="mb-8 text-4xl font-bold">Workflow AI</h1>
      <form
        onSubmit={handleSubmit}
        className="group relative w-full max-w-lg focus-within:scale-105"
      >
        <Input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInput(e.target.value)
          }
          placeholder="Ask anything..."
          className="h-14 pr-12 text-lg shadow-lg"
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-70 group-hover:opacity-100"
          disabled={!input.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
};

// Chat message component
const Message = ({
  message,
  index,
}: {
  message: LangChainMessage;
  index: number;
}) => {
  const isAi = message.type === 'ai';

  return (
    <div
      className={cn(
        'flex w-full gap-2 p-4',
        isAi ? 'bg-muted/50' : 'bg-background'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
          isAi ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isAi ? 'AI' : 'Y'}
      </div>
      <div className="flex-1">
        {typeof message.content === 'string' ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : (
          <p className="whitespace-pre-wrap text-sm">
            {message.content.map((c) => c.text).join('')}
          </p>
        )}
      </div>
    </div>
  );
};

const ChatInterface = ({
  messages,
  isLoading,
  onSendMessage,
  workflow,
}: {
  messages: LangChainMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  workflow: Workflow | null;
}) => {
  const [input, setInput] = useState('');
  const [showMobileView, setShowMobileView] = useState<'chat' | 'workflow'>(
    'chat'
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const hasWorkflow = workflow !== null;

  // These values control the animation positions and widths
  const leftPaneWidth = hasWorkflow ? '40%' : 'min(100%, 800px)';
  const leftPaneTranslate = hasWorkflow ? '0%' : '0%';
  const rightPaneWidth = hasWorkflow ? '60%' : '0%';
  const rightPaneOpacity = hasWorkflow ? 1 : 0;
  const rightPaneTranslate = hasWorkflow ? '0%' : '5%';

  return (
    <div className="h-[calc(100vh-70px)] w-full px-4 py-2 md:px-8">
      {/* Mobile Toggle - Only on mobile */}
      <div className="mb-2 flex md:hidden">
        <Button
          variant={showMobileView === 'chat' ? 'default' : 'outline'}
          onClick={() => setShowMobileView('chat')}
          className="flex-1 rounded-none"
        >
          Chat
        </Button>
        <Button
          variant={showMobileView === 'workflow' ? 'default' : 'outline'}
          onClick={() => setShowMobileView('workflow')}
          className="flex-1 rounded-none"
          disabled={!hasWorkflow}
        >
          Workflow
          {hasWorkflow && <Badge className="ml-2">1</Badge>}
        </Button>
      </div>

      {/* Main two-pane layout container */}
      <div className="relative flex h-[calc(100%-40px)] w-full md:h-full">
        {/* Left pane - Chat */}
        <div
          className={cn(
            'flex h-full overflow-hidden',
            hasWorkflow ? '' : 'mx-auto',
            showMobileView === 'workflow' ? 'hidden md:block' : 'block'
          )}
        >
          <Card className="flex h-full w-full flex-col overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle>Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col overflow-hidden pb-0">
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-2">
                {messages.map((message, i) => (
                  <Message key={i} message={message} index={i} />
                ))}
                {isLoading && '...'}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSubmit} className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setInput(e.target.value)
                    }
                    placeholder="Type your message..."
                    className="min-h-[60px] resize-none"
                  />
                  <Button
                    type="submit"
                    disabled={input.trim() === '' || isLoading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right pane - Workflow visualization */}
        <div
          className={cn(
            'flex h-full overflow-hidden',
            showMobileView === 'chat' ? 'hidden md:block' : 'block'
          )}
        >
          <Card className="flex h-full w-full flex-col overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle>Workflow Diagram</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 pt-2">
              {workflow && (
                <ButterflowWorkflowVisualization
                  workflow={{ workflow }}
                  tasks={[]}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default function IndexPage() {
  const [messages, setMessages] = useState<LangChainMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const _threadId = useRef(uuid());

  const handleSendMessage = async (content: string) => {
    // Set chat as started
    if (!chatStarted) {
      setChatStarted(true);
    }

    // Add user message to chat
    const userMessage: LangChainMessage = {
      id: uuid(),
      type: 'human',
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // In a real implementation, this would call the streamWorkflow function
      // For now, we'll simulate a response after a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate AI response
      const aiMessage: LangChainMessage = {
        id: uuid(),
        type: 'ai',
        content:
          "I've created a workflow based on your request. You can see it visualized on the right.",
      };

      // Simulate workflow data (in real implementation, this would come from the streamWorkflow function)
      const mockWorkflow: Workflow = {
        version: '1.0',
        nodes: [
          {
            id: 'start',
            name: 'Start Node',
            type: 'automatic',
            steps: [],
          },
          {
            id: 'process',
            name: 'Process Data',
            type: 'automatic',
            depends_on: ['start'],
            steps: [],
          },
          {
            id: 'decision',
            name: 'Make Decision',
            type: 'manual',
            depends_on: ['process'],
            steps: [],
          },
          {
            id: 'success',
            name: 'Success Path',
            type: 'automatic',
            depends_on: ['decision'],
            steps: [],
          },
          {
            id: 'failure',
            name: 'Failure Path',
            type: 'automatic',
            depends_on: ['decision'],
            steps: [],
          },
          {
            id: 'end',
            name: 'End Node',
            type: 'automatic',
            depends_on: ['success', 'failure'],
            steps: [],
          },
        ],
      };

      setMessages((prev) => [...prev, aiMessage]);
      setWorkflow(mockWorkflow);
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage: LangChainMessage = {
        id: uuid(),
        type: 'ai',
        content:
          'Sorry, there was an error processing your request. Please try again.',
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      {!chatStarted ? (
        <LandingInput onSubmit={handleSendMessage} />
      ) : (
        <div>
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            workflow={workflow}
          />
        </div>
      )}
    </section>
  );
}
