'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  variant?: 'landing' | 'chat';
  autoFocus?: boolean;
}

export const MessageInput = ({
  onSubmit,
  disabled = false,
  placeholder = 'Ask anything...',
  className,
  variant = 'chat',
  autoFocus = false,
}: MessageInputProps) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (variant === 'landing') {
    return (
      <form
        onSubmit={handleSubmit}
        className={cn(
          'group relative w-full max-w-lg message-input-transition',
          className
        )}
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[56px] pr-12 text-lg shadow-lg resize-none"
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-70 group-hover:opacity-100"
          disabled={!input.trim() || disabled}
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('border-t p-4 message-input-transition', className)}
    >
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[60px] resize-none"
        />
        <Button type="submit" disabled={input.trim() === '' || disabled}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};
