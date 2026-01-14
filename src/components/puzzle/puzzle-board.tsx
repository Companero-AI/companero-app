'use client';

import { PuzzlePiece } from './puzzle-piece';
import { PIECE_METADATA, type PieceType, type PieceStatus } from '@/types/database';

export interface PuzzlePieceData {
  pieceType: PieceType;
  status: PieceStatus;
}

export interface PuzzleBoardProps {
  pieces: PuzzlePieceData[];
  activePiece?: PieceType | null;
  onPieceClick?: (pieceType: PieceType) => void;
}

export function PuzzleBoard({ pieces, activePiece, onPieceClick }: PuzzleBoardProps) {
  // Sort pieces by their defined order
  const sortedPieces = [...pieces].sort(
    (a, b) => PIECE_METADATA[a.pieceType].order - PIECE_METADATA[b.pieceType].order
  );

  // Calculate progress
  const completedCount = pieces.filter((p) => p.status === 'complete').length;
  const totalCount = pieces.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Planning Progress</span>
          <span className="text-sm text-gray-500">
            {completedCount} of {totalCount} complete
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Puzzle pieces grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        {sortedPieces.map((piece) => (
          <PuzzlePiece
            key={piece.pieceType}
            pieceType={piece.pieceType}
            status={piece.status}
            isActive={activePiece === piece.pieceType}
            onClick={() => onPieceClick?.(piece.pieceType)}
          />
        ))}
      </div>

      {/* Completion message */}
      {completedCount === totalCount && totalCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <span className="text-2xl mb-2 block">🎉</span>
          <h3 className="font-semibold text-green-800">Puzzle Complete!</h3>
          <p className="text-sm text-green-600 mt-1">
            Your product plan is ready. You can export it or continue refining.
          </p>
        </div>
      )}
    </div>
  );
}
