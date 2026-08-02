import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

import { closeDatabase, db } from '../src/db/index.js';
import {
  auditLogs,
  comments,
  labels,
  notifications,
  projects,
  taskLabels,
  tasks,
  users,
  workspaceMembers,
  workspaces,
} from '../src/db/schema/index.js';

const DEMO_SLUG = 'coordra-demo';
const DEMO_WORKSPACE_ID = '00000000-0000-4000-8000-000000000001';
const REQUIRED_CONFIRMATION = 'coordra-demo';
const DEMO_EMAILS = {
  owner: 'owner@coordra.demo',
  member: 'member@coordra.demo',
  viewer: 'viewer@coordra.demo',
} as const;

const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setUTCHours(17, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

const requireSeedConfirmation = (): string => {
  if (process.env.DEMO_SEED_CONFIRM !== REQUIRED_CONFIRMATION) {
    throw new Error(
      `Demo seeding is intentionally guarded. Set DEMO_SEED_CONFIRM=${REQUIRED_CONFIRMATION} before running it.`
    );
  }

  const password = process.env.DEMO_SEED_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error(
      'Set DEMO_SEED_PASSWORD to a password containing at least 12 characters.'
    );
  }

  return password;
};

const seedDemo = async (): Promise<void> => {
  const password = requireSeedConfirmation();
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await db.transaction(async (tx) => {
    // The script owns only this well-known demo workspace. Removing it makes
    // the script idempotent without touching unrelated application data.
    await tx.delete(workspaces).where(eq(workspaces.slug, DEMO_SLUG));

    const upsertDemoUser = async (email: string, fullName: string) => {
      const [user] = await tx
        .insert(users)
        .values({ email, fullName, passwordHash })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            fullName,
            passwordHash,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!user) {
        throw new Error(`Failed to create demo user ${email}.`);
      }

      return user;
    };

    // A node-postgres transaction uses one client, so keep its queries sequential.
    const owner = await upsertDemoUser(DEMO_EMAILS.owner, 'Olivia Owner');
    const member = await upsertDemoUser(DEMO_EMAILS.member, 'Maya Member');
    const viewer = await upsertDemoUser(DEMO_EMAILS.viewer, 'Victor Viewer');

    const [workspace] = await tx
      .insert(workspaces)
      .values({
        id: DEMO_WORKSPACE_ID,
        name: 'Coordra Demo',
        slug: DEMO_SLUG,
      })
      .returning();

    if (!workspace) {
      throw new Error('Failed to create the demo workspace.');
    }

    await tx.insert(workspaceMembers).values([
      { workspaceId: workspace.id, userId: owner.id, role: 'OWNER' },
      { workspaceId: workspace.id, userId: member.id, role: 'MEMBER' },
      { workspaceId: workspace.id, userId: viewer.id, role: 'VIEWER' },
    ]);

    const createdProjects = await tx
      .insert(projects)
      .values([
        {
          workspaceId: workspace.id,
          name: 'Product Launch',
          description: 'Coordinate the public launch of the team workspace.',
        },
        {
          workspaceId: workspace.id,
          name: 'Mobile Experience',
          description: 'Improve responsive workflows and mobile usability.',
        },
        {
          workspaceId: workspace.id,
          name: 'Growth Experiments',
          description: 'Run measurable onboarding and activation experiments.',
        },
      ])
      .returning();

    const projectByName = new Map(
      createdProjects.map((project) => [project.name, project])
    );
    const productLaunch = projectByName.get('Product Launch');
    const mobileExperience = projectByName.get('Mobile Experience');
    const growthExperiments = projectByName.get('Growth Experiments');

    if (!productLaunch || !mobileExperience || !growthExperiments) {
      throw new Error('Failed to create all demo projects.');
    }

    const createdTasks = await tx
      .insert(tasks)
      .values([
        {
          workspaceId: workspace.id,
          projectId: productLaunch.id,
          createdById: owner.id,
          assigneeId: owner.id,
          title: 'Finalize launch checklist',
          description:
            'Confirm owners, dependencies, rollback steps, and launch-day communication.',
          status: 'IN_PROGRESS',
          priority: 'URGENT',
          dueDate: daysFromNow(2),
        },
        {
          workspaceId: workspace.id,
          projectId: productLaunch.id,
          createdById: owner.id,
          assigneeId: member.id,
          title: 'Prepare product screenshots',
          description:
            'Capture the dashboard, Kanban board, task details, and member management.',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: daysFromNow(4),
        },
        {
          workspaceId: workspace.id,
          projectId: productLaunch.id,
          createdById: member.id,
          assigneeId: owner.id,
          title: 'Publish release notes',
          description: 'Summarize the launch features and technical highlights.',
          status: 'BACKLOG',
          priority: 'MEDIUM',
          dueDate: daysFromNow(7),
        },
        {
          workspaceId: workspace.id,
          projectId: mobileExperience.id,
          createdById: member.id,
          assigneeId: member.id,
          title: 'Test tablet navigation',
          description:
            'Validate drawer behavior, board scrolling, and task editing on tablet widths.',
          status: 'BLOCKED',
          priority: 'HIGH',
          dueDate: daysFromNow(3),
        },
        {
          workspaceId: workspace.id,
          projectId: mobileExperience.id,
          createdById: owner.id,
          assigneeId: member.id,
          title: 'Polish empty states',
          description:
            'Make first-use states clear and useful across projects, tasks, and members.',
          status: 'DONE',
          priority: 'LOW',
          dueDate: daysFromNow(-1),
        },
        {
          workspaceId: workspace.id,
          projectId: growthExperiments.id,
          createdById: owner.id,
          assigneeId: owner.id,
          title: 'Instrument invite conversion',
          description:
            'Track invite creation, acceptance, and first meaningful collaboration.',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          dueDate: daysFromNow(6),
        },
        {
          workspaceId: workspace.id,
          projectId: growthExperiments.id,
          createdById: member.id,
          assigneeId: member.id,
          title: 'Draft onboarding experiment',
          description:
            'Compare a guided workspace setup with the current blank-state experience.',
          status: 'TODO',
          priority: 'MEDIUM',
          dueDate: daysFromNow(10),
        },
      ])
      .returning();

    const taskByTitle = new Map(createdTasks.map((task) => [task.title, task]));
    const launchChecklist = taskByTitle.get('Finalize launch checklist');
    const productScreenshots = taskByTitle.get('Prepare product screenshots');
    const tabletNavigation = taskByTitle.get('Test tablet navigation');
    const inviteConversion = taskByTitle.get('Instrument invite conversion');

    if (
      !launchChecklist ||
      !productScreenshots ||
      !tabletNavigation ||
      !inviteConversion
    ) {
      throw new Error('Failed to create required demo tasks.');
    }

    const createdLabels = await tx
      .insert(labels)
      .values([
        { workspaceId: workspace.id, name: 'Frontend', color: '#7c3aed' },
        { workspaceId: workspace.id, name: 'Backend', color: '#0891b2' },
        { workspaceId: workspace.id, name: 'Design', color: '#db2777' },
        { workspaceId: workspace.id, name: 'Launch', color: '#ea580c' },
        { workspaceId: workspace.id, name: 'Analytics', color: '#16a34a' },
      ])
      .returning();

    const labelByName = new Map(createdLabels.map((label) => [label.name, label]));
    const frontend = labelByName.get('Frontend');
    const design = labelByName.get('Design');
    const launch = labelByName.get('Launch');
    const analytics = labelByName.get('Analytics');

    if (!frontend || !design || !launch || !analytics) {
      throw new Error('Failed to create required demo labels.');
    }

    await tx.insert(taskLabels).values([
      { taskId: launchChecklist.id, labelId: launch.id },
      { taskId: productScreenshots.id, labelId: design.id },
      { taskId: productScreenshots.id, labelId: launch.id },
      { taskId: tabletNavigation.id, labelId: frontend.id },
      { taskId: inviteConversion.id, labelId: analytics.id },
    ]);

    await tx.insert(comments).values([
      {
        workspaceId: workspace.id,
        taskId: launchChecklist.id,
        authorId: owner.id,
        content:
          'The migration and rollback sections are approved. Please verify the live smoke-test steps.',
      },
      {
        workspaceId: workspace.id,
        taskId: launchChecklist.id,
        authorId: member.id,
        content:
          'I added ownership for every launch-day check and linked the monitoring dashboard.',
      },
      {
        workspaceId: workspace.id,
        taskId: productScreenshots.id,
        authorId: member.id,
        content: 'The Kanban and member-management screenshots are ready for review.',
      },
    ]);

    await tx.insert(notifications).values([
      {
        workspaceId: workspace.id,
        userId: owner.id,
        type: 'TASK_ASSIGNED',
        message: 'You were assigned “Finalize launch checklist”.',
        resourceType: 'TASK',
        resourceId: launchChecklist.id,
      },
      {
        workspaceId: workspace.id,
        userId: member.id,
        type: 'COMMENT_ADDED',
        message: 'A new comment was added to “Prepare product screenshots”.',
        resourceType: 'TASK',
        resourceId: productScreenshots.id,
      },
      {
        workspaceId: workspace.id,
        userId: owner.id,
        type: 'TASK_STATUS_CHANGED',
        message: '“Instrument invite conversion” moved to In Progress.',
        resourceType: 'TASK',
        resourceId: inviteConversion.id,
        readAt: new Date(),
      },
    ]);

    await tx.insert(auditLogs).values([
      {
        workspaceId: workspace.id,
        actorId: owner.id,
        action: 'WORKSPACE_CREATED',
        entityType: 'WORKSPACE',
        entityId: workspace.id,
        newValue: { name: workspace.name, slug: workspace.slug },
      },
      ...createdProjects.map((project) => ({
        workspaceId: workspace.id,
        actorId: owner.id,
        action: 'PROJECT_CREATED',
        entityType: 'PROJECT',
        entityId: project.id,
        newValue: { name: project.name },
      })),
      {
        workspaceId: workspace.id,
        actorId: member.id,
        action: 'TASK_STATUS_CHANGED',
        entityType: 'TASK',
        entityId: launchChecklist.id,
        oldValue: { status: 'TODO' },
        newValue: { status: 'IN_PROGRESS' },
      },
    ]);

    return {
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
      projectCount: createdProjects.length,
      taskCount: createdTasks.length,
    };
  });

  console.log('\nDemo data seeded successfully.');
  console.log(`Workspace: ${result.workspaceSlug} (${result.workspaceId})`);
  console.log(`Projects: ${result.projectCount}`);
  console.log(`Tasks: ${result.taskCount}`);
  console.log('\nDemo accounts:');
  for (const email of Object.values(DEMO_EMAILS)) {
    console.log(`- ${email}`);
  }
  console.log('\nAll demo accounts use DEMO_SEED_PASSWORD.');
};

try {
  await seedDemo();
} catch (error) {
  console.error('\nDemo seed failed:', error);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
