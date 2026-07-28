import { ProtectedGate } from "@/components/AuthGates";
import { AppLayout } from "@/layouts/AppLayout";
import { WorkspaceProvider } from "@/providers/WorkspaceProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedGate>
      <WorkspaceProvider><AppLayout>{children}</AppLayout></WorkspaceProvider>
    </ProtectedGate>
  );
}
