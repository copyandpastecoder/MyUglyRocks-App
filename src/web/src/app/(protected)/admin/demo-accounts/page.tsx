'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Loader2,
  UserPlus,
  MoreHorizontal,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Database,
} from 'lucide-react';
import type { DemoAccountListDto, DemoAccountCreatedResponse } from '@/types/admin';

export default function DemoAccountsPage() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<DemoAccountListDto | null>(null);
  const [createdAccount, setCreatedAccount] = useState<DemoAccountCreatedResponse | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');

  // Fetch demo accounts
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['admin', 'demo-accounts'],
    queryFn: () => adminApi.getDemoAccounts(),
  });

  // Create demo account mutation
  const createMutation = useMutation({
    mutationFn: (email: string) => adminApi.createDemoAccount({ email }),
    onSuccess: (data) => {
      setCreatedAccount(data);
      setPasswordDialogOpen(true);
      setCreateDialogOpen(false);
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'demo-accounts'] });
      toast.success('Demo account created successfully');
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Failed to create demo account');
    },
  });

  // Delete demo account mutation
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteDemoAccount(userId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'demo-accounts'] });
      toast.success(
        `Demo account deleted: ${result.photosDeleted} photos, ${result.recordsDeleted} records removed`
      );
      setDeleteDialogOpen(false);
      setSelectedAccount(null);
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Failed to delete demo account');
    },
  });

  // Trigger photo copy mutation
  const photoCopyMutation = useMutation({
    mutationFn: (userId: string) => adminApi.triggerPhotoCopy(userId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          `Photos copied: ${result.photosCopied} inventory, ${result.cyclePhotosCopied} cycle photos`
        );
        queryClient.invalidateQueries({ queryKey: ['admin', 'demo-accounts'] });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Failed to copy photos');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    createMutation.mutate(email);
  };

  const handleDelete = () => {
    if (selectedAccount) {
      deleteMutation.mutate(selectedAccount.userId);
    }
  };

  const handleCopyPhotos = (account: DemoAccountListDto) => {
    photoCopyMutation.mutate(account.userId);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Demo Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage demo accounts with sample data
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Create Demo Account
        </Button>
      </div>

      {/* Demo Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Accounts</CardTitle>
          <CardDescription>
            Demo accounts can be deleted completely including all data and photos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !accounts || accounts.length === 0 ? (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No demo accounts</h3>
              <p className="text-muted-foreground mt-2">
                Create your first demo account to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Inventory</TableHead>
                  <TableHead className="text-right">Cycles</TableHead>
                  <TableHead className="text-right">Photos</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.userId}>
                    <TableCell className="font-medium">{account.email}</TableCell>
                    <TableCell>{account.username}</TableCell>
                    <TableCell>{format(new Date(account.dateCreated), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {account.dateLastLogin
                        ? format(new Date(account.dateLastLogin), 'MMM d, yyyy')
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">{account.inventoryCount}</TableCell>
                    <TableCell className="text-right">{account.cycleCount}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={account.photoCount > 0 ? 'default' : 'secondary'}>
                        {account.photoCount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleCopyPhotos(account)}
                            disabled={photoCopyMutation.isPending}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Copy Photos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAccount(account);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Demo Account Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Demo Account</DialogTitle>
            <DialogDescription>
              Create a new demo account with sample data. Photos will be copied in the background.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="demo@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={createMutation.isPending}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The demo account will be created with this email
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Display Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demo Account Created</DialogTitle>
            <DialogDescription>
              Save these credentials now - the password will not be shown again
            </DialogDescription>
          </DialogHeader>
          {createdAccount && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex gap-2">
                  <Input value={createdAccount.email} readOnly />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(createdAccount.email, 'Email')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <div className="flex gap-2">
                  <Input value={createdAccount.username} readOnly />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(createdAccount.username, 'Username')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Password (One-time view)</Label>
                <div className="flex gap-2">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={createdAccount.password}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(createdAccount.password, 'Password')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  ⚠️ Make sure to save this password - it cannot be recovered
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">{createdAccount.message}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => {
              setPasswordDialogOpen(false);
              setCreatedAccount(null);
              setShowPassword(false);
            }}>
              I&apos;ve Saved the Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Demo Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the demo account, all associated data, and R2 photos.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedAccount && (
            <div className="rounded-lg bg-muted p-4 my-4">
              <div className="space-y-1 text-sm">
                <p><strong>Email:</strong> {selectedAccount.email}</p>
                <p><strong>Username:</strong> {selectedAccount.username}</p>
                <p><strong>Data to delete:</strong></p>
                <ul className="list-disc list-inside ml-4 text-muted-foreground">
                  <li>{selectedAccount.inventoryCount} inventory items</li>
                  <li>{selectedAccount.cycleCount} cycles</li>
                  <li>{selectedAccount.photoCount} photos</li>
                </ul>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
