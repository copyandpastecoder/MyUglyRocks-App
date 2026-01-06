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
import { Textarea } from '@/components/ui/textarea';
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
  Search,
  MoreHorizontal,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  CheckCircle,
  Users,
  UserPlus,
} from 'lucide-react';
import type { AdminUserListDto, AdminUserDto } from '@/types/admin';

const roleFilters = [
  { value: 'all', label: 'All Roles' },
  { value: 'User', label: 'User' },
  { value: 'Moderator', label: 'Moderator' },
  { value: 'Admin', label: 'Admin' },
];

const statusFilters = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
];

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  User: 'secondary',
  Moderator: 'default',
  Admin: 'destructive',
};

const roleIcon: Record<string, typeof Shield> = {
  User: Shield,
  Moderator: ShieldCheck,
  Admin: ShieldAlert,
};

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUserDto | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('User');
  const [banReason, setBanReason] = useState('');
  const [deleteContent, setDeleteContent] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users', search, roleFilter, statusFilter, page],
    queryFn: () => adminApi.getUsers(
      search || undefined,
      roleFilter === 'all' ? undefined : roleFilter,
      statusFilter === 'all' ? undefined : statusFilter === 'active',
      page,
      20
    ),
  });

  const userDetailQuery = useQuery({
    queryKey: ['admin', 'user', selectedUser?.userId],
    queryFn: () => adminApi.getUser(selectedUser!.userId),
    enabled: !!selectedUser?.userId && isDetailDialogOpen,
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminApi.changeUserRole(userId, { role }),
    onSuccess: () => {
      toast.success('User role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', selectedUser?.userId] });
      setIsRoleDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user role');
    },
  });

  const banUserMutation = useMutation({
    mutationFn: ({ userId, reason, deleteContent }: {
      userId: string;
      reason?: string;
      deleteContent?: boolean;
    }) => adminApi.banUser(userId, { reason, deleteContent }),
    onSuccess: () => {
      toast.success('User has been banned');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', selectedUser?.userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setIsBanDialogOpen(false);
      setBanReason('');
      setDeleteContent(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to ban user');
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: (userId: string) => adminApi.unbanUser(userId),
    onSuccess: () => {
      toast.success('User has been unbanned');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', selectedUser?.userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: () => {
      toast.error('Failed to unban user');
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (email: string) => adminApi.createUser(email),
    onSuccess: (user) => {
      toast.success(`User ${user.email} created. They can use "Forgot Password" to set their password.`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setIsCreateUserDialogOpen(false);
      setNewUserEmail('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user');
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;
    createUserMutation.mutate(newUserEmail.trim());
  };

  const handleViewUser = (user: AdminUserListDto) => {
    setSelectedUser(user as unknown as AdminUserDto);
    setIsDetailDialogOpen(true);
  };

  const handleOpenRoleDialog = (user: AdminUserListDto) => {
    setSelectedUser(user as unknown as AdminUserDto);
    setNewRole(user.role);
    setIsRoleDialogOpen(true);
  };

  const handleOpenBanDialog = (user: AdminUserListDto) => {
    setSelectedUser(user as unknown as AdminUserDto);
    setIsBanDialogOpen(true);
  };

  const handleChangeRole = () => {
    if (!selectedUser) return;
    changeRoleMutation.mutate({ userId: selectedUser?.userId, role: newRole });
  };

  const handleBanUser = () => {
    if (!selectedUser) return;
    banUserMutation.mutate({
      userId: selectedUser?.userId,
      reason: banReason || undefined,
      deleteContent,
    });
  };

  const handleUnbanUser = (userId: string) => {
    unbanUserMutation.mutate(userId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View and manage all users on the platform</CardDescription>
          </div>
          <Button onClick={() => setIsCreateUserDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by username, email, or name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
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

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users?.items.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No users found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.items.map((user) => {
                    const RoleIcon = roleIcon[user.role] || Shield;
                    return (
                      <TableRow key={user.userId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.username}</p>

                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={roleBadgeVariant[user.role] || 'default'}>
                            <RoleIcon className="mr-1 h-3 w-3" />
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <Ban className="mr-1 h-3 w-3" />
                              Banned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(user.dateCreated), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.dateLastLogin
                            ? format(new Date(user.dateLastLogin), 'MMM d, yyyy')
                            : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenRoleDialog(user)}>
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.isActive ? (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleOpenBanDialog(user)}
                                >
                                  Ban User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUnbanUser(user.userId)}>
                                  Unban User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {users && users.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {users.page} of {users.totalPages} ({users.totalCount} total)
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
                      onClick={() => setPage((p) => Math.min(users.totalPages, p + 1))}
                      disabled={page === users.totalPages}
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

      {/* User Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {userDetailQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
            </div>
          ) : userDetailQuery.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Username</p>
                  <p className="font-medium">{userDetailQuery.data.username}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Display Name</p>
                  <p className="font-medium">{userDetailQuery.data.displayName || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{userDetailQuery.data.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email Verified</p>
                  <p className="font-medium">{userDetailQuery.data.emailVerified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Role</p>
                  <Badge variant={roleBadgeVariant[userDetailQuery.data.role] || 'default'}>
                    {userDetailQuery.data.role}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {userDetailQuery.data.isActive ? (
                    <Badge variant="outline" className="text-green-600">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Banned</Badge>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Joined</p>
                  <p className="font-medium">
                    {format(new Date(userDetailQuery.data.dateCreated), 'PPP')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Login</p>
                  <p className="font-medium">
                    {userDetailQuery.data.dateLastLogin
                      ? format(new Date(userDetailQuery.data.dateLastLogin), 'PPP')
                      : 'Never'}
                  </p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Activity</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{userDetailQuery.data.totalCycles}</p>
                    <p className="text-xs text-muted-foreground">Cycles</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userDetailQuery.data.totalPosts}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userDetailQuery.data.totalComments}</p>
                    <p className="text-xs text-muted-foreground">Comments</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Moderator">Moderator</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={changeRoleMutation.isPending}>
              {changeRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <AlertDialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban {selectedUser?.username}? They will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter a reason for the ban..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="deleteContent"
                checked={deleteContent}
                onCheckedChange={(checked) => setDeleteContent(checked as boolean)}
              />
              <Label htmlFor="deleteContent" className="text-sm text-destructive">
                Also delete all their posts and comments
              </Label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setBanReason('');
              setDeleteContent(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {banUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. The user will need to use &quot;Forgot Password&quot; to set their password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newUserEmail">Email Address</Label>
                <Input
                  id="newUserEmail"
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateUserDialogOpen(false);
                  setNewUserEmail('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
