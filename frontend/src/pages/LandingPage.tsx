import { ArrowRight, CheckCircle2, Github, Layers3, LockKeyhole, Radio, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const LandingPage = () => {
  const { user } = useAuth();

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="brand brand--light" to="/"><span className="brand__mark"><Layers3 size={21} /></span><span>WorkspaceOS</span></Link>
        <nav><a href="#features">Features</a><a href="#engineering">Engineering</a><a href="https://github.com/Anugrah-Singh/SAAS-Team-Workspace" target="_blank" rel="noreferrer"><Github size={17} /> GitHub</a></nav>
        <Link className="button button--secondary button--sm" to={user ? '/app' : '/login'}>{user ? 'Open workspace' : 'Sign in'} <ArrowRight size={15} /></Link>
      </header>

      <section className="landing-hero">
        <div className="landing-hero__copy">
          <span className="eyebrow eyebrow--light">Real-time team collaboration</span>
          <h1>One operating system for the work your team ships.</h1>
          <p>WorkspaceOS combines multi-tenant project management, a live Kanban board, hierarchical RBAC, notifications, and transactional audit history.</p>
          <div className="button-row">
            <Link className="button button--primary button--lg" to={user ? '/app' : '/register'}>{user ? 'Enter workspace' : 'Create an account'} <ArrowRight size={17} /></Link>
            <a className="button button--ghost button--lg button--on-dark" href="https://github.com/Anugrah-Singh/SAAS-Team-Workspace" target="_blank" rel="noreferrer"><Github size={17} /> View source</a>
          </div>
          <div className="landing-proof"><span><CheckCircle2 size={16} /> Secure cookie auth</span><span><CheckCircle2 size={16} /> Tenant-isolated data</span><span><CheckCircle2 size={16} /> Neon preview CI</span></div>
        </div>
        <div className="product-preview">
          <div className="product-preview__top"><span /><span /><span /><strong>Launch workspace</strong></div>
          <div className="product-preview__body">
            {['BACKLOG', 'IN PROGRESS', 'DONE'].map((column, columnIndex) => (
              <div className="preview-column" key={column}><header><span />{column}<b>{columnIndex + 2}</b></header>{Array.from({ length: columnIndex === 1 ? 3 : 2 }).map((_, index) => <article key={index}><small>{index === 0 ? 'HIGH' : 'MEDIUM'}</small><strong>{['Polish onboarding flow', 'Create release dashboard', 'Verify workspace roles'][Math.min(index + columnIndex, 2)]}</strong><p>Clear task context and shared ownership.</p><footer><i /> <span>AS</span></footer></article>)}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-features" id="features">
        <div><span className="eyebrow">Product capabilities</span><h2>Everything needed for a convincing full-stack collaboration demo.</h2></div>
        <div className="feature-grid">
          <article><Workflow size={23} /><h3>Kanban delivery</h3><p>Create, filter, assign, drag, archive, and duplicate tasks across five delivery states.</p></article>
          <article><LockKeyhole size={23} /><h3>Workspace RBAC</h3><p>Owner, admin, manager, member, and viewer permissions are enforced on the backend.</p></article>
          <article><Radio size={23} /><h3>Live collaboration</h3><p>Socket.IO updates task boards, comments, members, invitations, and notifications without refreshes.</p></article>
        </div>
      </section>

      <section className="engineering-section" id="engineering">
        <div><span className="eyebrow eyebrow--light">Engineering depth</span><h2>Built beyond the happy path.</h2><p>Pull requests provision isolated Neon branches, apply Drizzle migrations, and run authenticated integration tests before merge.</p></div>
        <div className="pipeline"><span>GitHub PR</span><ArrowRight /><span>Neon branch</span><ArrowRight /><span>Migration</span><ArrowRight /><span>Integration tests</span><ArrowRight /><span>Cleanup</span></div>
      </section>
    </main>
  );
};
