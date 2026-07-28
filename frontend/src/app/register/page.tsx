import { PublicOnlyGate } from "@/components/AuthGates";
import { RegisterPage } from "@/views/RegisterPage";
export default function Page() { return <PublicOnlyGate><RegisterPage /></PublicOnlyGate>; }
