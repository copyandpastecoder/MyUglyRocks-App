'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TrackingModeToggleProps {
  isDetailedMode: boolean;
  onToggle: (value: boolean) => void;
}

export function TrackingModeToggle({ isDetailedMode, onToggle }: TrackingModeToggleProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {isDetailedMode ? 'Detailed' : 'Simple'} Mode
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/settings/preferences" className="text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Change default in Settings → Preferences</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Switch
        checked={isDetailedMode}
        onCheckedChange={onToggle}
        aria-label="Toggle detailed mode"
      />
    </div>
  );
}
