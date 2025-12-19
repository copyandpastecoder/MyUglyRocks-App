import type { CycleDto, CycleListDto } from '@/types/cycle';

export interface CycleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, dialog is in edit mode */
  cycle?: CycleDto | CycleListDto | null;
  /** Called after successful create (with new cycle ID) */
  onCreated?: (cycleId: string) => void;
  /** Called after successful update */
  onUpdated?: () => void;
}
