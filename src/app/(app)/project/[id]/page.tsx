import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PuzzleBoardWrapper } from './puzzle-board-wrapper';
import type { PuzzlePiece } from '@/types/database';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/projects"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          &larr; Back to projects
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">
          {project.name}
        </h1>
        {project.description && (
          <p className="text-gray-600 mt-1">{project.description}</p>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <PuzzleBoardWrapper projectId={id} pieces={puzzlePieces} />
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-4">👈</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select a puzzle piece
            </h3>
            <p className="text-gray-600">
              Click on an available puzzle piece to start working on it with AI guidance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
