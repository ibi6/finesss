import { Dumbbell, Scale, Sparkles, UtensilsCrossed } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import type { QuickEntryRequest } from '../QuickEntrySheet'
import { AiCoachPanel } from '../components/AiCoachPanel'
import { buildTodayFocus } from '../todayFocus.model'
import { formatDateKeyLabel, isTodayDateKey } from '../../store/date'
import { useFitnessStore } from '../../store/useFitnessStore'

interface TodayViewProps {
  targetDate: string
  onApplyMealTemplate?: (templateId: string, targetDateKey?: string) => void
  onApplyWorkoutTemplate?: (templateId: string, targetDateKey?: string) => void
  onOpenInsights?: () => void
  onQuickAction?: (request: QuickEntryRequest) => void
}

const focusIcons = {
  meal: UtensilsCrossed,
  workout: Dumbbell,
  body: Scale,
  recovery: Sparkles,
} as const

export function TodayView({ onQuickAction, targetDate }: TodayViewProps) {
  const snapshot = useFitnessStore(
    useShallow((state) => ({
      profile: state.profile,
      foods: state.foods,
      mealTemplates: state.mealTemplates,
      weeklyMealPlans: state.weeklyMealPlans,
      weeklyWorkoutPlans: state.weeklyWorkoutPlans,
      weeklyPrepCheckedKeys: state.weeklyPrepCheckedKeys,
      photoEstimateRecords: state.photoEstimateRecords,
      workoutTemplates: state.workoutTemplates,
      mealEntries: state.mealEntries,
      workoutSessions: state.workoutSessions,
      bodyEntries: state.bodyEntries,
      recoveryEntries: state.recoveryEntries,
    })),
  )
  const focus = buildTodayFocus(snapshot, targetDate)
  const FocusIcon = focusIcons[focus.mode]
  const dateLabel = isTodayDateKey(targetDate) ? '今天' : formatDateKeyLabel(targetDate)

  function openFocusRecord() {
    onQuickAction?.({
      mode: focus.mode,
      mealType: focus.mealType,
    })
  }

  return (
    <section className="today-simple-layout">
      <article className="today-focus-card">
        <p className="section-kicker">{dateLabel}</p>
        <div aria-hidden="true" className="today-focus-icon">
          <FocusIcon size={24} />
        </div>
        <div className="today-focus-copy">
          <span>你现在最该做</span>
          <h2>{focus.title}</h2>
          <p>{focus.summary}</p>
        </div>
        <button className="primary-button today-focus-action" onClick={openFocusRecord} type="button">
          {focus.actionLabel}
        </button>
      </article>
      <AiCoachPanel snapshot={snapshot} targetDate={targetDate} />
    </section>
  )
}
