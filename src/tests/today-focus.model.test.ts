import { describe, expect, it } from 'vitest'

import { buildTodayFocus } from '../app/todayFocus.model'
import { formatLocalDateKey } from '../store/date'
import type { FitnessStateSnapshot } from '../store/types'
import { useFitnessStore } from '../store/useFitnessStore'

function todayMealEntries(targetDate: string): FitnessStateSnapshot['mealEntries'] {
  return [
    {
      id: 'today-breakfast',
      mealType: 'breakfast',
      foodName: 'breakfast',
      servingLabel: '1 serving',
      calories: 420,
      protein: 30,
      carbs: 40,
      fat: 12,
      loggedAt: `${targetDate}T08:00:00.000Z`,
      dateKey: targetDate,
      sourceFoodId: null,
    },
    {
      id: 'today-lunch',
      mealType: 'lunch',
      foodName: 'lunch',
      servingLabel: '1 serving',
      calories: 620,
      protein: 45,
      carbs: 58,
      fat: 18,
      loggedAt: `${targetDate}T12:00:00.000Z`,
      dateKey: targetDate,
      sourceFoodId: null,
    },
    {
      id: 'today-dinner',
      mealType: 'dinner',
      foodName: 'dinner',
      servingLabel: '1 serving',
      calories: 540,
      protein: 40,
      carbs: 35,
      fat: 20,
      loggedAt: `${targetDate}T18:00:00.000Z`,
      dateKey: targetDate,
      sourceFoodId: null,
    },
  ]
}

function todayBodyEntries(targetDate: string): FitnessStateSnapshot['bodyEntries'] {
  return [
    {
      id: 'today-body',
      loggedAt: `${targetDate}T07:00:00.000Z`,
      dateKey: targetDate,
      weight: 72.4,
      bodyFat: null,
      waist: null,
      chest: null,
      hips: null,
    },
  ]
}

function todayRecoveryEntries(targetDate: string): FitnessStateSnapshot['recoveryEntries'] {
  return [
    {
      id: 'today-recovery',
      loggedAt: `${targetDate}T21:00:00.000Z`,
      dateKey: targetDate,
      waterLiters: 2.6,
      steps: 8500,
      sleepHours: 7.5,
      energy: 4,
    },
  ]
}

function todayWorkoutSessions(targetDate: string): FitnessStateSnapshot['workoutSessions'] {
  return [
    {
      id: 'today-workout',
      kind: 'strength',
      title: 'strength',
      startedAt: `${targetDate}T17:00:00.000Z`,
      dateKey: targetDate,
      durationMinutes: 45,
      estimatedCalories: 260,
      notes: '',
      exercises: [],
    },
  ]
}

function snapshot(patch: Partial<FitnessStateSnapshot> = {}): FitnessStateSnapshot {
  const base = useFitnessStore.getState()
  const targetDate = formatLocalDateKey(new Date())

  return {
    profile: base.profile,
    foods: base.foods,
    mealTemplates: base.mealTemplates,
    weeklyMealPlans: base.weeklyMealPlans,
    weeklyWorkoutPlans: base.weeklyWorkoutPlans,
    weeklyPrepCheckedKeys: base.weeklyPrepCheckedKeys,
    photoEstimateRecords: base.photoEstimateRecords,
    workoutTemplates: base.workoutTemplates,
    mealEntries: todayMealEntries(targetDate),
    workoutSessions: todayWorkoutSessions(targetDate),
    bodyEntries: todayBodyEntries(targetDate),
    recoveryEntries: todayRecoveryEntries(targetDate),
    ...patch,
  }
}

describe('buildTodayFocus', () => {
  it('prioritizes missing breakfast before body, recovery, and workout', () => {
    const targetDate = formatLocalDateKey(new Date())
    const base = snapshot({
      mealEntries: useFitnessStore.getState().mealEntries.filter(
        (entry) => !(entry.dateKey === targetDate && entry.mealType === 'breakfast'),
      ),
      bodyEntries: [],
      recoveryEntries: [],
      workoutSessions: [],
    })

    expect(buildTodayFocus(base, targetDate)).toMatchObject({
      mode: 'meal',
      mealType: 'breakfast',
      title: '补早餐',
      actionLabel: '去记早餐',
    })
  })

  it('falls through to body, recovery, then workout after three meals exist', () => {
    const targetDate = formatLocalDateKey(new Date())
    const base = snapshot()
    const threeMeals = base.mealEntries.filter((entry) => entry.dateKey === targetDate)

    expect(buildTodayFocus(snapshot({ mealEntries: threeMeals, bodyEntries: [] }), targetDate).mode).toBe('body')
    expect(buildTodayFocus(snapshot({ mealEntries: threeMeals, recoveryEntries: [] }), targetDate).mode).toBe('recovery')
    expect(buildTodayFocus(snapshot({ mealEntries: threeMeals, workoutSessions: [] }), targetDate).mode).toBe('workout')
  })

  it('returns a one-line summary without exposing metric grids', () => {
    const targetDate = formatLocalDateKey(new Date())
    const focus = buildTodayFocus(snapshot(), targetDate)

    expect(focus.summary).toMatch(/已吃 \d+ kcal/)
    expect(focus.summary).toMatch(/训练/)
    expect(focus.summary).not.toMatch(/[\r\n]/)
  })
})
