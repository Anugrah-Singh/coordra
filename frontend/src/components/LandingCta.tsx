"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function LandingCta({ prominent = false }: { prominent?: boolean }) {
  const { user, isLoading } = useAuth();
  const href = user ? "/app" : prominent ? "/register" : "/login";
  const label = user ? (prominent ? "Enter workspace" : "Open workspace") : (prominent ? "Create an account" : "Sign in");
  return (
    <Button asChild size={prominent ? "lg" : "sm"} variant={prominent ? "default" : "secondary"}>
      <Link href={href} aria-disabled={isLoading}>
        {isLoading ? "Checking session…" : label} <ArrowRight size={prominent ? 17 : 15} />
      </Link>
    </Button>
  );
}
