'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Search,
  Eye,
  Clock,
  Calendar,
  CalendarRange,
  AlertCircle,
  Info,
} from 'lucide-react';
import type { ErrorLogListDto, ErrorLogDetailDto, ErrorSeverity } from '@/types/admin';

type TimePreset = '24h' | '7d' | '30d' | 'all';

const timePresets: Record<TimePreset, { label: string; icon: typeof Clock; startDate?: Date; endDate?: Date }> = {
  '24h': {
    label: 'Last 24h',
    icon: Clock,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
  '7d': {
    label: 'Last 7d',
    icon: Calendar,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
  '30d': {
    label: 'Last 30d',
    icon: CalendarRange,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
  all: {
    label: 'All Time',
    icon: CalendarRange,
    startDate: undefined,
    endDate: undefined,
  },
};

const severityFilters: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Severities' },
  { value: 'Info', label: 'Info' },
  { value: 'Warning', label: 'Warning' },
  { value: 'Error', label: 'Error' },
  { value: 'Critical', label: 'Critical' },
];

const severityBadgeVariant: Record<ErrorSeverity, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Critical: 'destructive',
  Error: 'default',
  Warning: 'secondary',
  Info: 'outline',
};

const severityIcon: Record<ErrorSeverity, typeof AlertTriangle> = {
  Critical: AlertTriangle,
  Error: AlertCircle,
  Warning: AlertTriangle,
  Info: Info,
};

export default function ErrorLogsPage() {
  const [timePreset, setTimePreset] = useState<TimePreset>('24h');
  const [severity, setSeverity] = useState('all');
  const [searchPath, setSearchPath] = useState('');
  const [searchCorrelationId, setSearchCorrelationId] = useState('');
  const [page, setPage] = useState(1);
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const preset = timePresets[timePreset];

  const { data: errors, isLoading } = useQuery({
    queryKey: ['admin', 'error-logs', timePreset, severity, searchPath, searchCorrelationId, page],
    queryFn: () => adminApi.getErrorLogs({
      startDate: preset.startDate?.toISOString(),
      endDate: preset.endDate?.toISOString(),
      severity: severity === 'all' ? undefined : (severity as ErrorSeverity),
      searchPath: searchPath || undefined,
      searchCorrelationId: searchCorrelationId || undefined,
      page,
      pageSize: 20,
    }),
  });

  const errorDetailQuery = useQuery({
    queryKey: ['admin', 'error-log', selectedError],
    queryFn: () => adminApi.getErrorLog(selectedError!),
    enabled: !!selectedError && isDetailDialogOpen,
  });

  const handleViewError = (error: ErrorLogListDto) => {
    setSelectedError(error.errorLogId);
    setIsDetailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Error Logs</CardTitle>
          <CardDescription>View and debug API exceptions and errors</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Time Preset Buttons */}
          <div className="mb-6 flex flex-wrap gap-2">
            {(Object.keys(timePresets) as TimePreset[]).map((key) => {
              const { label, icon: Icon } = timePresets[key];
              return (
                <Button
                  key={key}
                  variant={timePreset === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setTimePreset(key);
                    setPage(1);
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </Button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row">
            <Select value={severity} onValueChange={(v) => { setSeverity(v); setPage(1); }}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {severityFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by path..."
                value={searchPath}
                onChange={(e) => {
                  setSearchPath(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by correlation ID..."
                value={searchCorrelationId}
                onChange={(e) => {
                  setSearchCorrelationId(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : errors?.items.length === 0 ? (
            <div className="py-12 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No errors found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or time range.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Correlation ID</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errors?.items.map((error) => {
                      const SeverityIcon = severityIcon[error.severity];
                      return (
                        <TableRow key={error.errorLogId}>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {format(new Date(error.dateCreated), 'MMM d, HH:mm:ss')}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{error.correlationId}</TableCell>
                          <TableCell>
                            <Badge variant={severityBadgeVariant[error.severity]}>
                              <SeverityIcon className="mr-1 h-3 w-3" />
                              {error.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{error.exceptionType}</TableCell>
                          <TableCell className="max-w-xs truncate text-sm">{error.messageExcerpt}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {error.httpMethod} {error.httpPath || '-'}
                          </TableCell>
                          <TableCell>
                            {error.httpStatusCode && (
                              <Badge variant={error.httpStatusCode >= 500 ? 'destructive' : 'secondary'}>
                                {error.httpStatusCode}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{error.username || '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewError(error)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {errors && errors.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {errors.page} of {errors.totalPages} ({errors.totalCount} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(errors.totalPages, p + 1))}
                      disabled={page === errors.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Error Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Details</DialogTitle>
            <DialogDescription>Full error context and stack trace</DialogDescription>
          </DialogHeader>
          {errorDetailQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : errorDetailQuery.data ? (
            <div className="space-y-4">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Correlation ID</p>
                  <p className="font-mono text-xs">{errorDetailQuery.data.correlationId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Timestamp</p>
                  <p className="font-medium">{format(new Date(errorDetailQuery.data.dateCreated), 'PPpp')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Exception Type</p>
                  <p className="font-mono text-xs">{errorDetailQuery.data.exceptionType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Severity</p>
                  <Badge variant={severityBadgeVariant[errorDetailQuery.data.severity]}>
                    {errorDetailQuery.data.severity}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">HTTP Method & Path</p>
                  <p className="font-mono text-xs">
                    {errorDetailQuery.data.httpMethod} {errorDetailQuery.data.httpPath || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">HTTP Status</p>
                  <p className="font-medium">{errorDetailQuery.data.httpStatusCode || '-'}</p>
                </div>
                {errorDetailQuery.data.httpQueryString && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Query String</p>
                    <p className="font-mono text-xs">{errorDetailQuery.data.httpQueryString}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{errorDetailQuery.data.username || 'Anonymous'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">IP Address</p>
                  <p className="font-mono text-xs">{errorDetailQuery.data.ipAddress || '-'}</p>
                </div>
              </div>

              {/* Message */}
              <div className="border-t pt-4">
                <Label className="text-muted-foreground">Message</Label>
                <p className="mt-2 rounded-md bg-muted p-3 text-sm">{errorDetailQuery.data.message}</p>
              </div>

              {/* Inner Exception */}
              {errorDetailQuery.data.innerException && (
                <div>
                  <Label className="text-muted-foreground">Inner Exception</Label>
                  <p className="mt-2 rounded-md bg-muted p-3 font-mono text-xs">{errorDetailQuery.data.innerException}</p>
                </div>
              )}

              {/* Stack Trace */}
              {errorDetailQuery.data.stackTrace && (
                <div>
                  <Label className="text-muted-foreground">Stack Trace</Label>
                  <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs">{errorDetailQuery.data.stackTrace}</pre>
                </div>
              )}

              {/* Request Headers */}
              {errorDetailQuery.data.requestHeaders && (
                <div>
                  <Label className="text-muted-foreground">Request Headers</Label>
                  <div className="mt-2 rounded-md bg-muted p-3">
                    {Object.entries(errorDetailQuery.data.requestHeaders).map(([key, value]) => (
                      <div key={key} className="flex gap-2 text-xs">
                        <span className="font-medium">{key}:</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Agent */}
              {errorDetailQuery.data.userAgent && (
                <div>
                  <Label className="text-muted-foreground">User Agent</Label>
                  <p className="mt-2 rounded-md bg-muted p-3 font-mono text-xs">{errorDetailQuery.data.userAgent}</p>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
