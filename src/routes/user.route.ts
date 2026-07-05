import { Router } from 'express';
import { createUserHandler } from '../controllers/user.controller.js'
import { validate } from '../middlewares/validate.middleware.js';
import { createUserSchema } from '../schemas/user.schema.js';

const router = Router();

router.post('/', validate(createUserSchema), createUserHandler);

export default router;