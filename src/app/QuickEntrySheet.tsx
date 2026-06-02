import { Dumbbell, Scale, Sparkles, UtensilsCrossed, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

import {
  createDateStampForDateKey,
  formatDateKeyLabel,
  resolveDateKey,
} from '../store/date'
import {
  getRecoveryPresetByLabel,
  recoveryPresets,
  type RecoveryPreset,
  type RecoveryPresetLabel,
} from '../store/recoveryPresets'
import type {
  BodyEntry,
  EnergyLevel,
  Food,
  MealType,
  RecoveryEntry,
  WorkoutKind,
  WorkoutTemplate,
} from '../store/types'
import { useFitnessStore } from '../store/useFitnessStore'

export type QuickEntryMode = 'meal' | 'workout' | 'body' | 'recovery'
export interface QuickEntryRequest {
  mode: QuickEntryMode
  targetDateKey?: string
  mealPrefillFoodId?: string | null
  workoutPrefillTemplateId?: string | null
  recoveryPresetLabel?: RecoveryPresetLabel | null
  mealType?: MealType
}

interface QuickEntrySheetProps {
  request: QuickEntryRequest | null
  targetDate: string
  onClose: () => void
  onOpenWorkspace?: (mode: QuickEntryMode) => void
}

const modeMeta: Record<
  QuickEntryMode,
  {
    label: string
    title: string
    description: string
    icon: typeof UtensilsCrossed
  }
> = {
  meal: {
    label: '饮食',
    title: '这口吃的，直接记下来',
    description: '常吃食物先带入，不够再手填。',
    icon: UtensilsCrossed,
  },
  workout: {
    label: '训练',
    title: '把这次训练先落一笔',
    description: '常练可以先带一版，再补完整细节。',
    icon: Dumbbell,
  },
  body: {
    label: '体重',
    title: '先把称重和围度记住',
    description: '这一笔会直接沉到当天身体记录里。',
    icon: Scale,
  },
  recovery: {
    label: '恢复',
    title: '喝水、睡眠、步数一次补完',
    description: '先记恢复，今天的执行分才更准。',
    icon: Sparkles,
  },
}

function createMealForm(food?: Food, mealType: MealType = 'breakfast') {
  return {
    mealType,
    foodName: food?.name ?? '',
    servingLabel: food?.servingLabel ?? '',
    calories: String(food?.calories ?? 380),
    protein: String(food?.protein ?? 28),
    carbs: String(food?.carbs ?? 32),
    fat: String(food?.fat ?? 12),
    sourceFoodId: food?.id ?? null,
  }
}

function createWorkoutForm(template?: WorkoutTemplate) {
  return {
    title: template?.name ?? '',
    kind: template?.kind ?? ('strength' as WorkoutKind),
    durationMinutes: String(template?.durationMinutes ?? 50),
    estimatedCalories: String(template?.estimatedCalories ?? 320),
    notes: '',
    exercises: template?.exercises ?? [],
  }
}

function createBodyForm(entry: BodyEntry | null, fallbackWeight: number) {
  return {
    weight: String(entry?.weight ?? fallbackWeight),
    bodyFat: entry?.bodyFat != null ? String(entry.bodyFat) : '',
    waist: entry?.waist != null ? String(entry.waist) : '',
    chest: entry?.chest != null ? String(entry.chest) : '',
    hips: entry?.hips != null ? String(entry.hips) : '',
  }
}

function createRecoveryForm(entry: RecoveryEntry | null, preset?: RecoveryPreset | null) {
  if (preset) {
    return {
      waterLiters: String(preset.waterLiters),
      steps: String(preset.steps),
      sleepHours: String(preset.sleepHours),
      energy: String(preset.energy),
    }
  }

  return {
    waterLiters: String(entry?.waterLiters ?? 2.5),
    steps: String(entry?.steps ?? 9000),
    sleepHours: String(entry?.sleepHours ?? 7.4),
    energy: String(entry?.energy ?? 4),
  }
}

function findRelevantEntry<T extends { loggedAt: string; dateKey?: string }>(
  entries: T[],
  targetDate: string,
) {
  const selectedDateEntries = entries
    .filter((entry) => resolveDateKey(entry.dateKey, entry.loggedAt) === targetDate)
    .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))

  if (selectedDateEntries.length > 0) {
    return selectedDateEntries[0]
  }

  return [...entries].sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))[0] ?? null
}

function findSelectedDateEntry<T extends { loggedAt: string; dateKey?: string }>(entries: T[], targetDate: string) {
  return (
    entries
      .filter((entry) => resolveDateKey(entry.dateKey, entry.loggedAt) === targetDate)
      .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))[0] ?? null
  )
}

export function QuickEntrySheet({
  request,
  targetDate,
  onClose,
  onOpenWorkspace,
}: QuickEntrySheetProps) {
  const {
    profile,
    foods,
    workoutTemplates,
    bodyEntries,
    recoveryEntries,
    addMealEntry,
    addWorkoutSession,
    addBodyEntry,
    addRecoveryEntry,
    updateBodyEntry,
    updateRecoveryEntry,
  } = useFitnessStore(
    useShallow((state) => ({
      profile: state.profile,
      foods: state.foods,
      workoutTemplates: state.workoutTemplates,
      bodyEntries: state.bodyEntries,
      recoveryEntries: state.recoveryEntries,
      addMealEntry: state.addMealEntry,
      addWorkoutSession: state.addWorkoutSession,
      addBodyEntry: state.addBodyEntry,
      addRecoveryEntry: state.addRecoveryEntry,
      updateBodyEntry: state.updateBodyEntry,
      updateRecoveryEntry: state.updateRecoveryEntry,
    })),
  )
  const favoriteFoods = useMemo(() => foods.filter((food) => food.isFavorite).slice(0, 4), [foods])
  const latestWorkoutTemplate = workoutTemplates[0]
  const requestedWorkoutTemplate =
    request?.workoutPrefillTemplateId != null
      ? workoutTemplates.find((template) => template.id === request.workoutPrefillTemplateId) ?? null
      : null
  const requestedRecoveryPreset = getRecoveryPresetByLabel(request?.recoveryPresetLabel)
  const relevantBodyEntry = useMemo(
    () => findRelevantEntry(bodyEntries, targetDate),
    [bodyEntries, targetDate],
  )
  const selectedBodyEntry = useMemo(
    () => findSelectedDateEntry(bodyEntries, targetDate),
    [bodyEntries, targetDate],
  )
  const relevantRecoveryEntry = useMemo(
    () => findRelevantEntry(recoveryEntries, targetDate),
    [recoveryEntries, targetDate],
  )
  const selectedRecoveryEntry = useMemo(
    () => findSelectedDateEntry(recoveryEntries, targetDate),
    [recoveryEntries, targetDate],
  )
  const initialSuggestedFood =
    request?.mealPrefillFoodId != null
      ? foods.find((food) => food.id === request.mealPrefillFoodId) ?? null
      : null

  const [activeMode, setActiveMode] = useState<QuickEntryMode>(request?.mode ?? 'meal')
  const [mealForm, setMealForm] = useState(() =>
    createMealForm(initialSuggestedFood ?? favoriteFoods[0], request?.mealType),
  )
  const [workoutForm, setWorkoutForm] = useState(() =>
    createWorkoutForm(requestedWorkoutTemplate ?? latestWorkoutTemplate),
  )
  const [bodyForm, setBodyForm] = useState(() =>
    createBodyForm(relevantBodyEntry, profile.startWeight),
  )
  const [recoveryForm, setRecoveryForm] = useState(() =>
    createRecoveryForm(relevantRecoveryEntry, requestedRecoveryPreset),
  )

  if (!request) {
    return null
  }

  const activeMeta = modeMeta[activeMode]
  const ActiveIcon = activeMeta.icon
  const selectedMealFood =
    mealForm.sourceFoodId != null
      ? foods.find((food) => food.id === mealForm.sourceFoodId) ?? null
      : null

  function closeSheet() {
    onClose()
  }

  function openWorkspace() {
    onOpenWorkspace?.(activeMode)
    onClose()
  }

  function applyFavoriteFood(food: Food) {
    setMealForm((current) => ({
      ...current,
      foodName: food.name,
      servingLabel: food.servingLabel,
      calories: String(food.calories),
      protein: String(food.protein),
      carbs: String(food.carbs),
      fat: String(food.fat),
      sourceFoodId: food.id,
    }))
  }

  function applyWorkoutTemplate(template: WorkoutTemplate) {
    setWorkoutForm({
      title: template.name,
      kind: template.kind,
      durationMinutes: String(template.durationMinutes),
      estimatedCalories: String(template.estimatedCalories),
      notes: '',
      exercises: template.exercises,
    })
  }

  function applyRecoveryPreset(preset: RecoveryPreset) {
    setRecoveryForm({
      waterLiters: String(preset.waterLiters),
      steps: String(preset.steps),
      sleepHours: String(preset.sleepHours),
      energy: String(preset.energy),
    })
  }

  function submitMeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const stamp = createDateStampForDateKey(targetDate)

    addMealEntry({
      mealType: mealForm.mealType,
      foodName: mealForm.foodName,
      servingLabel: mealForm.servingLabel,
      calories: Number(mealForm.calories),
      protein: Number(mealForm.protein),
      carbs: Number(mealForm.carbs),
      fat: Number(mealForm.fat),
      loggedAt: stamp.iso,
      dateKey: stamp.dateKey,
      sourceFoodId: mealForm.sourceFoodId,
    })

    closeSheet()
  }

  function submitWorkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const stamp = createDateStampForDateKey(targetDate)

    addWorkoutSession({
      kind: workoutForm.kind,
      title: workoutForm.title,
      startedAt: stamp.iso,
      dateKey: stamp.dateKey,
      durationMinutes: Number(workoutForm.durationMinutes),
      estimatedCalories: Number(workoutForm.estimatedCalories),
      notes: workoutForm.notes.trim(),
      exercises: workoutForm.exercises,
    })

    closeSheet()
  }

  function submitBody(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (selectedBodyEntry) {
      updateBodyEntry(selectedBodyEntry.id, {
        weight: Number(bodyForm.weight),
        bodyFat: bodyForm.bodyFat ? Number(bodyForm.bodyFat) : null,
        waist: bodyForm.waist ? Number(bodyForm.waist) : null,
        chest: bodyForm.chest ? Number(bodyForm.chest) : null,
        hips: bodyForm.hips ? Number(bodyForm.hips) : null,
      })
      closeSheet()
      return
    }

    const stamp = createDateStampForDateKey(targetDate)

    addBodyEntry({
      loggedAt: stamp.iso,
      dateKey: stamp.dateKey,
      weight: Number(bodyForm.weight),
      bodyFat: bodyForm.bodyFat ? Number(bodyForm.bodyFat) : null,
      waist: bodyForm.waist ? Number(bodyForm.waist) : null,
      chest: bodyForm.chest ? Number(bodyForm.chest) : null,
      hips: bodyForm.hips ? Number(bodyForm.hips) : null,
    })

    closeSheet()
  }

  function submitRecovery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (selectedRecoveryEntry) {
      updateRecoveryEntry(selectedRecoveryEntry.id, {
        waterLiters: Number(recoveryForm.waterLiters),
        steps: Number(recoveryForm.steps),
        sleepHours: Number(recoveryForm.sleepHours),
        energy: Number(recoveryForm.energy) as EnergyLevel,
      })
      closeSheet()
      return
    }

    const stamp = createDateStampForDateKey(targetDate)

    addRecoveryEntry({
      loggedAt: stamp.iso,
      dateKey: stamp.dateKey,
      waterLiters: Number(recoveryForm.waterLiters),
      steps: Number(recoveryForm.steps),
      sleepHours: Number(recoveryForm.sleepHours),
      energy: Number(recoveryForm.energy) as EnergyLevel,
    })

    closeSheet()
  }

  return (
    <div className="sheet-backdrop" onClick={closeSheet} role="presentation">
      <section
        aria-label="快速记录面板"
        aria-modal="true"
        className="settings-sheet quick-entry-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="settings-head">
          <div>
            <p className="section-kicker">快速记录</p>
            <h2>{activeMeta.title}</h2>
            <p className="muted-copy muted-copy--compact">{activeMeta.description}</p>
          </div>
          <button aria-label="关闭快速记录" className="icon-circle-button" onClick={closeSheet} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="quick-entry-summary">
          <span className="pill pill--muted">{formatDateKeyLabel(targetDate)}</span>
          <span className="pill">
            <ActiveIcon size={14} />
            <span>{activeMeta.label}</span>
          </span>
          {activeMode === 'meal' && selectedMealFood ? (
            <span className="pill pill--muted">{selectedMealFood.name}</span>
          ) : null}
        </div>

        <div className="scene-chip-row" role="tablist" aria-label="快速记录模式">
          {(Object.keys(modeMeta) as QuickEntryMode[]).map((modeOption) => (
            <button
              aria-selected={activeMode === modeOption}
              className={`scene-chip${activeMode === modeOption ? ' is-active' : ''}`}
              key={modeOption}
              onClick={() => setActiveMode(modeOption)}
              role="tab"
              type="button"
            >
              {modeMeta[modeOption].label}
            </button>
          ))}
        </div>

        {activeMode === 'meal' ? (
          <form className="feature-form quick-entry-form" onSubmit={submitMeal}>
            {favoriteFoods.length > 0 ? (
              <div className="panel-subsection quick-entry-section">
                <div className="meal-inline-head">
                  <div>
                    <p className="section-kicker">常吃带入</p>
                    <h3>点一下就能填满一版</h3>
                  </div>
                </div>
                <div className="favorite-chip-row">
                  {favoriteFoods.map((food) => (
                    <button
                      className="favorite-food-pill"
                      key={food.id}
                      onClick={() => applyFavoriteFood(food)}
                      type="button"
                    >
                      <strong>{food.name}</strong>
                      <span>{food.servingLabel}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="panel-subsection quick-entry-section">
              {selectedMealFood ? <p className="inline-note">已从常用食物带入，可继续微调</p> : null}
              <div className="form-grid">
                <label className="field field--span-2">
                  <span>食物名称</span>
                  <input
                    onChange={(event) =>
                      setMealForm((current) => ({
                        ...current,
                        foodName: event.target.value,
                        sourceFoodId: null,
                      }))
                    }
                    required
                    type="text"
                    value={mealForm.foodName}
                  />
                </label>

                <label className="field">
                  <span>餐次</span>
                  <select
                    onChange={(event) =>
                      setMealForm((current) => ({
                        ...current,
                        mealType: event.target.value as MealType,
                      }))
                    }
                    value={mealForm.mealType}
                  >
                    <option value="breakfast">早餐</option>
                    <option value="lunch">午餐</option>
                    <option value="dinner">晚餐</option>
                    <option value="snack">加餐</option>
                  </select>
                </label>

                <label className="field">
                  <span>份量</span>
                  <input
                    onChange={(event) =>
                      setMealForm((current) => ({
                        ...current,
                        servingLabel: event.target.value,
                      }))
                    }
                    required
                    type="text"
                    value={mealForm.servingLabel}
                  />
                </label>
              </div>

              <div className="macro-grid">
                <label className="field">
                  <span>热量</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) =>
                      setMealForm((current) => ({
                        ...current,
                        calories: event.target.value,
                      }))
                    }
                    required
                    type="number"
                    value={mealForm.calories}
                  />
                </label>
                <label className="field">
                  <span>蛋白质</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) =>
                      setMealForm((current) => ({
                        ...current,
                        protein: event.target.value,
                      }))
                    }
                    required
                    type="number"
                    value={mealForm.protein}
                  />
                </label>
                <label className="field">
                  <span>碳水</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) =>
                      setMealForm((current) => ({
                        ...current,
                        carbs: event.target.value,
                      }))
                    }
                    required
                    type="number"
                    value={mealForm.carbs}
                  />
                </label>
                <label className="field">
                  <span>脂肪</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) =>
                      setMealForm((current) => ({
                        ...current,
                        fat: event.target.value,
                      }))
                    }
                    required
                    type="number"
                    value={mealForm.fat}
                  />
                </label>
              </div>
            </div>

            <div className="form-actions form-actions--split">
              <button className="ghost-button" onClick={openWorkspace} type="button">
                打开完整页
              </button>
              <button className="primary-button" type="submit">
                保存饮食
              </button>
            </div>
          </form>
        ) : null}

        {activeMode === 'workout' ? (
          <form className="feature-form quick-entry-form" onSubmit={submitWorkout}>
            <div className="panel-subsection quick-entry-section">
              <div className="meal-inline-head">
                <div>
                  <p className="section-kicker">模板快带入</p>
                  <h3>先把今天这练带出来</h3>
                </div>
              </div>
              <div className="favorite-chip-row">
                {workoutTemplates.map((template) => (
                  <button
                    className="favorite-food-pill"
                    key={template.id}
                    onClick={() => applyWorkoutTemplate(template)}
                    type="button"
                  >
                    <strong>{template.name}</strong>
                    <span>
                      {template.durationMinutes} 分钟 · {template.estimatedCalories} kcal
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel-subsection quick-entry-section">
              <div className="form-grid">
                <label className="field field--span-2">
                  <span>训练标题</span>
                  <input
                    onChange={(event) =>
                      setWorkoutForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    required
                    type="text"
                    value={workoutForm.title}
                  />
                </label>

                <label className="field">
                  <span>训练类型</span>
                  <select
                    onChange={(event) =>
                      setWorkoutForm((current) => ({
                        ...current,
                        kind: event.target.value as WorkoutKind,
                      }))
                    }
                    value={workoutForm.kind}
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
                      setWorkoutForm((current) => ({
                        ...current,
                        durationMinutes: event.target.value,
                      }))
                    }
                    required
                    type="number"
                    value={workoutForm.durationMinutes}
                  />
                </label>

                <label className="field">
                  <span>消耗热量</span>
                  <input
                    inputMode="numeric"
                    onChange={(event) =>
                      setWorkoutForm((current) => ({
                        ...current,
                        estimatedCalories: event.target.value,
                      }))
                    }
                    required
                    type="number"
                    value={workoutForm.estimatedCalories}
                  />
                </label>

                <label className="field field--span-2">
                  <span>备注</span>
                  <textarea
                    onChange={(event) =>
                      setWorkoutForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="例如：状态不错、最后一组掉速"
                    value={workoutForm.notes}
                  />
                </label>
              </div>
            </div>

            <div className="form-actions form-actions--split">
              <button className="ghost-button" onClick={openWorkspace} type="button">
                打开完整页
              </button>
              <button className="primary-button" type="submit">
                保存训练
              </button>
            </div>
          </form>
        ) : null}

        {activeMode === 'body' ? (
          <form className="feature-form quick-entry-form" onSubmit={submitBody}>
            <div className="panel-subsection quick-entry-section">
              <div className="form-grid">
                <label className="field">
                  <span>体重</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) =>
                      setBodyForm((current) => ({
                        ...current,
                        weight: event.target.value,
                      }))
                    }
                    required
                    type="number"
                    value={bodyForm.weight}
                  />
                </label>
                <label className="field">
                  <span>体脂</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) =>
                      setBodyForm((current) => ({
                        ...current,
                        bodyFat: event.target.value,
                      }))
                    }
                    type="number"
                    value={bodyForm.bodyFat}
                  />
                </label>
                <label className="field">
                  <span>腰围</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) =>
                      setBodyForm((current) => ({
                        ...current,
                        waist: event.target.value,
                      }))
                    }
                    type="number"
                    value={bodyForm.waist}
                  />
                </label>
                <label className="field">
                  <span>胸围</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) =>
                      setBodyForm((current) => ({
                        ...current,
                        chest: event.target.value,
                      }))
                    }
                    type="number"
                    value={bodyForm.chest}
                  />
                </label>
                <label className="field">
                  <span>臀围</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) =>
                      setBodyForm((current) => ({
                        ...current,
                        hips: event.target.value,
                      }))
                    }
                    type="number"
                    value={bodyForm.hips}
                  />
                </label>
              </div>
            </div>

            <div className="form-actions form-actions--split">
              <button className="ghost-button" onClick={openWorkspace} type="button">
                打开完整页
              </button>
              <button className="primary-button" type="submit">
                {selectedBodyEntry ? '更新体重' : '保存体重'}
              </button>
            </div>
          </form>
        ) : null}

        {activeMode === 'recovery' ? (
          <form className="feature-form quick-entry-form" onSubmit={submitRecovery}>
            <div className="panel-subsection quick-entry-section">
              <div className="meal-inline-head">
                <div>
                  <p className="section-kicker">恢复预设</p>
                  <h3>先选接近的一天</h3>
                </div>
              </div>
              <div className="favorite-chip-row">
                {recoveryPresets.map((preset) => (
                  <button
                    className="favorite-food-pill"
                    key={preset.label}
                    onClick={() => applyRecoveryPreset(preset)}
                    type="button"
                  >
                    <strong>{preset.label}</strong>
                    <span>
                      {preset.waterLiters}L · {preset.steps} 步
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel-subsection quick-entry-section">
              <div className="form-grid">
                <label className="field">
                  <span>喝水</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) =>
                      setRecoveryForm((current) => ({
                        ...current,
                        waterLiters: event.target.value,
                      }))
                    }
                    type="number"
                    value={recoveryForm.waterLiters}
                  />
                </label>
                <label className="field">
                  <span>步数</span>
                  <input
                    inputMode="numeric"
                    onChange={(event) =>
                      setRecoveryForm((current) => ({
                        ...current,
                        steps: event.target.value,
                      }))
                    }
                    type="number"
                    value={recoveryForm.steps}
                  />
                </label>
                <label className="field">
                  <span>睡眠</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) =>
                      setRecoveryForm((current) => ({
                        ...current,
                        sleepHours: event.target.value,
                      }))
                    }
                    type="number"
                    value={recoveryForm.sleepHours}
                  />
                </label>
              </div>

              <div className="energy-block">
                <span className="field-label">精力评分</span>
                <div className="segmented-control" role="radiogroup" aria-label="快速精力评分">
                  {['1', '2', '3', '4', '5'].map((option) => (
                    <button
                      aria-checked={recoveryForm.energy === option}
                      className={`segment-button${recoveryForm.energy === option ? ' is-active' : ''}`}
                      key={option}
                      onClick={() =>
                        setRecoveryForm((current) => ({
                          ...current,
                          energy: option,
                        }))
                      }
                      role="radio"
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-actions form-actions--split">
              <button className="ghost-button" onClick={openWorkspace} type="button">
                打开完整页
              </button>
              <button className="primary-button" type="submit">
                {selectedRecoveryEntry ? '更新恢复' : '保存恢复'}
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  )
}
