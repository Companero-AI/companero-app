import { readFile } from 'fs/promises';
import { join } from 'path';
import type { PieceType } from '@/types/database';

const PROMPTS_DIR = join(process.cwd(), 'src', 'prompts');

// Cache for loaded prompts
const promptCache = new Map<string, string>();

async function loadPrompt(relativePath: string): Promise<string> {
  const cacheKey = relativePath;

  if (promptCache.has(cacheKey)) {
    return promptCache.get(cacheKey)!;
  }

  const fullPath = join(PROMPTS_DIR, relativePath);
  const content = await readFile(fullPath, 'utf-8');

  promptCache.set(cacheKey, content);
  return content;
}

export async function getSystemPrompt(): Promise<string> {
  return loadPrompt('system.md');
}

export async function getPiecePrompt(pieceType: PieceType): Promise<string> {
  return loadPrompt(`pieces/${pieceType}.md`);
}

export async function buildConversationPrompt(
  pieceType: PieceType,
  projectContext?: {
    name: string;
    description?: string | null;
    completedPieces?: Array<{ type: PieceType; summary: string }>;
  }
): Promise<string> {
  const [systemPrompt, piecePrompt] = await Promise.all([
    getSystemPrompt(),
    getPiecePrompt(pieceType),
  ]);

  let contextSection = '';

  if (projectContext) {
    contextSection = `\n\n## Current Project Context\n`;
    contextSection += `**Project Name:** ${projectContext.name}\n`;

    if (projectContext.description) {
      contextSection += `**Description:** ${projectContext.description}\n`;
    }

    if (projectContext.completedPieces && projectContext.completedPieces.length > 0) {
      contextSection += `\n### Previously Completed Pieces\n`;
      for (const piece of projectContext.completedPieces) {
        contextSection += `\n**${piece.type.charAt(0).toUpperCase() + piece.type.slice(1)}:**\n${piece.summary}\n`;
      }
    }
  }

  return `${systemPrompt}${contextSection}\n\n---\n\n${piecePrompt}`;
}

// Clear the cache (useful for development)
export function clearPromptCache(): void {
  promptCache.clear();
}
