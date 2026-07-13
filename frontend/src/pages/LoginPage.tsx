import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CheckCircle2, Layers3, ShieldCheck, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../lib/api';
import { Button } from '../components/ui';

const schema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination =
    (location.state as { from?: string } | null)?.from ?? '/app';

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
      navigate(destination, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.fields.email) {
        setError('email', { message: error.fields.email });
      }
      toast.error(error instanceof Error ? error.message : 'Login failed');
    }
  });

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <Link className="brand brand--light" to="/">
          <span className="brand__mark"><Layers3 size={21} /></span>
          <span>WorkspaceOS</span>
        </Link>
        <div className="auth-hero__content">
          <span className="eyebrow eyebrow--light">Built for focused teams</span>
          <h1>Projects move faster when everyone sees the same truth.</h1>
          <p>
            Plan work, enforce workspace roles, and collaborate live without
            losing context across tools.
          </p>
          <div className="auth-proof-list">
            <span><ShieldCheck size={18} /> Tenant-isolated workspace data</span>
            <span><Zap size={18} /> Real-time task and comment updates</span>
            <span><CheckCircle2 size={18} /> Production-tested CI and migrations</span>
          </div>
        </div>
        <div className="auth-hero__glow" />
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card__heading">
            <span className="eyebrow">Team workspace</span>
            <h2>Sign in to your account</h2>
            <p>Use your account or the demo credentials listed in the README.</p>
          </div>

          <form className="form-stack" onSubmit={onSubmit} noValidate>
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register('email')}
              />
              {errors.email ? <small className="field-error">{errors.email.message}</small> : null}
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                {...register('password')}
              />
              {errors.password ? <small className="field-error">{errors.password.message}</small> : null}
            </label>

            <Button type="submit" size="lg" isLoading={isSubmitting}>
              Sign in <ArrowRight size={17} />
            </Button>
          </form>

          <p className="auth-card__footer">
            New to WorkspaceOS? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
};
