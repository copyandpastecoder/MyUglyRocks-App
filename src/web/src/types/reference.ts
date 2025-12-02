// Specimen types
export interface SpecimenListDto {
  id: string;
  commonName: string;
  alias: string | null;
  variety: string | null;
  rockFamily: string | null;
  materialType: string;
  mohsHardnessMin: number | null;
  mohsHardnessMax: number | null;
  tumblingDifficulty: string | null;
}

export interface SpecimenDetailDto {
  id: string;
  commonName: string;
  scientificName: string | null;
  alias: string | null;
  rockFamily: string | null;
  species: string | null;
  variety: string | null;
  materialType: string;
  mohsHardnessMin: number | null;
  mohsHardnessMax: number | null;
  tumblingDifficulty: string | null;
  recommendedGritSequence: string | null;
  specialConsiderations: string | null;
  notes: string | null;
}

export interface SpecimenSearchRequest {
  query?: string;
  materialType?: string;
  difficulty?: string;
  minHardness?: number;
  maxHardness?: number;
}

// Material types
export interface MaterialListDto {
  id: string;
  commonName: string;
  category: string;
  materialType: string | null;
  usageType: string | null;
  meshSize: number;
  sortOrder: number;
}

export interface MaterialDetailDto {
  id: string;
  commonName: string;
  category: string;
  materialType: string | null;
  materialSize: string | null;
  usageType: string | null;
  meshSize: number;
  sortOrder: number;
  isCleaning: boolean;
  notes: string | null;
}

export interface MaterialSearchRequest {
  query?: string;
  category?: string;
  usageType?: string;
}
