import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Layers3, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../lib/api';

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
  const navigate = useNavigate();
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

  const onSubmit = handleSubmit(async ({ confirmPassword: _, ...values }) => {
    try {
      await createAccount(values);
      toast.success('Account created');
      navigate('/app', { replace: true });
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
    <main className="auth-page auth-page--register">
      <section className="auth-hero">
        <Link className="brand brand--light" to="/">
          <span className="brand__mark"><Layers3 size={21} /></span>
          <span>WorkspaceOS</span>
        </Link>
        <div className="auth-hero__content">
          <span className="eyebrow eyebrow--light">Your team command center</span>
          <h1>Turn scattered work into one clear operating system.</h1>
          <p>
            Create a workspace, invite collaborators, build projects, and move
            tasks across a live Kanban board.
          </p>
          <div className="auth-stat-card">
            <Sparkles size={21} />
            <div>
              <strong>Portfolio-grade engineering</strong>
              <span>RBAC, audit trails, Neon branching, and Socket.IO.</span>
            </div>
          </div>
        </div>
        <div className="auth-hero__glow" />
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card__heading">
            <span className="eyebrow">Start collaborating</span>
            <h2>Create your account</h2>
            <p>You will be signed in automatically after registration.</p>
          </div>

          <form className="form-stack" onSubmit={onSubmit} noValidate>
            <label className="field">
              <span>Full name</span>
              <input autoComplete="name" placeholder="Anugrah Singh" {...register('fullName')} />
              {errors.fullName ? <small className="field-error">{errors.fullName.message}</small> : null}
            </label>
            <label className="field">
              <span>Email address</span>
              <input type="email" autoComplete="email" placeholder="you@company.com" {...register('email')} />
              {errors.email ? <small className="field-error">{errors.email.message}</small> : null}
            </label>
            <div className="form-grid form-grid--two">
              <label className="field">
                <span>Password</span>
                <input type="password" autoComplete="new-password" placeholder="12+ characters" {...register('password')} />
                {errors.password ? <small className="field-error">{errors.password.message}</small> : null}
              </label>
              <label className="field">
                <span>Confirm password</span>
                <input type="password" autoComplete="new-password" placeholder="Repeat password" {...register('confirmPassword')} />
                {errors.confirmPassword ? <small className="field-error">{errors.confirmPassword.message}</small> : null}
              </label>
            </div>
            <Button type="submit" size="lg" isLoading={isSubmitting}>
              Create account <ArrowRight size={17} />
            </Button>
          </form>

          <p className="auth-card__footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
};
