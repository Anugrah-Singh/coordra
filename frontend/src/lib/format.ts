export const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const humanize = (value: string) =>
  value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const isOverdue = (dueDate: string | null, status?: string) =>
  Boolean(
    dueDate &&
      status !== 'DONE' &&
      new Date(dueDate).getTime() < Date.now()
  );

export const toDateTimeLocal = (value: string | null | undefined) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000)
    .toISOString()
    .slice(0, 16);
};
