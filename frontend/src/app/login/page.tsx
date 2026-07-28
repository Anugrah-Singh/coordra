import { PublicOnlyGate } from "@/components/AuthGates";
import { LoginPage } from "@/views/LoginPage";
export default function Page() { return <PublicOnlyGate><LoginPage /></PublicOnlyGate>; }
