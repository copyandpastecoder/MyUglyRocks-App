import type { CreateUserSpecimenRequest, SpecimenLookupData } from '@/types/user-specimen';

// Data passed to onSuccess callback
export interface CustomSpecimenCreatedData {
  userSpecimenId: string;
  commonName: string;
  scientificName: string | null;
  tumblingDifficulty: string | null;
  materialType: string;
}

export interface AddCustomSpecimenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: CustomSpecimenCreatedData) => void;
  initialName?: string;
}

export const MATERIAL_TYPES = ['Rock', 'Mineral', 'Glass', 'Fossil', 'Other'];
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export type { CreateUserSpecimenRequest, SpecimenLookupData };
