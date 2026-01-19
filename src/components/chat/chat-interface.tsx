'use client';

import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport, type UIMessage } from 'ai';
import { useRef, useEffect, useState, useMemo } from 'react';
import { Send, RefreshCw, CheckCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PIECE_METADATA, type PieceType } from '@/types/database';

export interface ChatInterfaceProps {
  projectId: string;
  pieceType: PieceType;
  pieceId: string;
  conversationId?: string;
  onComplete?: (summary: string) => void;
}

// Helper to extract text content from message parts
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

export function ChatInterface({
  projectId,
  pieceType,
  pieceId,
  conversationId,
}: ChatInterfaceProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [summary, setSummary] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const metadata = PIECE_METADATA[pieceType];

  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: '/api/chat',
        body: {
          projectId,
          pieceType,
          conversationId,
        },
      }),
    [projectId, pieceType, conversationId]
  );

  const { messages, status, sendMessage, regenerate, error } = useChat({
    transport,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');
    await sendMessage({ text: message });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleComplete = async () => {
    if (!summary.trim()) {
      setCompleteError('Please provide a summary of what you defined for this piece.');
      return;
    }

    setIsCompleting(true);
    setCompleteError(null);

    try {
      const response = await fetch('/api/pieces/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pieceId,
          summary: summary.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete piece');
      }

      // Success - redirect back to project page
      router.push(`/project/${projectId}`);
      router.refresh();
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : 'Failed to complete piece');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{metadata.icon}</span>
            <div>
              <h2 className="font-semibold text-gray-900">{metadata.title}</h2>
              <p className="text-xs text-gray-500">{metadata.description}</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              onClick={() => setShowCompleteModal(true)}
              variant="primary"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete Piece
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <span className="text-4xl block mb-3">{metadata.icon}</span>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Let&apos;s work on {metadata.title}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              I&apos;ll guide you through defining this piece of your product puzzle.
              Just start typing to begin our conversation.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">
                {getMessageText(message)}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
                <span className="text-xs">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">
              Something went wrong. Please try again.
              <Button
                variant="ghost"
                size="sm"
                onClick={() => regenerate()}
                className="ml-2"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-100 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

      {/* Completion Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Complete {metadata.title}
              </h3>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setCompleteError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Write a brief summary of what you defined for this piece. This will help provide
              context for the following pieces.
            </p>

            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={`Summarize your ${metadata.title.toLowerCase()}...`}
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />

            {completeError && (
              <p className="text-sm text-red-600 mt-2">{completeError}</p>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCompleteModal(false);
                  setCompleteError(null);
                }}
                disabled={isCompleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isCompleting || !summary.trim()}
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
              >
                {isCompleting ? 'Completing...' : 'Mark as Complete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
