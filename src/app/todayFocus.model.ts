import { resolveDateKey } from '../store/date'
import { buildDailySummary } from '../store/selectors'
import type { FitnessStateSnapshot, MealType } from '../store/types'

export type TodayFocusMode = 'meal' | 'body' | 'recovery' | 'workout'

export interface TodayFocus {
  mode: TodayFocusMode
  mealType?: MealType
  title: string
  summary: string
  actionLabel: string
}

const primaryMeals: MealType[] = ['breakfast', 'lunch', 'dinner']

const mealCopy: Record<MealType, { title: string; actionLabel: string }> = {
  breakfast: { title: '补早餐', actionLabel: '去记早餐' },
  lunch: { title: '补午餐', actionLabel: '去记午餐' },
  dinner: { title: '补晚餐', actionLabel: '去记晚餐' },
  snack: { title: '补加餐', actionLabel: '去记加餐' },
}

function getLoggedMealTypes(snapshot: FitnessStateSnapshot, targetDate: string) {
  return new Set(
    snapshot.mealEntries
      .filter((entry) => resolveDateKey(entry.dateKey, entry.loggedAt) === targetDate)
      .map((entry) => entry.mealType),
  )
}

function formatTrainingSummary(minutes: number) {
  return minutes > 0 ? `训练 ${minutes} 分钟` : '训练未记'
}

export function buildTodayFocus(snapshot: FitnessStateSnapshot, targetDate: string): TodayFocus {
  const daily = buildDailySummary(snapshot, targetDate)
  const loggedMealTypes = getLoggedMealTypes(snapshot, targetDate)
  const missingMeal = primaryMeals.find((mealType) => !loggedMealTypes.has(mealType))
  const summary = `已吃 ${daily.calories} kcal，${formatTrainingSummary(daily.trainingMinutes)}`

  if (missingMeal) {
    return {
      mode: 'meal',
      mealType: missingMeal,
      summary,
      ...mealCopy[missingMeal],
    }
  }

  if (!daily.hasBodyEntry) {
    return {
      mode: 'body',
      title: '记体重',
      summary,
      actionLabel: '去记体重',
    }
  }

  if (!daily.recoveryLogged) {
    return {
      mode: 'recovery',
      title: '记恢复',
      summary,
      actionLabel: '去记恢复',
    }
  }

  if (daily.trainingMinutes <= 0) {
    return {
      mode: 'workout',
      title: '记训练',
      summary,
      actionLabel: '去记训练',
    }
  }

  return {
    mode: 'meal',
    mealType: 'snack',
    title: '今天已经稳住了',
    summary,
    actionLabel: '再记一笔',
  }
}
