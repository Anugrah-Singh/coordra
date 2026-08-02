import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PulseMessage } from './PulseMessage';

describe('PulseMessage', () => {
  it('renders friendly activity labels and exposes retry as a button', async () => {
    const retry = vi.fn();
    render(
      <PulseMessage
        message={{
          id: '1',
          role: 'assistant',
          content: 'Pulse is temporarily unavailable.',
          activities: ['Reviewed project health'],
          failedPrompt: 'Summarize risks',
        }}
        onRetry={retry}
      />
    );
    expect(screen.getByText('Reviewed project health')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledWith('Summarize risks');
  });
});
