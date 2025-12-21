import type { CycleListDto } from '@/types/cycle';

export interface CycleCardProps {
  cycle: CycleListDto;
  onDelete?: (cycleId: string) => void;
  onEdit?: (cycleId: string) => void;
  /** Whether to show the dropdown menu actions */
  showActions?: boolean;
  /** Use plain card styling (for completed cycles) */
  plainStyle?: boolean;
}
