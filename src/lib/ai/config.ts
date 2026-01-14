import { anthropic } from '@ai-sdk/anthropic';

// Claude model configuration
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

// Create the model instance for use with Vercel AI SDK
export const model = anthropic(CLAUDE_MODEL);

// Model parameters for chat completion
export const DEFAULT_MODEL_PARAMS = {
  temperature: 0.7,
  maxTokens: 4096,
} as const;
