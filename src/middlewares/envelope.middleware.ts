import { NextFunction, Request, Response } from 'express';

type LegacyPayload = {
  success?: boolean;
  code?: string;
  message?: string;
  data?: unknown;
  errors?: Array<{ field: string; message: string }>;
};

/** Enforces the sole public API envelope at the HTTP boundary. */
export const enforceApiEnvelope = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  const sendJson = res.json.bind(res);

  res.json = ((body: LegacyPayload) => {
    if (body && typeof body === 'object' && 'data' in body) {
      return sendJson({ data: body.data });
    }
    if (body?.success === true) return sendJson({ data: null });
    if (body?.success === false || body?.code) {
      return sendJson({
        error: {
          code: body.code ?? 'INTERNAL_ERROR',
          message: body.message ?? 'Request failed',
          fields: Object.fromEntries(
            (body.errors ?? []).map(({ field, message }) => [field, message])
          ),
        },
      });
    }
    return sendJson(body);
  }) as Response['json'];

  next();
};
