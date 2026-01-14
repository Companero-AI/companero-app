import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import type { Project } from '@/types/database';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Projects</h1>
          <p className="text-gray-600 mt-1">
            Build your product plans piece by piece
          </p>
        </div>
        <Link href="/projects/new">
          <Button>New Project</Button>
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-4xl mb-4">🧩</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No projects yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start planning your first product with AI guidance
          </p>
          <Link href="/projects/new">
            <Button>Create your first project</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project: Project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-gray-600 mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
              <p className="text-sm text-gray-400 mt-3">
                Updated {new Date(project.updated_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
