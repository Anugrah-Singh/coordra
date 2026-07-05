import { Router } from 'express';
import { loginHandler } from '../controllers/auth.controller.js';

const router = Router();

// We map this to a POST request because we are sending sensitive credentials in the body
router.post('/login', loginHandler);

export default router;