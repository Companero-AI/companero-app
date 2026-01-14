'use client';

import { Lock, Check, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PIECE_METADATA, type PieceType, type PieceStatus } from '@/types/database';

export interface PuzzlePieceProps {
  pieceType: PieceType;
  status: PieceStatus;
  onClick?: () => void;
  isActive?: boolean;
}

export function PuzzlePiece({
  pieceType,
  status,
  onClick,
  isActive = false,
}: PuzzlePieceProps) {
  const metadata = PIECE_METADATA[pieceType];

  const statusStyles: Record<PieceStatus, string> = {
    locked: 'opacity-50 cursor-not-allowed bg-gray-50',
    available: 'cursor-pointer hover:border-blue-300 hover:shadow-md bg-white',
    in_progress: 'cursor-pointer border-blue-500 border-2 bg-blue-50',
    complete: 'cursor-pointer border-green-500 bg-green-50',
  };

  const statusIcons: Record<PieceStatus, React.ReactNode> = {
    locked: <Lock className="h-5 w-5 text-gray-400" />,
    available: <ChevronRight className="h-5 w-5 text-gray-400" />,
    in_progress: (
      <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
    ),
    complete: <Check className="h-5 w-5 text-green-600" />,
  };

  const handleClick = () => {
    if (status !== 'locked' && onClick) {
      onClick();
    }
  };

  return (
    <Card
      className={`
        relative p-4 transition-all duration-200
        ${statusStyles[status]}
        ${isActive ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
      onClick={handleClick}
      role={status !== 'locked' ? 'button' : undefined}
      tabIndex={status !== 'locked' ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl" role="img" aria-label={metadata.title}>
              {metadata.icon}
            </span>
            <h3 className="font-semibold text-gray-900 truncate">{metadata.title}</h3>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{metadata.description}</p>
        </div>
        <div className="flex-shrink-0">{statusIcons[status]}</div>
      </div>

      {status === 'locked' && (
        <div className="mt-3 text-xs text-gray-500">
          Complete previous pieces to unlock
        </div>
      )}
    </Card>
  );
}
