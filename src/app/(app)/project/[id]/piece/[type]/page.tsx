import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ChatInterface } from '@/components/chat/chat-interface';
import { PuzzleBoardWrapper } from '../../puzzle-board-wrapper';
import { PIECE_METADATA, MVP_PIECE_TYPES, type PieceType, type PuzzlePiece } from '@/types/database';

interface PiecePageProps {
  params: Promise<{ id: string; type: string }>;
}

export default async function PiecePage({ params }: PiecePageProps) {
  const { id, type } = await params;

  // Validate piece type
  if (!MVP_PIECE_TYPES.includes(type as PieceType)) {
    notFound();
  }

  const pieceType = type as PieceType;
  const supabase = await createClient();

  // Get project details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Get puzzle pieces
  const { data: pieces } = await supabase
    .from('puzzle_pieces')
    .select('*')
    .eq('project_id', id);

  const puzzlePieces = (pieces || []).map((piece: PuzzlePiece) => ({
    pieceType: piece.piece_type,
    status: piece.status,
  }));

  // Get the current piece
  const currentPiece = pieces?.find((p: PuzzlePiece) => p.piece_type === pieceType);

  if (!currentPiece || currentPiece.status === 'locked') {
    notFound();
  }

  // Update piece status to in_progress if it's available
  if (currentPiece.status === 'available') {
    await supabase
      .from('puzzle_pieces')
      .update({ status: 'in_progress' })
      .eq('id', currentPiece.id);
  }

  const metadata = PIECE_METADATA[pieceType];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href={`/project/${id}`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          &larr; Back to {project.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-4 flex items-center gap-2">
          <span>{metadata.icon}</span>
          {metadata.title}
        </h1>
        <p className="text-gray-600 mt-1">{metadata.description}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <PuzzleBoardWrapper
            projectId={id}
            pieces={puzzlePieces}
            activePiece={pieceType}
          />
        </div>
        <div className="lg:col-span-2 h-[600px]">
          <ChatInterface
            projectId={id}
            pieceType={pieceType}
            pieceId={currentPiece.id}
          />
        </div>
      </div>
    </div>
  );
}
