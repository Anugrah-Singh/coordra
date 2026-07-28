import { ArrowRight, CheckCircle2, GitFork, Layers3, LockKeyhole, Radio, Workflow } from 'lucide-react';
import Link from 'next/link';
import { LandingCta } from '../components/LandingCta';
import { Button } from '../components/ui/button';

export const LandingPage = () => {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 [&>nav]:hidden [&>nav]:items-center [&>nav]:gap-6 [&>nav]:text-sm [&>nav]:text-muted-foreground md:[&>nav]:flex [&>nav_a]:inline-flex [&>nav_a]:items-center [&>nav_a]:gap-1.5 [&>nav_a]:hover:text-foreground">
        <Link className="inline-flex items-center gap-2.5 font-heading text-base font-bold tracking-tight" href="/"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Layers3 size={21} /></span><span>WorkspaceOS</span></Link>
        <nav><a href="#features">Features</a><a href="#engineering">Engineering</a><a href="https://github.com/Anugrah-Singh/SAAS-Team-Workspace" target="_blank" rel="noreferrer"><GitFork size={17} /> GitHub</a></nav>
        <LandingCta />
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[.9fr_1.1fr]">
        <div className="[&_h1]:mt-5 [&_h1]:font-heading [&_h1]:text-5xl [&_h1]:font-semibold [&_h1]:leading-[.96] [&_h1]:tracking-tight sm:[&_h1]:text-6xl [&_p]:mt-6 [&_p]:max-w-xl [&_p]:text-lg [&_p]:leading-relaxed [&_p]:text-muted-foreground">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">Real-time team collaboration</span>
          <h1>One operating system for the work your team ships.</h1>
          <p>WorkspaceOS combines multi-tenant project management, a live Kanban board, hierarchical RBAC, notifications, and transactional audit history.</p>
          <div className="flex flex-wrap items-center gap-2">
            <LandingCta prominent />
            <Button asChild size="lg" variant="ghost"><a href="https://github.com/Anugrah-Singh/SAAS-Team-Workspace" target="_blank" rel="noreferrer"><GitFork size={17} /> View source</a></Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5 [&>span]:text-xs [&>span]:text-muted-foreground"><span><CheckCircle2 size={16} /> Secure cookie auth</span><span><CheckCircle2 size={16} /> Tenant-isolated data</span><span><CheckCircle2 size={16} /> Neon preview CI</span></div>
        </div>
        <div className="overflow-hidden rounded-2xl border bg-foreground text-background shadow-2xl">
          <div className="flex items-center gap-2 border-b border-background/10 px-5 py-4 [&>span]:size-2 [&>span]:rounded-full [&>span]:bg-background/20 [&>strong]:ml-auto [&>strong]:font-mono [&>strong]:text-[10px] [&>strong]:uppercase [&>strong]:tracking-wider [&>strong]:text-background/45"><span /><span /><span /><strong>Launch workspace</strong></div>
          <div className="grid gap-2 p-3 sm:grid-cols-3">
            {['BACKLOG', 'IN PROGRESS', 'DONE'].map((column, columnIndex) => (
              <div className="rounded-xl bg-background/5 p-2 [&>header]:flex [&>header]:items-center [&>header]:gap-2 [&>header]:p-2 [&>header]:font-mono [&>header]:text-[9px] [&>header]:tracking-wider [&>header]:text-background/50 [&>header>span]:size-1.5 [&>header>span]:rounded-full [&>header>span]:bg-primary [&>header>b]:ml-auto [&>article]:mt-2 [&>article]:rounded-lg [&>article]:bg-background [&>article]:p-3 [&>article]:text-foreground [&_small]:font-mono [&_small]:text-[8px] [&_small]:text-amber-700 [&_strong]:mt-2 [&_strong]:block [&_strong]:text-xs [&_p]:mt-1 [&_p]:text-[10px] [&_p]:text-muted-foreground [&_footer]:mt-3 [&_footer]:flex [&_footer]:items-center [&_footer]:justify-between [&_footer>i]:h-1 [&_footer>i]:w-10 [&_footer>i]:rounded-full [&_footer>i]:bg-secondary [&_footer>span]:grid [&_footer>span]:size-6 [&_footer>span]:place-items-center [&_footer>span]:rounded-full [&_footer>span]:bg-primary [&_footer>span]:text-[8px] [&_footer>span]:text-primary-foreground" key={column}><header><span />{column}<b>{columnIndex + 2}</b></header>{Array.from({ length: columnIndex === 1 ? 3 : 2 }).map((_, index) => <article key={index}><small>{index === 0 ? 'HIGH' : 'MEDIUM'}</small><strong>{['Polish onboarding flow', 'Create release dashboard', 'Verify workspace roles'][Math.min(index + columnIndex, 2)]}</strong><p>Clear task context and shared ownership.</p><footer><i /> <span>AS</span></footer></article>)}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 [&>div:first-child]:max-w-2xl [&_h2]:mt-3 [&_h2]:font-heading [&_h2]:text-4xl [&_h2]:font-semibold" id="features">
        <div><span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">Product capabilities</span><h2>Everything needed for a convincing full-stack collaboration demo.</h2></div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-3 [&>article]:bg-background [&>article]:p-7 [&>article>svg]:text-primary [&_h3]:mt-8 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-semibold [&_p]:mt-2 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground">
          <article><Workflow size={23} /><h3>Kanban delivery</h3><p>Create, filter, assign, drag, archive, and duplicate tasks across five delivery states.</p></article>
          <article><LockKeyhole size={23} /><h3>Workspace RBAC</h3><p>Owner, admin, manager, member, and viewer permissions are enforced on the backend.</p></article>
          <article><Radio size={23} /><h3>Live collaboration</h3><p>Socket.IO updates task boards, comments, members, invitations, and notifications without refreshes.</p></article>
        </div>
      </section>

      <section className="grid gap-10 bg-foreground px-[max(1.25rem,calc((100vw-80rem)/2))] py-24 text-background lg:grid-cols-[.7fr_1.3fr] lg:items-end [&_h2]:mt-3 [&_h2]:font-heading [&_h2]:text-4xl [&_h2]:font-semibold [&_p]:mt-4 [&_p]:text-background/55" id="engineering">
        <div><span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">Engineering depth</span><h2>Built beyond the happy path.</h2><p>Pull requests provision isolated Neon branches, apply Drizzle migrations, and run authenticated integration tests before merge.</p></div>
        <div className="flex flex-wrap items-center gap-3 [&>span]:rounded-lg [&>span]:border [&>span]:border-background/15 [&>span]:px-3 [&>span]:py-2 [&>span]:font-mono [&>span]:text-[10px] [&>span]:uppercase [&>svg]:text-primary"><span>GitHub PR</span><ArrowRight /><span>Neon branch</span><ArrowRight /><span>Migration</span><ArrowRight /><span>Integration tests</span><ArrowRight /><span>Cleanup</span></div>
      </section>
    </main>
  );
};
