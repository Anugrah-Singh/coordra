import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET ??= 'assistant-test-secret-with-at-least-32-characters';
process.env.FRONTEND_URL ??= 'http://localhost:3000';
process.env.AI_ENABLED = 'false';

const [{ deriveRisks }, { resolveName, isValidTimeZone }, types, provider] =
  await Promise.all([
    import('../src/ai/risks.js'),
    import('../src/ai/resolution.js'),
    import('../src/ai/types.js'),
    import('../src/ai/provider.js'),
  ]);

describe('Pulse deterministic behavior', () => {
  it('derives every documented risk rule from facts', () => {
    const now = new Date('2026-08-02T12:00:00.000Z');
    const risks = deriveRisks({
      now,
      tasks: [
        {
          id: 'overdue',
          projectId: 'project',
          title: 'Overdue work',
          status: 'TODO',
          priority: 'MEDIUM',
          assigneeId: 'member',
          assigneeName: 'Maya',
          dueDate: new Date('2026-08-01T12:00:00.000Z'),
        },
        {
          id: 'blocked',
          projectId: 'project',
          title: 'Blocked work',
          status: 'BLOCKED',
          priority: 'HIGH',
          assigneeId: 'member',
          assigneeName: 'Maya',
          dueDate: null,
        },
        {
          id: 'urgent',
          projectId: 'project',
          title: 'Urgent work',
          status: 'TODO',
          priority: 'URGENT',
          assigneeId: null,
          assigneeName: null,
          dueDate: null,
        },
        {
          id: 'soon',
          projectId: 'project',
          title: 'Backlog work',
          status: 'BACKLOG',
          priority: 'MEDIUM',
          assigneeId: null,
          assigneeName: null,
          dueDate: new Date('2026-08-03T12:00:00.000Z'),
        },
      ],
      projects: [
        {
          id: 'project',
          name: 'Launch',
          taskCounts: { unfinished: 8 },
          lastActivityAt: new Date('2026-07-20T12:00:00.000Z'),
          memberLoad: [{ memberId: 'member', memberName: 'Maya', activeTasks: 6 }],
        },
      ],
    });
    assert.equal(risks.filter((risk) => risk.severity === 'high').length, 3);
    assert.equal(risks.filter((risk) => risk.severity === 'medium').length, 3);
  });

  it('resolves one, zero, and multiple workspace names without accepting IDs', () => {
    const choices = [
      { id: '1', name: 'Product Launch' },
      { id: '2', name: 'Launch Research' },
      { id: '3', name: 'Website' },
    ];
    assert.equal(resolveName('Website', choices, 'project').kind, 'match');
    assert.equal(resolveName('Missing', choices, 'project').kind, 'missing');
    assert.equal(resolveName('Launch', choices, 'project').kind, 'ambiguous');
  });

  it('validates time zones and role-to-tool mapping', () => {
    assert.equal(isValidTimeZone('Asia/Kolkata'), true);
    assert.equal(isValidTimeZone('Mars/Olympus'), false);
    assert.equal(types.roleToolNames('VIEWER').length, 4);
    assert.equal(types.roleToolNames('MEMBER').length, 7);
  });

  it('supports a fake model generator without calling Groq', async () => {
    const result = await provider.runPulseMessage(
      {
        workspaceName: 'Coordra Demo',
        timeZone: 'UTC',
        history: [],
        message: 'Summarize risks',
        toolContext: {
          workspaceId: '00000000-0000-4000-8000-000000000001',
          requesterId: '00000000-0000-4000-8000-000000000002',
          role: 'VIEWER',
          now: new Date('2026-08-02T12:00:00.000Z'),
        },
      },
      async () => ({ message: 'No verified risks.', activities: [] })
    );
    assert.equal(result.message, 'No verified risks.');
  });
});
