export interface CycleStatisticsDto {
  durationStats: DurationStatsDto;
  weightStats: WeightStatsDto;
  operationalStats: OperationalStatsDto;
  tumblerStats: TumblerStatsDto[];
  barrelStats: BarrelStatsDto[];
  specimenStats: SpecimenStatsDto;
  overdueStats: OverdueStatsDto;
  activityStats: ActivityStatsDto;
}

export interface DurationStatsDto {
  avgCycleDurationDays: number | null;
  avgStage1DurationDays: number | null;
  avgStage2DurationDays: number | null;
  avgStage3DurationDays: number | null;
  avgStage4DurationDays: number | null;
  fastestCycleDays: number | null;
  longestCycleDays: number | null;
  perTumblerDurations: TumblerDurationStatsDto[];
}

export interface TumblerDurationStatsDto {
  tumblerId: string;
  tumblerName: string;
  avgCycleDurationDays: number | null;
  avgStage1DurationDays: number | null;
  avgStage2DurationDays: number | null;
  avgStage3DurationDays: number | null;
  avgStage4DurationDays: number | null;
}

export interface WeightStatsDto {
  avgStage1WeightLossPercent: number | null;
  avgStage2WeightLossPercent: number | null;
  avgStage3WeightLossPercent: number | null;
  avgStage4WeightLossPercent: number | null;
  avgTotalWeightLossPercent: number | null;
  avgStage1Weight: StageWeightDto | null;
  avgStage2Weight: StageWeightDto | null;
  avgStage3Weight: StageWeightDto | null;
  avgStage4Weight: StageWeightDto | null;
  weightLossByHardness: HardnessWeightLossDto[];
}

export interface StageWeightDto {
  avgWeightBeforeGrams: number | null;
  avgWeightAfterGrams: number | null;
  avgWeightLossGrams: number | null;
}

export interface HardnessWeightLossDto {
  hardnessCategory: string;
  avgWeightLossPercent: number | null;
  cycleCount: number;
}

export interface OperationalStatsDto {
  totalRuntimeHours: number;
  avgRuntimePerCycleHours: number | null;
  completionRate: number;
  currentlyOverdueCount: number;
}

export interface TumblerStatsDto {
  tumblerId: string;
  tumblerName: string;
  cycleCount: number;
  avgCycleHours: number | null;
  avgIdleTimeDays: number | null;
}

export interface BarrelStatsDto {
  barrelId: string;
  barrelName: string;
  tumblerName: string;
  cycleCount: number;
  totalHours: number;
}

export interface SpecimenStatsDto {
  avgSpecimensPerCycle: number | null;
  totalSpecimensProcessed: number;
  mostCommonTypes: RockTypeCountDto[];
}

export interface RockTypeCountDto {
  rockType: string;
  count: number;
}

export interface OverdueStatsDto {
  mostOverdueStageType: string | null;
  avgDaysOverEstimate: number | null;
  onTimeCompletionRate: number;
}

export interface ActivityStatsDto {
  maxConcurrentCycles: number;
  avgConcurrentCycles: number;
  cyclesPerMonth: MonthlyActivityDto[];
}

export interface MonthlyActivityDto {
  year: number;
  month: number;
  cyclesStarted: number;
  cyclesCompleted: number;
}
