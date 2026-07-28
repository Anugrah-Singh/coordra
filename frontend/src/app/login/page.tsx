import { PublicOnlyGate } from '@/features/auth/AuthGates';
import { LoginPage } from '@/features/auth/LoginPage';
export default function Page() {
  return (
    <PublicOnlyGate>
      <LoginPage />
    </PublicOnlyGate>
  );
}
