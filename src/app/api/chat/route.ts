import { streamText } from 'ai';
import { model, DEFAULT_MODEL_PARAMS } from '@/lib/ai/config';
import { buildConversationPrompt } from '@/lib/ai/prompts';
import { createClient } from '@/lib/supabase/server';
import type { PieceType } from '@/types/database';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { messages, projectId, pieceType, conversationId } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      projectId: string;
      pieceType: PieceType;
      conversationId?: string;
    };

    if (!messages || !projectId || !pieceType) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Fetch project and any completed pieces for context
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return new Response('Project not found', { status: 404 });
    }

    // Get completed pieces for context
    const { data: completedPieces } = await supabase
      .from('puzzle_pieces')
      .select('piece_type, summary')
      .eq('project_id', projectId)
      .eq('status', 'complete')
      .not('summary', 'is', null);

    const projectContext = {
      name: project.name as string,
      description: project.description as string | null,
      completedPieces: completedPieces?.map((p: { piece_type: string; summary: string }) => ({
        type: p.piece_type as PieceType,
        summary: p.summary,
      })),
    };

    // Build the system prompt with context
    const systemPrompt = await buildConversationPrompt(pieceType, projectContext);

    // Save user message to database if we have a conversation
    if (conversationId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content: lastMessage.content,
        });
      }
    }

    // Stream the response using Vercel AI SDK
    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      ...DEFAULT_MODEL_PARAMS,
      onFinish: async ({ text }) => {
        // Save assistant response to database
        if (conversationId) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: text,
          });
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
