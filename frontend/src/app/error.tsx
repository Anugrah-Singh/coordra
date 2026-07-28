"use client";
import { useEffect } from "react";
import { Button, ErrorPanel } from "@/components/ui";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="grid min-h-screen place-items-center p-6"><div className="w-full max-w-lg"><ErrorPanel message={error.message} action={<Button onClick={reset}>Try again</Button>} /></div></main>;
}
