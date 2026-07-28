import { ProtectedGate } from '@/features/auth/AuthGates';
import { InvitePage } from '@/features/auth/InvitePage';
export default function Page() {
  return (
    <ProtectedGate>
      <InvitePage />
    </ProtectedGate>
  );
}
