import { Camera, Dumbbell, Search, Scale, Sparkles, UtensilsCrossed, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
import { buildPhotoEstimateAnalysis, type PhotoEstimateCandidate } from './components/photoEstimate'
import { foodMatchesQuery, normalizeFoodSearchText } from './foodSearch'
import { buildApiUrl } from './services/api'
import { searchOpenFoodFacts, type OnlineFoodResult } from './services/openFoodFacts'

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

interface AiFoodVisionEstimate {
  foodName: string
  servingLabel: string
  calories: number
  protein: number
  carbs: number
  fat: number
  sourceFoodId: string | null
}

interface AiFoodVisionResponse {
  provider: 'fallback' | 'openai' | string
  estimate: AiFoodVisionEstimate
  confidence: number
  note: string
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

function multiplyMacro(value: number, servings: number) {
  return Number((value * servings).toFixed(0))
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '')
    }
    reader.onerror = () => {
      reject(new Error('Failed to read food photo.'))
    }
    reader.readAsDataURL(file)
  })
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
    addFood,
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
      addFood: state.addFood,
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
  const [foodSearchQuery, setFoodSearchQuery] = useState(() => initialSuggestedFood?.name ?? favoriteFoods[0]?.name ?? '')
  const [onlineFoods, setOnlineFoods] = useState<OnlineFoodResult[]>([])
  const [onlineLookupStatus, setOnlineLookupStatus] = useState('')
  const [selectedOnlineFood, setSelectedOnlineFood] = useState<OnlineFoodResult | null>(null)
  const [saveOnlineFood, setSaveOnlineFood] = useState(false)
  const [quickPhotoName, setQuickPhotoName] = useState('')
  const [quickPhotoDataUrl, setQuickPhotoDataUrl] = useState('')
  const [quickPhotoPreviewUrl, setQuickPhotoPreviewUrl] = useState<string | null>(null)
  const [selectedPhotoFoodId, setSelectedPhotoFoodId] = useState<string | null>(null)
  const [aiVisionStatus, setAiVisionStatus] = useState('')
  const [isAiVisionLoading, setIsAiVisionLoading] = useState(false)
  const [workoutForm, setWorkoutForm] = useState(() =>
    createWorkoutForm(requestedWorkoutTemplate ?? latestWorkoutTemplate),
  )
  const [bodyForm, setBodyForm] = useState(() =>
    createBodyForm(relevantBodyEntry, profile.startWeight),
  )
  const [recoveryForm, setRecoveryForm] = useState(() =>
    createRecoveryForm(relevantRecoveryEntry, requestedRecoveryPreset),
  )
  const localFoodMatches = useMemo(() => {
    const normalizedQuery = normalizeFoodSearchText(foodSearchQuery)

    if (!normalizedQuery) {
      return favoriteFoods
    }

    return foods
      .filter((food) => foodMatchesQuery(food, normalizedQuery))
      .sort((left, right) => {
        if (left.isFavorite !== right.isFavorite) {
          return left.isFavorite ? -1 : 1
        }

        return (right.lastUsedAt ?? '').localeCompare(left.lastUsedAt ?? '')
      })
      .slice(0, 5)
  }, [favoriteFoods, foodSearchQuery, foods])
  const quickPhotoAnalysis = useMemo(
    () =>
      buildPhotoEstimateAnalysis({
        foods,
        query: foodSearchQuery,
        fileName: quickPhotoName,
        portionHint: 'regular',
        sceneHint: 'auto',
        mealTypeHint: mealForm.mealType,
      }),
    [foodSearchQuery, foods, mealForm.mealType, quickPhotoName],
  )
  const quickPhotoCandidates = quickPhotoName ? quickPhotoAnalysis.candidates.slice(0, 3) : []
  const quickPhotoActiveCandidate =
    quickPhotoCandidates.find((candidate) => candidate.food.id === selectedPhotoFoodId) ??
    quickPhotoCandidates[0] ??
    null

  useEffect(
    () => () => {
      if (quickPhotoPreviewUrl) {
        URL.revokeObjectURL(quickPhotoPreviewUrl)
      }
    },
    [quickPhotoPreviewUrl],
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

  function applyFood(food: Food) {
    setSelectedOnlineFood(null)
    setSaveOnlineFood(false)
    setFoodSearchQuery(food.name)
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

  function applyOnlineFood(food: OnlineFoodResult) {
    setSelectedOnlineFood(food)
    setSaveOnlineFood(false)
    setFoodSearchQuery(food.name)
    setMealForm((current) => ({
      ...current,
      foodName: food.name,
      servingLabel: food.servingLabel,
      calories: String(food.calories),
      protein: String(food.protein),
      carbs: String(food.carbs),
      fat: String(food.fat),
      sourceFoodId: null,
    }))
  }

  function applyPhotoCandidate(candidate: PhotoEstimateCandidate) {
    const servings = candidate.suggestedServings

    setSelectedOnlineFood(null)
    setSaveOnlineFood(false)
    setSelectedPhotoFoodId(candidate.food.id)
    setFoodSearchQuery(candidate.food.name)
    setMealForm((current) => ({
      ...current,
      foodName: candidate.food.name,
      servingLabel:
        servings === 1 ? candidate.food.servingLabel : `${servings} x ${candidate.food.servingLabel}`,
      calories: String(multiplyMacro(candidate.food.calories, servings)),
      protein: String(multiplyMacro(candidate.food.protein, servings)),
      carbs: String(multiplyMacro(candidate.food.carbs, servings)),
      fat: String(multiplyMacro(candidate.food.fat, servings)),
      sourceFoodId: candidate.source === 'library' ? candidate.food.id : null,
    }))
  }

  function applyAiFoodEstimate(estimate: AiFoodVisionEstimate) {
    setSelectedOnlineFood(null)
    setSaveOnlineFood(false)
    setSelectedPhotoFoodId(estimate.sourceFoodId)
    setFoodSearchQuery(estimate.foodName)
    setMealForm((current) => ({
      ...current,
      foodName: estimate.foodName,
      servingLabel: estimate.servingLabel,
      calories: String(Math.round(estimate.calories)),
      protein: String(Math.round(estimate.protein)),
      carbs: String(Math.round(estimate.carbs)),
      fat: String(Math.round(estimate.fat)),
      sourceFoodId: estimate.sourceFoodId,
    }))
  }

  async function handleQuickPhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (quickPhotoPreviewUrl) {
      URL.revokeObjectURL(quickPhotoPreviewUrl)
    }

    setQuickPhotoPreviewUrl(URL.createObjectURL(file))
    setQuickPhotoName(file.name.replace(/\.[^.]+$/, ''))
    setQuickPhotoDataUrl('')
    setSelectedPhotoFoodId(null)
    setAiVisionStatus('')

    try {
      setQuickPhotoDataUrl(await readFileAsDataUrl(file))
    } catch {
      setAiVisionStatus('照片读取失败，可以先用本地候选或手动填写。')
    }
  }

  async function identifyQuickPhotoWithAi() {
    if (!quickPhotoName) {
      return
    }

    setIsAiVisionLoading(true)
    setAiVisionStatus('AI 识别中...')

    try {
      const response = await fetch(buildApiUrl('/api/ai/food-vision'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoName: quickPhotoName,
          query: foodSearchQuery,
          imageDataUrl: quickPhotoDataUrl,
          candidates: quickPhotoCandidates.map((candidate) => ({
            name: candidate.food.name,
            servingLabel:
              candidate.suggestedServings === 1
                ? candidate.food.servingLabel
                : `${candidate.suggestedServings} x ${candidate.food.servingLabel}`,
            calories: multiplyMacro(candidate.food.calories, candidate.suggestedServings),
            protein: multiplyMacro(candidate.food.protein, candidate.suggestedServings),
            carbs: multiplyMacro(candidate.food.carbs, candidate.suggestedServings),
            fat: multiplyMacro(candidate.food.fat, candidate.suggestedServings),
            sourceFoodId: candidate.source === 'library' ? candidate.food.id : null,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('AI food vision request failed')
      }

      const result = (await response.json()) as AiFoodVisionResponse
      applyAiFoodEstimate(result.estimate)
      setAiVisionStatus(result.note || `AI 已带入，可信度约 ${Math.round(result.confidence)}%`)
    } catch {
      if (quickPhotoActiveCandidate) {
        applyPhotoCandidate(quickPhotoActiveCandidate)
      }
      setAiVisionStatus('AI 识别暂时不可用，已保留本地照片候选。')
    } finally {
      setIsAiVisionLoading(false)
    }
  }

  async function lookupFoodOnline() {
    setOnlineLookupStatus('查询中...')
    setOnlineFoods([])

    try {
      const results = await searchOpenFoodFacts(foodSearchQuery || mealForm.foodName)
      setOnlineFoods(results)
      setOnlineLookupStatus(results.length > 0 ? `找到 ${results.length} 个在线结果` : '在线也没找到合适结果')
    } catch {
      setOnlineLookupStatus('联网查询失败，仍可手动保存。')
    }
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
    let sourceFoodId = mealForm.sourceFoodId

    if (selectedOnlineFood && saveOnlineFood) {
      const createdFood = addFood({
        name: mealForm.foodName.trim(),
        servingLabel: mealForm.servingLabel.trim(),
        calories: Number(mealForm.calories),
        protein: Number(mealForm.protein),
        carbs: Number(mealForm.carbs),
        fat: Number(mealForm.fat),
        isFavorite: true,
      })
      sourceFoodId = createdFood.id
    }

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
      sourceFoodId,
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
            <div className="panel-subsection quick-entry-section quick-food-search-section">
              <label className="search-field quick-food-search-field">
                <Search size={16} />
                <input
                  aria-label="搜索食物或商品"
                  onChange={(event) => setFoodSearchQuery(event.target.value)}
                  placeholder="先搜本地食物，找不到再联网"
                  type="search"
                  value={foodSearchQuery}
                />
              </label>

              {localFoodMatches.length > 0 ? (
                <div className="favorite-chip-row quick-food-result-row">
                  {localFoodMatches.map((food) => (
                    <button
                      aria-label={`带入 ${food.name}`}
                      className="favorite-food-pill"
                      key={food.id}
                      onClick={() => applyFood(food)}
                      type="button"
                    >
                      <strong>{food.name}</strong>
                      <span>{food.calories} kcal · {food.servingLabel}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="inline-note">本地没搜到，可以手动填，也可以联网查一下。</p>
              )}

              <div className="quick-food-online-row">
                <button
                  className="ghost-button inline-action-button"
                  disabled={!foodSearchQuery.trim()}
                  onClick={lookupFoodOnline}
                  type="button"
                >
                  联网查一下
                </button>
                {onlineLookupStatus ? <span className="inline-note">{onlineLookupStatus}</span> : null}
              </div>

              {onlineFoods.length > 0 ? (
                <div className="stack-list quick-food-online-list">
                  {onlineFoods.map((food) => (
                    <button
                      aria-label={`带入 ${food.name}`}
                      className="list-item list-item--dense quick-food-online-card"
                      key={food.id}
                      onClick={() => applyOnlineFood(food)}
                      type="button"
                    >
                      <div>
                        <strong>{food.name}</strong>
                        <p>{food.servingLabel}</p>
                      </div>
                      <div className="numeric-meta">
                        <strong>{food.calories} kcal</strong>
                        <span>{food.protein} g 蛋白</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}

              <details className="quick-photo-estimate-card">
                <summary>
                  <Camera size={16} />
                  <span>拍照估算热量</span>
                </summary>
                <div className="quick-photo-estimate-body">
                  <label className="quick-photo-upload-field">
                    <input
                      accept="image/*"
                      aria-label="拍照或上传食物照片"
                      capture="environment"
                      className="visually-hidden-input"
                      onChange={handleQuickPhotoChange}
                      type="file"
                    />
                    <span>{quickPhotoName ? '重新拍一张' : '拍照或上传'}</span>
                  </label>
                  <p className="inline-note">
                    {quickPhotoName
                      ? `当前照片：${quickPhotoName}`
                      : '拍完后会按照片文件名、搜索词和餐次给一版热量候选。'}
                  </p>

                  {quickPhotoName ? (
                    <div className="quick-photo-ai-row">
                      <button
                        className="primary-button quick-photo-ai-button"
                        disabled={isAiVisionLoading}
                        onClick={identifyQuickPhotoWithAi}
                        type="button"
                      >
                        {isAiVisionLoading ? '识别中...' : 'AI 识别照片'}
                      </button>
                      {aiVisionStatus ? <span className="inline-note">{aiVisionStatus}</span> : null}
                    </div>
                  ) : null}

                  {quickPhotoName ? (
                    quickPhotoCandidates.length > 0 ? (
                      <div className="quick-photo-candidate-grid">
                        {quickPhotoCandidates.map((candidate) => (
                          <button
                            aria-label={`按照片带入 ${candidate.food.name}`}
                            aria-pressed={quickPhotoActiveCandidate?.food.id === candidate.food.id}
                            className={`list-item list-item--dense quick-photo-candidate${
                              quickPhotoActiveCandidate?.food.id === candidate.food.id ? ' is-active' : ''
                            }`}
                            key={candidate.food.id}
                            onClick={() => applyPhotoCandidate(candidate)}
                            type="button"
                          >
                            <div>
                              <strong>{candidate.food.name}</strong>
                              <p>{candidate.reasons.slice(0, 2).join(' · ')}</p>
                            </div>
                            <div className="numeric-meta">
                              <strong>{multiplyMacro(candidate.food.calories, candidate.suggestedServings)} kcal</strong>
                              <span>{candidate.confidence}%</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="inline-note">还没估出候选，先在上面补一个关键词，比如“汉堡”或“奶茶”。</p>
                    )
                  ) : null}
                </div>
              </details>
            </div>

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
                      onClick={() => applyFood(food)}
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
                    onChange={(event) => {
                      setMealForm((current) => ({
                        ...current,
                        foodName: event.target.value,
                        sourceFoodId: null,
                      }))
                      setSelectedOnlineFood(null)
                      setSaveOnlineFood(false)
                    }}
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

              {selectedOnlineFood ? (
                <label className="checkbox-row quick-online-save-row">
                  <input
                    checked={saveOnlineFood}
                    onChange={(event) => setSaveOnlineFood(event.target.checked)}
                    type="checkbox"
                  />
                  <span>保存为常用</span>
                </label>
              ) : null}
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
