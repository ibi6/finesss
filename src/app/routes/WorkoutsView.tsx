import { Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { ConfirmSheet } from '../components/ConfirmSheet'
import {
  createDateFromKey,
  createDateStampForDateKey,
  formatDateKeyLabel,
  formatShortDateKey,
  isTodayDateKey,
  resolveDateKey,
} from '../../store/date'
import { buildWorkoutHistorySummary, buildWorkoutRhythmSummary } from '../../store/selectors'
import type { WeekdayIndex, WorkoutKind, WorkoutSession, WorkoutTemplate } from '../../store/types'
import { useFitnessStore } from '../../store/useFitnessStore'
import { WorkoutSummaryCards } from './WorkoutSummaryCards'
import {
  blankExercise,
  cloneWorkoutExercises,
  weeklyPlannerDays,
  type WorkoutHistoryKindFilter,
  type WorkoutTemplateDraft,
} from './WorkoutsView.model'

interface WorkoutsViewProps {
  targetDate: string
}

export function WorkoutsView({ targetDate }: WorkoutsViewProps) {
  const targetWeekday = createDateFromKey(targetDate).getDay() as WeekdayIndex
  const {
    addWorkoutSession,
    addWorkoutTemplate,
    updateWorkoutSession,
    updateWorkoutTemplate,
    deleteWorkoutSession,
    deleteWorkoutTemplate,
    applyWorkoutTemplateToDate,
    setWeeklyWorkoutPlan,
    clearWeeklyWorkoutPlan,
    workoutSessions,
    workoutTemplates,
    weeklyWorkoutPlans,
  } = useFitnessStore(
    useShallow((state) => ({
      addWorkoutSession: state.addWorkoutSession,
      addWorkoutTemplate: state.addWorkoutTemplate,
      updateWorkoutSession: state.updateWorkoutSession,
      updateWorkoutTemplate: state.updateWorkoutTemplate,
      deleteWorkoutSession: state.deleteWorkoutSession,
      deleteWorkoutTemplate: state.deleteWorkoutTemplate,
      applyWorkoutTemplateToDate: state.applyWorkoutTemplateToDate,
      setWeeklyWorkoutPlan: state.setWeeklyWorkoutPlan,
      clearWeeklyWorkoutPlan: state.clearWeeklyWorkoutPlan,
      workoutSessions: state.workoutSessions,
      workoutTemplates: state.workoutTemplates,
      weeklyWorkoutPlans: state.weeklyWorkoutPlans,
    })),
  )
  const [kind, setKind] = useState<WorkoutKind>('strength')
  const [plannerSelection, setPlannerSelection] = useState<{
    targetDateKey: string
    weekday: WeekdayIndex
  }>({
    targetDateKey: targetDate,
    weekday: targetWeekday,
  })
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState('60')
  const [burn, setBurn] = useState('340')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState([blankExercise()])
  const [editingWorkout, setEditingWorkout] = useState<{
    id: string
    startedAt: string
    dateKey?: string
  } | null>(null)
  const [templateDraft, setTemplateDraft] = useState<WorkoutTemplateDraft | null>(null)
  const [pendingDeleteWorkout, setPendingDeleteWorkout] = useState<{
    id: string
    title: string
  } | null>(null)
  const [pendingDeleteTemplate, setPendingDeleteTemplate] = useState<{
    id: string
    name: string
  } | null>(null)
  const [historyQuery, setHistoryQuery] = useState('')
  const [historyKindFilter, setHistoryKindFilter] = useState<WorkoutHistoryKindFilter>('all')
  const [historyRangeDays, setHistoryRangeDays] = useState<7 | 30>(7)
  const selectedSessions = useMemo(
    () =>
      workoutSessions
        .filter((session) => resolveDateKey(session.dateKey, session.startedAt) === targetDate)
        .sort((left, right) => right.startedAt.localeCompare(left.startedAt)),
    [targetDate, workoutSessions],
  )
  const selectedSummary = useMemo(
    () => ({
      totalMinutes: selectedSessions.reduce((sum, session) => sum + session.durationMinutes, 0),
      totalCalories: selectedSessions.reduce((sum, session) => sum + session.estimatedCalories, 0),
      strengthCount: selectedSessions.filter((session) => session.kind === 'strength').length,
      cardioCount: selectedSessions.filter((session) => session.kind === 'cardio').length,
      exerciseCount: selectedSessions.reduce((sum, session) => sum + session.exercises.length, 0),
    }),
    [selectedSessions],
  )
  const workoutRhythm = useMemo(
    () => buildWorkoutRhythmSummary({ workoutSessions }, targetDate),
    [targetDate, workoutSessions],
  )
  const workoutHistory = useMemo(
    () =>
      buildWorkoutHistorySummary(
        { workoutSessions },
        targetDate,
        {
          query: historyQuery,
          kind: historyKindFilter,
          rangeDays: historyRangeDays,
        },
      ),
    [historyKindFilter, historyQuery, historyRangeDays, targetDate, workoutSessions],
  )
  const isTodayView = isTodayDateKey(targetDate)
  const maxLoadMinutes = Math.max(...workoutRhythm.days.map((day) => day.minutes), 1)
  const plannerWeekday =
    plannerSelection.targetDateKey === targetDate ? plannerSelection.weekday : targetWeekday
  const weeklyWorkoutPlansByWeekday = useMemo(
    () => new Map(weeklyWorkoutPlans.map((plan) => [plan.weekday, plan])),
    [weeklyWorkoutPlans],
  )
  const workoutTemplatesById = useMemo(
    () => new Map(workoutTemplates.map((template) => [template.id, template])),
    [workoutTemplates],
  )
  const selectedWeeklyWorkoutPlan = weeklyWorkoutPlans.find((plan) => plan.weekday === plannerWeekday) ?? null
  const selectedPlannedWorkoutTemplate = selectedWeeklyWorkoutPlan
    ? workoutTemplatesById.get(selectedWeeklyWorkoutPlan.templateId) ?? null
    : null
  const selectedPlannerLabel =
    weeklyPlannerDays.find((day) => day.value === plannerWeekday)?.label ?? '周一'
  const selectedPlannerStatus = selectedPlannedWorkoutTemplate
    ? `已排 ${selectedPlannedWorkoutTemplate.name} · ${selectedPlannedWorkoutTemplate.durationMinutes} 分钟 · ${
        selectedPlannedWorkoutTemplate.kind === 'strength' ? '力量' : '有氧'
      }`
    : '这个训练日还没排模板，先从上面的常练模板里选一套。'
  const weeklyPlannedWorkoutItems = weeklyPlannerDays
    .map((day) => {
      const plan = weeklyWorkoutPlansByWeekday.get(day.value)

      if (!plan) {
        return null
      }

      const template = workoutTemplatesById.get(plan.templateId)

      if (!template) {
        return null
      }

      return {
        weekday: day,
        template,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item != null)
  const historySummaryLabel =
    workoutHistory.totalInRange === workoutHistory.filteredCount
      ? `近 ${historyRangeDays} 天共 ${workoutHistory.totalInRange} 条训练记录`
      : `近 ${historyRangeDays} 天显示 ${workoutHistory.filteredCount} / ${workoutHistory.totalInRange} 条记录`
  const showWeeklyPlanInlineNote =
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? true
      : window.matchMedia('(min-width: 421px)').matches
  const showWorkoutFormFooterNote =
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? true
      : window.matchMedia('(min-width: 421px)').matches

  function resetForm(nextKind: WorkoutKind = 'strength') {
    setEditingWorkout(null)
    setKind(nextKind)
    setTitle('')
    setDuration('60')
    setBurn('340')
    setNotes('')
    setExercises([blankExercise()])
  }

  function loadTemplate(template: WorkoutTemplate) {
    setEditingWorkout(null)
    setKind(template.kind)
    setTitle(template.name)
    setDuration(String(template.durationMinutes))
    setBurn(String(template.estimatedCalories))
    setNotes('')
    setExercises(cloneWorkoutExercises(template.exercises))
  }

  function startEditWorkout(workoutId: string) {
    const session = workoutSessions.find((candidate) => candidate.id === workoutId)
    if (!session) {
      return
    }

    setEditingWorkout({
      id: session.id,
      startedAt: session.startedAt,
      dateKey: session.dateKey,
    })
    setKind(session.kind)
    setTitle(session.title)
    setDuration(String(session.durationMinutes))
    setBurn(String(session.estimatedCalories))
    setNotes(session.notes)
    setExercises(cloneWorkoutExercises(session.exercises))
  }

  function updateExercise(index: number, key: 'name' | 'sets' | 'reps' | 'weight', value: string) {
    setExercises((current) =>
      current.map((exercise, currentIndex) =>
        currentIndex === index
          ? {
              ...exercise,
              [key]: key === 'name' ? value : Number(value),
            }
          : exercise,
      ),
    )
  }

  function appendExercise() {
    setExercises((current) => [...current, blankExercise()])
  }

  function removeExercise(index: number) {
    setExercises((current) => {
      if (current.length === 1) {
        return [blankExercise()]
      }

      return current.filter((_, currentIndex) => currentIndex !== index)
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const stamp = createDateStampForDateKey(targetDate)

    const payload = {
      kind,
      title,
      startedAt: editingWorkout?.startedAt ?? stamp.iso,
      dateKey: editingWorkout?.dateKey ?? stamp.dateKey,
      durationMinutes: Number(duration),
      estimatedCalories: Number(burn),
      notes,
      exercises:
        kind === 'strength'
          ? exercises.filter((exercise) => exercise.name.trim().length > 0)
          : [],
    }

    if (editingWorkout) {
      updateWorkoutSession(editingWorkout.id, payload)
      resetForm(kind)
      return
    }

    addWorkoutSession(payload)
    resetForm(kind)
  }

  function startCaptureWorkoutTemplate(session: WorkoutSession) {
    setTemplateDraft({
      id: null,
      name: session.title,
      kind: session.kind,
      duration: String(session.durationMinutes),
      burn: String(session.estimatedCalories),
      exercises: cloneWorkoutExercises(session.exercises),
    })
  }

  function startEditWorkoutTemplate(templateId: string) {
    const template = workoutTemplates.find((candidate) => candidate.id === templateId)

    if (!template) {
      return
    }

    setTemplateDraft({
      id: template.id,
      name: template.name,
      kind: template.kind,
      duration: String(template.durationMinutes),
      burn: String(template.estimatedCalories),
      exercises: cloneWorkoutExercises(template.exercises),
    })
  }

  function resetTemplateDraft() {
    setTemplateDraft(null)
  }

  function updateTemplateExercise(index: number, key: 'name' | 'sets' | 'reps' | 'weight', value: string) {
    setTemplateDraft((current) =>
      current
        ? {
            ...current,
            exercises: current.exercises.map((exercise, currentIndex) =>
              currentIndex === index
                ? {
                    ...exercise,
                    [key]: key === 'name' ? value : Number(value),
                  }
                : exercise,
            ),
          }
        : current,
    )
  }

  function appendTemplateExercise() {
    setTemplateDraft((current) =>
      current
        ? {
            ...current,
            exercises: [...current.exercises, blankExercise()],
          }
        : current,
    )
  }

  function removeTemplateExercise(index: number) {
    setTemplateDraft((current) => {
      if (!current) {
        return current
      }

      if (current.exercises.length === 1) {
        return {
          ...current,
          exercises: [blankExercise()],
        }
      }

      return {
        ...current,
        exercises: current.exercises.filter((_, currentIndex) => currentIndex !== index),
      }
    })
  }

  function handleSaveWorkoutTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!templateDraft) {
      return
    }

    const payload = {
      name: templateDraft.name.trim(),
      kind: templateDraft.kind,
      durationMinutes: Number(templateDraft.duration),
      estimatedCalories: Number(templateDraft.burn),
      exercises:
        templateDraft.kind === 'strength'
          ? templateDraft.exercises.filter((exercise) => exercise.name.trim().length > 0)
          : [],
    }

    if (!payload.name) {
      return
    }

    if (templateDraft.id) {
      updateWorkoutTemplate(templateDraft.id, payload)
    } else {
      addWorkoutTemplate(payload)
    }

    resetTemplateDraft()
  }

  function confirmDeleteWorkout() {
    if (!pendingDeleteWorkout) {
      return
    }

    deleteWorkoutSession(pendingDeleteWorkout.id)
    setPendingDeleteWorkout(null)
  }

  function confirmDeleteTemplate() {
    if (!pendingDeleteTemplate) {
      return
    }

    deleteWorkoutTemplate(pendingDeleteTemplate.id)
    setPendingDeleteTemplate(null)
  }

  function relogWorkoutSession(session: WorkoutSession) {
    const stamp = createDateStampForDateKey(targetDate)

    addWorkoutSession({
      kind: session.kind,
      title: session.title,
      startedAt: stamp.iso,
      dateKey: stamp.dateKey,
      durationMinutes: session.durationMinutes,
      estimatedCalories: session.estimatedCalories,
      notes: session.notes,
      exercises: session.exercises.map((exercise) => ({
        ...exercise,
        id: crypto.randomUUID(),
      })),
    })
  }

  function assignWeeklyWorkout(templateId: string) {
    setWeeklyWorkoutPlan(plannerWeekday, templateId)
  }

  function clearSelectedWeeklyWorkout() {
    clearWeeklyWorkoutPlan(plannerWeekday)
  }

  function applySelectedWeeklyWorkout() {
    if (!selectedPlannedWorkoutTemplate) {
      return
    }

    applyWorkoutTemplateToDate(selectedPlannedWorkoutTemplate.id, targetDate)
  }

  return (
    <section className="feature-layout">
      <article className="feature-panel feature-panel--wide">
        <div className="panel-head">
          <div>
            <p className="section-kicker">训练</p>
            <h2>把训练做成能连续复用的工作台</h2>
          </div>
          <div className="pill-row">
            <span className="pill">{formatDateKeyLabel(targetDate)}</span>
            <span className="pill pill--muted">{selectedSessions.length} 次训练</span>
          </div>
        </div>

        <WorkoutSummaryCards isTodayView={isTodayView} summary={selectedSummary} />

        <div className="meal-inline-section workout-rhythm-panel workout-rhythm-panel--compact">
          <div className="meal-inline-head workout-rhythm-head--compact">
            <div>
              <p className="section-kicker">本周训练节奏</p>
              <h3>{workoutRhythm.headline}</h3>
              <p className="muted-copy muted-copy--compact">{workoutRhythm.detail}</p>
            </div>
            <div className="pill-row">
              <span className="pill">
                {workoutRhythm.sessionCount} / {workoutRhythm.weeklyTarget} 次
              </span>
              <span className="pill pill--muted">{workoutRhythm.focusLabel}</span>
            </div>
          </div>

          <div aria-label="训练节奏摘要" className="workout-rhythm-grid workout-rhythm-grid--rail" role="list">
            <article className="meal-summary-card" role="listitem">
              <span>近 7 天总时长</span>
              <strong>{workoutRhythm.totalMinutes} 分钟</strong>
              <small>{workoutRhythm.totalCalories} kcal 预计消耗</small>
            </article>
            <article className="meal-summary-card" role="listitem">
              <span>活跃训练日</span>
              <strong>{workoutRhythm.activeDays} 天</strong>
              <small>这周有记录的训练日数</small>
            </article>
            <article className="meal-summary-card" role="listitem">
              <span>力量 / 有氧</span>
              <strong>
                {workoutRhythm.strengthSessions} / {workoutRhythm.cardioSessions}
              </strong>
              <small>{workoutRhythm.focusLabel}</small>
            </article>
            <article className="meal-summary-card" role="listitem">
              <span>平均单次</span>
              <strong>{workoutRhythm.averageSessionMinutes} 分钟</strong>
              <small>最长 {workoutRhythm.longestSessionMinutes} 分钟</small>
            </article>
          </div>

          <div className="workout-load-section">
            <div className="meal-inline-head">
              <div>
                <p className="section-kicker">近 7 天负荷</p>
                <h3>{workoutRhythm.activeDays} 天有训练，先把节奏稳住</h3>
              </div>
            </div>

            <div
              aria-label="近7天训练负荷"
              className="bar-list workout-load-list workout-load-list--rail workout-load-list--compact"
              role="list"
            >
              {workoutRhythm.days.map((day) => (
                <div className="bar-row workout-load-row workout-load-row--compact" key={day.dateKey} role="listitem">
                  <span>{formatShortDateKey(day.dateKey)}</span>
                  <div className="bar-track">
                    <div
                      className={`workout-load-fill is-${day.intensity}`}
                      style={{
                        width:
                          day.minutes > 0 ? `${Math.max((day.minutes / maxLoadMinutes) * 100, 8)}%` : '0%',
                      }}
                    />
                  </div>
                  <strong>{day.minutes} 分钟</strong>
                  <small>
                    {day.sessionCount > 0
                      ? `力量 ${day.strengthCount} / 有氧 ${day.cardioCount}`
                      : '休息 / 恢复日'}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="meal-inline-section">
          <div className="meal-inline-head">
            <div>
              <p className="section-kicker">模板快填</p>
              <h3>先带入常练模板，再补细节</h3>
            </div>
            <span className="inline-note">共 {workoutTemplates.length} 套模板</span>
          </div>

          <div className="template-row workout-template-grid">
            {workoutTemplates.map((template) => (
              <article className="workout-template-stack" key={template.id}>
                <button className="template-card" onClick={() => loadTemplate(template)} type="button">
                  <strong>{template.name}</strong>
                  <span>
                    {template.durationMinutes} min · {template.kind === 'strength' ? '力量' : '有氧'}
                  </span>
                </button>
                <div className="action-row action-row--wrap">
                  <button
                    aria-label={`编辑模板 ${template.name}`}
                    className="text-action"
                    onClick={() => startEditWorkoutTemplate(template.id)}
                    type="button"
                  >
                    编辑模板
                  </button>
                  <button
                    aria-label={`删除模板 ${template.name}`}
                    className="text-action text-action--danger"
                    onClick={() =>
                      setPendingDeleteTemplate({
                        id: template.id,
                        name: template.name,
                      })
                    }
                    type="button"
                  >
                    删除模板
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        {templateDraft ? (
          <form className="feature-form meal-form-shell workout-template-editor" onSubmit={handleSaveWorkoutTemplate}>
            <div className="meal-inline-head">
              <div>
                <p className="section-kicker">模板编辑</p>
                <h3>{templateDraft.id ? '修改这套训练模板' : '把这次训练存成下次的快捷模板'}</h3>
              </div>
              <span className="inline-note">
                {templateDraft.id
                  ? '只会更新模板，不会改动历史训练记录'
                  : '保存后会出现在模板快填和周训练计划里'}
              </span>
            </div>

            <div className="form-grid">
              <label className="field field--span-2">
                <span>模板名称</span>
                <input
                  onChange={(event) =>
                    setTemplateDraft((current) => (current ? { ...current, name: event.target.value } : current))
                  }
                  required
                  type="text"
                  value={templateDraft.name}
                />
              </label>

              <label className="field">
                <span>训练类型</span>
                <select
                  value={templateDraft.kind}
                  onChange={(event) =>
                    setTemplateDraft((current) =>
                      current ? { ...current, kind: event.target.value as WorkoutKind } : current,
                    )
                  }
                >
                  <option value="strength">力量</option>
                  <option value="cardio">有氧</option>
                </select>
              </label>

              <label className="field">
                <span>时长</span>
                <input
                  inputMode="numeric"
                  onChange={(event) =>
                    setTemplateDraft((current) => (current ? { ...current, duration: event.target.value } : current))
                  }
                  required
                  type="number"
                  value={templateDraft.duration}
                />
              </label>

              <label className="field">
                  <span>预估消耗</span>
                <input
                  inputMode="numeric"
                  onChange={(event) =>
                    setTemplateDraft((current) => (current ? { ...current, burn: event.target.value } : current))
                  }
                  required
                  type="number"
                  value={templateDraft.burn}
                />
              </label>
            </div>

            {templateDraft.kind === 'strength' ? (
              <div className="exercise-block">
                <div className="meal-inline-head">
                  <div>
                    <p className="section-kicker">模板动作</p>
                    <h3>把这套训练的动作顺手整理好</h3>
                  </div>
                  <button className="ghost-button inline-action-button" onClick={appendTemplateExercise} type="button">
                    <Plus size={16} />
                    <span>加动作</span>
                  </button>
                </div>

                <div className="stack-list">
                  {templateDraft.exercises.map((exercise, index) => (
                    <div className="exercise-row" key={exercise.id}>
                      <label className="field field--span-2">
                        <span>动作名称</span>
                        <input
                          onChange={(event) => updateTemplateExercise(index, 'name', event.target.value)}
                          type="text"
                          value={exercise.name}
                        />
                      </label>
                      <label className="field">
                        <span>组数</span>
                        <input
                          inputMode="numeric"
                          onChange={(event) => updateTemplateExercise(index, 'sets', event.target.value)}
                          type="number"
                          value={exercise.sets}
                        />
                      </label>
                      <label className="field">
                        <span>次数</span>
                        <input
                          inputMode="numeric"
                          onChange={(event) => updateTemplateExercise(index, 'reps', event.target.value)}
                          type="number"
                          value={exercise.reps}
                        />
                      </label>
                      <label className="field">
                        <span>重量</span>
                        <input
                          inputMode="decimal"
                          onChange={(event) => updateTemplateExercise(index, 'weight', event.target.value)}
                          type="number"
                          value={exercise.weight}
                        />
                      </label>
                      <button
                        aria-label={`删除模板第 ${index + 1} 个动作`}
                        className="icon-button icon-button--muted"
                        onClick={() => removeTemplateExercise(index)}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="form-actions form-actions--split">
              <button className="ghost-button" onClick={resetTemplateDraft} type="button">
                取消编辑
              </button>
              <button className="primary-button" type="submit">
                {templateDraft.id ? '更新模板' : '保存模板'}
              </button>
            </div>
          </form>
        ) : null}

        <div className="meal-inline-section workout-weekly-plan-panel">
          <div className="meal-inline-head">
            <div>
              <p className="section-kicker">训练周计划</p>
              <h3>把常练模板排进这一周</h3>
            </div>
            {showWeeklyPlanInlineNote ? (
              <span className="inline-note">到了那天就能直接开练</span>
            ) : null}
          </div>

          <div className="panel-subsection weekly-plan-shell weekly-plan-shell--tight">
            <div className="field-label">计划日期</div>
            <div className="weekly-plan-day-row weekly-plan-day-row--rail" role="list" aria-label="每周训练计划日期">
              {weeklyPlannerDays.map((day) => (
                <button
                  aria-label={`计划 ${day.label}`}
                  className={`segment-button${plannerWeekday === day.value ? ' is-active' : ''}`}
                  key={day.value}
                  onClick={() =>
                    setPlannerSelection({
                      targetDateKey: targetDate,
                      weekday: day.value,
                    })
                  }
                  type="button"
                >
                  {day.label}
                </button>
              ))}
            </div>

            <article className="weekly-plan-current-card weekly-plan-current-card--compact weekly-plan-current-card--tight weekly-plan-current-card--action-tight weekly-plan-current-card--copy-tight">
              <div className="weekly-plan-current-copy weekly-plan-current-copy--tight">
                <strong className="weekly-plan-current-copy-title--ultra-tight">当前槽位：{selectedPlannerLabel}</strong>
                <p className="weekly-plan-current-copy-text--ultra-tight">{selectedPlannerStatus}</p>
              </div>
              <div className="entry-actions weekly-plan-current-actions--tight">
                <button
                  aria-label="将计划带入当前日期训练"
                  className="primary-button weekly-plan-current-action-button--ultra-tight"
                  disabled={!selectedPlannedWorkoutTemplate}
                  onClick={applySelectedWeeklyWorkout}
                  type="button"
                >
                  用到 {formatShortDateKey(targetDate)}
                </button>
                <button
                  aria-label="清空训练计划"
                  className="ghost-button weekly-plan-current-action-button--ultra-tight"
                  disabled={!selectedWeeklyWorkoutPlan}
                  onClick={clearSelectedWeeklyWorkout}
                  type="button"
                >
                  清空计划
                </button>
              </div>
            </article>

            <div
              aria-label="训练计划模板"
              className="weekly-plan-template-grid weekly-plan-template-grid--rail weekly-plan-template-grid--compact weekly-plan-template-grid--tight"
              role="list"
            >
              {workoutTemplates.map((template) => {
                const isActive = selectedPlannedWorkoutTemplate?.id === template.id

                return (
                  <div key={`planner-${template.id}`} role="listitem">
                    <button
                      aria-label={`安排 ${template.name}`}
                      className={`weekly-plan-template-card weekly-plan-template-card--compact weekly-plan-template-card--tight weekly-plan-template-card--ultra-tight${isActive ? ' is-active' : ''}`}
                      onClick={() => assignWeeklyWorkout(template.id)}
                      type="button"
                    >
                      <div className="list-meta-row">
                        <strong>{template.name}</strong>
                        <span className="pill pill--muted">{template.kind === 'strength' ? '力量' : '有氧'}</span>
                      </div>
                      <p>
                        {template.durationMinutes} 分钟 · {template.estimatedCalories} kcal
                      </p>
                      <small>
                        {template.exercises.length > 0
                          ? `${template.exercises.length} 个动作`
                          : '无器械动作清单，适合直接记一笔有氧'}
                      </small>
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="stack-list weekly-workout-plan-list weekly-workout-plan-list--compact">
              {weeklyPlannedWorkoutItems.length > 0 ? (
                weeklyPlannedWorkoutItems.map((item) => (
                  <article className="list-item list-item--dense" key={item.weekday.value}>
                    <div>
                      <strong>
                        {item.weekday.label} · {item.template.name}
                      </strong>
                      <p>
                        {item.template.kind === 'strength' ? '力量' : '有氧'} · {item.template.durationMinutes} 分钟 ·{' '}
                        {item.template.estimatedCalories} kcal
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-note">这周还没有排训练，先把最常练的那几套固定下来。</div>
              )}
            </div>
          </div>
        </div>

        <form
          className="feature-form meal-form-shell workout-form-shell workout-form-shell--tight workout-form-shell--ultra-tight"
          onSubmit={handleSubmit}
        >
          <div className="meal-inline-head">
            <div>
              <p className="section-kicker">手动录入</p>
              <h3>{editingWorkout ? '修改这条训练记录' : '把这次训练完整记下来'}</h3>
            </div>
            {editingWorkout ? <span className="inline-note">编辑中，保存后会覆盖原记录</span> : null}
          </div>

          <div className="form-grid workout-form-grid--tight workout-form-grid--dense workout-form-grid--triple">
            <label className="field field--span-2 workout-form-field--full workout-form-field--primary-ultra-tight workout-form-field--primary-shell-ultra-tight workout-form-field--primary-control-ultra-tight">
              <span className="workout-form-primary-copy--ultra-tight workout-form-primary-copy--control-ultra-tight">训练标题</span>
              <input
                className="workout-form-primary-control--tight workout-form-primary-control--ultra-tight"
                onChange={(event) => setTitle(event.target.value)}
                required
                type="text"
                value={title}
              />
            </label>

            <label className="field workout-form-field--triplet workout-form-field--triplet-tight workout-form-field--triplet-ultra-tight">
              <span>训练类型</span>
              <select
                className="workout-form-triplet-control--tight workout-form-triplet-select--tight workout-form-triplet-control--ultra-tight"
                value={kind}
                onChange={(event) => setKind(event.target.value as WorkoutKind)}
              >
                <option value="strength">力量</option>
                <option value="cardio">有氧</option>
              </select>
            </label>

            <label className="field workout-form-field--triplet workout-form-field--triplet-tight workout-form-field--triplet-ultra-tight">
              <span>时长</span>
              <input
                className="workout-form-triplet-control--tight workout-form-triplet-input--tight workout-form-triplet-control--ultra-tight"
                inputMode="numeric"
                onChange={(event) => setDuration(event.target.value)}
                required
                type="number"
                value={duration}
              />
            </label>

            <label className="field workout-form-field--triplet workout-form-field--triplet-tight workout-form-field--triplet-ultra-tight">
              <span>预估消耗</span>
              <input
                className="workout-form-triplet-control--tight workout-form-triplet-input--tight workout-form-triplet-control--ultra-tight"
                inputMode="numeric"
                onChange={(event) => setBurn(event.target.value)}
                required
                type="number"
                value={burn}
              />
            </label>

            <label className="field field--span-2 workout-form-field--full workout-form-field--notes-compact workout-form-field--notes-tight workout-form-field--notes-ultra-tight workout-form-field--notes-shell-ultra-tight workout-form-field--notes-shell-gap-tight">
              <span className="workout-form-notes-copy--ultra-tight workout-form-notes-copy--control-ultra-tight workout-form-notes-copy--line-tight">备注</span>
              <textarea
                className="workout-form-notes-control--tight workout-form-notes-control--ultra-tight workout-form-notes-control--control-ultra-tight workout-form-notes-control--compact-control workout-form-notes-control--extra-compact-control workout-form-notes-control--ultra-compact-control workout-form-notes-control--hyper-compact-control"
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                value={notes}
              />
            </label>
          </div>

          {kind === 'strength' ? (
            <div className="exercise-block workout-form-exercise-block workout-form-exercise-block--compact workout-form-exercise-block--tight workout-form-exercise-block--ultra-tight">
              <div className="meal-inline-head workout-form-exercise-head--tight workout-form-exercise-head--ultra-tight">
                <div className="workout-form-exercise-copy--ultra-tight">
                  <p className="section-kicker">动作清单</p>
                  <h3 className="workout-form-exercise-copy-title--ultra-tight">把组数、次数和重量顺手补齐</h3>
                </div>
                <button
                  className="ghost-button inline-action-button inline-action-button--compact"
                  onClick={appendExercise}
                  type="button"
                >
                  <Plus size={16} />
                  <span>加动作</span>
                </button>
              </div>

              <div className="stack-list workout-exercise-stack--tight">
                {exercises.map((exercise, index) => (
                  <div
                    className="exercise-row workout-exercise-row workout-exercise-row--compact workout-exercise-row--tight-metrics workout-exercise-row--ultra-tight workout-exercise-row--grid-ultra-tight workout-exercise-row--vertical-ultra-tight"
                    key={exercise.id}
                  >
                    <label className="field field--span-2 workout-form-field--full workout-exercise-name workout-exercise-name-field--ultra-tight workout-exercise-name-field--control-ultra-tight">
                      <span className="workout-exercise-name-copy--ultra-tight">动作名称</span>
                      <input
                        className="workout-exercise-name-input--tight workout-exercise-name-input--ultra-tight"
                        onChange={(event) => updateExercise(index, 'name', event.target.value)}
                        type="text"
                        value={exercise.name}
                      />
                    </label>
                    <label className="field workout-exercise-metric-field workout-exercise-metric-field--ultra-tight workout-exercise-metric-field--control-ultra-tight">
                      <span>组数</span>
                      <input
                        className="workout-exercise-metric-input--tight workout-exercise-metric-input--ultra-tight"
                        inputMode="numeric"
                        onChange={(event) => updateExercise(index, 'sets', event.target.value)}
                        type="number"
                        value={exercise.sets}
                      />
                    </label>
                    <label className="field workout-exercise-metric-field workout-exercise-metric-field--ultra-tight workout-exercise-metric-field--control-ultra-tight">
                      <span>次数</span>
                      <input
                        className="workout-exercise-metric-input--tight workout-exercise-metric-input--ultra-tight"
                        inputMode="numeric"
                        onChange={(event) => updateExercise(index, 'reps', event.target.value)}
                        type="number"
                        value={exercise.reps}
                      />
                    </label>
                    <label className="field workout-exercise-metric-field workout-exercise-metric-field--ultra-tight workout-exercise-metric-field--control-ultra-tight">
                      <span>重量</span>
                      <input
                        className="workout-exercise-metric-input--tight workout-exercise-metric-input--ultra-tight"
                        inputMode="decimal"
                        onChange={(event) => updateExercise(index, 'weight', event.target.value)}
                        type="number"
                        value={exercise.weight}
                      />
                    </label>
                    <button
                      aria-label={`删除第 ${index + 1} 个动作`}
                      className="icon-button icon-button--muted workout-exercise-delete-button--ultra-tight"
                      onClick={() => removeExercise(index)}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="form-actions form-actions--split workout-form-actions--tight">
            {editingWorkout ? (
              <button className="ghost-button" onClick={() => resetForm(kind)} type="button">
                取消编辑
              </button>
            ) : (
              showWorkoutFormFooterNote ? (
                <span className="inline-note">模板、手填和补录都会统一沉到今天的训练记录里</span>
              ) : null
            )}

            <button className="primary-button" type="submit">
              {editingWorkout ? '更新训练' : '保存训练'}
            </button>
          </div>
        </form>
      </article>

      <article className="feature-panel feature-panel--wide">
        <div className="panel-head">
          <div>
            <p className="section-kicker">{isTodayView ? '今日训练' : '所选日期训练'}</p>
            <h3>
              共 {selectedSummary.totalMinutes} 分钟 · 约 {selectedSummary.totalCalories} 千卡
            </h3>
          </div>
        </div>
        <div className="stack-list">
          {selectedSessions.length > 0 ? (
            selectedSessions.map((session) => (
              <div className="list-item list-item--dense" key={session.id}>
                <div>
                  <strong>{session.title}</strong>
                  <p>
                    {session.kind === 'strength' ? '力量' : '有氧'} · {session.durationMinutes} 分钟
                  </p>
                </div>
                <div className="entry-actions">
                  <div className="numeric-meta">
                    <strong>{session.estimatedCalories} 千卡</strong>
                    <span>{session.exercises.length} 个动作</span>
                  </div>
                  <div className="action-row">
                    <button
                      aria-label={`编辑 ${session.title}`}
                      className="text-action"
                      onClick={() => startEditWorkout(session.id)}
                      type="button"
                    >
                      编辑
                    </button>
                    <button
                      aria-label={`将 ${session.title} 存为模板`}
                      className="text-action"
                      onClick={() => startCaptureWorkoutTemplate(session)}
                      type="button"
                    >
                      存为模板
                    </button>
                    <button
                      aria-label={`删除 ${session.title}`}
                      className="text-action text-action--danger"
                      onClick={() =>
                        setPendingDeleteWorkout({
                          id: session.id,
                          title: session.title,
                        })
                      }
                      type="button"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-note">这一天还没有训练记录，可以先补一次训练。</div>
          )}
        </div>
      </article>

      <article className="feature-panel feature-panel--wide">
        <div className="panel-head">
          <div>
            <p className="section-kicker">训练历史</p>
            <h3>训练历史工作台</h3>
          </div>
          <span className="inline-note">{historySummaryLabel}</span>
        </div>
        <div className="workout-history-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="搜索训练历史"
              onChange={(event) => setHistoryQuery(event.target.value)}
              placeholder="按标题、备注、动作名称搜索"
              type="search"
              value={historyQuery}
            />
          </label>

          <div className="workout-history-filter-grid">
            <div className="segmented-control segmented-control--3">
              {([
                ['all', '全部'],
                ['strength', '力量'],
                ['cardio', '有氧'],
              ] as const).map(([value, label]) => (
                <button
                  className={`segment-button${historyKindFilter === value ? ' is-active' : ''}`}
                  key={value}
                  onClick={() => setHistoryKindFilter(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="workout-history-range-row">
              {([
                [7, '近 7 天'],
                [30, '近 30 天'],
              ] as const).map(([value, label]) => (
                <button
                  className={`segment-button${historyRangeDays === value ? ' is-active' : ''}`}
                  key={value}
                  onClick={() => setHistoryRangeDays(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="stack-list workout-history-list">
          {workoutHistory.totalInRange === 0 ? (
            <div className="empty-note">近 {historyRangeDays} 天还没有训练记录，先记下一次训练。</div>
          ) : workoutHistory.items.length === 0 ? (
            <div className="empty-note">没有找到匹配的训练，换个关键词或筛选条件再试。</div>
          ) : (
            workoutHistory.items.map((session) => {
              const sessionDateKey = resolveDateKey(session.dateKey, session.startedAt)
              const sessionMeta =
                session.notes.trim().length > 0
                  ? session.notes
                  : session.exercises.length > 0
                    ? session.exercises.map((exercise) => exercise.name).join(' / ')
                    : '这次记录没有补充备注'

              return (
                <div className="list-item list-item--dense" key={session.id}>
                  <div>
                    <div className="list-meta-row">
                      <strong>{session.title}</strong>
                      <span className="pill pill--muted">{session.kind === 'strength' ? '力量' : '有氧'}</span>
                      <span className="pill pill--muted">{formatShortDateKey(sessionDateKey)}</span>
                    </div>
                    <p>
                        {session.durationMinutes} 分钟 · 约 {session.estimatedCalories} 千卡
                    </p>
                    <small className="subtle-caption">{sessionMeta}</small>
                  </div>
                  <div className="entry-actions">
                    <div className="numeric-meta">
                      <strong>{session.kind === 'strength' ? `${session.exercises.length} 个动作` : '有氧记录'}</strong>
                      <span>{sessionDateKey}</span>
                    </div>
                    <div className="action-row action-row--wrap">
                      <button
                        aria-label={`编辑 ${session.title}`}
                        className="text-action"
                        onClick={() => startEditWorkout(session.id)}
                        type="button"
                      >
                        编辑
                      </button>
                      <button
                        aria-label={`再练一次 ${session.title}`}
                        className="text-action"
                        onClick={() => relogWorkoutSession(session)}
                        type="button"
                      >
                        再练一次
                      </button>
                      <button
                        aria-label={`将 ${session.title} 存为模板`}
                        className="text-action"
                        onClick={() => startCaptureWorkoutTemplate(session)}
                        type="button"
                      >
                        存为模板
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </article>

      <ConfirmSheet
        confirmLabel="确认删除"
        message={
          pendingDeleteWorkout
            ? `会删除“${pendingDeleteWorkout.title}”这条训练记录，训练时长和消耗统计也会一起回退。`
            : ''
        }
        onClose={() => setPendingDeleteWorkout(null)}
        onConfirm={confirmDeleteWorkout}
        open={pendingDeleteWorkout !== null}
        title="删除这条训练记录？"
      />
      <ConfirmSheet
        confirmLabel="删除模板"
        message={
          pendingDeleteTemplate
            ? `会删除模板“${pendingDeleteTemplate.name}”，并清掉仍在引用它的周训练计划，但已经记过的训练记录不会受影响。`
            : ''
        }
        onClose={() => setPendingDeleteTemplate(null)}
        onConfirm={confirmDeleteTemplate}
        open={pendingDeleteTemplate !== null}
        title="删除这套训练模板？"
      />
    </section>
  )
}
