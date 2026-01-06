'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Copy, Ban, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminApi } from '@/lib/api';
import type {
  InvitationCodeDto,
  PaginatedInvitationCodesResponse,
  InvitationStatsDto,
  CreateInvitationCodeRequest,
  RevokeInvitationCodeRequest,
} from '@/types/auth';

export default function AdminInvitationsPage() {
  const [codes, setCodes] = useState<InvitationCodeDto[]>([]);
  const [stats, setStats] = useState<InvitationStatsDto | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Generate codes modal state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateQuantity, setGenerateQuantity] = useState(1);
  const [generateDescription, setGenerateDescription] = useState('');
  const [generateExpiresAt, setGenerateExpiresAt] = useState('');
  const [generatedCodes, setGeneratedCodes] = useState<InvitationCodeDto[]>([]);

  // Revoke modal state
  const [revokeModalCode, setRevokeModalCode] = useState<InvitationCodeDto | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  const pageSize = 20;

  useEffect(() => {
    fetchStats();
    fetchCodes();
  }, [page, statusFilter, searchQuery]);

  const fetchStats = async () => {
    try {
      const data = await adminApi.getInvitationCodeStats();
      setStats(data || null);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats(null);
    }
  };

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getInvitationCodes(
        statusFilter !== 'all' ? statusFilter : undefined,
        page,
        pageSize
      );
      setCodes(data?.items || []);
      setTotal(data?.totalCount || 0);
    } catch (error) {
      console.error('Failed to fetch codes:', error);
      toast.error('Failed to load invitation codes');
      setCodes([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCodes = async () => {
    setIsGenerating(true);
    try {
      // If date is selected, append end of day time (23:59:59)
      const expiresAtISO = generateExpiresAt 
        ? new Date(generateExpiresAt + 'T23:59:59').toISOString() 
        : undefined;
      console.log('Expiration date input:', generateExpiresAt);
      console.log('Expiration date ISO:', expiresAtISO);
      
      const request: CreateInvitationCodeRequest = {
        quantity: generateQuantity,
        description: generateDescription || undefined,
        expiresAt: expiresAtISO,
      };
      
      console.log('Request being sent:', request);

      const newCodes = await adminApi.generateInvitationCodes(request);
      setGeneratedCodes(newCodes);
      toast.success(`Generated ${newCodes.length} invitation code(s)`);
      fetchStats();
      fetchCodes();
    } catch (error) {
      console.error('Error generating codes:', error);
      toast.error('Error trying to generate new invite code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeCode = async () => {
    if (!revokeModalCode) return;

    setIsRevoking(true);
    try {
      const request: RevokeInvitationCodeRequest = {
        reason: revokeReason,
      };

      await adminApi.revokeInvitationCode(revokeModalCode.invitationCodeId, request);
      toast.success('Code revoked successfully');
      setRevokeModalCode(null);
      setRevokeReason('');
      fetchStats();
      fetchCodes();
    } catch (error) {
      console.error('Error revoking code:', error);
      toast.error('Failed to revoke code');
    } finally {
      setIsRevoking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const copyAllGeneratedCodes = () => {
    const allCodes = generatedCodes.map((c) => c.code).join('\n');
    navigator.clipboard.writeText(allCodes);
    toast.success(`Copied ${generatedCodes.length} codes to clipboard`);
  };

  const resetGenerateModal = () => {
    setGenerateQuantity(1);
    setGenerateDescription('');
    setGenerateExpiresAt('');
    setGeneratedCodes([]);
    setIsGenerateModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Unused':
        return <Badge variant="outline">Unused</Badge>;
      case 'Used':
        return <Badge variant="default">Used</Badge>;
      case 'Expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'Revoked':
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invitation Codes</h1>
          <p className="text-muted-foreground">
            Manage invitation codes for user registration
          </p>
        </div>
        <Button onClick={() => setIsGenerateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Codes
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{stats.totalCodesGenerated}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Available</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {stats.codesAvailable}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Used</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{stats.codesUsed}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Expired</CardDescription>
              <CardTitle className="text-3xl text-gray-600">{stats.codesExpired}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Revoked</CardDescription>
              <CardTitle className="text-3xl text-red-600">{stats.codesRevoked}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Code</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ROCK-XXXX-YYYY"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unused">Unused</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invitation Codes</CardTitle>
          <CardDescription>
            Showing {codes.length} of {total} codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Used By</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : codes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No codes found
                  </TableCell>
                </TableRow>
              ) : (
                codes.map((code) => (
                  <TableRow key={code.invitationCodeId}>
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        {code.code}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(code.status)}</TableCell>
                    <TableCell>
                      {new Date(code.dateCreated).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {code.dateExpires
                        ? new Date(code.dateExpires).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>{code.usedByUsername || '—'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {code.description || '—'}
                    </TableCell>
                    <TableCell>
                      {code.status === 'Unused' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRevokeModalCode(code);
                            setRevokeReason('');
                          }}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {total > pageSize && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(total / pageSize)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(total / pageSize)}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Codes Modal */}
      <Dialog open={isGenerateModalOpen} onOpenChange={(open) => { if (!open) resetGenerateModal(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invitation Codes</DialogTitle>
            <DialogDescription>
              Create new invitation codes for user registration
            </DialogDescription>
          </DialogHeader>

          {generatedCodes.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm font-medium">
                Successfully generated {generatedCodes.length} code(s):
              </p>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded border p-4">
                {generatedCodes.map((code) => (
                  <div
                    key={code.invitationCodeId}
                    className="flex items-center justify-between font-mono text-sm"
                  >
                    {code.code}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(code.code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button onClick={copyAllGeneratedCodes} className="w-full">
                Copy All Codes
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="1000"
                  value={generateQuantity}
                  onChange={(e) => setGenerateQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., For January 2026 event"
                  value={generateDescription}
                  onChange={(e) => setGenerateDescription(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">Code will expire at 11:59 PM on selected date</p>
                <input
                  id="expiresAt"
                  type="date"
                  value={generateExpiresAt}
                  onChange={(e) => setGenerateExpiresAt(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {generatedCodes.length === 0 ? (
              <>
                <Button variant="outline" onClick={resetGenerateModal}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateCodes} disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              </>
            ) : (
              <Button onClick={resetGenerateModal}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Code Modal */}
      <Dialog
        open={!!revokeModalCode}
        onOpenChange={() => {
          setRevokeModalCode(null);
          setRevokeReason('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Invitation Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke code{' '}
              <span className="font-mono font-semibold">{revokeModalCode?.code}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this code is being revoked"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRevokeModalCode(null);
                setRevokeReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeCode}
              disabled={isRevoking || !revokeReason.trim()}
            >
              {isRevoking ? 'Revoking...' : 'Revoke Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
