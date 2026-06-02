import { formatShortDateKey, getLocalDateKeyFromIso } from '../../store/date'
import type { MealType, PhotoEstimateRecord, WeekdayIndex } from '../../store/types'

export const defaultMealForm = {
  mealType: 'breakfast' as MealType,
  foodName: '',
  servingLabel: '',
  calories: '380',
  protein: '28',
  carbs: '32',
  fat: '12',
  sourceFoodId: null as string | null,
}

export const defaultFoodDraft = {
  name: '',
  servingLabel: '1 份',
  calories: '420',
  protein: '25',
  carbs: '40',
  fat: '14',
  isFavorite: true,
}

export interface MealTemplateDraft {
  id: string | null
  mode: 'create' | 'edit'
  mealType: MealType
  name: string
  items: Array<{
    id: string
    foodName: string
    servingLabel: string
    calories: string
    protein: string
    carbs: string
    fat: string
  }>
}

export interface WeeklyPrepItem {
  contextLabels: string[]
  foodName: string
  key: string
  servingLabel: string
  templateNames: string[]
  totalCalories: number
  totalCount: number
}

export type PrepWindowMode = '3days' | '7days' | 'week'
export type PrepVisibilityMode = 'all' | 'pending'
export type MealWorkspace = 'log' | 'plan'
export type PendingLogFocusTarget = 'photo' | 'manual' | 'favorites' | 'history'
export type MealReuseRangeDays = 7 | 30
export type PhotoHistoryRangeDays = 7 | 30

export const mealTypeLabels: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}

export const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export const prepWindowOptions: Array<{ label: string; value: PrepWindowMode }> = [
  { label: '近3天', value: '3days' },
  { label: '近7天', value: '7days' },
  { label: '整周', value: 'week' },
]

export const prepVisibilityOptions: Array<{ label: string; value: PrepVisibilityMode }> = [
  { label: '全部', value: 'all' },
  { label: '未备好', value: 'pending' },
]

export const photoEstimateSceneLabels: Record<PhotoEstimateRecord['scene'], string> = {
  meal: '正餐',
  drink: '饮品',
  protein: '蛋白',
  snack: '加餐',
}

export const weeklyPlannerDays: Array<{ value: WeekdayIndex; label: string; short: string }> = [
  { value: 1, label: '周一', short: '一' },
  { value: 2, label: '周二', short: '二' },
  { value: 3, label: '周三', short: '三' },
  { value: 4, label: '周四', short: '四' },
  { value: 5, label: '周五', short: '五' },
  { value: 6, label: '周六', short: '六' },
  { value: 0, label: '周日', short: '日' },
]

export function formatLastUsed(lastUsedAt: string | null) {
  if (!lastUsedAt) {
    return '还没带入过'
  }

  return `最近使用 ${formatShortDateKey(getLocalDateKeyFromIso(lastUsedAt))}`
}

export function buildTemplateName(mealType: MealType) {
  return `${mealTypeLabels[mealType]}甯哥敤缁勫悎`
}

export function buildWeeklyPrepKey(foodName: string, servingLabel: string) {
  return `${foodName}__${servingLabel}`
}

export function formatLoggedTime(iso: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}
