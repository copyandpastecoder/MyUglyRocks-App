import type { InventoryPhotoDto, InventorySpecimenDto } from '@/types/inventory';

export interface InventoryPhotoEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryId: string;
  photo: InventoryPhotoDto | null;
  specimens: InventorySpecimenDto[];
  onSuccess?: () => void;
}
