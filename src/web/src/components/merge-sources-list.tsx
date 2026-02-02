'use client';

import { useQuery } from '@tanstack/react-query';
import { cycleApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface MergeSourcesListProps {
  cycleId: string;
}

export function MergeSourcesList({ cycleId }: MergeSourcesListProps) {
  const { data: sources, isLoading, error } = useQuery({
    queryKey: ['merge-sources', cycleId],
    queryFn: () => cycleApi.getMergeSourceCycles(cycleId),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load source cycles. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Merged From</CardTitle>
        <CardDescription>
          This cycle was created by merging the following cycles. View photos and stage details from the original
          cycles below:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sources.map((source) => (
          <Link
            key={source.cycleId}
            href={`/cycles/${source.cycleId}`}
            className="block"
          >
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors group">
              <div className="flex-1">
                <div className="font-medium group-hover:text-primary transition-colors flex items-center gap-2">
                  {source.name}
                  <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date(source.startDate).toLocaleDateString()} -{' '}
                  {source.endDate ? new Date(source.endDate).toLocaleDateString() : 'Present'}
                </div>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-4">
                <span>{source.stageCount} stages</span>
                <span>{source.specimenCount} specimens</span>
                <span className="font-medium text-foreground">{source.photoCount} photos</span>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
