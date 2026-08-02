import {
  Activity,
  ArrowRight,
  GitFork,
  KanbanSquare,
  Layers3,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { LandingCta } from '@/components/LandingCta';
import { Button } from '@/components/ui/button';

const capabilities = [
  {
    icon: KanbanSquare,
    title: 'Projects and priorities',
    copy: 'Plan work on live Kanban boards with owners, due dates, labels, and clear delivery states.',
  },
  {
    icon: Users,
    title: 'People and permissions',
    copy: 'Coordinate workspace access with a server-enforced role model and tenant-isolated data.',
  },
  {
    icon: MessageSquareText,
    title: 'Context where work happens',
    copy: 'Keep comments, invitations, and notifications attached to the work they explain.',
  },
  {
    icon: Activity,
    title: 'Live accountability',
    copy: 'See real-time changes across browsers and inspect a transactional audit history.',
  },
  {
    icon: Sparkles,
    title: 'Pulse coordination',
    copy: 'Ask about workload and risk, then review structured proposals before any change is made.',
  },
];

export const LandingPage = () => (
  <main className="min-h-screen bg-background">
    <header className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5">
      <Link
        className="inline-flex items-center gap-2.5 font-heading text-base font-bold tracking-tight"
        href="/"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Layers3 aria-hidden="true" size={21} />
        </span>
        <span>Coordra</span>
      </Link>
      <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
        <a className="hover:text-foreground" href="#capabilities">
          Capabilities
        </a>
        <a
          className="inline-flex items-center gap-1.5 hover:text-foreground"
          href="https://github.com/Anugrah-Singh/coordra"
          target="_blank"
          rel="noreferrer"
        >
          <GitFork aria-hidden="true" size={17} /> GitHub
        </a>
      </nav>
      <LandingCta />
    </header>

    <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[.88fr_1.12fr]">
      <div>
        <span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">
          Projects · people · priorities
        </span>
        <h1 className="mt-5 max-w-3xl font-heading text-5xl font-semibold leading-[.96] tracking-tight text-balance sm:text-6xl">
          Keep the work moving, with every decision in view.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Coordra is an AI-assisted workspace for coordinating projects, people, and
          priorities. Pulse finds risks and prepares changes without acting on its own.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-2">
          <LandingCta prominent />
          <Button asChild size="lg" variant="ghost">
            <a
              href="https://github.com/Anugrah-Singh/coordra"
              target="_blank"
              rel="noreferrer"
            >
              <GitFork aria-hidden="true" size={17} /> View source
            </a>
          </Button>
        </div>
        <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="text-primary" size={17} />
          Pulse writes only after a member reviews and approves a stored proposal.
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-foreground text-background shadow-2xl">
        <div className="flex items-center gap-2 border-b border-background/10 px-5 py-4">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles aria-hidden="true" size={16} />
          </span>
          <div>
            <strong className="block text-sm">Pulse</strong>
            <small className="text-background/50">Product Launch · Workspace facts</small>
          </div>
        </div>
        <div className="space-y-3 p-5 text-sm">
          <div className="ml-14 rounded-2xl rounded-br-md bg-primary px-4 py-3 text-primary-foreground">
            What needs attention before launch?
          </div>
          <div className="mr-8 rounded-2xl rounded-bl-md bg-background/8 px-4 py-4">
            <p className="leading-relaxed text-background/85">
              Two conditions may need attention: one launch task is blocked, and an urgent
              task has no owner. Assigning an owner and recording the unblock step would
              reduce immediate delivery risk.
            </p>
            <div className="mt-4 rounded-xl border border-primary/40 bg-primary/10 p-3">
              <small className="font-mono text-[9px] uppercase tracking-wider text-primary">
                Proposal · awaiting approval
              </small>
              <strong className="mt-1 block">Assign “Finalize launch checklist”</strong>
              <span className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground">
                Review proposal <ArrowRight aria-hidden="true" size={14} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-24" id="capabilities">
      <div className="max-w-2xl">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">
          Five connected capabilities
        </span>
        <h2 className="mt-3 font-heading text-4xl font-semibold">
          Coordination that stays grounded in the workspace.
        </h2>
      </div>
      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-2 lg:grid-cols-5">
        {capabilities.map(({ icon: Icon, title, copy }) => (
          <article className="bg-background p-6" key={title}>
            <Icon aria-hidden="true" className="text-primary" size={22} />
            <h3 className="mt-8 font-heading text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
          </article>
        ))}
      </div>
    </section>
  </main>
);
