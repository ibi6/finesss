import type {
  FitnessStateSnapshot,
  Food,
  MealTemplate,
  MealEntry,
  Profile,
  RecoveryEntry,
  WorkoutSession,
  WorkoutTemplate,
  BodyEntry,
  WeeklyMealPlanSlot,
  WeeklyWorkoutPlanSlot,
} from './types'
import { formatLocalDateKey } from './date'

function atLocalTime(dayOffset: number, hours: number, minutes = 0) {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hours, minutes, 0, 0)
  return date
}

function createLocalStamp(dayOffset: number, hours: number, minutes = 0) {
  const date = atLocalTime(dayOffset, hours, minutes)

  return {
    iso: date.toISOString(),
    dateKey: formatLocalDateKey(date),
  }
}

const profile: Profile = {
  name: 'Mika',
  goalMode: 'cut',
  dailyCalories: 2050,
  dailyProtein: 160,
  dailyCarbs: 190,
  dailyFat: 70,
  startWeight: 73,
  targetWeight: 66,
  weeklyRateGoal: 0.5,
}

const foods: Food[] = [
  {
    id: 'food-greek-yogurt',
    name: '希腊酸奶碗',
    servingLabel: '1 碗',
    calories: 420,
    protein: 31,
    carbs: 42,
    fat: 11,
    isFavorite: true,
    lastUsedAt: null,
  },
  {
    id: 'food-chicken-rice',
    name: '鸡胸饭',
    servingLabel: '1 份',
    calories: 610,
    protein: 44,
    carbs: 55,
    fat: 16,
    isFavorite: true,
    lastUsedAt: null,
  },
  {
    id: 'food-salmon-salad',
    name: '三文鱼沙拉',
    servingLabel: '1 碗',
    calories: 530,
    protein: 39,
    carbs: 18,
    fat: 24,
    isFavorite: false,
    lastUsedAt: null,
  },
  {
    id: 'food-oatmeal',
    name: '燕麦片',
    servingLabel: '1 碗',
    calories: 280,
    protein: 10,
    carbs: 46,
    fat: 6,
    isFavorite: false,
    lastUsedAt: null,
  },
  {
    id: 'food-boiled-egg',
    name: '水煮蛋',
    servingLabel: '2 个',
    calories: 156,
    protein: 12,
    carbs: 2,
    fat: 10,
    isFavorite: false,
    lastUsedAt: null,
  },
  {
    id: 'food-banana',
    name: '香蕉',
    servingLabel: '1 根',
    calories: 105,
    protein: 1,
    carbs: 27,
    fat: 0,
    isFavorite: false,
    lastUsedAt: null,
  },
  {
    id: 'food-sweet-potato',
    name: '烤红薯',
    servingLabel: '1 个',
    calories: 180,
    protein: 4,
    carbs: 41,
    fat: 0,
    isFavorite: false,
    lastUsedAt: null,
  },
  {
    id: 'food-white-rice',
    name: '米饭',
    servingLabel: '1 碗',
    calories: 232,
    protein: 4,
    carbs: 51,
    fat: 0,
    isFavorite: false,
    lastUsedAt: null,
  },
  {
    id: 'food-fried-rice',
    name: '蛋炒饭',
    servingLabel: '1 盘',
    calories: 540,
    protein: 16,
    carbs: 66,
    fat: 22,
    isFavorite: false,
    lastUsedAt: null,
  },
  {
    id: 'food-tofu',
    name: '嫩豆腐',
    servingLabel: '1 盒',
    calories: 144,
    protein: 15,
    carbs: 6,
    fat: 8,
    isFavorite: false,
    lastUsedAt: null,
  },
  {
    id: 'food-beef-bowl',
    name: '牛肉饭',
    servingLabel: '1 份',
    calories: 620,
    protein: 34,
    carbs: 58,
    fat: 28,
    isFavorite: false,
    lastUsedAt: null,
  },
  {
    id: 'food-milk-tea',
    name: '奶茶',
    servingLabel: '1 杯',
    calories: 360,
    protein: 4,
    carbs: 58,
    fat: 12,
    isFavorite: false,
    lastUsedAt: null,
  },
  {
    id: 'food-dumplings',
    name: '水饺',
    servingLabel: '10 个',
    calories: 420,
    protein: 18,
    carbs: 48,
    fat: 16,
    isFavorite: false,
    lastUsedAt: null,
  },
]

const mealTemplates: MealTemplate[] = [
  {
    id: 'meal-template-high-protein-breakfast',
    name: '高蛋白早餐',
    mealType: 'breakfast',
    origin: 'preset',
    lastUsedAt: null,
    items: [
      {
        id: 'template-item-1',
        foodName: '希腊酸奶碗',
        servingLabel: '1 碗',
        calories: 420,
        protein: 31,
        carbs: 42,
        fat: 11,
      },
    ],
  },
  {
    id: 'meal-template-cut-dinner',
    name: '减脂晚餐',
    mealType: 'dinner',
    origin: 'preset',
    lastUsedAt: null,
    items: [
      {
        id: 'template-item-2',
        foodName: '三文鱼沙拉',
        servingLabel: '1 碗',
        calories: 530,
        protein: 39,
        carbs: 18,
        fat: 24,
      },
    ],
  },
]

const workoutTemplates: WorkoutTemplate[] = [
  {
    id: 'workout-template-push',
    name: '推训练',
    kind: 'strength',
    durationMinutes: 65,
    estimatedCalories: 380,
    exercises: [
      {
        id: 'push-1',
        name: '卧推',
        sets: 4,
        reps: 6,
        weight: 52.5,
      },
      {
        id: 'push-2',
        name: '上斜哑铃卧推',
        sets: 3,
        reps: 10,
        weight: 18,
      },
    ],
  },
  {
    id: 'workout-template-legs',
    name: '腿部日',
    kind: 'strength',
    durationMinutes: 75,
    estimatedCalories: 420,
    exercises: [
      {
        id: 'legs-1',
        name: '深蹲',
        sets: 4,
        reps: 6,
        weight: 80,
      },
      {
        id: 'legs-2',
        name: '罗马尼亚硬拉',
        sets: 3,
        reps: 8,
        weight: 70,
      },
    ],
  },
  {
    id: 'workout-template-cardio',
    name: '坡走',
    kind: 'cardio',
    durationMinutes: 35,
    estimatedCalories: 260,
    exercises: [],
  },
]

const weeklyMealPlans: WeeklyMealPlanSlot[] = []
const weeklyWorkoutPlans: WeeklyWorkoutPlanSlot[] = []
const weeklyPrepCheckedKeys: string[] = []
const photoEstimateRecords: FitnessStateSnapshot['photoEstimateRecords'] = []

const mealEntries: MealEntry[] = [
  {
    id: 'meal-entry-1',
    mealType: 'breakfast',
    foodName: '希腊酸奶碗',
    servingLabel: '1 碗',
    calories: 420,
    protein: 31,
    carbs: 42,
    fat: 11,
    loggedAt: createLocalStamp(0, 8).iso,
    dateKey: createLocalStamp(0, 8).dateKey,
    sourceFoodId: 'food-greek-yogurt',
  },
  {
    id: 'meal-entry-2',
    mealType: 'lunch',
    foodName: '鸡胸饭',
    servingLabel: '1 份',
    calories: 610,
    protein: 44,
    carbs: 55,
    fat: 16,
    loggedAt: createLocalStamp(0, 13).iso,
    dateKey: createLocalStamp(0, 13).dateKey,
    sourceFoodId: 'food-chicken-rice',
  },
  {
    id: 'meal-entry-3',
    mealType: 'dinner',
    foodName: '三文鱼沙拉',
    servingLabel: '1 碗',
    calories: 530,
    protein: 39,
    carbs: 18,
    fat: 24,
    loggedAt: createLocalStamp(-1, 19).iso,
    dateKey: createLocalStamp(-1, 19).dateKey,
    sourceFoodId: 'food-salmon-salad',
  },
]

const workoutSessions: WorkoutSession[] = [
  {
    id: 'workout-session-1',
    kind: 'strength',
    title: '腿部日',
    startedAt: createLocalStamp(0, 17).iso,
    dateKey: createLocalStamp(0, 17).dateKey,
    durationMinutes: 74,
    estimatedCalories: 420,
    notes: '今天控制离心，动作别抢。',
    exercises: [
      {
        id: 'exercise-seed-1',
        name: '深蹲',
        sets: 4,
        reps: 6,
        weight: 80,
      },
      {
        id: 'exercise-seed-2',
        name: '罗马尼亚硬拉',
        sets: 3,
        reps: 8,
        weight: 70,
      },
    ],
  },
  {
    id: 'workout-session-2',
    kind: 'cardio',
    title: '坡走',
    startedAt: createLocalStamp(-2, 9).iso,
    dateKey: createLocalStamp(-2, 9).dateKey,
    durationMinutes: 35,
    estimatedCalories: 260,
    notes: '',
    exercises: [],
  },
]

const bodyEntries: BodyEntry[] = [
  {
    id: 'body-entry-1',
    loggedAt: createLocalStamp(-6, 7).iso,
    dateKey: createLocalStamp(-6, 7).dateKey,
    weight: 72.8,
    bodyFat: 22.4,
    waist: 81,
    chest: 99,
    hips: 97,
  },
  {
    id: 'body-entry-2',
    loggedAt: createLocalStamp(0, 7).iso,
    dateKey: createLocalStamp(0, 7).dateKey,
    weight: 71.9,
    bodyFat: 21.8,
    waist: 79,
    chest: 98,
    hips: 96,
  },
]

const recoveryEntries: RecoveryEntry[] = [
  {
    id: 'recovery-seed-1',
    loggedAt: createLocalStamp(0, 21).iso,
    dateKey: createLocalStamp(0, 21).dateKey,
    waterLiters: 2.3,
    steps: 8200,
    sleepHours: 7.1,
    energy: 4,
  },
  {
    id: 'recovery-seed-2',
    loggedAt: createLocalStamp(-2, 21).iso,
    dateKey: createLocalStamp(-2, 21).dateKey,
    waterLiters: 2.7,
    steps: 10240,
    sleepHours: 7.8,
    energy: 5,
  },
]

const cleanProfile: Profile = {
  name: '我',
  goalMode: 'cut',
  dailyCalories: 2050,
  dailyProtein: 160,
  dailyCarbs: 190,
  dailyFat: 70,
  startWeight: 73,
  targetWeight: 66,
  weeklyRateGoal: 0.5,
}

function resetFoodUsage(food: Food): Food {
  return {
    ...food,
    isFavorite: false,
    lastUsedAt: null,
  }
}

export function createSeedSnapshot(): FitnessStateSnapshot {
  return {
    profile,
    foods,
    mealTemplates,
    weeklyMealPlans,
    weeklyWorkoutPlans,
    weeklyPrepCheckedKeys,
    photoEstimateRecords,
    workoutTemplates,
    mealEntries,
    workoutSessions,
    bodyEntries,
    recoveryEntries,
  }
}

export function createCleanSnapshot(): FitnessStateSnapshot {
  return {
    profile: cleanProfile,
    foods: foods.map(resetFoodUsage),
    mealTemplates,
    weeklyMealPlans,
    weeklyWorkoutPlans,
    weeklyPrepCheckedKeys,
    photoEstimateRecords,
    workoutTemplates,
    mealEntries: [],
    workoutSessions: [],
    bodyEntries: [],
    recoveryEntries: [],
  }
}
