'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Column definition for DataTable
 */
export interface ColumnDef<T> {
  /** Unique key for the column */
  id: string;
  /** Header text or render function */
  header: React.ReactNode | (() => React.ReactNode);
  /** Cell render function */
  cell: (row: T) => React.ReactNode;
  /** Column width class (e.g., 'w-[200px]') */
  className?: string;
  /** Header alignment */
  headerAlign?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Data to display */
  data: T[];
  /** Function to get unique key for each row */
  getRowKey: (row: T) => string;
  /** Loading state */
  isLoading?: boolean;
  /** Number of skeleton rows to show when loading */
  skeletonRows?: number;
  /** Empty state content */
  emptyState?: React.ReactNode;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Additional class for table container */
  className?: string;
}

/**
 * Reusable data table component with loading states and empty states.
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<User>[] = [
 *   { id: 'name', header: 'Name', cell: (row) => row.name },
 *   { id: 'email', header: 'Email', cell: (row) => row.email },
 *   {
 *     id: 'actions',
 *     header: () => <span className="sr-only">Actions</span>,
 *     cell: (row) => <ActionMenu user={row} />,
 *     headerAlign: 'right',
 *   },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   getRowKey={(row) => row.id}
 *   isLoading={isLoading}
 *   emptyState={<EmptyUsers />}
 * />
 * ```
 */
export function DataTable<T>({
  columns,
  data,
  getRowKey,
  isLoading = false,
  skeletonRows = 5,
  emptyState,
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[...Array(skeletonRows)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column.id}
              className={cn(
                column.className,
                column.headerAlign === 'right' && 'text-right',
                column.headerAlign === 'center' && 'text-center'
              )}
            >
              {typeof column.header === 'function' ? column.header() : column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow
            key={getRowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={onRowClick ? 'cursor-pointer' : undefined}
          >
            {columns.map((column) => (
              <TableCell key={column.id} className={column.className}>
                {column.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * Pagination controls for DataTable
 */
interface PaginationControlsProps {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total pages */
  totalPages: number;
  /** Total item count */
  totalCount?: number;
  /** Handler for page change */
  onPageChange: (page: number) => void;
  /** Show page info text */
  showPageInfo?: boolean;
  /** Additional class */
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  showPageInfo = true,
  className,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn('mt-4 flex items-center justify-between', className)}>
      {showPageInfo && (
        <p className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
          {totalCount !== undefined && ` (${totalCount} total)`}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

/**
 * Search input for DataTable
 */
interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Handler for search change */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional class */
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
