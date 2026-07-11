export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const getPagination = (query: {
  page?: string | undefined;
  limit?: string | undefined;
}) => {
  const pageNumber = Number(query.page ?? DEFAULT_PAGE);
  const limitNumber = Number(query.limit ?? DEFAULT_LIMIT);

  const page =
    Number.isFinite(pageNumber) && pageNumber > 0
      ? Math.floor(pageNumber)
      : DEFAULT_PAGE;

  const limit =
    Number.isFinite(limitNumber) && limitNumber > 0
      ? Math.min(Math.floor(limitNumber), MAX_LIMIT)
      : DEFAULT_LIMIT;

  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
};