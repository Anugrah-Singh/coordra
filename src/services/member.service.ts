import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema/users.js';
import { workspaceMembers } from '../db/schema/workspaces.js';

export const getWorkspaceMembersFromDb = async (workspaceId: string) => {
    return await db
        .select({
            id: users.id,
            fullName: users.fullName,
            email: users.email,
            role: workspaceMembers.role,
        })
        .from(workspaceMembers)
        .innerJoin(users, eq(workspaceMembers.userId, users.id))
        .where(eq(workspaceMembers.workspaceId, workspaceId));
};