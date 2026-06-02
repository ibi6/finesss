import type { WeekdayIndex, WorkoutKind, WorkoutTemplate } from '../../store/types'

export const blankExercise = () => ({
  id: crypto.randomUUID(),
  name: '',
  sets: 3,
  reps: 8,
  weight: 20,
})

export function cloneWorkoutExercises(exercises: WorkoutTemplate['exercises']) {
  return exercises.length > 0
    ? exercises.map((exercise) => ({
        ...exercise,
        id: crypto.randomUUID(),
      }))
    : [blankExercise()]
}

export const weeklyPlannerDays: Array<{ value: WeekdayIndex; label: string }> = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 0, label: '周日' },
]

export interface WorkoutTemplateDraft {
  id: string | null
  name: string
  kind: WorkoutKind
  duration: string
  burn: string
  exercises: ReturnType<typeof blankExercise>[]
}

export type WorkoutHistoryKindFilter = 'all' | WorkoutKind
