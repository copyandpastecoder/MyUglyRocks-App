'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Download,
  CheckCircle2,
  Clock,
  HardDrive,
  Shield,
  AlertCircle,
  RefreshCw,
  TestTube,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { adminApi } from '@/lib/api';
import type { BackupInfo } from '@/types/admin';

export default function AdminBackupsPage() {
  const queryClient = useQueryClient();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isTestingBucket, setIsTestingBucket] = useState(false);

  // Fetch latest backup
  const { data: latestBackup, isLoading: isLoadingLatest } = useQuery({
    queryKey: ['admin', 'backups', 'latest'],
    queryFn: () => adminApi.getLatestBackup(),
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch backup list
  const { data: backups, isLoading: isLoadingBackups } = useQuery({
    queryKey: ['admin', 'backups'],
    queryFn: () => adminApi.getBackups(20),
    refetchInterval: 60000,
  });

  // Create manual backup mutation
  const createBackupMutation = useMutation({
    mutationFn: () => adminApi.createBackup(),
    onMutate: () => {
      setIsCreatingBackup(true);
      toast.info('Creating backup...');
    },
    onSuccess: (data) => {
      setIsCreatingBackup(false);
      if (data.success) {
        toast.success(`Backup created successfully! Size: ${formatBytes(data.sizeBytes || 0)}`);
        queryClient.invalidateQueries({ queryKey: ['admin', 'backups'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'backups', 'latest'] });
      } else {
        toast.error(`Backup failed: ${data.errorMessage}`);
      }
    },
    onError: (error: Error) => {
      setIsCreatingBackup(false);
      toast.error(error.message || 'Failed to create backup');
    },
  });

  // Test bucket connection mutation
  const testBucketMutation = useMutation({
    mutationFn: () => adminApi.testBackupBucket(),
    onMutate: () => {
      setIsTestingBucket(true);
      toast.info('Testing backup bucket connection...');
    },
    onSuccess: (data) => {
      setIsTestingBucket(false);
      if (data.success) {
        toast.success(`Test file uploaded! Key: ${data.key}, Size: ${formatBytes(data.size)}`);
      } else {
        toast.error(`Test failed: ${data.message}`);
      }
    },
    onError: (error: Error) => {
      setIsTestingBucket(false);
      toast.error(error.message || 'Failed to test backup bucket');
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getBackupTypeBadge = (backupType: string) => {
    const types: Record<string, { variant: 'default' | 'secondary' | 'outline', label: string }> = {
      'Scheduled': { variant: 'default', label: 'Scheduled' },
      'Manual': { variant: 'secondary', label: 'Manual' },
      'PreRestore': { variant: 'outline', label: 'Pre-Restore' },
    };
    const type = types[backupType] || { variant: 'default', label: backupType };
    return <Badge variant={type.variant}>{type.label}</Badge>;
  };

  const getBackupFolder = (key: string) => {
    const folder = key.split('/')[0];
    const folderLabels: Record<string, string> = {
      'daily': 'Daily',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'manual': 'Manual',
      'pre-restore': 'Pre-Restore',
    };
    return folderLabels[folder] || folder;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Database Backups</h2>
        <p className="text-muted-foreground">
          Manage automated and manual database backups
        </p>
      </div>

      {/* Latest Backup Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Latest Backup
          </CardTitle>
          <CardDescription>Most recent database backup status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLatest ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : latestBackup ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-xs text-muted-foreground">Backup available</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(latestBackup.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Size</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(latestBackup.size || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Type</p>
                    <p className="text-xs text-muted-foreground">
                      {getBackupFolder(latestBackup.r2Key)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Database className="h-3 w-3" />
                <code className="rounded bg-muted px-1 py-0.5">{latestBackup.fileName}</code>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">No backups found. Create your first backup below.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Backup</CardTitle>
          <CardDescription>
            Create an on-demand backup of the database. Backups run daily at 4 AM UTC automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => createBackupMutation.mutate()}
              disabled={isCreatingBackup}
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Create Backup Now
                </>
              )}
            </Button>
            <Button
              onClick={() => testBucketMutation.mutate()}
              disabled={isTestingBucket}
              variant="outline"
            >
              {isTestingBucket ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Backup Bucket
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Manual backups are stored in the &quot;manual/&quot; folder and are encrypted with AES-256.
            Test button uploads a simple text file to verify R2 bucket connectivity.
          </p>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>Recent database backups (last 20)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingBackups ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : backups && backups.length > 0 ? (
            <div className="space-y-2">
              {backups.map((backup: BackupInfo) => (
                <div
                  key={backup.r2Key}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{backup.fileName}</p>
                      {getBackupTypeBadge(backup.backupType)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(backup.createdAt), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {formatBytes(backup.size || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {getBackupFolder(backup.r2Key)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <p className="text-sm">No backup history available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="font-medium">Backup Schedule:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Daily:</strong> 4:00 AM UTC (retained for 30 days)</li>
              <li><strong>Weekly:</strong> Every Sunday (retained for 180 days)</li>
              <li><strong>Monthly:</strong> 1st of each month (retained indefinitely)</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              All backups are encrypted with AES-256-CBC and stored in Cloudflare R2.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
