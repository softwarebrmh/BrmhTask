export interface PaginationParams {
  page: number;
  limit: number;
}

export function getPaginationOffset(params: PaginationParams) {
  return {
    skip: (params.page - 1) * params.limit,
    take: params.limit,
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams,
) {
  return {
    success: true,
    data,
    meta: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}
