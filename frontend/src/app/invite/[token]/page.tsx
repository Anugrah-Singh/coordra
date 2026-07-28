import { ProtectedGate } from "@/components/AuthGates";
import { InvitePage } from "@/views/InvitePage";
export default function Page() { return <ProtectedGate><InvitePage /></ProtectedGate>; }
