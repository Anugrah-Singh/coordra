import { ArrowLeft, Layers3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui';

export const NotFoundPage = () => (
  <main className="centered-page">
    <Card className="not-found-card">
      <span className="brand__mark"><Layers3 size={23} /></span>
      <strong>404</strong>
      <h1>This workspace route does not exist.</h1>
      <p>The link may be outdated, or you may not have access to the resource.</p>
      <Link className="button button--primary button--md" to="/app"><ArrowLeft size={16} /> Back to workspaces</Link>
    </Card>
  </main>
);
