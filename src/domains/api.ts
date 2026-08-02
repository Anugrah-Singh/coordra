import { Router } from 'express';

import auth from './auth/route.js';
import { inviteTokenRouter as invites } from './invites/route.js';
import { notificationRouter as notifications } from './activity/route.js';
import workspaces from './workspaces/route.js';

/** Top-level API map. Nested workspace routers compose the tenant domains. */
export const apiRouter = Router();

apiRouter.use('/auth', auth);
apiRouter.use('/notifications', notifications);
apiRouter.use('/workspace-invites', invites);
apiRouter.use('/workspaces', workspaces);
