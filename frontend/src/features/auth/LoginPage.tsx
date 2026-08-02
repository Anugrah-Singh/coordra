'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CheckCircle2, Layers3, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiError } from '@/lib/api-client';

const schema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export const LoginPage = () => {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedDestination = searchParams?.get('next');
  const destination =
    requestedDestination?.startsWith('/') && !requestedDestination.startsWith('//')
      ? requestedDestination
      : '/app';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      toast.success('Welcome back');
      router.replace(destination);
    } catch (error) {
      if (error instanceof ApiError && error.fields.email) {
        setError('email', { message: error.fields.email });
      }
      toast.error(error instanceof Error ? error.message : 'Login failed');
    }
  });

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(28rem,.95fr)]">
      <section className="relative hidden overflow-hidden bg-foreground p-10 text-background lg:flex lg:flex-col lg:justify-between">
        <Link
          className="inline-flex items-center gap-2.5 font-heading text-base font-bold tracking-tight text-background"
          href="/"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Layers3 size={21} />
          </span>
          <span>Coordra</span>
        </Link>
        <div className="relative z-10 my-auto max-w-xl [&_h1]:mt-4 [&_h1]:font-heading [&_h1]:text-5xl [&_h1]:font-semibold [&_h1]:leading-[1.02] [&_p]:mt-5 [&_p]:text-lg [&_p]:text-background/60">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-background/60">
            Built for focused teams
          </span>
          <h1>Projects move faster when everyone sees the same truth.</h1>
          <p>
            Plan work, enforce workspace roles, and collaborate live without losing
            context across tools.
          </p>
          <div className="mt-8 flex flex-col gap-3 [&>span]:flex [&>span]:items-center [&>span]:gap-3 [&>span]:text-sm [&>span]:text-background/75">
            <span>
              <ShieldCheck size={18} /> Tenant-isolated workspace data
            </span>
            <span>
              <Zap size={18} /> Real-time task and comment updates
            </span>
            <span>
              <CheckCircle2 size={18} /> Production-tested CI and migrations
            </span>
          </div>
        </div>
        <div className="pointer-events-none absolute -bottom-40 -right-40 size-[34rem] rounded-full bg-primary/25 blur-3xl" />
      </section>

      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md [&_h2]:font-heading [&_h2]:text-3xl [&_h2]:font-semibold">
          <div className="mb-8 [&_p]:mt-2 [&_p]:text-muted-foreground">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">
              Team workspace
            </span>
            <h2>Sign in to your account</h2>
            <p>Use your account or the demo credentials listed in the README.</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
            <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
              <span>Email address</span>
              <input
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register('email')}
              />
              {errors.email ? (
                <small className="text-xs font-normal text-destructive">
                  {errors.email.message}
                </small>
              ) : null}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
              <span>Password</span>
              <input
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                {...register('password')}
              />
              {errors.password ? (
                <small className="text-xs font-normal text-destructive">
                  {errors.password.message}
                </small>
              ) : null}
            </label>

            <LoadingButton type="submit" size="lg" isLoading={isSubmitting}>
              Sign in <ArrowRight size={17} />
            </LoadingButton>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground [&_a]:font-medium [&_a]:text-primary">
            New to Coordra? <Link href="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
};
