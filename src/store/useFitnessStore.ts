import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { createDateStampForDateKey, resolveDateKey } from './date'
import { createCleanSnapshot, createSeedSnapshot } from './seed'
import type {
  BodyEntry,
  FitnessState,
  FitnessStateSnapshot,
  Food,
  MealEntry,
  MealTemplate,
  Profile,
  RecoveryEntry,
  WeekdayIndex,
  MealType,
  WorkoutSession,
  WorkoutTemplate,
} from './types'

function withId<T extends object>(value: T) {
  return {
    id: crypto.randomUUID(),
    ...value,
  }
}

function patchById<T extends { id: string }>(
  collection: T[],
  targetId: string,
  patch: Partial<T>,
) {
  return collection.map((item) => (item.id === targetId ? { ...item, ...patch } : item))
}

function removeById<T extends { id: string }>(collection: T[], targetId: string) {
  return collection.filter((item) => item.id !== targetId)
}

function touchFoodById(foods: Food[], foodId: string | null, usedAt: string) {
  if (!foodId) {
    return foods
  }

  return foods.map((food) =>
    food.id === foodId
      ? {
          ...food,
          lastUsedAt: usedAt,
        }
      : food,
  )
}

function buildMealEntriesFromTemplate(template: MealTemplate, targetDate: string) {
  const stamp = createDateStampForDateKey(targetDate)

  return {
    entries: template.items.map((item) =>
      withId({
        mealType: template.mealType,
        foodName: item.foodName,
        servingLabel: item.servingLabel,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        loggedAt: stamp.iso,
        dateKey: stamp.dateKey,
        sourceFoodId: null,
      }),
    ),
    usedAt: stamp.iso,
  }
}

function buildWorkoutSessionFromTemplate(template: WorkoutTemplate, targetDate: string) {
  const stamp = createDateStampForDateKey(targetDate)

  return withId({
    kind: template.kind,
    title: template.name,
    startedAt: stamp.iso,
    dateKey: stamp.dateKey,
    durationMinutes: template.durationMinutes,
    estimatedCalories: template.estimatedCalories,
    notes: '',
    exercises: template.exercises.map((exercise) => ({
      ...exercise,
      id: crypto.randomUUID(),
    })),
  })
}

const seed = createCleanSnapshot()
const demoSeed = createSeedSnapshot()
const seedMealTemplatesById = new Map(seed.mealTemplates.map((template) => [template.id, template]))
const demoMealEntryIds = new Set(demoSeed.mealEntries.map((entry) => entry.id))
const demoWorkoutSessionIds = new Set(demoSeed.workoutSessions.map((session) => session.id))
const demoBodyEntryIds = new Set(demoSeed.bodyEntries.map((entry) => entry.id))
const demoRecoveryEntryIds = new Set(demoSeed.recoveryEntries.map((entry) => entry.id))

function withLoggedDateKeys<T extends { loggedAt: string; dateKey?: string }>(entries: T[]) {
  return entries.map((entry) => ({
    ...entry,
    dateKey: resolveDateKey(entry.dateKey, entry.loggedAt),
  }))
}

function withWorkoutDateKeys(entries: WorkoutSession[]) {
  return entries.map((entry) => ({
    ...entry,
    dateKey: resolveDateKey(entry.dateKey, entry.startedAt),
  }))
}

function mergeFoods(foods: Food[] | undefined) {
  if (!foods) {
    return seed.foods
  }

  const foodsById = new Map(foods.map((food) => [food.id, food]))
  const mergedSeedFoods = seed.foods.map((food) => {
    const existingFood = foodsById.get(food.id)

    if (!existingFood) {
      return food
    }

    return {
      ...food,
      isFavorite: existingFood.isFavorite,
      lastUsedAt: existingFood.lastUsedAt,
    }
  })
  const customFoods = foods.filter((food) => !seed.foods.some((seedFood) => seedFood.id === food.id))

  return [...mergedSeedFoods, ...customFoods]
}

function normalizeMealTemplate(template: MealTemplate, fallback?: MealTemplate) {
  return {
    ...template,
    mealType: template.mealType ?? fallback?.mealType ?? 'dinner',
    origin:
      template.origin ?? (fallback ? fallback.origin : seedMealTemplatesById.has(template.id) ? 'preset' : 'custom'),
    lastUsedAt: template.lastUsedAt ?? fallback?.lastUsedAt ?? null,
  }
}

function mergeMealTemplates(templates: MealTemplate[] | undefined) {
  if (!templates) {
    return seed.mealTemplates
  }

  const templatesById = new Map(templates.map((template) => [template.id, template]))
  const mergedSeedTemplates = seed.mealTemplates.map((seedTemplate) =>
    normalizeMealTemplate(templatesById.get(seedTemplate.id) ?? seedTemplate, seedTemplate),
  )
  const customTemplates = templates
    .filter((template) => !seedMealTemplatesById.has(template.id))
    .map((template) => normalizeMealTemplate(template))

  return [...mergedSeedTemplates, ...customTemplates]
}

function mergeWeeklyMealPlans(snapshotPlans: FitnessStateSnapshot['weeklyMealPlans'] | undefined) {
  return snapshotPlans ?? seed.weeklyMealPlans
}

function mergeWeeklyWorkoutPlans(snapshotPlans: FitnessStateSnapshot['weeklyWorkoutPlans'] | undefined) {
  return snapshotPlans ?? seed.weeklyWorkoutPlans
}

function mergeWeeklyPrepCheckedKeys(snapshotKeys: FitnessStateSnapshot['weeklyPrepCheckedKeys'] | undefined) {
  return snapshotKeys ?? seed.weeklyPrepCheckedKeys
}

function mergePhotoEstimateRecords(
  snapshotRecords: FitnessStateSnapshot['photoEstimateRecords'] | undefined,
) {
  return snapshotRecords ?? seed.photoEstimateRecords
}

function normalizeSnapshot(snapshot: Partial<FitnessStateSnapshot> | undefined) {
  if (!snapshot) {
    return seed
  }

  return {
    ...seed,
    ...snapshot,
    foods: mergeFoods(snapshot.foods),
    mealTemplates: mergeMealTemplates(snapshot.mealTemplates),
    weeklyMealPlans: mergeWeeklyMealPlans(snapshot.weeklyMealPlans),
    weeklyWorkoutPlans: mergeWeeklyWorkoutPlans(snapshot.weeklyWorkoutPlans),
    weeklyPrepCheckedKeys: mergeWeeklyPrepCheckedKeys(snapshot.weeklyPrepCheckedKeys),
    photoEstimateRecords: mergePhotoEstimateRecords(snapshot.photoEstimateRecords),
    workoutTemplates: snapshot.workoutTemplates ?? seed.workoutTemplates,
    mealEntries: withLoggedDateKeys(snapshot.mealEntries ?? seed.mealEntries),
    workoutSessions: withWorkoutDateKeys(snapshot.workoutSessions ?? seed.workoutSessions),
    bodyEntries: withLoggedDateKeys(snapshot.bodyEntries ?? seed.bodyEntries),
    recoveryEntries: withLoggedDateKeys(snapshot.recoveryEntries ?? seed.recoveryEntries),
  }
}

function removeDemoRecords(snapshot: FitnessStateSnapshot): FitnessStateSnapshot {
  const hasCustomLoggedData =
    snapshot.mealEntries.some((entry) => !demoMealEntryIds.has(entry.id)) ||
    snapshot.workoutSessions.some((session) => !demoWorkoutSessionIds.has(session.id)) ||
    snapshot.bodyEntries.some((entry) => !demoBodyEntryIds.has(entry.id)) ||
    snapshot.recoveryEntries.some((entry) => !demoRecoveryEntryIds.has(entry.id))

  return {
    ...snapshot,
    profile:
      snapshot.profile.name === demoSeed.profile.name && !hasCustomLoggedData
        ? seed.profile
        : snapshot.profile,
    mealEntries: snapshot.mealEntries.filter((entry) => !demoMealEntryIds.has(entry.id)),
    workoutSessions: snapshot.workoutSessions.filter(
      (session) => !demoWorkoutSessionIds.has(session.id),
    ),
    bodyEntries: snapshot.bodyEntries.filter((entry) => !demoBodyEntryIds.has(entry.id)),
    recoveryEntries: snapshot.recoveryEntries.filter((entry) => !demoRecoveryEntryIds.has(entry.id)),
  }
}

export const useFitnessStore = create<FitnessState>()(
  persist(
    (set) => ({
      ...seed,
      updateProfile: (profile: Partial<Profile>) =>
        set((state) => ({
          profile: {
            ...state.profile,
            ...profile,
          },
        })),
      replaceSnapshot: (snapshot: Partial<FitnessStateSnapshot>) =>
        set(() => normalizeSnapshot(snapshot)),
      addFood: (food) => {
        const createdFood = withId({ ...food, lastUsedAt: null })
        set((state) => ({
          foods: [...state.foods, createdFood],
        }))
        return createdFood
      },
      toggleFavoriteFood: (foodId: string) =>
        set((state) => ({
          foods: state.foods.map((food) =>
            food.id === foodId ? { ...food, isFavorite: !food.isFavorite } : food,
          ),
        })),
      addMealTemplate: (template) => {
        const createdTemplate = withId(template)
        set((state) => ({
          mealTemplates: [...state.mealTemplates, createdTemplate],
        }))
        return createdTemplate
      },
      updateMealTemplate: (templateId: string, patch: Partial<MealTemplate>) =>
        set((state) => ({
          mealTemplates: patchById(state.mealTemplates, templateId, patch),
        })),
      deleteMealTemplate: (templateId: string) =>
        set((state) => ({
          mealTemplates: removeById(state.mealTemplates, templateId),
          weeklyMealPlans: state.weeklyMealPlans.filter((plan) => plan.templateId !== templateId),
        })),
      touchMealTemplate: (templateId: string, usedAt: string) =>
        set((state) => ({
          mealTemplates: state.mealTemplates.map((template) =>
            template.id === templateId
              ? {
                  ...template,
                  lastUsedAt: usedAt,
                }
              : template,
          ),
        })),
      applyMealTemplateToDate: (templateId: string, targetDate: string) =>
        set((state) => {
          const template = state.mealTemplates.find((candidate) => candidate.id === templateId)

          if (!template) {
            return state
          }

          const { entries, usedAt } = buildMealEntriesFromTemplate(template, targetDate)

          return {
            mealEntries: [...state.mealEntries, ...entries],
            mealTemplates: state.mealTemplates.map((candidate) =>
              candidate.id === templateId
                ? {
                    ...candidate,
                    lastUsedAt: usedAt,
                  }
                : candidate,
            ),
          }
        }),
      setWeeklyMealPlan: (weekday: WeekdayIndex, mealType: MealType, templateId: string) =>
        set((state) => {
          const existingPlan = state.weeklyMealPlans.find(
            (plan) => plan.weekday === weekday && plan.mealType === mealType,
          )

          if (existingPlan) {
            return {
              weeklyMealPlans: patchById(state.weeklyMealPlans, existingPlan.id, { templateId }),
            }
          }

          return {
            weeklyMealPlans: [...state.weeklyMealPlans, withId({ weekday, mealType, templateId })],
          }
        }),
      clearWeeklyMealPlan: (weekday: WeekdayIndex, mealType: MealType) =>
        set((state) => ({
          weeklyMealPlans: state.weeklyMealPlans.filter(
            (plan) => !(plan.weekday === weekday && plan.mealType === mealType),
          ),
        })),
      setWeeklyWorkoutPlan: (weekday: WeekdayIndex, templateId: string) =>
        set((state) => {
          const existingPlan = state.weeklyWorkoutPlans.find((plan) => plan.weekday === weekday)

          if (existingPlan) {
            return {
              weeklyWorkoutPlans: patchById(state.weeklyWorkoutPlans, existingPlan.id, { templateId }),
            }
          }

          return {
            weeklyWorkoutPlans: [...state.weeklyWorkoutPlans, withId({ weekday, templateId })],
          }
        }),
      clearWeeklyWorkoutPlan: (weekday: WeekdayIndex) =>
        set((state) => ({
          weeklyWorkoutPlans: state.weeklyWorkoutPlans.filter((plan) => plan.weekday !== weekday),
        })),
      toggleWeeklyPrepCheckedKey: (prepKey: string) =>
        set((state) => ({
          weeklyPrepCheckedKeys: state.weeklyPrepCheckedKeys.includes(prepKey)
            ? state.weeklyPrepCheckedKeys.filter((item) => item !== prepKey)
            : [...state.weeklyPrepCheckedKeys, prepKey],
        })),
      clearWeeklyPrepCheckedKeys: () =>
        set(() => ({
          weeklyPrepCheckedKeys: [],
        })),
      addPhotoEstimateRecord: (record) =>
        set((state) => ({
          photoEstimateRecords: [withId(record), ...state.photoEstimateRecords].slice(0, 12),
        })),
      addMealEntry: (entry: Omit<MealEntry, 'id'>) =>
        set((state) => ({
          foods: touchFoodById(state.foods, entry.sourceFoodId, entry.loggedAt),
          mealEntries: [...state.mealEntries, withId(entry)],
        })),
      updateMealEntry: (entryId: string, patch: Partial<MealEntry>) =>
        set((state) => {
          const currentEntry = state.mealEntries.find((entry) => entry.id === entryId)

          if (!currentEntry) {
            return state
          }

          const nextLoggedAt = patch.loggedAt ?? currentEntry.loggedAt
          const nextSourceFoodId = patch.sourceFoodId ?? currentEntry.sourceFoodId

          return {
            foods: touchFoodById(state.foods, nextSourceFoodId, nextLoggedAt),
            mealEntries: patchById(state.mealEntries, entryId, patch),
          }
        }),
      deleteMealEntry: (entryId: string) =>
        set((state) => ({
          mealEntries: removeById(state.mealEntries, entryId),
        })),
      addWorkoutTemplate: (template) => {
        const createdTemplate = withId(template)
        set((state) => ({
          workoutTemplates: [...state.workoutTemplates, createdTemplate],
        }))
        return createdTemplate
      },
      updateWorkoutTemplate: (templateId: string, patch: Partial<WorkoutTemplate>) =>
        set((state) => ({
          workoutTemplates: patchById(state.workoutTemplates, templateId, patch),
        })),
      deleteWorkoutTemplate: (templateId: string) =>
        set((state) => ({
          workoutTemplates: removeById(state.workoutTemplates, templateId),
          weeklyWorkoutPlans: state.weeklyWorkoutPlans.filter((plan) => plan.templateId !== templateId),
        })),
      applyWorkoutTemplateToDate: (templateId: string, targetDate: string) =>
        set((state) => {
          const template = state.workoutTemplates.find((candidate) => candidate.id === templateId)

          if (!template) {
            return state
          }

          return {
            workoutSessions: [...state.workoutSessions, buildWorkoutSessionFromTemplate(template, targetDate)],
          }
        }),
      addWorkoutSession: (session: Omit<WorkoutSession, 'id'>) =>
        set((state) => ({
          workoutSessions: [...state.workoutSessions, withId(session)],
        })),
      updateWorkoutSession: (sessionId: string, patch: Partial<WorkoutSession>) =>
        set((state) => ({
          workoutSessions: patchById(state.workoutSessions, sessionId, patch),
        })),
      deleteWorkoutSession: (sessionId: string) =>
        set((state) => ({
          workoutSessions: removeById(state.workoutSessions, sessionId),
        })),
      addBodyEntry: (entry: Omit<BodyEntry, 'id'>) =>
        set((state) => ({
          bodyEntries: [...state.bodyEntries, withId(entry)],
        })),
      updateBodyEntry: (entryId: string, patch: Partial<BodyEntry>) =>
        set((state) => ({
          bodyEntries: patchById(state.bodyEntries, entryId, patch),
        })),
      deleteBodyEntry: (entryId: string) =>
        set((state) => ({
          bodyEntries: removeById(state.bodyEntries, entryId),
        })),
      addRecoveryEntry: (entry: Omit<RecoveryEntry, 'id'>) =>
        set((state) => ({
          recoveryEntries: [...state.recoveryEntries, withId(entry)],
        })),
      updateRecoveryEntry: (entryId: string, patch: Partial<RecoveryEntry>) =>
        set((state) => ({
          recoveryEntries: patchById(state.recoveryEntries, entryId, patch),
        })),
      deleteRecoveryEntry: (entryId: string) =>
        set((state) => ({
          recoveryEntries: removeById(state.recoveryEntries, entryId),
        })),
      resetToClean: () =>
        set(() => ({
          ...createCleanSnapshot(),
        })),
      resetToSeed: () =>
        set(() => ({
          ...createSeedSnapshot(),
        })),
    }),
    {
      name: 'peakfuel-store',
      version: 5,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizeSnapshot(persistedState as Partial<FitnessStateSnapshot> | undefined),
      }),
      migrate: (persistedState, version) => {
        const normalized = normalizeSnapshot(
          persistedState as Partial<FitnessStateSnapshot> | undefined,
        )

        return version < 5 ? removeDemoRecords(normalized) : normalized
      },
    },
  ),
)
