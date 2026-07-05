import { z } from 'zod';

export const createUserSchema = z.object({
    body: z.object({
        email: z.string({
            error: (issue) => issue.input === undefined
                ? 'Email is required'
                : 'Email must be a string'
        }),

        // We require a password from the client
        password: z.string().min(6, { 
            error: 'Password must be atleast 6 characters'
        }),

        //aligns with the 'full name' colum
        fullName: z.string().min(2, {
            error: 'Full name must be at least 2 characters'
        })
    }),
});


export type CreateUserInput = z.infer<typeof createUserSchema>['body'];