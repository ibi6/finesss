export type GoalMode = 'cut' | 'maintain' | 'gain'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type WorkoutKind = 'strength' | 'cardio'
export type EnergyLevel = 1 | 2 | 3 | 4 | 5
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface Profile {
  name: string
  goalMode: GoalMode
  dailyCalories: number
  dailyProtein: number
  dailyCarbs: number
  dailyFat: number
  startWeight: number
  targetWeight: number
  weeklyRateGoal: number
}

export interface Food {
  id: string
  name: string
  servingLabel: string
  calories: number
  protein: number
  carbs: number
  fat: number
  isFavorite: boolean
  lastUsedAt: string | null
}

export interface MealEntry {
  id: string
  mealType: MealType
  foodName: string
  servingLabel: string
  calories: number
  protein: number
  carbs: number
  fat: number
  loggedAt: string
  dateKey?: string
  sourceFoodId: string | null
}

export interface PhotoEstimateRecord {
  id: string
  loggedAt: string
  dateKey?: string
  photoName: string
  query: string
  scene: 'meal' | 'drink' | 'protein' | 'snack'
  sceneMode: 'auto' | 'manual'
  portionHint: 'light' | 'regular' | 'large'
  keywordSummary: string[]
  foodName: string
  servingLabel: string
  calories: number
  protein: number
  carbs: number
  fat: number
  sourceFoodId: string | null
  confidence: number
  reasons: string[]
}

export interface MealTemplateItem {
  id: string
  foodName: string
  servingLabel: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface MealTemplate {
  id: string
  name: string
  mealType: MealType
  items: MealTemplateItem[]
  origin: 'preset' | 'custom'
  lastUsedAt: string | null
}

export interface WeeklyMealPlanSlot {
  id: string
  weekday: WeekdayIndex
  mealType: MealType
  templateId: string
}

export interface WorkoutExercise {
  id: string
  name: string
  sets: number
  reps: number
  weight: number
}

export interface WorkoutTemplate {
  id: string
  name: string
  kind: WorkoutKind
  durationMinutes: number
  estimatedCalories: number
  exercises: WorkoutExercise[]
}

export interface WeeklyWorkoutPlanSlot {
  id: string
  weekday: WeekdayIndex
  templateId: string
}

export interface WorkoutSession {
  id: string
  kind: WorkoutKind
  title: string
  startedAt: string
  dateKey?: string
  durationMinutes: number
  estimatedCalories: number
  notes: string
  exercises: WorkoutExercise[]
}

export interface BodyEntry {
  id: string
  loggedAt: string
  dateKey?: string
  weight: number
  bodyFat: number | null
  waist: number | null
  chest: number | null
  hips: number | null
}

export interface RecoveryEntry {
  id: string
  loggedAt: string
  dateKey?: string
  waterLiters: number
  steps: number
  sleepHours: number
  energy: EnergyLevel
}

export interface FitnessStateSnapshot {
  profile: Profile
  foods: Food[]
  mealTemplates: MealTemplate[]
  weeklyMealPlans: WeeklyMealPlanSlot[]
  weeklyWorkoutPlans: WeeklyWorkoutPlanSlot[]
  weeklyPrepCheckedKeys: string[]
  photoEstimateRecords: PhotoEstimateRecord[]
  workoutTemplates: WorkoutTemplate[]
  mealEntries: MealEntry[]
  workoutSessions: WorkoutSession[]
  bodyEntries: BodyEntry[]
  recoveryEntries: RecoveryEntry[]
}

export interface FitnessState extends FitnessStateSnapshot {
  updateProfile: (profile: Partial<Profile>) => void
  replaceSnapshot: (snapshot: Partial<FitnessStateSnapshot>) => void
  addFood: (food: Omit<Food, 'id' | 'lastUsedAt'>) => Food
  toggleFavoriteFood: (foodId: string) => void
  addMealTemplate: (template: Omit<MealTemplate, 'id'>) => MealTemplate
  updateMealTemplate: (templateId: string, patch: Partial<MealTemplate>) => void
  deleteMealTemplate: (templateId: string) => void
  touchMealTemplate: (templateId: string, usedAt: string) => void
  applyMealTemplateToDate: (templateId: string, targetDate: string) => void
  setWeeklyMealPlan: (weekday: WeekdayIndex, mealType: MealType, templateId: string) => void
  clearWeeklyMealPlan: (weekday: WeekdayIndex, mealType: MealType) => void
  setWeeklyWorkoutPlan: (weekday: WeekdayIndex, templateId: string) => void
  clearWeeklyWorkoutPlan: (weekday: WeekdayIndex) => void
  toggleWeeklyPrepCheckedKey: (prepKey: string) => void
  clearWeeklyPrepCheckedKeys: () => void
  addPhotoEstimateRecord: (record: Omit<PhotoEstimateRecord, 'id'>) => void
  addMealEntry: (entry: Omit<MealEntry, 'id'>) => void
  updateMealEntry: (entryId: string, patch: Partial<MealEntry>) => void
  deleteMealEntry: (entryId: string) => void
  addWorkoutTemplate: (template: Omit<WorkoutTemplate, 'id'>) => WorkoutTemplate
  updateWorkoutTemplate: (templateId: string, patch: Partial<WorkoutTemplate>) => void
  deleteWorkoutTemplate: (templateId: string) => void
  applyWorkoutTemplateToDate: (templateId: string, targetDate: string) => void
  addWorkoutSession: (session: Omit<WorkoutSession, 'id'>) => void
  updateWorkoutSession: (sessionId: string, patch: Partial<WorkoutSession>) => void
  deleteWorkoutSession: (sessionId: string) => void
  addBodyEntry: (entry: Omit<BodyEntry, 'id'>) => void
  updateBodyEntry: (entryId: string, patch: Partial<BodyEntry>) => void
  deleteBodyEntry: (entryId: string) => void
  addRecoveryEntry: (entry: Omit<RecoveryEntry, 'id'>) => void
  updateRecoveryEntry: (entryId: string, patch: Partial<RecoveryEntry>) => void
  deleteRecoveryEntry: (entryId: string) => void
  resetToClean: () => void
  resetToSeed: () => void
}
