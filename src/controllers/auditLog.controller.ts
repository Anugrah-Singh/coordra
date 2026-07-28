import { Request, Response, NextFunction } from 'express';

import { getWorkspaceAuditLogs } from '../services/auditLog.service.js';

import {
  GetWorkspaceAuditLogsParams,
  GetWorkspaceAuditLogsQuery,
} from '../schemas/auditLog.schema.js';

export const getWorkspaceAuditLogsHandler = async (
  req: Request<GetWorkspaceAuditLogsParams, {}, {}, GetWorkspaceAuditLogsQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId } = req.params;

    const logs = await getWorkspaceAuditLogs({
      workspaceId,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.status(200).json({
      success: true,
      message: 'Workspace audit logs retrieved successfully',
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
