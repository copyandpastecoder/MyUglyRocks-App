import type { InventorySourceListDto } from '@/types/inventory-source';

export interface InventorySourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: InventorySourceListDto | null;
  onSuccess?: (sourceId: string) => void;
}
