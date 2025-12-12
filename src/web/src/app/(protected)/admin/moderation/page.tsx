'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';
import type { CommentReportListDto, CommentReportDto } from '@/types/admin';

const statusFilters = [
  { value: 'all', label: 'All Reports' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Reviewed', label: 'Reviewed' },
  { value: 'Dismissed', label: 'Dismissed' },
  { value: 'ActionTaken', label: 'Action Taken' },
];

const reasonBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Spam: 'secondary',
  Harassment: 'destructive',
  Inappropriate: 'destructive',
  Other: 'outline',
};

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Pending: 'destructive',
  Reviewed: 'default',
  Dismissed: 'secondary',
  ActionTaken: 'default',
};

export default function ModerationQueuePage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<CommentReportDto | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [resolutionStatus, setResolutionStatus] = useState('Reviewed');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [deleteComment, setDeleteComment] = useState(false);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin', 'reports', statusFilter, page],
    queryFn: () => adminApi.getReports(statusFilter === 'all' ? undefined : statusFilter, page, 20),
  });

  const reportDetailQuery = useQuery({
    queryKey: ['admin', 'report', selectedReport?.commentReportId],
    queryFn: () => adminApi.getReport(selectedReport!.commentReportId),
    enabled: !!selectedReport?.commentReportId && isDetailDialogOpen,
  });

  const resolveReportMutation = useMutation({
    mutationFn: ({ reportId, status, notes, deleteComment }: {
      reportId: string;
      status: string;
      notes?: string;
      deleteComment?: boolean;
    }) => adminApi.resolveReport(reportId, { status, resolutionNotes: notes, deleteComment }),
    onSuccess: () => {
      toast.success('Report resolved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setIsDetailDialogOpen(false);
      resetResolveForm();
    },
    onError: () => {
      toast.error('Failed to resolve report');
    },
  });

  const resetResolveForm = () => {
    setResolutionStatus('Reviewed');
    setResolutionNotes('');
    setDeleteComment(false);
    setSelectedReport(null);
  };

  const handleViewReport = (report: CommentReportListDto) => {
    setSelectedReport(report as unknown as CommentReportDto);
    setIsDetailDialogOpen(true);
  };

  const handleResolve = () => {
    if (!selectedReport) return;
    resolveReportMutation.mutate({
      reportId: selectedReport.commentReportId,
      status: resolutionStatus,
      notes: resolutionNotes || undefined,
      deleteComment,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Moderation Queue</CardTitle>
              <CardDescription>Review and resolve reported comments</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : reports?.items.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No reports to review</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'Pending'
                  ? 'All caught up! No pending reports.'
                  : 'No reports match this filter.'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comment</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports?.items.map((report) => (
                    <TableRow key={report.commentReportId}>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {report.commentExcerpt}
                      </TableCell>
                      <TableCell>{report.commentAuthorUsername}</TableCell>
                      <TableCell>{report.reportedByUsername}</TableCell>
                      <TableCell>
                        <Badge variant={reasonBadgeVariant[report.reason] || 'default'}>
                          {report.reason}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[report.status] || 'default'}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(report.dateCreated), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReport(report)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {reports && reports.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {reports.page} of {reports.totalPages} ({reports.totalCount} total)
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
                      onClick={() => setPage((p) => Math.min(reports.totalPages, p + 1))}
                      disabled={page === reports.totalPages}
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

      {/* Report Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => {
        setIsDetailDialogOpen(open);
        if (!open) resetResolveForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
            <DialogDescription>
              Review the reported content and take action
            </DialogDescription>
          </DialogHeader>

          {reportDetailQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : reportDetailQuery.data ? (
            <div className="space-y-6">
              {/* Report Info */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={reasonBadgeVariant[reportDetailQuery.data.reason] || 'default'}>
                    {reportDetailQuery.data.reason}
                  </Badge>
                  <Badge variant={statusBadgeVariant[reportDetailQuery.data.status] || 'default'}>
                    {reportDetailQuery.data.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Reported by <strong>{reportDetailQuery.data.reportedByUsername}</strong>{' '}
                  {formatDistanceToNow(new Date(reportDetailQuery.data.dateCreated), { addSuffix: true })}
                </p>
                {reportDetailQuery.data.details && (
                  <p className="text-sm">
                    <strong>Details:</strong> {reportDetailQuery.data.details}
                  </p>
                )}
              </div>

              {/* Comment Content */}
              <div className="space-y-2">
                <Label>Reported Comment</Label>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm font-medium">@{reportDetailQuery.data.commentAuthorUsername}</p>
                  <p className="mt-1 whitespace-pre-wrap">{reportDetailQuery.data.commentContent}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    On post: {reportDetailQuery.data.postTitle}
                  </p>
                </div>
              </div>

              {/* Resolution Form */}
              {reportDetailQuery.data.status === 'Pending' && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <Select value={resolutionStatus} onValueChange={setResolutionStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Reviewed">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                            Reviewed (No Action)
                          </span>
                        </SelectItem>
                        <SelectItem value="Dismissed">
                          <span className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                            Dismissed (Invalid Report)
                          </span>
                        </SelectItem>
                        <SelectItem value="ActionTaken">
                          <span className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            Action Taken
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Add notes about your decision..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="deleteComment"
                      checked={deleteComment}
                      onCheckedChange={(checked) => setDeleteComment(checked as boolean)}
                    />
                    <Label htmlFor="deleteComment" className="text-sm text-destructive">
                      Delete this comment
                    </Label>
                  </div>
                </div>
              )}

              {/* Previous Resolution */}
              {reportDetailQuery.data.status !== 'Pending' && (
                <div className="space-y-2 border-t pt-4">
                  <Label>Resolution</Label>
                  <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                    <p>
                      Resolved by <strong>{reportDetailQuery.data.resolvedByUsername}</strong>{' '}
                      {reportDetailQuery.data.resolvedDate &&
                        formatDistanceToNow(new Date(reportDetailQuery.data.resolvedDate), { addSuffix: true })}
                    </p>
                    {reportDetailQuery.data.resolutionNotes && (
                      <p className="mt-2 text-muted-foreground">
                        {reportDetailQuery.data.resolutionNotes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
            {reportDetailQuery.data?.status === 'Pending' && (
              <Button onClick={handleResolve} disabled={resolveReportMutation.isPending}>
                {resolveReportMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Resolve Report
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
