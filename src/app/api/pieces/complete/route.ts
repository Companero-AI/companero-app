import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PIECE_METADATA, MVP_PIECE_TYPES, type PieceType } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pieceId, summary } = body as {
      pieceId: string;
      summary: string;
    };

    if (!pieceId || !summary) {
      return NextResponse.json(
        { error: 'Missing required fields: pieceId and summary' },
        { status: 400 }
      );
    }

    // Get the piece and verify ownership through project
    const { data: piece, error: pieceError } = await supabase
      .from('puzzle_pieces')
      .select('*, projects!inner(user_id)')
      .eq('id', pieceId)
      .single();

    if (pieceError || !piece) {
      return NextResponse.json({ error: 'Piece not found' }, { status: 404 });
    }

    // Verify user owns the project
    if ((piece.projects as { user_id: string }).user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify piece is in progress (can only complete in_progress pieces)
    if (piece.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Can only complete pieces that are in progress' },
        { status: 400 }
      );
    }

    // Update the piece to complete status with summary
    const { error: updateError } = await supabase
      .from('puzzle_pieces')
      .update({
        status: 'complete',
        summary: summary.trim(),
      })
      .eq('id', pieceId);

    if (updateError) {
      console.error('Error updating piece:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete piece' },
        { status: 500 }
      );
    }

    // Now unlock dependent pieces
    // Get all pieces for this project
    const { data: allPieces } = await supabase
      .from('puzzle_pieces')
      .select('id, piece_type, status')
      .eq('project_id', piece.project_id);

    if (allPieces) {
      // Create a map of piece types to their statuses
      const pieceStatusMap = new Map<PieceType, string>();
      const pieceIdMap = new Map<PieceType, string>();

      for (const p of allPieces) {
        // Update the status of the just-completed piece in our map
        const status = p.id === pieceId ? 'complete' : p.status;
        pieceStatusMap.set(p.piece_type as PieceType, status);
        pieceIdMap.set(p.piece_type as PieceType, p.id);
      }

      // Find locked pieces that can now be unlocked
      const piecesToUnlock: string[] = [];

      for (const pieceType of MVP_PIECE_TYPES) {
        const status = pieceStatusMap.get(pieceType);

        // Only process locked pieces
        if (status !== 'locked') continue;

        // Check if all prerequisites are complete
        const prerequisites = PIECE_METADATA[pieceType].prerequisites;
        const allPrerequisitesMet = prerequisites.every(
          (prereq) => pieceStatusMap.get(prereq) === 'complete'
        );

        if (allPrerequisitesMet) {
          const id = pieceIdMap.get(pieceType);
          if (id) {
            piecesToUnlock.push(id);
          }
        }
      }

      // Unlock the pieces
      if (piecesToUnlock.length > 0) {
        await supabase
          .from('puzzle_pieces')
          .update({ status: 'available' })
          .in('id', piecesToUnlock);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Piece completed successfully',
    });
  } catch (error) {
    console.error('Complete piece API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
