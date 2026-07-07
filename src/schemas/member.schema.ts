import { z } from 'zod';

export const addMemberSchema = z.object({
    body: z.object({
        email: z.email({
            error: 'Invalid email address formar'
        }),
        role: z.enum(['ADMIN', 'MEMBER'], {
            error: 'Role must be ADMIN or MEMBER'
        })
    })
});