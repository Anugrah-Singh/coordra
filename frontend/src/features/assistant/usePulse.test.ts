import { describe, expect, it } from 'vitest';
import { boundHistory, type PulseMessageItem } from './usePulse';

describe('boundHistory', () => {
  it('keeps only the latest ten messages', () => {
    const messages: PulseMessageItem[] = Array.from({ length: 12 }, (_, index) => ({
      id: String(index),
      role: index % 2 ? 'assistant' : 'user',
      content: `message ${index}`,
    }));
    expect(boundHistory(messages)).toHaveLength(10);
    expect(boundHistory(messages)[0]?.content).toBe('message 2');
  });

  it('stays within the client history character budget', () => {
    const messages: PulseMessageItem[] = Array.from({ length: 10 }, (_, index) => ({
      id: String(index),
      role: 'user',
      content: String(index).repeat(2_000),
    }));
    const result = boundHistory(messages);
    expect(
      result.reduce((total, item) => total + item.content.length, 0)
    ).toBeLessThanOrEqual(10_000);
  });
});
