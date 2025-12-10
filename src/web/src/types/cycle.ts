export interface CycleDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  status: string;
  goal: string | null;
  difficultyRating: number | null;
  finalQuality: number | null;
  additionalSpecimens: string | null;
  notes: string | null;
  dateCreated: string;
  stageRuns: StageRunSummaryDto[];
  specimens: SpecimenDto[];
}

export interface CycleListDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  status: string;
  goal: string | null;
  difficultyRating: number | null;
  stageCount: number;
  activeStageCount: number;
  isOverdue: boolean;
  dateCreated: string;
}

export interface CreateCycleRequest {
  name: string;
  startDate: string;
  goal?: string;
  difficultyRating?: number;
  additionalSpecimens?: string;
  notes?: string;
  specimenIds?: string[];
}

export interface UpdateCycleRequest {
  name: string;
  startDate: string;
  goal?: string;
  difficultyRating?: number;
  additionalSpecimens?: string;
  notes?: string;
}

export interface CompleteCycleRequest {
  finalQuality?: number;
  notes?: string;
}

export interface StageRunSummaryDto {
  id: string;
  stageName: string;
  runNumber: number;
  totalRuns: number;
  startDateTime: string;
  endDateTime: string;
  status: string;
  resultRating: number | null;
  cleaningRun: CleaningRunDto | null;
}

export interface StageRunDto {
  id: string;
  cycleId: string;
  stageName: string;
  runNumber: number;
  totalRuns: number;
  startDateTime: string;
  durationDays: number;
  durationHours: number;
  endDateTime: string;
  status: string;
  reminderEnabled: boolean;
  loadWeightBeforeGrams: number | null;
  fillLevelPercent: number | null;
  waterLevel: string | null;
  waterAmountMl: number | null;
  resultRating: number | null;
  nextAction: string | null;
  notes: string | null;
  dateCreated: string;
  barrels: import('./tumbler').BarrelDto[];
  cleaningRun: CleaningRunDto | null;
  materials: StageMaterialDto[];
  photos: PhotoDto[];
}

export interface CreateStageRunRequest {
  barrelIds: string[];
  stageName: string;
  startDateTime: string;
  durationDays: number;
  durationHours: number;
  reminderEnabled?: boolean;
  remindAfterDays?: number;
  remindAtEndOfStage?: boolean;
  loadWeightBeforeGrams?: number;
  fillLevelPercent?: number;
  waterLevel?: string;
  waterAmountMl?: number;
  notes?: string;
  materials?: CreateStageMaterialRequest[];
  cleaningRun?: CreateCleaningRunRequest;
}

export interface CleaningRunDto {
  id: string;
  durationMinutes: number;
  purpose: string | null;
  status: string;
  resultNotes: string | null;
  notes: string | null;
  materials: CleaningMaterialDto[];
}

export interface CreateCleaningRunRequest {
  durationMinutes: number;
  purpose?: string;
  reminderEnabled?: boolean;
  notes?: string;
  materials?: CreateCleaningMaterialRequest[];
}

export interface CreateCleaningMaterialRequest {
  materialId: string;
  displayAmount?: number;
  displayUnit?: string;
}

export interface StageMaterialDto {
  id: string;
  materialId: string;
  materialName: string;
  displayAmount: number | null;
  displayUnit: string | null;
  sortOrder: number;
}

export interface CreateStageMaterialRequest {
  materialId: string;
  displayAmount?: number;
  displayUnit?: string;
}

export interface UpdateStageRunRequest {
  barrelIds?: string[];
  stageName: string;
  startDateTime: string;
  durationDays: number;
  durationHours: number;
  reminderEnabled?: boolean;
  remindAfterDays?: number;
  remindAtEndOfStage?: boolean;
  loadWeightBeforeGrams?: number;
  loadWeightAfterGrams?: number;
  fillLevelPercent?: number;
  waterLevel?: string;
  waterAmountMl?: number;
  notes?: string;
}

export interface CompleteStageRunRequest {
  resultRating?: number;
  resultShapeRounding?: number;
  resultScratchLevel?: number;
  resultPitting?: number;
  resultShine?: number;
  issueScratches?: boolean;
  issueChips?: boolean;
  issueUnderRounded?: boolean;
  issueContamination?: boolean;
  lessonsLearned?: string;
  nextAction?: string;
  loadWeightAfterGrams?: number;
  actualEndDateTime?: string;
}

export interface CleaningMaterialDto {
  id: string;
  materialId: string;
  materialName: string;
  displayAmount: number | null;
  displayUnit: string | null;
  sortOrder: number;
}

export interface PhotoDto {
  id: string;
  url: string;
  fileName: string | null;
  photoType: string;
  caption: string | null;
  sortOrder: number;
  dateCreated: string;
  thumbnailUrl: string | null;
  mediumUrl: string | null;
  largeUrl: string | null;
  blurHash: string | null;
  width: number | null;
  height: number | null;
}

export interface SpecimenDto {
  id: string;
  commonName: string;
  scientificName: string | null;
  materialType: string;
  mohsHardnessMin: number | null;
  mohsHardnessMax: number | null;
  tumblingDifficulty: string | null;
}

export interface CyclePhotoDto {
  id: string;
  url: string;
  fileName: string | null;
  photoType: string;
  caption: string | null;
  sortOrder: number;
  dateCreated: string;
  thumbnailUrl: string | null;
  mediumUrl: string | null;
  largeUrl: string | null;
  blurHash: string | null;
  width: number | null;
  height: number | null;
  // Stage context
  stageRunId: string;
  stageName: string;
  runNumber: number;
}
