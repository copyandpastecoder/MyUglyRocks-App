'use client';

import { useState, useCallback, useMemo } from 'react';

/**
 * Pagination state and handlers
 */
interface PaginationState {
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  totalCount: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  previousPage: () => void;
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Set page size */
  setPageSize: (size: number) => void;
  /** Set total count (usually from API response) */
  setTotalCount: (count: number) => void;
  /** Reset to first page */
  reset: () => void;
}

interface UsePaginationOptions {
  /** Initial page (default: 1) */
  initialPage?: number;
  /** Initial page size (default: 20) */
  initialPageSize?: number;
  /** Initial total count (default: 0) */
  initialTotalCount?: number;
}

/**
 * Hook for managing pagination state.
 * Works well with paginated API responses.
 *
 * @example
 * ```tsx
 * const pagination = usePagination({ initialPageSize: 20 });
 *
 * const { data } = useQuery({
 *   queryKey: ['items', pagination.page, pagination.pageSize],
 *   queryFn: () => api.getItems(pagination.page, pagination.pageSize),
 *   onSuccess: (data) => pagination.setTotalCount(data.totalCount),
 * });
 *
 * // In JSX
 * <Pagination
 *   currentPage={pagination.page}
 *   totalPages={pagination.totalPages}
 *   onPageChange={pagination.goToPage}
 * />
 * ```
 */
export function usePagination({
  initialPage = 1,
  initialPageSize = 20,
  initialTotalCount = 0,
}: UsePaginationOptions = {}): PaginationState {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalCount, setTotalCountState] = useState(initialTotalCount);

  const totalPages = useMemo(
    () => Math.ceil(totalCount / pageSize) || 1,
    [totalCount, pageSize]
  );

  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const nextPage = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setPage((p) => Math.max(p - 1, 1));
  }, []);

  const goToPage = useCallback(
    (newPage: number) => {
      setPage(Math.min(Math.max(newPage, 1), totalPages));
    },
    [totalPages]
  );

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const setTotalCount = useCallback((count: number) => {
    setTotalCountState(count);
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
  }, [initialPage]);

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    goToPage,
    setPageSize,
    setTotalCount,
    reset,
  };
}

/**
 * Search and filter state combined with pagination
 */
interface SearchFilterPaginationState<TFilters extends Record<string, unknown>>
  extends PaginationState {
  /** Current search query */
  search: string;
  /** Current filters */
  filters: TFilters;
  /** Set search query (resets to page 1) */
  setSearch: (search: string) => void;
  /** Set a single filter (resets to page 1) */
  setFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void;
  /** Set multiple filters (resets to page 1) */
  setFilters: (filters: Partial<TFilters>) => void;
  /** Clear all filters and search */
  clearFilters: () => void;
}

interface UseSearchFilterPaginationOptions<TFilters extends Record<string, unknown>> {
  /** Initial page (default: 1) */
  initialPage?: number;
  /** Initial page size (default: 20) */
  initialPageSize?: number;
  /** Initial filters */
  initialFilters: TFilters;
}

/**
 * Hook for managing search, filters, and pagination together.
 * Automatically resets to page 1 when search or filters change.
 *
 * @example
 * ```tsx
 * const { search, setSearch, filters, setFilter, page, ...pagination } =
 *   useSearchFilterPagination({
 *     initialFilters: { role: 'all', status: 'all' },
 *   });
 *
 * const { data } = useQuery({
 *   queryKey: ['users', search, filters, page],
 *   queryFn: () => api.getUsers({ search, ...filters, page }),
 * });
 * ```
 */
export function useSearchFilterPagination<TFilters extends Record<string, unknown>>({
  initialPage = 1,
  initialPageSize = 20,
  initialFilters,
}: UseSearchFilterPaginationOptions<TFilters>): SearchFilterPaginationState<TFilters> {
  const pagination = usePagination({ initialPage, initialPageSize });
  const [search, setSearchState] = useState('');
  const [filters, setFiltersState] = useState<TFilters>(initialFilters);

  // Extract reset to avoid recreating callbacks when pagination object changes
  const { reset } = pagination;

  const setSearch = useCallback((newSearch: string) => {
    setSearchState(newSearch);
    reset();
  }, [reset]);

  const setFilter = useCallback(
    <K extends keyof TFilters>(key: K, value: TFilters[K]) => {
      setFiltersState((prev) => ({ ...prev, [key]: value }));
      reset();
    },
    [reset]
  );

  const setFilters = useCallback(
    (newFilters: Partial<TFilters>) => {
      setFiltersState((prev) => ({ ...prev, ...newFilters }));
      reset();
    },
    [reset]
  );

  const clearFilters = useCallback(() => {
    setSearchState('');
    setFiltersState(initialFilters);
    reset();
  }, [initialFilters, reset]);

  return {
    ...pagination,
    search,
    filters,
    setSearch,
    setFilter,
    setFilters,
    clearFilters,
  };
}
