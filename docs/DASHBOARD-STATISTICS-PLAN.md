# Dashboard Cycle Statistics - Implementation Plan

## Overview

Replace the existing cycles card on the dashboard with a comprehensive statistics section showing summaries, aggregations, and charts for active and completed cycles.

## Changes Summary

- **Remove:** Active Cycles card from dashboard (duplicates the Cycles page)
- **Add:** New statistics section with multiple stat cards and charts

---

## Statistics to Implement

### 1. Duration Statistics

| Statistic | Description |
|-----------|-------------|
| Avg Cycle Duration | Average days from start to completion |
| Avg Stage 1 Duration | Weeks spent in coarse grind |
| Avg Stage 2 Duration | Weeks spent in medium grind |
| Avg Stage 3 Duration | Weeks spent in fine grind |
| Avg Stage 4 Duration | Weeks spent in polish |
| Fastest Cycle | Quickest completion (days) |
| Longest Cycle | Longest completion (days) |

**Per-Tumbler Breakdown:** All stage durations also broken down by tumbler to compare machine performance.

### 2. Weight Loss Statistics (Per Stage)

| Statistic | Description |
|-----------|-------------|
| Stage 1 Avg Weight Loss % | Bulk of material removed (coarse grind) |
| Stage 2 Avg Weight Loss % | Likely minimal |
| Stage 3 Avg Weight Loss % | Likely minimal |
| Stage 4 Avg Weight Loss % | Likely minimal (polish) |
| Total Avg Weight Loss % | Overall cycle loss |
| Avg Weight Before/After per Stage | See material removal at each step |

### 3. Weight Loss by Specimen Hardness

| Hardness Category | Description |
|-------------------|-------------|
| Soft (Mohs 5-6) | Expected higher weight loss |
| Medium (Mohs 6-7) | Moderate weight loss |
| Hard (Mohs 7+) | Expected lower weight loss |

### 4. Operational Statistics

| Statistic | Description |
|-----------|-------------|
| Total Runtime Hours | All-time machine hours |
| Avg Runtime per Cycle | Hours per complete cycle |
| Completion Rate | % of started cycles finished |
| Currently Overdue | Count of active stages past due date |

### 5. Tumbler Performance

| Statistic | Description |
|-----------|-------------|
| Avg Cycle Hours per Tumbler | Compare speed across machines |
| Avg Stage Duration per Tumbler | Stage 1-4 breakdown by tumbler |
| Cycles per Tumbler | Usage distribution |
| Avg Idle Time Between Cycles | Days between completing and starting next (per tumbler) |

### 6. Barrel Tracking

| Statistic | Description |
|-----------|-------------|
| Cycles per Barrel | Wear tracking - identify barrels due for replacement |
| Avg Hours per Barrel | Runtime by barrel |

### 7. Specimen Insights

| Statistic | Description |
|-----------|-------------|
| Avg Specimens per Cycle | Typical load size |
| Most Common Rock Types | What you tumble most (if tracked) |
| Total Specimens Processed | Lifetime count |

### 8. Overdue Analysis

| Statistic | Description |
|-----------|-------------|
| Most Overdue Stage | Which stage type runs late most often |
| Avg Days Over Estimate | How much buffer to add to estimates |
| On-Time Completion Rate | % of stages completed without going overdue |

### 9. Activity Patterns

| Statistic | Description |
|-----------|-------------|
| Max Concurrent Cycles | Most cycles running at once |
| Avg Concurrent Cycles | Typical workload |
| Cycles per Month Trend | Monthly activity over time |

---

## Charts to Implement

1. **Stage Duration Breakdown** (Grouped Bar Chart)
   - Stages side by side, grouped by tumbler
   - Shows which tumbler is faster at each stage

2. **Monthly Activity** (Bar Chart)
   - Cycles started/completed per month
   - Shows activity trends over time

3. **Tumbler Comparison** (Bar Chart)
   - Avg hours/duration per tumbler side-by-side
   - Quick visual comparison of machine speed

4. **Tumbler Utilization** (Donut Chart)
   - Cycle count distribution by tumbler
   - Shows which machines get most use

5. **Weight Loss by Stage** (Bar Chart)
   - Stage 1-4 weight loss percentages
   - Visually shows Stage 1 dominates

6. **Weight Loss by Hardness** (Bar Chart)
   - Compare weight loss across hardness categories
   - Helps set expectations for different stone types

---

## Implementation Phases

### Phase 1: Backend - Statistics DTOs

**Create:** `src/api/MyUglyRocks.Abstractions/DTOs/CycleStatisticsDtos.cs`

```csharp
public record CycleStatisticsDto
{
    public DurationStatsDto DurationStats { get; init; }
    public WeightStatsDto WeightStats { get; init; }
    public OperationalStatsDto OperationalStats { get; init; }
    public List<TumblerStatsDto> TumblerStats { get; init; }
    public List<BarrelStatsDto> BarrelStats { get; init; }
    public SpecimenStatsDto SpecimenStats { get; init; }
    public OverdueStatsDto OverdueStats { get; init; }
    public ActivityStatsDto ActivityStats { get; init; }
}

public record DurationStatsDto
{
    public double? AvgCycleDurationDays { get; init; }
    public double? AvgStage1DurationDays { get; init; }
    public double? AvgStage2DurationDays { get; init; }
    public double? AvgStage3DurationDays { get; init; }
    public double? AvgStage4DurationDays { get; init; }
    public int? FastestCycleDays { get; init; }
    public int? LongestCycleDays { get; init; }
    public List<TumblerDurationStatsDto> PerTumblerDurations { get; init; }
}

public record TumblerDurationStatsDto
{
    public Guid TumblerId { get; init; }
    public string TumblerName { get; init; }
    public double? AvgCycleDurationDays { get; init; }
    public double? AvgStage1DurationDays { get; init; }
    public double? AvgStage2DurationDays { get; init; }
    public double? AvgStage3DurationDays { get; init; }
    public double? AvgStage4DurationDays { get; init; }
}

public record WeightStatsDto
{
    public double? AvgStage1WeightLossPercent { get; init; }
    public double? AvgStage2WeightLossPercent { get; init; }
    public double? AvgStage3WeightLossPercent { get; init; }
    public double? AvgStage4WeightLossPercent { get; init; }
    public double? AvgTotalWeightLossPercent { get; init; }
    public StageWeightDto AvgStage1Weight { get; init; }
    public StageWeightDto AvgStage2Weight { get; init; }
    public StageWeightDto AvgStage3Weight { get; init; }
    public StageWeightDto AvgStage4Weight { get; init; }
    public List<HardnessWeightLossDto> WeightLossByHardness { get; init; }
}

public record StageWeightDto
{
    public double? AvgWeightBeforeGrams { get; init; }
    public double? AvgWeightAfterGrams { get; init; }
    public double? AvgWeightLossGrams { get; init; }
}

public record HardnessWeightLossDto
{
    public string HardnessCategory { get; init; } // "Soft (5-6)", "Medium (6-7)", "Hard (7+)"
    public double? AvgWeightLossPercent { get; init; }
    public int CycleCount { get; init; }
}

public record OperationalStatsDto
{
    public double TotalRuntimeHours { get; init; }
    public double? AvgRuntimePerCycleHours { get; init; }
    public double CompletionRate { get; init; } // 0-100%
    public int CurrentlyOverdueCount { get; init; }
}

public record TumblerStatsDto
{
    public Guid TumblerId { get; init; }
    public string TumblerName { get; init; }
    public int CycleCount { get; init; }
    public double? AvgCycleHours { get; init; }
    public double? AvgIdleTimeDays { get; init; }
}

public record BarrelStatsDto
{
    public Guid BarrelId { get; init; }
    public string BarrelName { get; init; }
    public string TumblerName { get; init; }
    public int CycleCount { get; init; }
    public double TotalHours { get; init; }
}

public record SpecimenStatsDto
{
    public double? AvgSpecimensPerCycle { get; init; }
    public int TotalSpecimensProcessed { get; init; }
    public List<RockTypeCountDto> MostCommonTypes { get; init; }
}

public record RockTypeCountDto
{
    public string RockType { get; init; }
    public int Count { get; init; }
}

public record OverdueStatsDto
{
    public string MostOverdueStageType { get; init; } // "Stage 1", "Stage 2", etc.
    public double? AvgDaysOverEstimate { get; init; }
    public double OnTimeCompletionRate { get; init; } // 0-100%
}

public record ActivityStatsDto
{
    public int MaxConcurrentCycles { get; init; }
    public double AvgConcurrentCycles { get; init; }
    public List<MonthlyActivityDto> CyclesPerMonth { get; init; }
}

public record MonthlyActivityDto
{
    public int Year { get; init; }
    public int Month { get; init; }
    public int CyclesStarted { get; init; }
    public int CyclesCompleted { get; init; }
}
```

### Phase 2: Backend - Statistics Service Method

**Modify:** `src/api/MyUglyRocks.Core/Services/CycleService.cs`

Add method: `Task<CycleStatisticsDto> GetCycleStatisticsAsync(Guid userId)`

This method will:
1. Query all cycles for the user (active and completed)
2. Query all stage runs with their weights
3. Query all specimens with hardness data
4. Calculate all aggregations in-memory or via SQL
5. Return the populated `CycleStatisticsDto`

### Phase 3: Backend - Statistics Endpoint

**Modify:** `src/api/MyUglyRocks.Api/Controllers/CyclesController.cs`

Add endpoint:
```csharp
[HttpGet("statistics")]
public async Task<ActionResult<CycleStatisticsDto>> GetStatistics()
{
    var userId = GetUserId();
    var statistics = await _cycleService.GetCycleStatisticsAsync(userId);
    return Ok(statistics);
}
```

### Phase 4: Frontend - Types

**Create:** `src/web/src/types/cycle-statistics.ts`

TypeScript interfaces matching the backend DTOs.

### Phase 5: Frontend - Hook

**Create:** `src/web/src/hooks/use-cycle-statistics.ts`

```typescript
export function useCycleStatistics() {
  return useQuery({
    queryKey: ['cycle-statistics'],
    queryFn: async () => {
      const response = await fetch('/api/cycles/statistics');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      return response.json() as Promise<CycleStatisticsDto>;
    },
  });
}
```

### Phase 6: Frontend - Install Recharts

```bash
npm install recharts
```

### Phase 7: Frontend - Statistics Components

**Create folder:** `src/web/src/components/dashboard-statistics/`

Components to create:
- `index.tsx` - Main container/export
- `duration-stats-card.tsx` - Duration averages display
- `weight-stats-card.tsx` - Weight loss per stage
- `tumbler-stats-card.tsx` - Tumbler performance comparison
- `operational-stats-card.tsx` - Runtime, completion rate, overdue
- `specimen-stats-card.tsx` - Specimen counts and types
- `barrel-stats-card.tsx` - Barrel usage tracking
- `overdue-stats-card.tsx` - Overdue analysis
- `stage-duration-chart.tsx` - Grouped bar chart
- `monthly-activity-chart.tsx` - Bar chart
- `tumbler-utilization-chart.tsx` - Donut chart
- `weight-by-stage-chart.tsx` - Bar chart
- `weight-by-hardness-chart.tsx` - Bar chart

### Phase 8: Frontend - Dashboard Update

**Modify:** `src/web/src/app/(protected)/dashboard/page.tsx`

1. Remove the "Active Cycles" card section
2. Import and add the new statistics components
3. Layout the statistics cards and charts in a responsive grid

---

## Suggested Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Welcome back, {userName}                                           │
├───────────────┬───────────────┬───────────────┬─────────────────────┤
│  Active (3)   │ Completed(12) │ Tumblers (2)  │ Active Stages (4)   │
├───────────────┴───────────────┴───────────────┴─────────────────────┤
│                                                                     │
│  📊 Cycle Statistics                                                │
│                                                                     │
│  ┌─────────────────────────────┐  ┌───────────────────────────────┐ │
│  │  Duration Averages          │  │  Monthly Activity (Bar Chart) │ │
│  │  ─────────────────────────  │  │                               │ │
│  │  Total Cycle: 6.2 weeks     │  │   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │ │
│  │  Stage 1: 2.1 weeks         │  │                               │ │
│  │  Stage 2: 1.8 weeks         │  └───────────────────────────────┘ │
│  │  Stage 3: 1.5 weeks         │                                    │
│  │  Stage 4: 0.8 weeks         │  ┌───────────────────────────────┐ │
│  └─────────────────────────────┘  │  Stage Duration by Tumbler    │ │
│                                    │  (Grouped Bar Chart)          │ │
│  ┌─────────────────────────────┐  │                               │ │
│  │  Weight Loss by Stage       │  └───────────────────────────────┘ │
│  │  ─────────────────────────  │                                    │
│  │  Stage 1: 18% avg           │  ┌───────────────────────────────┐ │
│  │  Stage 2: 2% avg            │  │  Tumbler Utilization (Donut)  │ │
│  │  Stage 3: <1% avg           │  │                               │ │
│  │  Stage 4: <1% avg           │  │         🍩                    │ │
│  └─────────────────────────────┘  └───────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────┐  ┌───────────────────────────────┐ │
│  │  Operational Stats          │  │  Weight Loss by Hardness      │ │
│  │  ─────────────────────────  │  │  (Bar Chart)                  │ │
│  │  Total Runtime: 847 hrs     │  │                               │ │
│  │  Avg/Cycle: 42 hrs          │  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    │ │
│  │  Completion Rate: 92%       │  │                               │ │
│  │  Currently Overdue: 1       │  └───────────────────────────────┘ │
│  └─────────────────────────────┘                                    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Tumbler Performance Comparison                              │   │
│  │  ────────────────────────────────────────────────────────    │   │
│  │  Tumbler        │ Cycles │ Avg Hours │ Avg Duration │ Idle   │   │
│  │  ─────────────────────────────────────────────────────────   │   │
│  │  Lortone 3A     │   12   │   168 hrs │   6.8 weeks  │ 2.1d   │   │
│  │  Thumler's A-R2 │    8   │   144 hrs │   5.6 weeks  │ 1.8d   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Barrel Usage                                                │   │
│  │  ────────────────────────────────────────────────────────    │   │
│  │  Barrel             │ Tumbler      │ Cycles │ Total Hours    │   │
│  │  ─────────────────────────────────────────────────────────   │   │
│  │  Barrel 1           │ Lortone 3A   │   12   │   504 hrs      │   │
│  │  Barrel 2           │ Lortone 3A   │   10   │   420 hrs      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────┐  ┌───────────────────────────────┐ │
│  │  Specimen Stats             │  │  Overdue Analysis             │ │
│  │  ─────────────────────────  │  │  ───────────────────────────  │ │
│  │  Avg per Cycle: 8.5         │  │  Most Overdue: Stage 1        │ │
│  │  Total Processed: 204       │  │  Avg Days Over: 2.3           │ │
│  │  Top Types:                 │  │  On-Time Rate: 78%            │ │
│  │    - Agate (45)             │  │                               │ │
│  │    - Jasper (38)            │  │                               │ │
│  └─────────────────────────────┘  └───────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────┐                                    │
│  │  Activity Patterns          │                                    │
│  │  ─────────────────────────  │                                    │
│  │  Max Concurrent: 4          │                                    │
│  │  Avg Concurrent: 2.1        │                                    │
│  └─────────────────────────────┘                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Files to Create

| File | Description |
|------|-------------|
| `src/api/MyUglyRocks.Abstractions/DTOs/CycleStatisticsDtos.cs` | All statistics DTOs |
| `src/web/src/types/cycle-statistics.ts` | TypeScript interfaces |
| `src/web/src/hooks/use-cycle-statistics.ts` | React Query hook |
| `src/web/src/components/dashboard-statistics/index.tsx` | Main export |
| `src/web/src/components/dashboard-statistics/duration-stats-card.tsx` | Duration stats |
| `src/web/src/components/dashboard-statistics/weight-stats-card.tsx` | Weight loss stats |
| `src/web/src/components/dashboard-statistics/tumbler-stats-card.tsx` | Tumbler performance |
| `src/web/src/components/dashboard-statistics/operational-stats-card.tsx` | Operational stats |
| `src/web/src/components/dashboard-statistics/specimen-stats-card.tsx` | Specimen stats |
| `src/web/src/components/dashboard-statistics/barrel-stats-card.tsx` | Barrel tracking |
| `src/web/src/components/dashboard-statistics/overdue-stats-card.tsx` | Overdue analysis |
| `src/web/src/components/dashboard-statistics/activity-stats-card.tsx` | Activity patterns |
| `src/web/src/components/dashboard-statistics/stage-duration-chart.tsx` | Grouped bar chart |
| `src/web/src/components/dashboard-statistics/monthly-activity-chart.tsx` | Bar chart |
| `src/web/src/components/dashboard-statistics/tumbler-utilization-chart.tsx` | Donut chart |
| `src/web/src/components/dashboard-statistics/weight-by-stage-chart.tsx` | Bar chart |
| `src/web/src/components/dashboard-statistics/weight-by-hardness-chart.tsx` | Bar chart |

## Files to Modify

| File | Changes |
|------|---------|
| `src/api/MyUglyRocks.Core/Services/CycleService.cs` | Add `GetCycleStatisticsAsync` method |
| `src/api/MyUglyRocks.Api/Controllers/CyclesController.cs` | Add `/statistics` endpoint |
| `src/web/src/app/(protected)/dashboard/page.tsx` | Remove cycles card, add statistics section |
| `src/web/package.json` | Add recharts dependency |

---

## Dependencies

- **Recharts** - React charting library for graphs
  - Install: `npm install recharts`
  - Docs: https://recharts.org/

---

## Notes

- All statistics are calculated per-user (no cross-user data)
- Null/empty states should be handled gracefully (show "No data" or hide sections)
- Statistics should handle users with 0 cycles, 1 cycle, or many cycles
- Consider caching the statistics endpoint if performance becomes an issue
- Mobile responsiveness: cards should stack vertically on smaller screens
