import { PublicOnlyGate } from '@/features/auth/AuthGates';
import { RegisterPage } from '@/features/auth/RegisterPage';
export default function Page() {
  return (
    <PublicOnlyGate>
      <RegisterPage />
    </PublicOnlyGate>
  );
}
