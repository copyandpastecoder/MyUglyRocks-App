'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, MoreVertical, Pencil, CheckCircle, Trash2, AlertCircle, RotateCcw, Cylinder, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { getCycleStatusClass, getStageProgressText } from '@/lib/cycle-utils';
import type { CycleCardProps } from './types';

export function CycleCard({ cycle, onDelete, onEdit, showActions = true, plainStyle = false }: CycleCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const progressText = cycle.activeStageCount > 0 && cycle.activeStageStartDateTime && cycle.activeStageDurationEstimateEndDate
    ? getStageProgressText(
        new Date(cycle.activeStageStartDateTime),
        new Date(cycle.activeStageDurationEstimateEndDate),
        cycle.activeStageDaysOverdue
      )
    : null;

  // Format barrel display
  const barrelDisplay = cycle.activeBarrelNickname
    ? cycle.activeBarrelNickname
    : cycle.activeBarrelNumber
      ? `Barrel #${cycle.activeBarrelNumber}`
      : null;

  const hasTumblerInfo = cycle.activeTumblerName || barrelDisplay;
  const isActive = cycle.status === 'Active';

  // Use plain style for completed cycles, colored style for active
  const cardClassName = plainStyle
    ? 'bg-card border-border hover:bg-accent/50'
    : getCycleStatusClass(cycle);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={`rounded-lg border transition-all duration-200 ${cardClassName} ${isExpanded ? 'shadow-md' : 'hover:shadow-sm hover:-translate-y-0.5'}`}
      >
        {/* Main row - always visible */}
        <div className="flex items-center p-3 gap-2">
          {/* Expand/collapse chevron */}
          {hasTumblerInfo && (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
                <span className="sr-only">{isExpanded ? 'Collapse' : 'Expand'} details</span>
              </Button>
            </CollapsibleTrigger>
          )}
          {/* Spacer when no expand button */}
          {!hasTumblerInfo && <div className="w-6 shrink-0" />}

          {/* Cycle info - navigates to cycle */}
          <Link href={`/cycles/${cycle.cycleId}`} className="flex-1 min-w-0">
            <p className="font-medium truncate">{cycle.name}</p>
            <p className="text-sm text-muted-foreground truncate">
              {cycle.stageCount} stage{cycle.stageCount !== 1 ? 's' : ''}
              {progressText && (
                cycle.isOverdue ? (
                  <span className="text-yellow-600"> · {progressText}</span>
                ) : (
                  <span> · {progressText}</span>
                )
              )}
            </p>
          </Link>

          {/* Status icon */}
          <div className="shrink-0">
            {cycle.isOverdue ? (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            ) : (
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          {/* Actions menu */}
          {showActions && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => router.push(`/cycles/${cycle.cycleId}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onSelect={() => onEdit(cycle.cycleId)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {isActive && (
                  <DropdownMenuItem onSelect={() => router.push(`/cycles/${cycle.cycleId}/complete`)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Cycle
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onSelect={() => onDelete(cycle.cycleId)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Expanded content */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-0 border-t border-border/50 mt-0">
            <div className="pt-3 space-y-2 text-sm">
              {cycle.activeTumblerName && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Cylinder className="h-4 w-4 shrink-0" />
                  <span className="font-medium text-foreground">Tumbler:</span>
                  <span className="truncate">{cycle.activeTumblerName}</span>
                </div>
              )}
              {barrelDisplay && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 shrink-0" /> {/* Spacer to align with icon above */}
                  <span className="font-medium text-foreground">Barrel:</span>
                  <span className="truncate">{barrelDisplay}</span>
                </div>
              )}
              {/* Specimens will go here when API returns them */}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
