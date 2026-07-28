import { AppLayout } from '@/components/app-shell/AppLayout';
import { ProtectedGate } from '@/features/auth/AuthGates';
import { WorkspaceProvider } from '@/features/workspaces/WorkspaceProvider';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedGate>
      <WorkspaceProvider>
        <AppLayout>{children}</AppLayout>
      </WorkspaceProvider>
    </ProtectedGate>
  );
}
