import type { CycleDto } from '@/types/cycle';
import type { BarrelDto } from '@/types/tumbler';
import type { MaterialListDto } from '@/types/reference';

export const STAGE_NAMES = ['Coarse', 'Medium', 'Fine', 'Pre-Polish', 'Polish', 'Burnish', 'Custom'];

export const WATER_UNITS = [
  { value: 'ml', label: 'ml' },
  { value: 'floz', label: 'fl oz' },
];

export interface BarrelInfo extends BarrelDto {
  tumblerName: string;
  tumblerId: string;
}

export interface StageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycleId: string;
  cycle: CycleDto;
  stageRunId?: string; // If provided, we're in edit mode
  allBarrels: BarrelInfo[];
  materials: MaterialListDto[];
  onSuccess?: () => void;
}

export interface MaterialSelection {
  materialId: string;
  displayAmount: string;
  displayUnit: string;
}

export interface CleaningRunData {
  enabled: boolean;
  durationDays: string;
  durationHours: string;
  durationMinutes: string;
  purpose: string;
  notes: string;
  materials: MaterialSelection[];
}
