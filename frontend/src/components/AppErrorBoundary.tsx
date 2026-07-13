import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, Card } from './ui';

type State = { error: Error | null };

export class AppErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[UI crash]', error, info);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main className="fatal-page">
        <Card className="fatal-card">
          <AlertTriangle size={34} />
          <h1>The workspace UI hit an unexpected error.</h1>
          <p>{this.state.error.message}</p>
          <Button onClick={() => window.location.reload()}>Reload application</Button>
        </Card>
      </main>
    );
  }
}
