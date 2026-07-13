import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
  useEffect,
} from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { initials } from '../lib/format';

export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
};

export const Button = ({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) => (
  <button
    className={cn('button', `button--${variant}`, `button--${size}`, className)}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading ? <LoaderCircle size={16} className="spin" /> : null}
    {children}
  </button>
);

export const Spinner = ({ label = 'Loading' }: { label?: string }) => (
  <div className="spinner" role="status" aria-label={label}>
    <LoaderCircle className="spin" />
    <span>{label}</span>
  </div>
);

export const PageSpinner = ({ label = 'Loading workspace' }: { label?: string }) => (
  <div className="page-spinner">
    <Spinner label={label} />
  </div>
);

export const Avatar = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => (
  <span className={cn('avatar', `avatar--${size}`)} aria-label={name} title={name}>
    {initials(name) || '?'}
  </span>
);

export const Badge = ({
  children,
  tone = 'neutral',
  className,
}: PropsWithChildren<{
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  className?: string;
}>) => <span className={cn('badge', `badge--${tone}`, className)}>{children}</span>;

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('card', className)} {...props} />
);

export const EmptyState = ({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) => (
  <div className="empty-state">
    {icon ? <div className="empty-state__icon">{icon}</div> : null}
    <h3>{title}</h3>
    <p>{description}</p>
    {action ? <div className="empty-state__action">{action}</div> : null}
  </div>
);

export const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
}: PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}>) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.classList.add('modal-open');
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={cn('modal', `modal--${size}`)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog">
            <X size={19} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </section>
    </div>
  );
};

export const ErrorPanel = ({
  title = 'Something went wrong',
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: ReactNode;
}) => (
  <Card className="error-panel">
    <h3>{title}</h3>
    <p>{message}</p>
    {action}
  </Card>
);
