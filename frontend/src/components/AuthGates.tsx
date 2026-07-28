"use client";

import { useEffect, type PropsWithChildren } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PageSpinner } from "@/components/ui";

export function ProtectedGate({ children }: PropsWithChildren) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && !user) {
      const query = search?.toString() ?? "";
      const destination = `${pathname ?? "/app"}${query ? `?${query}` : ""}`;
      router.replace(`/login?next=${encodeURIComponent(destination)}`);
    }
  }, [isLoading, pathname, router, search, user]);
  if (isLoading || !user) return <PageSpinner label="Restoring your session" />;
  return children;
}

export function PublicOnlyGate({ children }: PropsWithChildren) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && user) router.replace("/app");
  }, [isLoading, router, user]);
  if (isLoading || user) return <PageSpinner label="Checking your session" />;
  return children;
}
