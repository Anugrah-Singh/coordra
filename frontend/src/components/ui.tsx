"use client";

import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { LoaderCircle } from "lucide-react";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Card as ShadcnCard } from "@/components/ui/card";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { Avatar as ShadcnAvatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner as ShadcnSpinner } from "@/components/ui/spinner";

export { cn };

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const mappedVariant = variant === "primary" ? "default" : variant === "danger" ? "destructive" : variant;
  const mappedSize = size === "md" ? "default" : size;
  return (
    <ShadcnButton
      variant={mappedVariant}
      size={mappedSize}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : null}
      {children}
    </ShadcnButton>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground" role="status"><ShadcnSpinner /><span>{label}</span></div>;
}

export function PageSpinner({ label = "Loading workspace" }: { label?: string }) {
  return <div className="grid min-h-[50vh] place-items-center"><Spinner label={label} /></div>;
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <ShadcnAvatar className={cn(size === "sm" && "size-7", size === "lg" && "size-11")} title={name}>
      <AvatarFallback>{initials(name) || "?"}</AvatarFallback>
    </ShadcnAvatar>
  );
}

const toneVariant = {
  neutral: "secondary",
  success: "default",
  warning: "outline",
  danger: "destructive",
  info: "outline",
  purple: "secondary",
} as const;

export function Badge({ children, tone = "neutral", className }: PropsWithChildren<{
  tone?: keyof typeof toneVariant;
  className?: string;
}>) {
  return <ShadcnBadge variant={toneVariant[tone]} className={className}>{children}</ShadcnBadge>;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <ShadcnCard className={className} {...props} />;
}

export function EmptyState({ icon, title, description, action }: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Empty>
      <EmptyHeader>
        {icon ? <EmptyMedia variant="icon">{icon}</EmptyMedia> : null}
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

export function Modal({ open, onClose, title, description, children, size = "md" }: PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
}>) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className={cn(
        size === "sm" && "sm:max-w-md",
        size === "lg" && "sm:max-w-3xl",
        size === "xl" && "sm:max-w-6xl"
      )}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function ErrorPanel({ title = "Something went wrong", message, action }: {
  title?: string;
  message: string;
  action?: ReactNode;
}) {
  return <Alert variant="destructive"><AlertTitle>{title}</AlertTitle><AlertDescription>{message}</AlertDescription>{action}</Alert>;
}
