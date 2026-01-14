'use client';

import { useRouter } from 'next/navigation';
import { PuzzleBoard, type PuzzlePieceData } from '@/components/puzzle/puzzle-board';
import type { PieceType } from '@/types/database';

interface PuzzleBoardWrapperProps {
  projectId: string;
  pieces: PuzzlePieceData[];
  activePiece?: PieceType | null;
}

export function PuzzleBoardWrapper({ projectId, pieces, activePiece }: PuzzleBoardWrapperProps) {
  const router = useRouter();

  const handlePieceClick = (pieceType: PieceType) => {
    const piece = pieces.find(p => p.pieceType === pieceType);
    if (piece && piece.status !== 'locked') {
      router.push(`/project/${projectId}/piece/${pieceType}`);
    }
  };

  return (
    <PuzzleBoard
      pieces={pieces}
      activePiece={activePiece}
      onPieceClick={handlePieceClick}
    />
  );
}
