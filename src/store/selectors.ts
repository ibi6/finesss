import type {
  BodyEntry,
  EnergyLevel,
  FitnessStateSnapshot,
  Food,
  MealEntry,
  MealType,
  RecoveryEntry,
  WorkoutKind,
  WorkoutSession,
  WorkoutTemplate,
} from './types'
import { createDateFromKey, formatShortDateKey, getLocalDateKeyFromIso, resolveDateKey, shiftDateKey } from './date'
import { getRecoveryPresetByLabel, type RecoveryPresetLabel } from './recoveryPresets'

export interface DailySummary {
  calories: number
  protein: number
  carbs: number
  fat: number
  mealsLogged: number
  trainingMinutes: number
  trainingCalories: number
  hasBodyEntry: boolean
  recoveryLogged: boolean
  recoveryScore: number | null
  consistencyScore: number
}

export interface WeeklySummary {
  averageCalories: number
  proteinGoalDays: number
  trainingSessions: number
  recoveryDays: number
  averageSleepHours: number
  averageRecoveryScore: number
  weeklyWeightDelta: number
}

export interface WeightTrendPoint {
  date: string
  weight: number
}

export interface WeightTrend {
  points: WeightTrendPoint[]
  direction: 'up' | 'down' | 'flat'
  delta: number
}

export interface RangeSummary {
  span: number
  averageCalories: number
  averageProtein: number
  proteinGoalDays: number
  calorieGoalDays: number
  trainingSessions: number
  trainingMinutes: number
  recoveryDays: number
  bodyEntryDays: number
  averageSleepHours: number
  averageRecoveryScore: number
  latestRecoveryScore: number | null
  latestRecoveryDateKey: string | null
  averageConsistency: number
  weightDelta: number
}

export interface AdherenceMetric {
  id: 'calories' | 'protein' | 'workout' | 'recovery' | 'body'
  label: string
  score: number
}

export interface TodayCoachAction {
  id: 'meal' | 'meal-plan' | 'protein' | 'workout' | 'recovery' | 'body' | 'done'
  title: string
  detail: string
  status: 'todo' | 'watch' | 'done'
  action: 'meal' | 'workout' | 'body' | 'recovery' | null
  suggestions?: TodayCoachFoodSuggestion[]
  plannedMealSuggestions?: TodayCoachMealPlanSuggestion[]
  workoutSuggestions?: TodayCoachWorkoutSuggestion[]
  recoverySuggestions?: TodayCoachRecoverySuggestion[]
}

export interface TodayCoachFoodSuggestion {
  foodId: string
  name: string
  servingLabel: string
  protein: number
  calories: number
}

export interface TodayCoachMealPlanSuggestion {
  templateId: string
  templateName: string
  mealType: MealType
  itemCount: number
}

export interface TodayCoachWorkoutSuggestion {
  templateId: string
  name: string
  kind: WorkoutTemplate['kind']
  durationMinutes: number
  estimatedCalories: number
}

export interface TodayCoachRecoverySuggestion {
  label: RecoveryPresetLabel
  waterLiters: number
  steps: number
  sleepHours: number
  energy: EnergyLevel
}

export interface TodayCoachSummary {
  loggingStreak: number
  completeDaysLast7: number
  strongestMetric: string
  weakestMetric: string
  actions: TodayCoachAction[]
}

export interface TodayMomentumBadge {
  id: 'weight' | 'streak' | 'training'
  title: string
  detail: string
}

export interface TodayMomentumMission {
  id: 'training' | 'protein' | 'recovery'
  title: string
  current: number
  target: number
  unit: '次' | '天'
  progressPercent: number
  status: 'todo' | 'watch' | 'done'
}

export interface TodayMomentumSummary {
  stageLabel: string
  headline: string
  detail: string
  badges: TodayMomentumBadge[]
  missions: TodayMomentumMission[]
}

export interface TodayAchievementItem {
  id: string
  title: string
  detail: string
  progressLabel: string
  progressPercent: number
}

export interface TodayAchievementSummary {
  unlockedCount: number
  unlocked: TodayAchievementItem[]
  nextUp: TodayAchievementItem[]
}

export interface GoalProgressSummary {
  direction: 'cut' | 'gain' | 'maintain'
  startWeight: number
  currentWeight: number
  targetWeight: number
  totalChange: number
  completedChange: number
  remainingChange: number
  progressPercent: number
  nextMilestoneWeight: number | null
  nextMilestoneChange: number
}

export interface GoalForecastSummary {
  direction: GoalProgressSummary['direction']
  currentWeight: number
  targetWeight: number
  remainingChange: number
  weeklyRateGoal: number
  etaWeeks: number
  etaDateKey: string | null
  status: 'active' | 'at-goal' | 'maintain' | 'paused'
}

export type WeeklyReviewTone = 'positive' | 'watch' | 'risk'

export interface WeeklyReviewFinding {
  id: 'strongest' | 'trend' | 'gap'
  tone: WeeklyReviewTone
  title: string
  detail: string
}

export interface WeeklyReviewRecommendation {
  id: 'protein' | 'workout' | 'recovery' | 'body' | 'consistency'
  tone: 'watch' | 'risk'
  title: string
  detail: string
  targetLabel: string
  priority: number
}

export interface WeeklyReviewRisk {
  id: 'missing-body' | 'missing-recovery' | 'fragmented-logging'
  title: string
  detail: string
}

export interface WeeklyReviewSummary {
  findings: WeeklyReviewFinding[]
  recommendations: WeeklyReviewRecommendation[]
  risk: WeeklyReviewRisk | null
  topReminder: WeeklyReviewRecommendation | null
}

export interface WeeklyReportSection {
  id: 'progress' | 'execution' | 'strength' | 'gap' | 'next'
  label: string
  text: string
}

export interface WeeklyReportSummary {
  title: string
  periodLabel: string
  sections: WeeklyReportSection[]
  shareText: string
}

export interface WeeklyPlanAdherenceSignal {
  id: string
  tone: 'positive' | 'watch'
  title: string
  detail: string
}

export interface WeeklyPlanAdherenceSummary {
  plannedMeals: number
  completedMeals: number
  missedMeals: number
  plannedWorkouts: number
  completedWorkouts: number
  missedWorkouts: number
  unplannedMealLogs: number
  unplannedWorkoutLogs: number
  mealCompletionRate: number
  workoutCompletionRate: number
  headline: string
  detail: string
  signals: WeeklyPlanAdherenceSignal[]
}

export interface TodayPlanAction {
  id: string
  kind: 'meal' | 'workout'
  status: 'pending' | 'done'
  title: string
  detail: string
  targetLabel: string
  ctaLabel: string | null
  templateId?: string
  mealType?: MealType
  workoutTemplateId?: string
  targetDateKey: string
}

export interface TodayPlanSummary {
  targetDateKey: string
  headline: string
  detail: string
  hasPlans: boolean
  pendingCount: number
  completedCount: number
  items: TodayPlanAction[]
}

export interface TomorrowPlanAction {
  id: 'planned-meal' | 'protein-meal' | 'planned-workout' | 'workout' | 'body' | 'recovery'
  kind: 'meal' | 'workout' | 'body' | 'recovery'
  title: string
  detail: string
  targetLabel: string
  ctaLabel: string
  priority: number
  templateId?: string
  mealType?: MealType
  workoutTemplateId?: string
  recoveryPresetLabel?: RecoveryPresetLabel
  targetDateKey: string
}

export interface TomorrowPlanSummary {
  targetDateKey: string
  headline: string
  detail: string
  items: TomorrowPlanAction[]
  primaryItem: TomorrowPlanAction | null
}

export interface ConsistencyCalendarDay {
  dateKey: string
  score: number
  intensity: 'none' | 'low' | 'medium' | 'high' | 'full'
  hasAnyLog: boolean
}

export interface ConsistencyCalendarSummary {
  days: ConsistencyCalendarDay[]
  fullDays: number
  blankDays: number
  averageScore: number
  bestLoggingStreak: number
}

export interface WorkoutRhythmDay {
  dateKey: string
  minutes: number
  calories: number
  sessionCount: number
  strengthCount: number
  cardioCount: number
  intensity: 'rest' | 'light' | 'medium' | 'high'
}

export interface WorkoutRhythmSummary {
  weeklyTarget: number
  sessionCount: number
  remainingSessions: number
  activeDays: number
  totalMinutes: number
  totalCalories: number
  strengthSessions: number
  cardioSessions: number
  averageSessionMinutes: number
  longestSessionMinutes: number
  focusLabel: string
  headline: string
  detail: string
  days: WorkoutRhythmDay[]
}

export type WorkoutHistoryKindFilter = 'all' | WorkoutKind

export interface WorkoutHistoryFilters {
  query: string
  kind: WorkoutHistoryKindFilter
  rangeDays: number
}

export interface WorkoutHistorySummary {
  items: WorkoutSession[]
  totalInRange: number
  filteredCount: number
}

export type BodyHistoryKindFilter = 'all' | 'body' | 'recovery'

export interface BodyHistoryFilters {
  query: string
  kind: BodyHistoryKindFilter
  rangeDays: number
}

export interface BodyHistoryItem {
  id: string
  kind: 'body' | 'recovery'
  dateKey: string
  loggedAt: string
  title: string
  detail: string
  searchText: string
}

export interface BodyHistorySummary {
  items: BodyHistoryItem[]
  totalInRange: number
  filteredCount: number
}

export type MealReuseSourceFilter = 'all' | 'favorite' | 'recent'

export interface MealReuseFilters {
  query: string
  source: MealReuseSourceFilter
  rangeDays: number
}

export interface MealReuseItem {
  id: string
  foodId: string
  name: string
  servingLabel: string
  calories: number
  protein: number
  carbs: number
  fat: number
  isFavorite: boolean
  lastUsedAt: string | null
  lastUsedDateKey: string | null
  searchText: string
}

export interface MealReuseSummary {
  items: MealReuseItem[]
  totalInRange: number
  filteredCount: number
}

export type PhotoEstimateHistorySceneFilter = 'all' | 'meal' | 'drink' | 'protein' | 'snack'

export interface PhotoEstimateHistoryFilters {
  query: string
  scene: PhotoEstimateHistorySceneFilter
  rangeDays: number
}

export interface PhotoEstimateHistorySummary {
  items: FitnessStateSnapshot['photoEstimateRecords']
  totalInRange: number
  filteredCount: number
}

function getRange(targetDate: string, span: number) {
  const dates: string[] = []
  const end = new Date(`${targetDate}T00:00:00.000Z`)

  for (let index = span - 1; index >= 0; index -= 1) {
    const cursor = new Date(end)
    cursor.setUTCDate(end.getUTCDate() - index)
    dates.push(cursor.toISOString().slice(0, 10))
  }

  return dates
}

function sumMeals(entries: MealEntry[]) {
  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fat: totals.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

function averageOf(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  const total = values.reduce((sum, value) => sum + value, 0)
  return total / values.length
}

function formatSignedDelta(value: number) {
  if (value > 0) {
    return `+${value.toFixed(1)} kg`
  }

  if (value < 0) {
    return `${value.toFixed(1)} kg`
  }

  return '0.0 kg'
}

const recoveryScoreTargets = {
  waterLiters: 3,
  steps: 10_000,
  sleepHours: 8,
  energy: 5,
} as const

function getLoggedEntryDateKey<T extends { loggedAt: string; dateKey?: string }>(entry: T) {
  return resolveDateKey(entry.dateKey, entry.loggedAt)
}

function getEntriesForDate<T extends { loggedAt: string; dateKey?: string }>(
  entries: T[],
  targetDate: string,
) {
  return entries.filter((entry) => getLoggedEntryDateKey(entry) === targetDate)
}

function getWorkoutDateKey(entry: WorkoutSession) {
  return resolveDateKey(entry.dateKey, entry.startedAt)
}

function getWorkoutsForDate(entries: WorkoutSession[], targetDate: string) {
  return entries.filter((entry) => getWorkoutDateKey(entry) === targetDate)
}

function getLatestLoggedEntry<T extends { loggedAt: string }>(entries: T[]) {
  return [...entries].sort((left, right) => left.loggedAt.localeCompare(right.loggedAt)).at(-1) ?? null
}

function getWeightDelta(points: BodyEntry[]) {
  if (points.length < 2) {
    return 0
  }

  return Number((points[points.length - 1].weight - points[0].weight).toFixed(2))
}

function getDirectionFromWeights(startWeight: number, targetWeight: number) {
  if (targetWeight < startWeight) {
    return 'cut' as const
  }

  if (targetWeight > startWeight) {
    return 'gain' as const
  }

  return 'maintain' as const
}

function getLatestBodyEntryOnOrBeforeDate(entries: BodyEntry[], targetDate: string) {
  const sortedEntries = [...entries].sort((left, right) => left.loggedAt.localeCompare(right.loggedAt))
  const eligibleEntries = sortedEntries.filter((entry) => getLoggedEntryDateKey(entry) <= targetDate)

  return eligibleEntries.at(-1) ?? null
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getRecoveryScore(entry: RecoveryEntry) {
  const waterScore =
    clampNumber(entry.waterLiters / recoveryScoreTargets.waterLiters, 0, 1) * 20
  const stepsScore = clampNumber(entry.steps / recoveryScoreTargets.steps, 0, 1) * 20
  const sleepScore =
    clampNumber(entry.sleepHours / recoveryScoreTargets.sleepHours, 0, 1) * 35
  const energyScore = clampNumber(entry.energy / recoveryScoreTargets.energy, 0, 1) * 25

  return Math.round(waterScore + stepsScore + sleepScore + energyScore)
}

function getAverageRecoveryScore(entries: RecoveryEntry[]) {
  if (entries.length === 0) {
    return 0
  }

  return Number(averageOf(entries.map((entry) => getRecoveryScore(entry))).toFixed(0))
}

function getConsistencyIntensity(score: number): ConsistencyCalendarDay['intensity'] {
  if (score >= 75) {
    return 'full'
  }

  if (score >= 50) {
    return 'high'
  }

  if (score >= 25) {
    return 'medium'
  }

  if (score > 0) {
    return 'low'
  }

  return 'none'
}

function getWorkoutLoadIntensity(minutes: number): WorkoutRhythmDay['intensity'] {
  if (minutes >= 60) {
    return 'high'
  }

  if (minutes >= 30) {
    return 'medium'
  }

  if (minutes > 0) {
    return 'light'
  }

  return 'rest'
}

function getWorkoutFocusLabel(strengthSessions: number, cardioSessions: number) {
  if (strengthSessions === 0 && cardioSessions === 0) {
    return '等待开练'
  }

  if (strengthSessions === cardioSessions) {
    return '力量 / 有氧平衡'
  }

  return strengthSessions > cardioSessions ? '力量优先' : '有氧优先'
}

function getMissionStatus(current: number, target: number): TodayMomentumMission['status'] {
  if (current >= target) {
    return 'done'
  }

  if (current >= Math.ceil(target / 2)) {
    return 'watch'
  }

  return 'todo'
}

const weeklyReviewRecommendationPriority: Record<WeeklyReviewRecommendation['id'], number> = {
  consistency: 1,
  body: 2,
  recovery: 3,
  protein: 4,
  workout: 5,
}

const tomorrowPlanActionPriority: Record<TomorrowPlanAction['id'], number> = {
  'planned-meal': 1,
  'protein-meal': 2,
  'planned-workout': 3,
  workout: 4,
  body: 5,
  recovery: 6,
}

const todayPlanStatusPriority: Record<TodayPlanAction['status'], number> = {
  pending: 1,
  done: 2,
}

function getMealTemplateTotals(template: FitnessStateSnapshot['mealTemplates'][number]) {
  return template.items.reduce(
    (totals, item) => ({
      calories: totals.calories + item.calories,
      protein: totals.protein + item.protein,
    }),
    { calories: 0, protein: 0 },
  )
}

function getTomorrowMealActionTitle(
  mode: 'planned' | 'protein',
  mealType: MealType,
) {
  const mealLabel = coachMealTypeLabels[mealType]
  const prefix =
    mealType === 'breakfast' ? '明早' : mealType === 'dinner' ? '明晚' : '明天'

  if (mode === 'planned') {
    return `${prefix}先把计划${mealLabel}带进来`
  }

  return `${prefix}先把高蛋白${mealLabel}带进来`
}

function getTomorrowMealCtaLabel(mealType: MealType) {
  return `带入${coachMealTypeLabels[mealType]}`
}

function formatPlanSlotLabel(dateKey: string, label: string) {
  return `${formatShortDateKey(dateKey)} ${label}`
}

function getTodayMealActionTitle(mealType: MealType, status: TodayPlanAction['status']) {
  if (status === 'done') {
    return `${coachMealTypeLabels[mealType]}已记`
  }

  return `按计划吃${coachMealTypeLabels[mealType]}`
}

function getTodayMealActionDetail(
  mealType: MealType,
  templateName: string,
  status: TodayPlanAction['status'],
) {
  if (status === 'done') {
    return `今天这顿原本排的是 ${templateName}，这一餐已经有记录了。`
  }

  return `今天的${coachMealTypeLabels[mealType]}已经排了 ${templateName}，直接带入就能少做一次手填。`
}

function getTomorrowPlannedWorkoutTitle(template: WorkoutTemplate) {
  return `明天按计划练${template.name}`
}

function getTodayWorkoutActionTitle(
  template: WorkoutTemplate,
  status: TodayPlanAction['status'],
) {
  if (status === 'done') {
    return '训练已记'
  }

  return `按计划练${template.name}`
}

function getTodayWorkoutActionDetail(
  template: WorkoutTemplate,
  status: TodayPlanAction['status'],
) {
  if (status === 'done') {
    return `今天原本排了 ${template.name}，训练记录已经补上了。`
  }

  return `今天已经排了 ${template.name}，直接带入这套训练就能开始记。`
}

function getTomorrowPlannedMealSlot(
  snapshot: Pick<FitnessStateSnapshot, 'mealEntries' | 'mealTemplates' | 'weeklyMealPlans'>,
  targetDate: string,
) {
  const weekday = createDateFromKey(targetDate).getDay()
  const loggedMealTypes = new Set(getEntriesForDate(snapshot.mealEntries, targetDate).map((entry) => entry.mealType))
  const templateById = new Map(snapshot.mealTemplates.map((template) => [template.id, template]))

  return (
    snapshot.weeklyMealPlans
      .filter((plan) => plan.weekday === weekday && !loggedMealTypes.has(plan.mealType))
      .sort(
        (left, right) =>
          coachMealTypeOrder.indexOf(left.mealType) - coachMealTypeOrder.indexOf(right.mealType),
      )
      .map((plan) => ({
        plan,
        template: templateById.get(plan.templateId) ?? null,
      }))
      .find((item) => item.template != null) ?? null
  )
}

function getTomorrowPlannedWorkoutSlot(
  snapshot: Pick<FitnessStateSnapshot, 'workoutTemplates' | 'workoutSessions' | 'weeklyWorkoutPlans'>,
  targetDate: string,
) {
  const weekday = createDateFromKey(targetDate).getDay()

  if (getWorkoutsForDate(snapshot.workoutSessions, targetDate).length > 0) {
    return null
  }

  const plan = snapshot.weeklyWorkoutPlans.find((candidate) => candidate.weekday === weekday)

  if (!plan) {
    return null
  }

  const template = snapshot.workoutTemplates.find((candidate) => candidate.id === plan.templateId)

  if (!template) {
    return null
  }

  return {
    plan,
    template,
  }
}

function getBestTomorrowProteinTemplate(
  snapshot: Pick<FitnessStateSnapshot, 'mealTemplates'>,
) {
  const rankTemplates = (templates: FitnessStateSnapshot['mealTemplates']) =>
    [...templates].sort((left, right) => {
      const leftTotals = getMealTemplateTotals(left)
      const rightTotals = getMealTemplateTotals(right)

      if (rightTotals.protein !== leftTotals.protein) {
        return rightTotals.protein - leftTotals.protein
      }

      const leftDensity = leftTotals.protein / Math.max(leftTotals.calories, 1)
      const rightDensity = rightTotals.protein / Math.max(rightTotals.calories, 1)

      if (rightDensity !== leftDensity) {
        return rightDensity - leftDensity
      }

      return left.name.localeCompare(right.name, 'zh-CN')
    })

  const breakfastTemplate = rankTemplates(
    snapshot.mealTemplates.filter((template) => template.mealType === 'breakfast'),
  )[0]

  if (breakfastTemplate) {
    return breakfastTemplate
  }

  return rankTemplates(snapshot.mealTemplates)[0] ?? null
}

function formatWeightAchievementTitle(
  direction: GoalProgressSummary['direction'],
  amount: number,
  {
    achieved,
  }: {
    achieved: boolean
  },
) {
  const formatted = Number(amount.toFixed(1))

  if (direction === 'gain') {
    return achieved ? `已增重 ${formatted} kg` : `已增重 ${formatted} kg`
  }

  if (direction === 'maintain') {
    return achieved ? '进入维持区间' : '继续维持在目标区间'
  }

  return achieved ? `已减重 ${formatted} kg` : `已减重 ${formatted} kg`
}

function getConsistencyScore({
  profile,
  meals,
  workouts,
  bodyEntries,
  recoveryEntries,
}: {
  profile: FitnessStateSnapshot['profile']
  meals: MealEntry[]
  workouts: WorkoutSession[]
  bodyEntries: BodyEntry[]
  recoveryEntries: RecoveryEntry[]
}) {
  const macros = sumMeals(meals)
  const scoreParts = [
    profile.dailyCalories > 0 ? Math.min(macros.calories / profile.dailyCalories, 1) : 0,
    profile.dailyProtein > 0 ? Math.min(macros.protein / profile.dailyProtein, 1) : 0,
    workouts.length > 0 ? 1 : 0,
    bodyEntries.length > 0 ? 1 : 0,
    recoveryEntries.length > 0 ? 1 : 0,
  ]

  return Math.round((scoreParts.reduce((sum, value) => sum + value, 0) / scoreParts.length) * 100)
}

function hasAnyLogOnDate(snapshot: FitnessStateSnapshot, targetDate: string) {
  return (
    getEntriesForDate(snapshot.mealEntries, targetDate).length > 0 ||
    getWorkoutsForDate(snapshot.workoutSessions, targetDate).length > 0 ||
    getEntriesForDate(snapshot.bodyEntries, targetDate).length > 0 ||
    getEntriesForDate(snapshot.recoveryEntries, targetDate).length > 0
  )
}

function getLastUsedTime(food: Food) {
  if (!food.lastUsedAt) {
    return 0
  }

  return Number.isNaN(Date.parse(food.lastUsedAt)) ? 0 : Date.parse(food.lastUsedAt)
}

function toCoachFoodSuggestion(food: Food): TodayCoachFoodSuggestion {
  return {
    foodId: food.id,
    name: food.name,
    servingLabel: food.servingLabel,
    protein: food.protein,
    calories: food.calories,
  }
}

const coachMealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const coachMealTypeLabels: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}

function scoreStarterFood(food: Food) {
  const proteinDensity = food.protein / Math.max(food.calories, 1)
  const balancedCalories =
    food.calories >= 180 && food.calories <= 650 ? 0.18 : food.calories < 180 ? 0.08 : 0

  return (
    food.protein +
    proteinDensity * 120 +
    balancedCalories * 100 +
    (food.isFavorite ? 16 : 0) +
    (food.lastUsedAt ? 10 : 0)
  )
}

function scoreProteinFood(
  food: Food,
  {
    proteinGap,
    caloriesLeft,
    dailyCalories,
  }: {
    proteinGap: number
    caloriesLeft: number
    dailyCalories: number
  },
) {
  const safeProteinGap = Math.max(proteinGap, 1)
  const proteinDensity = food.protein / Math.max(food.calories, 1)
  const proteinCoverage = Math.min(food.protein / safeProteinGap, 1)
  const calorieFit =
    caloriesLeft > 0
      ? Math.max(0, 1 - Math.max(food.calories - caloriesLeft, 0) / Math.max(caloriesLeft, 1))
      : Math.max(0, 1 - food.calories / Math.max(dailyCalories, 1))

  return (
    food.protein +
    proteinDensity * 180 +
    proteinCoverage * 50 +
    calorieFit * 32 +
    (food.isFavorite ? 12 : 0) +
    (food.lastUsedAt ? 8 : 0)
  )
}

function getCoachFoodSuggestions(
  snapshot: FitnessStateSnapshot,
  {
    mode,
    proteinGap,
    caloriesLeft,
    limit = 3,
  }: {
    mode: 'starter' | 'protein'
    proteinGap: number
    caloriesLeft: number
    limit?: number
  },
) {
  const scoredFoods = snapshot.foods
    .filter((food) => {
      if (mode === 'protein') {
        return food.protein >= 10
      }

      return food.calories > 0
    })
    .map((food) => ({
      food,
      score:
        mode === 'protein'
          ? scoreProteinFood(food, {
              proteinGap,
              caloriesLeft,
              dailyCalories: snapshot.profile.dailyCalories,
            })
          : scoreStarterFood(food),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      if (right.food.protein !== left.food.protein) {
        return right.food.protein - left.food.protein
      }

      return getLastUsedTime(right.food) - getLastUsedTime(left.food)
    })

  return scoredFoods.slice(0, limit).map(({ food }) => toCoachFoodSuggestion(food))
}

function toCoachMealPlanSuggestion(
  template: FitnessStateSnapshot['mealTemplates'][number],
): TodayCoachMealPlanSuggestion {
  return {
    templateId: template.id,
    templateName: template.name,
    mealType: template.mealType,
    itemCount: template.items.length,
  }
}

function getCoachMealPlanSuggestions(
  snapshot: Pick<FitnessStateSnapshot, 'mealEntries' | 'mealTemplates' | 'weeklyMealPlans'>,
  targetDate: string,
  limit = 2,
) {
  const weekday = createDateFromKey(targetDate).getDay()
  const loggedMealTypes = new Set(getEntriesForDate(snapshot.mealEntries, targetDate).map((entry) => entry.mealType))
  const templateById = new Map(snapshot.mealTemplates.map((template) => [template.id, template]))

  return snapshot.weeklyMealPlans
    .filter((plan) => plan.weekday === weekday && !loggedMealTypes.has(plan.mealType))
    .sort(
      (left, right) =>
        coachMealTypeOrder.indexOf(left.mealType) - coachMealTypeOrder.indexOf(right.mealType),
    )
    .map((plan) => templateById.get(plan.templateId))
    .filter((template): template is FitnessStateSnapshot['mealTemplates'][number] => template != null)
    .slice(0, limit)
    .map((template) => toCoachMealPlanSuggestion(template))
}

function toCoachWorkoutSuggestion(template: WorkoutTemplate): TodayCoachWorkoutSuggestion {
  return {
    templateId: template.id,
    name: template.name,
    kind: template.kind,
    durationMinutes: template.durationMinutes,
    estimatedCalories: template.estimatedCalories,
  }
}

function getWorkoutTemplateLastUsedAt(workoutSessions: WorkoutSession[], template: WorkoutTemplate) {
  const matchedSession = workoutSessions
    .filter((session) => session.title === template.name)
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0]

  if (!matchedSession) {
    return null
  }

  const timestamp = Date.parse(matchedSession.startedAt)
  return Number.isNaN(timestamp) ? null : timestamp
}

function getCoachWorkoutSuggestions(
  snapshot: Pick<FitnessStateSnapshot, 'workoutTemplates' | 'workoutSessions'>,
  {
    preferredKind,
    limit = 2,
  }: {
    preferredKind: WorkoutTemplate['kind']
    limit?: number
  },
) {
  const now = Date.now()

  const scoredTemplates = snapshot.workoutTemplates
    .map((template) => {
      const lastUsedAt = getWorkoutTemplateLastUsedAt(snapshot.workoutSessions, template)
      const freshnessScore =
        lastUsedAt == null ? 30 : Math.min(Math.max((now - lastUsedAt) / (1000 * 60 * 60 * 24), 0), 5) * 4
      const kindScore = template.kind === preferredKind ? 24 : 0
      const easeScore = template.durationMinutes <= 65 ? 8 : 0

      return {
        template,
        score: freshnessScore + kindScore + easeScore,
      }
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      if (left.template.durationMinutes !== right.template.durationMinutes) {
        return left.template.durationMinutes - right.template.durationMinutes
      }

      return left.template.name.localeCompare(right.template.name, 'zh-CN')
    })

  return scoredTemplates.slice(0, limit).map(({ template }) => toCoachWorkoutSuggestion(template))
}

function toCoachRecoverySuggestion(label: RecoveryPresetLabel): TodayCoachRecoverySuggestion {
  const preset = getRecoveryPresetByLabel(label)

  if (!preset) {
    throw new Error(`Unknown recovery preset: ${label}`)
  }

  return {
    label: preset.label,
    waterLiters: preset.waterLiters,
    steps: preset.steps,
    sleepHours: preset.sleepHours,
    energy: preset.energy,
  }
}

function getCoachRecoverySuggestions(daily: DailySummary) {
  const presetLabels: RecoveryPresetLabel[] =
    daily.trainingMinutes >= 60
      ? ['高压日', '标准日']
      : daily.trainingMinutes > 0
        ? ['标准日', '高压日']
        : ['标准日', '通勤日']

  return presetLabels.map((label) => toCoachRecoverySuggestion(label))
}

export function buildDailySummary(snapshot: FitnessStateSnapshot, targetDate: string): DailySummary {
  const meals = getEntriesForDate(snapshot.mealEntries, targetDate)
  const workouts = getWorkoutsForDate(snapshot.workoutSessions, targetDate)
  const bodyEntries = getEntriesForDate(snapshot.bodyEntries, targetDate)
  const recoveryEntries = getEntriesForDate(snapshot.recoveryEntries, targetDate)
  const latestRecoveryEntry = getLatestLoggedEntry(recoveryEntries)
  const macros = sumMeals(meals)

  return {
    ...macros,
    mealsLogged: meals.length,
    trainingMinutes: workouts.reduce((sum, workout) => sum + workout.durationMinutes, 0),
    trainingCalories: workouts.reduce((sum, workout) => sum + workout.estimatedCalories, 0),
    hasBodyEntry: bodyEntries.length > 0,
    recoveryLogged: recoveryEntries.length > 0,
    recoveryScore: latestRecoveryEntry ? getRecoveryScore(latestRecoveryEntry) : null,
    consistencyScore: getConsistencyScore({
      profile: snapshot.profile,
      meals,
      workouts,
      bodyEntries,
      recoveryEntries,
    }),
  }
}

export function buildWeeklySummary(snapshot: FitnessStateSnapshot, targetDate: string): WeeklySummary {
  const range = getRange(targetDate, 7)
  const mealDays = range
    .map((date) => sumMeals(getEntriesForDate(snapshot.mealEntries, date)))
    .filter((summary) => summary.calories > 0)
  const proteinGoalDays = mealDays.filter(
    (summary) => summary.protein >= snapshot.profile.dailyProtein,
  ).length
  const workouts = snapshot.workoutSessions.filter((session) =>
    range.includes(getWorkoutDateKey(session)),
  )
  const recoveryEntries = snapshot.recoveryEntries.filter((entry) =>
    range.includes(getLoggedEntryDateKey(entry)),
  )
  const bodyEntries = snapshot.bodyEntries
    .filter((entry) => range.includes(getLoggedEntryDateKey(entry)))
    .sort((left, right) => left.loggedAt.localeCompare(right.loggedAt))

  return {
    averageCalories: Number(averageOf(mealDays.map((summary) => summary.calories)).toFixed(0)),
    proteinGoalDays,
    trainingSessions: workouts.length,
    recoveryDays: recoveryEntries.length,
    averageSleepHours: Number(
      averageOf(recoveryEntries.map((entry) => entry.sleepHours)).toFixed(1),
    ),
    averageRecoveryScore: getAverageRecoveryScore(recoveryEntries),
    weeklyWeightDelta: getWeightDelta(bodyEntries),
  }
}

export function buildRangeSummary(
  snapshot: FitnessStateSnapshot,
  targetDate: string,
  span: number,
): RangeSummary {
  const range = getRange(targetDate, span)
  const dailySummaries = range.map((date) => buildDailySummary(snapshot, date))
  const workouts = snapshot.workoutSessions.filter((session) =>
    range.includes(getWorkoutDateKey(session)),
  )
  const recoveryEntries = snapshot.recoveryEntries.filter((entry) =>
    range.includes(getLoggedEntryDateKey(entry)),
  )
  const latestRecoveryEntry = getLatestLoggedEntry(recoveryEntries)
  const bodyEntries = snapshot.bodyEntries
    .filter((entry) => range.includes(getLoggedEntryDateKey(entry)))
    .sort((left, right) => left.loggedAt.localeCompare(right.loggedAt))

  return {
    span,
    averageCalories: Number(averageOf(dailySummaries.map((summary) => summary.calories)).toFixed(0)),
    averageProtein: Number(averageOf(dailySummaries.map((summary) => summary.protein)).toFixed(0)),
    proteinGoalDays: dailySummaries.filter(
      (summary) => summary.protein >= snapshot.profile.dailyProtein,
    ).length,
    calorieGoalDays: dailySummaries.filter(
      (summary) => summary.calories >= snapshot.profile.dailyCalories * 0.85,
    ).length,
    trainingSessions: workouts.length,
    trainingMinutes: workouts.reduce((sum, workout) => sum + workout.durationMinutes, 0),
    recoveryDays: recoveryEntries.length,
    bodyEntryDays: bodyEntries.length,
    averageSleepHours: Number(
      averageOf(recoveryEntries.map((entry) => entry.sleepHours)).toFixed(1),
    ),
    averageRecoveryScore: getAverageRecoveryScore(recoveryEntries),
    latestRecoveryScore: latestRecoveryEntry ? getRecoveryScore(latestRecoveryEntry) : null,
    latestRecoveryDateKey: latestRecoveryEntry ? getLoggedEntryDateKey(latestRecoveryEntry) : null,
    averageConsistency: Number(
      averageOf(dailySummaries.map((summary) => summary.consistencyScore)).toFixed(0),
    ),
    weightDelta: getWeightDelta(bodyEntries),
  }
}

export function buildAdherenceMetrics(
  snapshot: FitnessStateSnapshot,
  targetDate: string,
  span: number,
): AdherenceMetric[] {
  const range = getRange(targetDate, span)
  const dailySummaries = range.map((date) => buildDailySummary(snapshot, date))
  const totalDays = range.length || 1
  const averageScore = (values: number[]) =>
    Math.round((values.reduce((sum, value) => sum + value, 0) / totalDays) * 100)

  const metrics: AdherenceMetric[] = [
    {
      id: 'calories',
      label: '热量控制',
      score: averageScore(
        dailySummaries.map((summary) =>
          snapshot.profile.dailyCalories > 0
            ? Math.min(summary.calories / snapshot.profile.dailyCalories, 1)
            : 0,
        ),
      ),
    },
    {
      id: 'protein',
      label: '蛋白达标',
      score: averageScore(
        dailySummaries.map((summary) =>
          snapshot.profile.dailyProtein > 0
            ? Math.min(summary.protein / snapshot.profile.dailyProtein, 1)
            : 0,
        ),
      ),
    },
    {
      id: 'workout',
      label: '训练记录',
      score: averageScore(dailySummaries.map((summary) => (summary.trainingMinutes > 0 ? 1 : 0))),
    },
    {
      id: 'recovery',
      label: '恢复补录',
      score: averageScore(dailySummaries.map((summary) => (summary.recoveryLogged ? 1 : 0))),
    },
    {
      id: 'body',
      label: '体重记录',
      score: averageScore(dailySummaries.map((summary) => (summary.hasBodyEntry ? 1 : 0))),
    },
  ]

  return metrics.sort((left, right) => right.score - left.score)
}

export function buildWeightTrend(snapshot: FitnessStateSnapshot, targetDate: string): WeightTrend {
  const range = getRange(targetDate, 7)
  const points = snapshot.bodyEntries
    .filter((entry) => range.includes(getLoggedEntryDateKey(entry)))
    .sort((left, right) => left.loggedAt.localeCompare(right.loggedAt))
    .map((entry) => ({
      date: getLoggedEntryDateKey(entry),
      weight: entry.weight,
    }))

  const delta = points.length < 2 ? 0 : Number((points[points.length - 1].weight - points[0].weight).toFixed(2))
  const direction = delta === 0 ? 'flat' : delta < 0 ? 'down' : 'up'

  return {
    points,
    direction,
    delta,
  }
}

export function buildGoalProgressSummary(
  snapshot: FitnessStateSnapshot,
  targetDate: string,
): GoalProgressSummary {
  const { startWeight, targetWeight } = snapshot.profile
  const direction = getDirectionFromWeights(startWeight, targetWeight)
  const latestBodyEntry = getLatestBodyEntryOnOrBeforeDate(snapshot.bodyEntries, targetDate)
  const currentWeight = latestBodyEntry?.weight ?? startWeight
  const totalChange = Number(Math.abs(startWeight - targetWeight).toFixed(1))

  if (direction === 'maintain' || totalChange === 0) {
    return {
      direction,
      startWeight,
      currentWeight,
      targetWeight,
      totalChange,
      completedChange: 0,
      remainingChange: 0,
      progressPercent: 100,
      nextMilestoneWeight: null,
      nextMilestoneChange: 0,
    }
  }

  const rawCompleted =
    direction === 'cut' ? startWeight - currentWeight : currentWeight - startWeight
  const completedChange = Number(clampNumber(rawCompleted, 0, totalChange).toFixed(1))
  const remainingChange = Number(Math.max(totalChange - completedChange, 0).toFixed(1))
  const progressPercent = Math.round((completedChange / totalChange) * 100)

  let nextMilestoneWeight: number | null = null

  if (remainingChange > 0) {
    if (direction === 'cut') {
      const aligned = Math.floor(currentWeight * 2) / 2
      const candidate = aligned < currentWeight ? aligned : aligned - 0.5
      nextMilestoneWeight = candidate >= targetWeight ? Number(candidate.toFixed(1)) : targetWeight
    } else {
      const aligned = Math.ceil(currentWeight * 2) / 2
      const candidate = aligned > currentWeight ? aligned : aligned + 0.5
      nextMilestoneWeight = candidate <= targetWeight ? Number(candidate.toFixed(1)) : targetWeight
    }
  }

  const nextMilestoneChange =
    nextMilestoneWeight == null ? 0 : Number(Math.abs(currentWeight - nextMilestoneWeight).toFixed(1))

  return {
    direction,
    startWeight,
    currentWeight,
    targetWeight,
    totalChange,
    completedChange,
    remainingChange,
    progressPercent,
    nextMilestoneWeight,
    nextMilestoneChange,
  }
}

export function buildGoalForecastSummary(
  snapshot: FitnessStateSnapshot,
  targetDate: string,
): GoalForecastSummary {
  const progress = buildGoalProgressSummary(snapshot, targetDate)
  const weeklyRateGoal = Number(snapshot.profile.weeklyRateGoal.toFixed(2))

  if (progress.direction === 'maintain') {
    return {
      direction: progress.direction,
      currentWeight: progress.currentWeight,
      targetWeight: progress.targetWeight,
      remainingChange: 0,
      weeklyRateGoal,
      etaWeeks: 0,
      etaDateKey: targetDate,
      status: 'maintain',
    }
  }

  if (progress.remainingChange <= 0) {
    return {
      direction: progress.direction,
      currentWeight: progress.currentWeight,
      targetWeight: progress.targetWeight,
      remainingChange: 0,
      weeklyRateGoal,
      etaWeeks: 0,
      etaDateKey: targetDate,
      status: 'at-goal',
    }
  }

  if (weeklyRateGoal <= 0) {
    return {
      direction: progress.direction,
      currentWeight: progress.currentWeight,
      targetWeight: progress.targetWeight,
      remainingChange: progress.remainingChange,
      weeklyRateGoal,
      etaWeeks: 0,
      etaDateKey: null,
      status: 'paused',
    }
  }

  const etaWeeks = Math.max(1, Math.ceil(progress.remainingChange / weeklyRateGoal))

  return {
    direction: progress.direction,
    currentWeight: progress.currentWeight,
    targetWeight: progress.targetWeight,
    remainingChange: progress.remainingChange,
    weeklyRateGoal,
    etaWeeks,
    etaDateKey: shiftDateKey(targetDate, etaWeeks * 7),
    status: 'active',
  }
}

export function buildConsistencyCalendar(
  snapshot: FitnessStateSnapshot,
  targetDate: string,
  span: number,
): ConsistencyCalendarSummary {
  const range = getRange(targetDate, span)
  let currentStreak = 0
  let bestLoggingStreak = 0

  const days = range.map((dateKey) => {
    const daily = buildDailySummary(snapshot, dateKey)
    const hasAnyLog = hasAnyLogOnDate(snapshot, dateKey)

    if (hasAnyLog) {
      currentStreak += 1
      bestLoggingStreak = Math.max(bestLoggingStreak, currentStreak)
    } else {
      currentStreak = 0
    }

    return {
      dateKey,
      score: daily.consistencyScore,
      intensity: getConsistencyIntensity(daily.consistencyScore),
      hasAnyLog,
    }
  })

  return {
    days,
    fullDays: days.filter((day) => day.intensity === 'full').length,
    blankDays: days.filter((day) => !day.hasAnyLog).length,
    averageScore: Number(averageOf(days.map((day) => day.score)).toFixed(0)),
    bestLoggingStreak,
  }
}

export function buildWorkoutRhythmSummary(
  snapshot: Pick<FitnessStateSnapshot, 'workoutSessions'>,
  targetDate: string,
): WorkoutRhythmSummary {
  const weeklyTarget = 4
  const range = getRange(targetDate, 7)
  const days = range.map((dateKey) => {
    const sessions = getWorkoutsForDate(snapshot.workoutSessions, dateKey)
    const minutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0)
    const calories = sessions.reduce((sum, session) => sum + session.estimatedCalories, 0)
    const strengthCount = sessions.filter((session) => session.kind === 'strength').length
    const cardioCount = sessions.filter((session) => session.kind === 'cardio').length

    return {
      dateKey,
      minutes,
      calories,
      sessionCount: sessions.length,
      strengthCount,
      cardioCount,
      intensity: getWorkoutLoadIntensity(minutes),
    }
  })

  const sessionCount = days.reduce((sum, day) => sum + day.sessionCount, 0)
  const totalMinutes = days.reduce((sum, day) => sum + day.minutes, 0)
  const totalCalories = days.reduce((sum, day) => sum + day.calories, 0)
  const strengthSessions = days.reduce((sum, day) => sum + day.strengthCount, 0)
  const cardioSessions = days.reduce((sum, day) => sum + day.cardioCount, 0)
  const activeDays = days.filter((day) => day.sessionCount > 0).length
  const remainingSessions = Math.max(weeklyTarget - sessionCount, 0)
  const averageSessionMinutes = sessionCount > 0 ? Math.round(totalMinutes / sessionCount) : 0
  const longestSessionMinutes = Math.max(...days.map((day) => day.minutes), 0)
  const focusLabel = getWorkoutFocusLabel(strengthSessions, cardioSessions)
  const headline =
    remainingSessions > 0 ? `本周还差 ${remainingSessions} 次训练` : '本周训练节奏已稳住'
  const detail =
    sessionCount > 0
      ? `近 7 天共 ${sessionCount} 次训练，${totalMinutes} 分钟，力量 ${strengthSessions} 次 / 有氧 ${cardioSessions} 次。`
      : '近 7 天还没有训练记录，先落一笔，节奏面板就会开始判断。'

  return {
    weeklyTarget,
    sessionCount,
    remainingSessions,
    activeDays,
    totalMinutes,
    totalCalories,
    strengthSessions,
    cardioSessions,
    averageSessionMinutes,
    longestSessionMinutes,
    focusLabel,
    headline,
    detail,
    days,
  }
}

export function buildWorkoutHistorySummary(
  snapshot: Pick<FitnessStateSnapshot, 'workoutSessions'>,
  targetDate: string,
  filters: WorkoutHistoryFilters,
): WorkoutHistorySummary {
  const rangeDates = new Set(getRange(targetDate, filters.rangeDays))
  const query = filters.query.trim().toLowerCase()
  const inRangeItems = snapshot.workoutSessions
    .filter((session) => rangeDates.has(getWorkoutDateKey(session)))
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt))

  const items = inRangeItems.filter((session) => {
    if (filters.kind !== 'all' && session.kind !== filters.kind) {
      return false
    }

    if (!query) {
      return true
    }

    return [session.title, session.notes, ...session.exercises.map((exercise) => exercise.name)].some((value) =>
      value.toLowerCase().includes(query),
    )
  })

  return {
    items,
    totalInRange: inRangeItems.length,
    filteredCount: items.length,
  }
}

export function buildBodyHistorySummary(
  snapshot: Pick<FitnessStateSnapshot, 'bodyEntries' | 'recoveryEntries'>,
  targetDate: string,
  filters: BodyHistoryFilters,
): BodyHistorySummary {
  const rangeDates = new Set(getRange(targetDate, filters.rangeDays))
  const query = filters.query.trim().toLowerCase()

  const normalizedItems: BodyHistoryItem[] = [
    ...snapshot.bodyEntries.map((entry) => {
      const dateKey = resolveDateKey(entry.dateKey, entry.loggedAt)
      const measurementItems = [
        entry.bodyFat != null ? `体脂 ${entry.bodyFat}%` : null,
        entry.waist != null ? `腰围 ${entry.waist} cm` : null,
        entry.chest != null ? `胸围 ${entry.chest} cm` : null,
        entry.hips != null ? `臀围 ${entry.hips} cm` : null,
      ].filter(Boolean)

      return {
        id: entry.id,
        kind: 'body' as const,
        dateKey,
        loggedAt: entry.loggedAt,
        title: `${entry.weight.toFixed(1)} kg`,
        detail: measurementItems.length > 0 ? measurementItems.join(' / ') : '身体记录',
        searchText: [
          dateKey,
          entry.weight.toFixed(1),
          entry.bodyFat != null ? `体脂 ${entry.bodyFat}` : '',
          entry.waist != null ? `腰围 ${entry.waist}` : '',
          entry.chest != null ? `胸围 ${entry.chest}` : '',
          entry.hips != null ? `臀围 ${entry.hips}` : '',
        ]
          .join(' ')
          .toLowerCase(),
      }
    }),
    ...snapshot.recoveryEntries.map((entry) => {
      const dateKey = resolveDateKey(entry.dateKey, entry.loggedAt)

      return {
        id: entry.id,
        kind: 'recovery' as const,
        dateKey,
        loggedAt: entry.loggedAt,
        title: `${entry.sleepHours} 小时睡眠`,
        detail: `${entry.steps} 步 / ${entry.waterLiters} L 喝水 / ${entry.energy} / 5 精力`,
        searchText: [
          dateKey,
          `${entry.sleepHours} 小时睡眠`,
          `${entry.steps} 步`,
          `${entry.waterLiters} 喝水`,
          `${entry.energy} 精力`,
        ]
          .join(' ')
          .toLowerCase(),
      }
    }),
  ]
    .filter((item) => rangeDates.has(item.dateKey))
    .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))

  const items = normalizedItems.filter((item) => {
    if (filters.kind !== 'all' && item.kind !== filters.kind) {
      return false
    }

    if (!query) {
      return true
    }

    return item.searchText.includes(query)
  })

  return {
    items,
    totalInRange: normalizedItems.length,
    filteredCount: items.length,
  }
}

export function buildMealReuseSummary(
  snapshot: Pick<FitnessStateSnapshot, 'foods'>,
  targetDate: string,
  filters: MealReuseFilters,
): MealReuseSummary {
  const rangeDates = new Set(getRange(targetDate, filters.rangeDays))
  const query = filters.query.trim().toLowerCase()

  const normalizedItems: MealReuseItem[] = snapshot.foods
    .filter((food) => {
      const inRange = food.lastUsedAt ? rangeDates.has(getLocalDateKeyFromIso(food.lastUsedAt)) : false

      if (filters.source === 'favorite') {
        return food.isFavorite
      }

      if (filters.source === 'recent') {
        return inRange
      }

      return food.isFavorite || inRange
    })
    .map((food) => ({
      id: food.id,
      foodId: food.id,
      name: food.name,
      servingLabel: food.servingLabel,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      isFavorite: food.isFavorite,
      lastUsedAt: food.lastUsedAt,
      lastUsedDateKey: food.lastUsedAt ? getLocalDateKeyFromIso(food.lastUsedAt) : null,
      searchText: [
        food.name,
        food.servingLabel,
        `${food.calories}`,
        `${food.protein}`,
        `${food.carbs}`,
        `${food.fat}`,
        food.lastUsedAt ? getLocalDateKeyFromIso(food.lastUsedAt) : '',
      ]
        .join(' ')
        .toLowerCase(),
    }))
    .sort((left, right) => {
      if (left.isFavorite !== right.isFavorite) {
        return left.isFavorite ? -1 : 1
      }

      return (right.lastUsedAt ?? '').localeCompare(left.lastUsedAt ?? '')
    })

  const items = normalizedItems.filter((item) => {
    if (!query) {
      return true
    }

    return item.searchText.includes(query)
  })

  return {
    items,
    totalInRange: normalizedItems.length,
    filteredCount: items.length,
  }
}

export function buildPhotoEstimateHistorySummary(
  snapshot: Pick<FitnessStateSnapshot, 'photoEstimateRecords'>,
  targetDate: string,
  filters: PhotoEstimateHistoryFilters,
): PhotoEstimateHistorySummary {
  const rangeDates = new Set(getRange(targetDate, filters.rangeDays))
  const query = filters.query.trim().toLowerCase()

  const inRangeItems = snapshot.photoEstimateRecords
    .filter((record) => rangeDates.has(resolveDateKey(record.dateKey, record.loggedAt)))
    .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))

  const items = inRangeItems.filter((record) => {
    if (filters.scene !== 'all' && record.scene !== filters.scene) {
      return false
    }

    if (!query) {
      return true
    }

    return [
      record.foodName,
      record.servingLabel,
      `${record.calories}`,
      `${record.protein}`,
      ...record.reasons,
      resolveDateKey(record.dateKey, record.loggedAt),
    ]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })

  return {
    items,
    totalInRange: inRangeItems.length,
    filteredCount: items.length,
  }
}

export function buildTodayMomentumSummary(
  snapshot: FitnessStateSnapshot,
  targetDate: string,
): TodayMomentumSummary {
  const goalProgress = buildGoalProgressSummary(snapshot, targetDate)
  const weekly = buildWeeklySummary(snapshot, targetDate)
  const coach = buildTodayCoachSummary(snapshot, targetDate)
  const stageLabel =
    goalProgress.direction === 'cut'
      ? '减脂阶段'
      : goalProgress.direction === 'gain'
        ? '增肌阶段'
        : '维持阶段'

  const headline =
    goalProgress.nextMilestoneWeight != null
      ? `再减 ${goalProgress.nextMilestoneChange.toFixed(1)} kg，就能拿下 ${goalProgress.nextMilestoneWeight.toFixed(1)} kg 节点`
      : '已经进入当前目标区间'

  const detail =
    goalProgress.direction === 'maintain'
      ? '继续把训练、饮食和恢复稳定住，维持会越来越轻松。'
      : `已经从起点走了 ${goalProgress.progressPercent}% ，当前最稳的是 ${coach.strongestMetric}。`

  const badges: TodayMomentumBadge[] = [
    {
      id: 'weight',
      title:
        goalProgress.direction === 'gain'
          ? `已增 ${goalProgress.completedChange.toFixed(1)} kg`
          : `已减 ${goalProgress.completedChange.toFixed(1)} kg`,
      detail: `当前 ${goalProgress.currentWeight.toFixed(1)} kg`,
    },
    {
      id: 'streak',
      title: `连记 ${coach.loggingStreak} 天`,
      detail:
        coach.completeDaysLast7 > 0
          ? `近 7 天有 ${coach.completeDaysLast7} 天完整日`
          : '先把第一天完整日做出来',
    },
    {
      id: 'training',
      title: `本周已训 ${weekly.trainingSessions} 次`,
      detail:
        weekly.trainingSessions >= 2 ? '训练节奏在起势' : '再补一次，节奏会稳很多',
    },
  ]

  const missions: TodayMomentumMission[] = [
    {
      id: 'training',
      title: '本周训练',
      current: weekly.trainingSessions,
      target: 4,
      unit: '次',
      progressPercent: Math.min(Math.round((weekly.trainingSessions / 4) * 100), 100),
      status: getMissionStatus(weekly.trainingSessions, 4),
    },
    {
      id: 'protein',
      title: '蛋白达标',
      current: weekly.proteinGoalDays,
      target: 4,
      unit: '天',
      progressPercent: Math.min(Math.round((weekly.proteinGoalDays / 4) * 100), 100),
      status: getMissionStatus(weekly.proteinGoalDays, 4),
    },
    {
      id: 'recovery',
      title: '恢复记录',
      current: weekly.recoveryDays,
      target: 5,
      unit: '天',
      progressPercent: Math.min(Math.round((weekly.recoveryDays / 5) * 100), 100),
      status: getMissionStatus(weekly.recoveryDays, 5),
    },
  ]

  return {
    stageLabel,
    headline,
    detail,
    badges,
    missions,
  }
}

export function buildTodayAchievementSummary(
  snapshot: FitnessStateSnapshot,
  targetDate: string,
): TodayAchievementSummary {
  const goalProgress = buildGoalProgressSummary(snapshot, targetDate)
  const weekly = buildWeeklySummary(snapshot, targetDate)
  const coach = buildTodayCoachSummary(snapshot, targetDate)

  const unlocked: TodayAchievementItem[] = []

  if (goalProgress.direction !== 'maintain' && goalProgress.completedChange >= 1) {
    unlocked.push({
      id: 'weight-1',
      title: formatWeightAchievementTitle(goalProgress.direction, 1, { achieved: true }),
      detail: `当前 ${goalProgress.currentWeight.toFixed(1)} kg`,
      progressLabel: `${goalProgress.completedChange.toFixed(1)} / 1 kg`,
      progressPercent: 100,
    })
  }

  if (coach.loggingStreak >= 3) {
    unlocked.push({
      id: 'streak-3',
      title: '连续记录 3 天',
      detail: `近 7 天有 ${coach.completeDaysLast7} 天完整日`,
      progressLabel: `${coach.loggingStreak} / 3 天`,
      progressPercent: 100,
    })
  }

  if (weekly.trainingSessions >= 2) {
    unlocked.push({
      id: 'training-2',
      title: '本周完成 2 次训练',
      detail: `${weekly.trainingSessions} 次训练已经落地`,
      progressLabel: `${weekly.trainingSessions} / 2 次`,
      progressPercent: 100,
    })
  }

  const nextCandidates: TodayAchievementItem[] = []

  if (coach.loggingStreak < 7) {
    nextCandidates.push({
      id: 'streak-7',
      title: '连续记录 7 天',
      detail: '一周不断档，首页会开始有明显节奏感。',
      progressLabel: `${coach.loggingStreak} / 7 天`,
      progressPercent: Math.min(Math.round((coach.loggingStreak / 7) * 100), 100),
    })
  }

  if (goalProgress.direction !== 'maintain' && goalProgress.completedChange < 3) {
    nextCandidates.push({
      id: 'weight-3',
      title: formatWeightAchievementTitle(goalProgress.direction, 3, { achieved: false }),
      detail: goalProgress.nextMilestoneWeight
        ? `先拿下 ${goalProgress.nextMilestoneWeight.toFixed(1)} kg，离 3 kg 会更近。`
        : '继续把这段体重趋势稳住。',
      progressLabel: `${goalProgress.completedChange.toFixed(1)} / 3 kg`,
      progressPercent: Math.min(Math.round((goalProgress.completedChange / 3) * 100), 100),
    })
  }

  if (weekly.proteinGoalDays < 4) {
    nextCandidates.push({
      id: 'protein-4',
      title: '蛋白达标 4 天',
      detail: '先把一周里的蛋白节奏做出来，恢复会更稳。',
      progressLabel: `${weekly.proteinGoalDays} / 4 天`,
      progressPercent: Math.min(Math.round((weekly.proteinGoalDays / 4) * 100), 100),
    })
  }

  return {
    unlockedCount: unlocked.length,
    unlocked: unlocked.slice(0, 3),
    nextUp: nextCandidates
      .sort((left, right) => right.progressPercent - left.progressPercent)
      .slice(0, 2),
  }
}

export function buildTodayCoachSummary(
  snapshot: FitnessStateSnapshot,
  targetDate: string,
): TodayCoachSummary {
  const daily = buildDailySummary(snapshot, targetDate)
  const workoutRhythm = buildWorkoutRhythmSummary(snapshot, targetDate)
  const completeDaysLast7 = getRange(targetDate, 7)
    .map((date) => buildDailySummary(snapshot, date))
    .filter((summary) => summary.consistencyScore >= 75).length
  const adherence = buildAdherenceMetrics(snapshot, targetDate, 7)
  const strongestMetric = adherence[0]?.label ?? '记录节奏'
  const weakestMetric = adherence.at(-1)?.label ?? '记录节奏'
  const actions: TodayCoachAction[] = []
  const proteinGap = Math.max(snapshot.profile.dailyProtein - daily.protein, 0)
  const caloriesLeft = Math.max(snapshot.profile.dailyCalories - daily.calories, 0)
  const plannedMealSuggestions = getCoachMealPlanSuggestions(snapshot, targetDate)

  let loggingStreak = 0
  let cursor = targetDate

  while (loggingStreak < 30 && hasAnyLogOnDate(snapshot, cursor)) {
    loggingStreak += 1
    cursor = shiftDateKey(cursor, -1)
  }

  if (plannedMealSuggestions.length > 0) {
    const primaryPlan = plannedMealSuggestions[0]
    const primaryMealLabel = coachMealTypeLabels[primaryPlan.mealType]

    actions.push({
      id: 'meal-plan',
      title:
        plannedMealSuggestions.length > 1
          ? `今天还有 ${plannedMealSuggestions.length} 个计划餐次没落`
          : `计划里的${primaryMealLabel}先带进来`,
      detail:
        plannedMealSuggestions.length > 1
          ? `今天的周计划里还有 ${plannedMealSuggestions.length} 个餐次没记，先从 ${primaryPlan.templateName} 开始会比手填更快。`
          : `今天的周计划里已经排了 ${primaryPlan.templateName}，一键带入这顿会更快。`,
      status: 'todo',
      action: 'meal',
      plannedMealSuggestions,
    })
  } else if (daily.mealsLogged === 0) {
    actions.push({
      id: 'meal',
      title: '先记一餐',
      detail: '今天还没有饮食记录，先带一份熟悉的食物进来，首页数据会立刻完整很多。',
      status: 'todo',
      action: 'meal',
      suggestions: getCoachFoodSuggestions(snapshot, {
        mode: 'starter',
        proteinGap: Math.max(snapshot.profile.dailyProtein * 0.25, 30),
        caloriesLeft: snapshot.profile.dailyCalories,
      }),
    })
  } else if (proteinGap > 0) {
    actions.push({
      id: 'protein',
      title: `还差 ${proteinGap} g 蛋白`,
      detail:
        caloriesLeft <= 360
          ? '热量空间已经不算多了，优先补一份更干净的高蛋白选项。'
          : '先补一份高蛋白，再把剩余热量留给正餐或训练后加餐。',
      status: 'watch',
      action: 'meal',
      suggestions: getCoachFoodSuggestions(snapshot, {
        mode: 'protein',
        proteinGap,
        caloriesLeft,
      }),
    })
  }

  if (daily.trainingMinutes === 0) {
    actions.push({
      id: 'workout',
      title: '今天还没记训练',
      detail: '哪怕只是一次快走或一组力量，也值得先落一笔。',
      status: 'todo',
      action: 'workout',
    })
  }

  const workoutAction = actions.find((action) => action.id === 'workout')
  if (workoutAction) {
    const preferredWorkoutKind =
      workoutRhythm.strengthSessions <= workoutRhythm.cardioSessions ? 'strength' : 'cardio'
    const workoutSuggestions = getCoachWorkoutSuggestions(snapshot, {
      preferredKind: preferredWorkoutKind,
    })

    if (workoutRhythm.remainingSessions > 0) {
      workoutAction.title = `\u672c\u5468\u8fd8\u5dee ${workoutRhythm.remainingSessions} \u6b21\u8bad\u7ec3`
    }

    if (workoutSuggestions.length > 0) {
      workoutAction.detail = `\u5148\u4ece ${workoutSuggestions[0].name} \u8fd9\u79cd\u6a21\u677f\u5f00\u7ec3\uff0c\u8865\u4e0a\u4e00\u6b21\u540e\u672c\u5468\u8282\u594f\u4f1a\u7a33\u5f88\u591a\u3002`
      workoutAction.workoutSuggestions = workoutSuggestions
    }
  }

  if (!daily.recoveryLogged) {
    actions.push({
      id: 'recovery',
      title: '补一下恢复记录',
      detail: '把喝水、睡眠和步数补上，今天的恢复面板和执行分都会更准。',
      status: 'todo',
      action: 'recovery',
      recoverySuggestions: getCoachRecoverySuggestions(daily),
    })
  }

  if (!daily.hasBodyEntry) {
    actions.push({
      id: 'body',
      title: '今天还没记体重',
      detail: '补一笔称重后，体重趋势和阶段变化会更完整。',
      status: 'watch',
      action: 'body',
    })
  }

  if (actions.length === 0) {
    actions.push({
      id: 'done',
      title: '今天的记录已经挺齐了',
      detail: '晚点回来补最后一餐或看一眼趋势，就能把这一天收得很漂亮。',
      status: 'done',
      action: null,
    })
  }

  return {
    loggingStreak,
    completeDaysLast7,
    strongestMetric,
    weakestMetric,
    actions: actions.slice(0, 3),
  }
}

export function buildWeeklyReviewSummary(
  snapshot: FitnessStateSnapshot,
  targetDate: string,
): WeeklyReviewSummary {
  const rangeSummary = buildRangeSummary(snapshot, targetDate, 7)
  const adherence = buildAdherenceMetrics(snapshot, targetDate, 7)
  const goalProgress = buildGoalProgressSummary(snapshot, targetDate)
  const weekly = buildWeeklySummary(snapshot, targetDate)
  const trend = buildWeightTrend(snapshot, targetDate)
  const coach = buildTodayCoachSummary(snapshot, targetDate)
  const strongestMetric = adherence[0]
  const weakestMetric = adherence.at(-1)
  const trendDeltaLabel = `${Math.abs(trend.delta).toFixed(1)} kg`

  const findings: WeeklyReviewFinding[] = [
    {
      id: 'strongest',
      tone: 'positive',
      title: `这周最稳的是${strongestMetric?.label ?? '记录节奏'}`,
      detail:
        strongestMetric != null
          ? `${strongestMetric.label}已经开始形成稳定动作，这块可以继续按现在的节奏推进。`
          : '先把这一周的记录拉起来，复盘才会开始出现稳定结论。',
    },
    (() => {
      if (
        goalProgress.direction !== 'maintain' &&
        rangeSummary.bodyEntryDays >= 2 &&
        ((goalProgress.direction === 'cut' && trend.direction === 'down') ||
          (goalProgress.direction === 'gain' && trend.direction === 'up'))
      ) {
        return {
          id: 'trend',
          tone: 'positive',
          title:
            goalProgress.direction === 'cut'
              ? '这周体重方向和减脂目标一致'
              : '这周体重方向和增肌目标一致',
          detail: `近 7 天体重变化 ${trendDeltaLabel}，当前阶段方向没有跑偏。`,
        } satisfies WeeklyReviewFinding
      }

      if (goalProgress.direction !== 'maintain' && rangeSummary.bodyEntryDays < 2) {
        return {
          id: 'trend',
          tone: 'watch',
          title: '这周体重记录还不够看清方向',
          detail: '当前阶段至少需要 2 次体重锚点，趋势判断才不容易跑偏。',
        } satisfies WeeklyReviewFinding
      }

      if (goalProgress.direction === 'maintain') {
        return {
          id: 'trend',
          tone: trend.direction === 'flat' ? 'positive' : 'watch',
          title:
            trend.direction === 'flat'
              ? '这周体重基本稳在维持区间'
              : '这周体重波动偏大，维持区间还没稳住',
          detail:
            trend.direction === 'flat'
              ? '最近几次体重落点比较靠近，维持阶段的稳定性正在形成。'
              : `近 7 天体重变化 ${trendDeltaLabel}，先把饮食和恢复的完整度补齐再看。`,
        } satisfies WeeklyReviewFinding
      }

      if (trend.direction === 'flat') {
        return {
          id: 'trend',
          tone: 'watch',
          title: '这周体重趋势还没明显动起来',
          detail: '方向暂时不算偏，但变化还不够清晰，先把本周记录继续补稳。',
        } satisfies WeeklyReviewFinding
      }

      return {
        id: 'trend',
        tone: 'watch',
        title:
          goalProgress.direction === 'cut'
            ? '这周体重方向和减脂目标有点拧'
            : '这周体重方向和增肌目标有点拧',
        detail: `近 7 天体重变化 ${trendDeltaLabel}，先看热量、恢复和记录完整度。`,
      } satisfies WeeklyReviewFinding
    })(),
    {
      id: 'gap',
      tone: 'watch',
      title: `这周最拖后腿的是${weakestMetric?.label ?? '记录节奏'}`,
      detail:
        coach.completeDaysLast7 < 3
          ? `完整日只有 ${coach.completeDaysLast7} / 7，弱项会被放得更明显。`
          : `${weakestMetric?.label ?? '这项'}还没跟上本周节奏，下周优先把它拉回目标线。`,
    },
  ]

  const recommendations: WeeklyReviewRecommendation[] = []

  if (rangeSummary.averageConsistency < 60 || coach.completeDaysLast7 < 3) {
    recommendations.push({
      id: 'consistency',
      tone: 'risk',
      title: '先把完整记录拉回 3 天',
      detail: `近 7 天只有 ${coach.completeDaysLast7} 天接近完整记录，很多判断还不够稳。`,
      targetLabel: '完整日 >= 3 / 7',
      priority: weeklyReviewRecommendationPriority.consistency,
    })
  }

  if (goalProgress.direction !== 'maintain' && rangeSummary.bodyEntryDays < 2) {
    recommendations.push({
      id: 'body',
      tone: 'risk',
      title: '先把体重记录补到 2 / 7 天',
      detail: '当前阶段需要至少两次体重锚点，趋势判断才不容易跑偏。',
      targetLabel: '体重记录 >= 2 / 7',
      priority: weeklyReviewRecommendationPriority.body,
    })
  }

  if (weekly.recoveryDays < 5) {
    recommendations.push({
      id: 'recovery',
      tone: 'watch',
      title: '先把恢复记录补到 5 / 7 天',
      detail: `这周只记了 ${weekly.recoveryDays} 天恢复，睡眠和疲劳趋势还不够连续。`,
      targetLabel: '恢复记录 >= 5 / 7',
      priority: weeklyReviewRecommendationPriority.recovery,
    })
  }

  if (weekly.proteinGoalDays < 4) {
    recommendations.push({
      id: 'protein',
      tone: 'watch',
      title: '把蛋白达标拉回 4 / 7 天',
      detail: `这周只有 ${weekly.proteinGoalDays} 天蛋白够线，训练后的恢复会被拖慢。`,
      targetLabel: '蛋白达标 >= 4 / 7',
      priority: weeklyReviewRecommendationPriority.protein,
    })
  }

  if (weekly.trainingSessions < 4) {
    recommendations.push({
      id: 'workout',
      tone: 'watch',
      title: '把训练频率补到 4 / 7 天',
      detail: `这周只完成 ${weekly.trainingSessions} 次训练，训练节奏还没完全站住。`,
      targetLabel: '训练记录 >= 4 / 7',
      priority: weeklyReviewRecommendationPriority.workout,
    })
  }

  const prioritizedRecommendations = recommendations
    .sort((left, right) => left.priority - right.priority)
    .slice(0, 3)

  let risk: WeeklyReviewRisk | null = null

  if (goalProgress.direction !== 'maintain' && rangeSummary.bodyEntryDays < 2) {
    risk = {
      id: 'missing-body',
      title: '这周体重记录太少',
      detail: '当前阶段依赖体重方向判断，至少补到 2 / 7 天再看周趋势。',
    }
  } else if (weekly.recoveryDays <= 1) {
    risk = {
      id: 'missing-recovery',
      title: '这周恢复记录太少',
      detail: '恢复只记了一点点，睡眠和疲劳状态还不够连续，先别急着下判断。',
    }
  } else if (coach.completeDaysLast7 < 3 || rangeSummary.averageConsistency < 60) {
    risk = {
      id: 'fragmented-logging',
      title: '这周记录偏碎，先补齐再看趋势',
      detail: `近 7 天只有 ${coach.completeDaysLast7} 天接近完整记录，很多结论都还带着噪音。`,
    }
  }

  return {
    findings,
    recommendations: prioritizedRecommendations,
    risk,
    topReminder: prioritizedRecommendations[0] ?? null,
  }
}

export function buildWeeklyReportSummary(
  snapshot: FitnessStateSnapshot,
  targetDate: string,
): WeeklyReportSummary {
  const goalProgress = buildGoalProgressSummary(snapshot, targetDate)
  const rangeSummary = buildRangeSummary(snapshot, targetDate, 7)
  const adherence = buildAdherenceMetrics(snapshot, targetDate, 7)
  const weeklyReview = buildWeeklyReviewSummary(snapshot, targetDate)
  const trend = buildWeightTrend(snapshot, targetDate)
  const strongestMetric = adherence[0]?.label ?? '记录节奏'
  const weakestMetric = adherence.at(-1)?.label ?? '记录节奏'
  const periodLabel = `${formatShortDateKey(shiftDateKey(targetDate, -6))} - ${formatShortDateKey(targetDate)}`
  const stageLabel =
    goalProgress.direction === 'cut'
      ? '减脂阶段'
      : goalProgress.direction === 'gain'
        ? '增肌阶段'
        : '维持阶段'
  const nextLine =
    weeklyReview.topReminder != null
      ? weeklyReview.recommendations[1] != null
        ? `${weeklyReview.topReminder.title}；再把${weeklyReview.recommendations[1].title.replace(/^先把|^把/, '')}。`
        : `${weeklyReview.topReminder.title}。`
      : '保持现在的记录节奏。'

  const sections: WeeklyReportSection[] = [
    {
      id: 'progress',
      label: '阶段进度',
      text:
        goalProgress.direction === 'maintain'
          ? `${stageLabel}，当前 ${goalProgress.currentWeight.toFixed(1)} kg，已经回到目标区间附近。`
          : `${stageLabel}，当前 ${goalProgress.currentWeight.toFixed(1)} kg，离目标还剩 ${goalProgress.remainingChange.toFixed(1)} kg，已完成 ${goalProgress.progressPercent}%。`,
    },
    {
      id: 'execution',
      label: '本周执行',
      text: `蛋白达标 ${rangeSummary.proteinGoalDays}/7 天，训练 ${rangeSummary.trainingSessions} 次（${rangeSummary.trainingMinutes} 分钟），恢复记录 ${rangeSummary.recoveryDays}/7 天，体重 7 天变化 ${formatSignedDelta(trend.delta)}。`,
    },
    {
      id: 'strength',
      label: '最稳项',
      text: strongestMetric,
    },
    {
      id: 'gap',
      label: '当前缺口',
      text: weakestMetric,
    },
    {
      id: 'next',
      label: '下周优先',
      text: nextLine,
    },
  ]

  return {
    title: '本周周报',
    periodLabel,
    sections,
    shareText: [
      `燃刻本周周报｜${periodLabel}`,
      ...sections.map((section) => `${section.label}：${section.text}`),
    ].join('\n'),
  }
}

export function buildWeeklyPlanAdherenceSummary(
  snapshot: Pick<
    FitnessStateSnapshot,
    'mealEntries' | 'weeklyMealPlans' | 'workoutSessions' | 'weeklyWorkoutPlans' | 'workoutTemplates'
  >,
  targetDate: string,
): WeeklyPlanAdherenceSummary {
  const dates = getRange(targetDate, 7)
  const workoutTemplateById = new Map(snapshot.workoutTemplates.map((template) => [template.id, template]))
  const plannedMealSlots: Array<{ dateKey: string; mealType: MealType; completed: boolean }> = []
  const plannedWorkoutSlots: Array<{ dateKey: string; templateName: string; completed: boolean }> = []
  const unplannedMealLabels: string[] = []
  const unplannedWorkoutLabels: string[] = []

  dates.forEach((dateKey) => {
    const weekday = createDateFromKey(dateKey).getDay()
    const dayMeals = getEntriesForDate(snapshot.mealEntries, dateKey)
    const loggedMealTypes = new Set(dayMeals.map((entry) => entry.mealType))
    const dayMealPlans = snapshot.weeklyMealPlans.filter((plan) => plan.weekday === weekday)
    const plannedMealTypes = new Set(dayMealPlans.map((plan) => plan.mealType))

    dayMealPlans.forEach((plan) => {
      plannedMealSlots.push({
        dateKey,
        mealType: plan.mealType,
        completed: loggedMealTypes.has(plan.mealType),
      })
    })

    loggedMealTypes.forEach((mealType) => {
      if (!plannedMealTypes.has(mealType)) {
        unplannedMealLabels.push(formatPlanSlotLabel(dateKey, coachMealTypeLabels[mealType]))
      }
    })

    const dayWorkoutPlan = snapshot.weeklyWorkoutPlans.find((plan) => plan.weekday === weekday) ?? null
    const dayWorkouts = getWorkoutsForDate(snapshot.workoutSessions, dateKey)

    if (dayWorkoutPlan) {
      const template = workoutTemplateById.get(dayWorkoutPlan.templateId)

      plannedWorkoutSlots.push({
        dateKey,
        templateName: template?.name ?? '计划训练',
        completed: dayWorkouts.length > 0,
      })
    } else if (dayWorkouts.length > 0) {
      unplannedWorkoutLabels.push(formatShortDateKey(dateKey))
    }
  })

  const plannedMeals = plannedMealSlots.length
  const completedMeals = plannedMealSlots.filter((slot) => slot.completed).length
  const missedMeals = plannedMeals - completedMeals
  const plannedWorkouts = plannedWorkoutSlots.length
  const completedWorkouts = plannedWorkoutSlots.filter((slot) => slot.completed).length
  const missedWorkouts = plannedWorkouts - completedWorkouts
  const totalPlanned = plannedMeals + plannedWorkouts
  const totalCompleted = completedMeals + completedWorkouts

  const signals: WeeklyPlanAdherenceSignal[] = []
  const missedWorkoutLabels = plannedWorkoutSlots
    .filter((slot) => !slot.completed)
    .map((slot) => formatPlanSlotLabel(slot.dateKey, slot.templateName))
  const missedMealLabels = plannedMealSlots
    .filter((slot) => !slot.completed)
    .map((slot) => formatPlanSlotLabel(slot.dateKey, coachMealTypeLabels[slot.mealType]))

  if (missedWorkouts > 0) {
    signals.push({
      id: 'missed-workout',
      tone: 'watch',
      title: `这周漏了 ${missedWorkouts} 次计划训练`,
      detail: `计划里排了但没落下来的训练有：${missedWorkoutLabels.slice(0, 2).join('、')}。`,
    })
  }

  if (missedMeals > 0) {
    signals.push({
      id: 'missed-meal',
      tone: 'watch',
      title: `这周漏了 ${missedMeals} 顿计划餐`,
      detail: `还没按计划完成的餐次有：${missedMealLabels.slice(0, 3).join('、')}。`,
    })
  }

  if (unplannedWorkoutLabels.length > 0) {
    signals.push({
      id: 'unplanned-workout',
      tone: 'positive',
      title: `有 ${unplannedWorkoutLabels.length} 次训练发生在计划外`,
      detail: `说明你还是动起来了，只是这些训练没被周计划提前接住：${unplannedWorkoutLabels.slice(0, 2).join('、')}。`,
    })
  }

  if (unplannedMealLabels.length > 0) {
    signals.push({
      id: 'unplanned-meal',
      tone: 'positive',
      title: `有 ${unplannedMealLabels.length} 顿饮食记录发生在计划外`,
      detail: `这些餐次是临时记下来的：${unplannedMealLabels.slice(0, 3).join('、')}。`,
    })
  }

  if (signals.length === 0 && totalPlanned > 0) {
    signals.push({
      id: 'fully-on-plan',
      tone: 'positive',
      title: '这周排好的基本都落下来了',
      detail: `计划内已完成 ${totalCompleted} / ${totalPlanned} 项，执行和计划基本对齐。`,
    })
  }

  if (totalPlanned === 0) {
    return {
      plannedMeals,
      completedMeals,
      missedMeals,
      plannedWorkouts,
      completedWorkouts,
      missedWorkouts,
      unplannedMealLogs: unplannedMealLabels.length,
      unplannedWorkoutLogs: unplannedWorkoutLabels.length,
      mealCompletionRate: 0,
      workoutCompletionRate: 0,
      headline: '这周还没有固定计划可对照',
      detail: '先去饮食或训练把常练内容排进周计划，再回来判断执行率。',
      signals: [],
    }
  }

  return {
    plannedMeals,
    completedMeals,
    missedMeals,
    plannedWorkouts,
    completedWorkouts,
    missedWorkouts,
    unplannedMealLogs: unplannedMealLabels.length,
    unplannedWorkoutLogs: unplannedWorkoutLabels.length,
    mealCompletionRate: plannedMeals > 0 ? Math.round((completedMeals / plannedMeals) * 100) : 0,
    workoutCompletionRate: plannedWorkouts > 0 ? Math.round((completedWorkouts / plannedWorkouts) * 100) : 0,
    headline: `这周按计划落下了 ${totalCompleted} / ${totalPlanned} 项`,
    detail: `饮食按计划完成 ${completedMeals} / ${plannedMeals}，训练按计划完成 ${completedWorkouts} / ${plannedWorkouts}。`,
    signals: signals.slice(0, 3),
  }
}

export function buildTomorrowPlanSummary(
  snapshot: FitnessStateSnapshot,
  targetDate: string,
): TomorrowPlanSummary {
  const tomorrowDateKey = shiftDateKey(targetDate, 1)
  const weekly = buildWeeklySummary(snapshot, targetDate)
  const rangeSummary = buildRangeSummary(snapshot, targetDate, 7)
  const workoutRhythm = buildWorkoutRhythmSummary(snapshot, targetDate)
  const tomorrowMeals = getEntriesForDate(snapshot.mealEntries, tomorrowDateKey)
  const tomorrowWorkouts = getWorkoutsForDate(snapshot.workoutSessions, tomorrowDateKey)
  const tomorrowBodyEntries = getEntriesForDate(snapshot.bodyEntries, tomorrowDateKey)
  const tomorrowRecoveryEntries = getEntriesForDate(snapshot.recoveryEntries, tomorrowDateKey)
  const tomorrowBreakfastLogged = tomorrowMeals.some((entry) => entry.mealType === 'breakfast')
  const actions: TomorrowPlanAction[] = []
  const plannedMealSlot = getTomorrowPlannedMealSlot(snapshot, tomorrowDateKey)
  const plannedWorkoutSlot = getTomorrowPlannedWorkoutSlot(snapshot, tomorrowDateKey)

  if (plannedMealSlot?.template) {
    actions.push({
      id: 'planned-meal',
      kind: 'meal',
      title: getTomorrowMealActionTitle('planned', plannedMealSlot.plan.mealType),
      detail: `明天的周计划里已经排了 ${plannedMealSlot.template.name}，先把它带进来，明早就不用重新想。`,
      targetLabel: `按计划完成${coachMealTypeLabels[plannedMealSlot.plan.mealType]}`,
      ctaLabel: getTomorrowMealCtaLabel(plannedMealSlot.plan.mealType),
      priority: tomorrowPlanActionPriority['planned-meal'],
      templateId: plannedMealSlot.template.id,
      mealType: plannedMealSlot.plan.mealType,
      targetDateKey: tomorrowDateKey,
    })
  }

  if (!plannedMealSlot && weekly.proteinGoalDays < 4 && !tomorrowBreakfastLogged) {
    const proteinTemplate = getBestTomorrowProteinTemplate(snapshot)

    if (proteinTemplate) {
      actions.push({
        id: 'protein-meal',
        kind: 'meal',
        title: getTomorrowMealActionTitle('protein', proteinTemplate.mealType),
        detail: `这周蛋白还没站上目标线，先把一顿高蛋白${coachMealTypeLabels[proteinTemplate.mealType]}提前摆好。`,
        targetLabel: '蛋白达标 >= 4 / 7',
        ctaLabel: getTomorrowMealCtaLabel(proteinTemplate.mealType),
        priority: tomorrowPlanActionPriority['protein-meal'],
        templateId: proteinTemplate.id,
        mealType: proteinTemplate.mealType,
        targetDateKey: tomorrowDateKey,
      })
    }
  }

  if (plannedWorkoutSlot) {
    actions.push({
      id: 'planned-workout',
      kind: 'workout',
      title: getTomorrowPlannedWorkoutTitle(plannedWorkoutSlot.template),
      detail: `明天已经排了 ${plannedWorkoutSlot.template.name}，直接按这套开练，会比临时决定更省脑力。`,
      targetLabel: '按计划完成训练',
      ctaLabel: '去记训练',
      priority: tomorrowPlanActionPriority['planned-workout'],
      workoutTemplateId: plannedWorkoutSlot.template.id,
      targetDateKey: tomorrowDateKey,
    })
  }

  if (!plannedWorkoutSlot && weekly.trainingSessions < 4 && tomorrowWorkouts.length === 0) {
    const preferredWorkoutKind =
      workoutRhythm.strengthSessions <= workoutRhythm.cardioSessions ? 'strength' : 'cardio'
    const workoutSuggestion = getCoachWorkoutSuggestions(snapshot, {
      preferredKind: preferredWorkoutKind,
      limit: 1,
    })[0]

    if (workoutSuggestion) {
      actions.push({
        id: 'workout',
        kind: 'workout',
        title: workoutSuggestion.kind === 'strength' ? '明天补一节力量训练' : '明天补一节有氧训练',
        detail: `本周训练还差 ${Math.max(4 - weekly.trainingSessions, 1)} 次，先从 ${workoutSuggestion.name} 开始最顺手。`,
        targetLabel: '训练记录 >= 4 / 7',
        ctaLabel: '去记训练',
        priority: tomorrowPlanActionPriority.workout,
        workoutTemplateId: workoutSuggestion.templateId,
        targetDateKey: tomorrowDateKey,
      })
    }
  }

  if (
    snapshot.profile.goalMode !== 'maintain' &&
    rangeSummary.bodyEntryDays < 2 &&
    tomorrowBodyEntries.length === 0
  ) {
    actions.push({
      id: 'body',
      kind: 'body',
      title: '明早补一笔体重记录',
      detail: '这周体重落点还不够连续，明早补一笔，趋势判断会更稳。',
      targetLabel: '体重记录 >= 2 / 7',
      ctaLabel: '去记体重',
      priority: tomorrowPlanActionPriority.body,
      targetDateKey: tomorrowDateKey,
    })
  }

  if (weekly.recoveryDays < 5 && tomorrowRecoveryEntries.length === 0) {
    actions.push({
      id: 'recovery',
      kind: 'recovery',
      title: '明晚把恢复记录补上',
      detail: `这周恢复只记了 ${weekly.recoveryDays} / 5 天，明晚用一笔标准日把节奏续上。`,
      targetLabel: '恢复记录 >= 5 / 7',
      ctaLabel: '去记恢复',
      priority: tomorrowPlanActionPriority.recovery,
      recoveryPresetLabel: '标准日',
      targetDateKey: tomorrowDateKey,
    })
  }

  const items = actions
    .sort((left, right) => left.priority - right.priority)
    .slice(0, 3)
  const primaryItem = items[0] ?? null

  if (!primaryItem) {
    return {
      targetDateKey: tomorrowDateKey,
      headline: '明天继续按现在的节奏走',
      detail: '今天这一周的关键动作已经比较齐了，明天照常记录就够了。',
      items: [],
      primaryItem: null,
    }
  }

  return {
    targetDateKey: tomorrowDateKey,
    headline: primaryItem.title,
    detail: '把明天最值得先做的 2-3 件事提前摆出来，明早直接照着做就行。',
    items,
    primaryItem,
  }
}

export function buildTodayPlanSummary(
  snapshot: Pick<
    FitnessStateSnapshot,
    'mealEntries' | 'mealTemplates' | 'weeklyMealPlans' | 'workoutSessions' | 'workoutTemplates' | 'weeklyWorkoutPlans'
  >,
  targetDate: string,
): TodayPlanSummary {
  const weekday = createDateFromKey(targetDate).getDay()
  const loggedMealTypes = new Set(getEntriesForDate(snapshot.mealEntries, targetDate).map((entry) => entry.mealType))
  const hasWorkoutLogged = getWorkoutsForDate(snapshot.workoutSessions, targetDate).length > 0
  const mealTemplateById = new Map(snapshot.mealTemplates.map((template) => [template.id, template]))
  const workoutTemplateById = new Map(snapshot.workoutTemplates.map((template) => [template.id, template]))

  const mealItems = snapshot.weeklyMealPlans
    .filter((plan) => plan.weekday === weekday)
    .sort(
      (left, right) =>
        coachMealTypeOrder.indexOf(left.mealType) - coachMealTypeOrder.indexOf(right.mealType),
    )
    .map((plan) => {
      const template = mealTemplateById.get(plan.templateId)

      if (!template) {
        return null
      }

      const status: TodayPlanAction['status'] = loggedMealTypes.has(plan.mealType) ? 'done' : 'pending'

      return {
        id: `meal-${plan.mealType}`,
        kind: 'meal' as const,
        status,
        title: getTodayMealActionTitle(plan.mealType, status),
        detail: getTodayMealActionDetail(plan.mealType, template.name, status),
        targetLabel: template.name,
        ctaLabel: status === 'pending' ? getTomorrowMealCtaLabel(plan.mealType) : null,
        templateId: template.id,
        mealType: plan.mealType,
        targetDateKey: targetDate,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item != null)

  const workoutPlan = snapshot.weeklyWorkoutPlans.find((plan) => plan.weekday === weekday)
  const workoutItems: TodayPlanAction[] = []

  if (workoutPlan) {
    const template = workoutTemplateById.get(workoutPlan.templateId)

    if (template) {
      const status: TodayPlanAction['status'] = hasWorkoutLogged ? 'done' : 'pending'

      workoutItems.push({
        id: 'workout',
        kind: 'workout' as const,
        status,
        title: getTodayWorkoutActionTitle(template, status),
        detail: getTodayWorkoutActionDetail(template, status),
        targetLabel: `${template.kind === 'strength' ? '力量' : '有氧'} · ${template.durationMinutes} 分钟`,
        ctaLabel: status === 'pending' ? '带入训练' : null,
        workoutTemplateId: template.id,
        targetDateKey: targetDate,
      })
    }
  }

  const items = [...mealItems, ...workoutItems].sort((left, right) => {
    if (todayPlanStatusPriority[left.status] !== todayPlanStatusPriority[right.status]) {
      return todayPlanStatusPriority[left.status] - todayPlanStatusPriority[right.status]
    }

    if (left.kind !== right.kind) {
      return left.kind === 'meal' ? -1 : 1
    }

    if (left.kind === 'meal' && right.kind === 'meal' && left.mealType && right.mealType) {
      return coachMealTypeOrder.indexOf(left.mealType) - coachMealTypeOrder.indexOf(right.mealType)
    }

    return left.title.localeCompare(right.title, 'zh-CN')
  })

  const pendingCount = items.filter((item) => item.status === 'pending').length
  const completedCount = items.length - pendingCount
  const hasPlans = items.length > 0

  if (!hasPlans) {
    return {
      targetDateKey: targetDate,
      headline: '今天还没排固定计划',
      detail: '先去饮食或训练把常用模板排进周计划，首页就能直接执行。',
      hasPlans: false,
      pendingCount: 0,
      completedCount: 0,
      items: [],
    }
  }

  return {
    targetDateKey: targetDate,
    headline: pendingCount > 0 ? `今天按计划还差 ${pendingCount} 项` : '今天排好的都已经落下来了',
    detail:
      pendingCount > 0
        ? '已经排好的餐和训练都放在这，做完一项就少想一步。'
        : '今天原本排好的餐和训练都已经有记录了，照着现在的节奏继续就行。',
    hasPlans: true,
    pendingCount,
    completedCount,
    items,
  }
}
