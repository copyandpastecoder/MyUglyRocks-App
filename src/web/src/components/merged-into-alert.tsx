'use client';

import { useQuery } from '@tanstack/react-query';
import { cycleApi } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Info } from 'lucide-react';
import Link from 'next/link';

interface MergedIntoAlertProps {
  cycleId: string;
}

export function MergedIntoAlert({ cycleId }: MergedIntoAlertProps) {
  const { data: targetCycle, isLoading } = useQuery({
    queryKey: ['merged-into', cycleId],
    queryFn: () => cycleApi.getMergedIntoCycle(cycleId),
  });

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (!targetCycle) {
    return null;
  }

  return (
    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-blue-900 dark:text-blue-100">
        This cycle was merged
      </AlertTitle>
      <AlertDescription className="text-blue-800 dark:text-blue-200">
        This cycle was merged into{' '}
        <Link
          href={`/cycles/${targetCycle.cycleId}`}
          className="font-semibold underline hover:no-underline"
        >
          {targetCycle.name}
        </Link>
        {' '}on {new Date(targetCycle.startDate).toLocaleDateString()}
      </AlertDescription>
    </Alert>
  );
}
