import { Request, Response, NextFunction } from 'express';

import { getWorkspaceAuditLogsFromDb } from '../services/auditLog.service.js';

import { GetWorkspaceAuditLogsParams } from '../schemas/auditLog.schema.js';

export const getWorkspaceAuditLogsHandler = async (
  req: Request<GetWorkspaceAuditLogsParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId } = req.params;

    const auditLogs = await getWorkspaceAuditLogsFromDb(workspaceId);

    res.status(200).json({
      success: true,
      message: 'Workspace audit logs retrieved successfully',
      data: auditLogs,
    });
  } catch (error) {
    next(error);
  }
};