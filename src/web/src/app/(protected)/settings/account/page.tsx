'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { userApi, authApi, exportApi } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Download, ChevronDown, FileArchive, LogOut } from 'lucide-react';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // Deactivation state
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivateReason, setDeactivateReason] = useState('');
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);

  // Export state
  const [exportPassword, setExportPassword] = useState('');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<string | null>(null);

  // Helper function to download a blob
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Export mutations
  const exportCyclesMutation = useMutation({
    mutationFn: exportApi.exportCycles,
    onSuccess: (blob) => {
      downloadBlob(blob, `cycles-export-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Cycles exported successfully');
      setExportType(null);
    },
    onError: () => {
      toast.error('Failed to export cycles');
      setExportType(null);
    },
  });

  const exportStagesMutation = useMutation({
    mutationFn: exportApi.exportStages,
    onSuccess: (blob) => {
      downloadBlob(blob, `stages-export-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Stages exported successfully');
      setExportType(null);
    },
    onError: () => {
      toast.error('Failed to export stages');
      setExportType(null);
    },
  });

  const exportTumblersMutation = useMutation({
    mutationFn: exportApi.exportTumblers,
    onSuccess: (blob) => {
      downloadBlob(blob, `tumblers-export-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Tumblers exported successfully');
      setExportType(null);
    },
    onError: () => {
      toast.error('Failed to export tumblers');
      setExportType(null);
    },
  });

  const exportPostsMutation = useMutation({
    mutationFn: exportApi.exportPosts,
    onSuccess: (blob) => {
      downloadBlob(blob, `posts-export-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Posts exported successfully');
      setExportType(null);
    },
    onError: () => {
      toast.error('Failed to export posts');
      setExportType(null);
    },
  });

  const exportFullDataMutation = useMutation({
    mutationFn: exportApi.exportFullData,
    onSuccess: (blob) => {
      downloadBlob(blob, `myuglyrocks-data-export-${new Date().toISOString().split('T')[0]}.zip`);
      toast.success('Full data export completed');
      setIsExportDialogOpen(false);
      setExportPassword('');
    },
    onError: () => {
      toast.error('Failed to export data. Please check your password.');
    },
  });

  const handleExportCycles = () => {
    setExportType('cycles');
    exportCyclesMutation.mutate(undefined);
  };

  const handleExportStages = () => {
    setExportType('stages');
    exportStagesMutation.mutate(undefined);
  };

  const handleExportTumblers = () => {
    setExportType('tumblers');
    exportTumblersMutation.mutate();
  };

  const handleExportPosts = () => {
    setExportType('posts');
    exportPostsMutation.mutate();
  };

  const handleFullExport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportPassword) {
      toast.error('Please enter your password');
      return;
    }
    exportFullDataMutation.mutate({ password: exportPassword });
  };

  const isExporting = exportCyclesMutation.isPending ||
    exportStagesMutation.isPending ||
    exportTumblersMutation.isPending ||
    exportPostsMutation.isPending;

  const changePasswordMutation = useMutation({
    mutationFn: userApi.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to change password. Please check your current password.');
    },
  });

  const deactivateAccountMutation = useMutation({
    mutationFn: userApi.deactivateAccount,
    onSuccess: async () => {
      toast.success('Account deactivated');
      await authApi.logout();
      logout();
      router.push('/');
    },
    onError: () => {
      toast.error('Failed to deactivate account. Please check your password.');
    },
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleDeactivateAccount = () => {
    if (!deactivatePassword) {
      toast.error('Please enter your password');
      return;
    }

    deactivateAccountMutation.mutate({
      password: deactivatePassword,
      reason: deactivateReason || undefined,
    });
  };

  const handleSignOut = async () => {
    try {
      await authApi.logout();
      logout();
      router.push('/');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sign Out - visible on mobile where header is hidden */}
      <Card className="md:hidden">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sign Out</Label>
              <p className="text-sm text-muted-foreground">
                Sign out of your account
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your password and security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Password</Label>
              <p className="text-sm text-muted-foreground">
                Change your account password
              </p>
            </div>
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Change Password</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and choose a new one
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsPasswordDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Change Password
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security
              </p>
            </div>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active Sessions</Label>
              <p className="text-sm text-muted-foreground">
                Manage devices logged into your account
              </p>
            </div>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
          <CardDescription>Manage your data and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Individual Data */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Export Data</Label>
              <p className="text-sm text-muted-foreground">
                Download individual datasets as CSV
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCycles}>
                  {exportType === 'cycles' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Export Cycles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportStages}>
                  {exportType === 'stages' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Export Stages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportTumblers}>
                  {exportType === 'tumblers' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Export Tumblers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPosts}>
                  {exportType === 'posts' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Export Posts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator />

          {/* Full Data Export (GDPR) */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Full Data Export</Label>
              <p className="text-sm text-muted-foreground">
                Download all your data in a ZIP archive (GDPR compliant)
              </p>
            </div>
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileArchive className="mr-2 h-4 w-4" />
                  Export All
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export All Data</DialogTitle>
                  <DialogDescription>
                    This will create a ZIP archive containing all your data including
                    profile, settings, cycles, stages, tumblers, posts, comments, and votes.
                    Please enter your password to confirm.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleFullExport} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="exportPassword">Password</Label>
                    <Input
                      id="exportPassword"
                      type="password"
                      value={exportPassword}
                      onChange={(e) => setExportPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsExportDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={exportFullDataMutation.isPending}
                    >
                      {exportFullDataMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Download Archive
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Privacy Policy</Label>
              <p className="text-sm text-muted-foreground">
                Read our privacy policy
              </p>
            </div>
            <Button variant="link" asChild>
              <a href="/privacy" target="_blank">View</a>
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Terms of Service</Label>
              <p className="text-sm text-muted-foreground">
                Read our terms of service
              </p>
            </div>
            <Button variant="link" asChild>
              <a href="/terms" target="_blank">View</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-destructive">Deactivate Account</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Deactivate Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Deactivate Account
                  </DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. All your data including cycles,
                    posts, and comments will be permanently deleted.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="deactivatePassword">
                      Enter your password to confirm
                    </Label>
                    <Input
                      id="deactivatePassword"
                      type="password"
                      value={deactivatePassword}
                      onChange={(e) => setDeactivatePassword(e.target.value)}
                      placeholder="Your password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deactivateReason">
                      Reason for leaving (optional)
                    </Label>
                    <Textarea
                      id="deactivateReason"
                      value={deactivateReason}
                      onChange={(e) => setDeactivateReason(e.target.value)}
                      placeholder="Help us improve by sharing why you're leaving..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeactivateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        Continue to Deactivate
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your account and remove all
                          associated data. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeactivateAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deactivateAccountMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Yes, deactivate my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
