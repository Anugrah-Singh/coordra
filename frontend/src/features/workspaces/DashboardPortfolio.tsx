import { ArrowRight, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Project } from '@/types/api';

interface DashboardPortfolioProps {
  projects: Project[];
  workspaceId: string;
}

export const DashboardPortfolio = ({
  projects,
  workspaceId,
}: DashboardPortfolioProps) => {
  return (
    <section>
      <header className="flex items-end justify-between [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground">
        <div>
          <h2>Project portfolio</h2>
          <p>Jump into a board and continue delivery.</p>
        </div>
      </header>
      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={27} />}
          title="Create your first project"
          description="Projects group tasks into a focused delivery board."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mt-4">
          {projects.slice(0, 4).map((project) => (
            <Link
              key={project.id}
              href={`/app/workspaces/${workspaceId}/projects/${project.id}`}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border bg-card p-4 shadow-xs hover:border-primary/35 hover:shadow-sm [&_strong]:block [&_span]:block [&_span]:truncate [&_span]:text-xs [&_span]:text-muted-foreground"
            >
              <div className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                <FolderKanban size={18} />
              </div>
              <div>
                <strong>{project.name}</strong>
                <span>{project.description || 'No description'}</span>
              </div>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};
