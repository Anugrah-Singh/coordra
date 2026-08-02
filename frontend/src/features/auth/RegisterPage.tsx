'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Layers3, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiError } from '@/lib/api-client';

const schema = z
  .object({
    fullName: z.string().trim().min(2, 'Use at least 2 characters').max(100),
    email: z.email('Enter a valid email address'),
    password: z.string().min(12, 'Use at least 12 characters').max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof schema>;

export const RegisterPage = () => {
  const { register: createAccount } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createAccount({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });
      toast.success('Account created');
      router.replace('/app');
    } catch (error) {
      if (error instanceof ApiError) {
        Object.entries(error.fields).forEach(([field, message]) => {
          const normalized = field.replace(/^body\./, '') as keyof FormValues;
          if (normalized in schema.shape) setError(normalized, { message });
        });
      }
      toast.error(error instanceof Error ? error.message : 'Registration failed');
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
            Your team command center
          </span>
          <h1>Turn scattered work into one clear operating system.</h1>
          <p>
            Create a workspace, invite collaborators, build projects, and move tasks
            across a live Kanban board.
          </p>
          <div className="relative z-10 grid grid-cols-3 gap-3 rounded-xl border border-background/10 bg-background/5 p-4 backdrop-blur [&_strong]:block [&_strong]:font-heading [&_strong]:text-xl [&_span]:text-xs [&_span]:text-background/50">
            <Sparkles size={21} />
            <div>
              <strong>Portfolio-grade engineering</strong>
              <span>RBAC, audit trails, Neon branching, and Socket.IO.</span>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -bottom-40 -right-40 size-[34rem] rounded-full bg-primary/25 blur-3xl" />
      </section>

      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md [&_h2]:font-heading [&_h2]:text-3xl [&_h2]:font-semibold">
          <div className="mb-8 [&_p]:mt-2 [&_p]:text-muted-foreground">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-primary">
              Start collaborating
            </span>
            <h2>Create your account</h2>
            <p>You will be signed in automatically after registration.</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
            <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
              <span>Full name</span>
              <input
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                autoComplete="name"
                placeholder="Anugrah Singh"
                {...register('fullName')}
              />
              {errors.fullName ? (
                <small className="text-xs font-normal text-destructive">
                  {errors.fullName.message}
                </small>
              ) : null}
            </label>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
                <span>Password</span>
                <input
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                  type="password"
                  autoComplete="new-password"
                  placeholder="12+ characters"
                  {...register('password')}
                />
                {errors.password ? (
                  <small className="text-xs font-normal text-destructive">
                    {errors.password.message}
                  </small>
                ) : null}
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium [&>small]:font-normal [&>small]:text-muted-foreground">
                <span>Confirm password</span>
                <input
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword ? (
                  <small className="text-xs font-normal text-destructive">
                    {errors.confirmPassword.message}
                  </small>
                ) : null}
              </label>
            </div>
            <LoadingButton type="submit" size="lg" isLoading={isSubmitting}>
              Create account <ArrowRight size={17} />
            </LoadingButton>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground [&_a]:font-medium [&_a]:text-primary">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
};
