import { Camera, Clock3, Copy, PencilLine, Plus, Search, Star } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ConfirmSheet } from '../components/ConfirmSheet'
import {
  PhotoEstimatePanel,
  type PhotoEstimateApplyPayload,
} from '../components/PhotoEstimatePanel'
import {
  createDateFromKey,
  createDateStampForDateKey,
  formatDateKeyLabel,
  formatShortDateKey,
  isTodayDateKey,
  resolveDateKey,
  shiftDateKey,
} from '../../store/date'
import { buildDailySummary, buildMealReuseSummary, buildPhotoEstimateHistorySummary } from '../../store/selectors'
import type {
  Food,
  MealEntry,
  MealTemplate,
  MealType,
  PhotoEstimateRecord,
  WeekdayIndex,
} from '../../store/types'
import { useFitnessStore } from '../../store/useFitnessStore'
import { foodMatchesQuery, normalizeFoodSearchText } from '../foodSearch'
import { MealWorkspaceTabs } from './MealWorkspaceTabs'
import {
  buildTemplateName,
  buildWeeklyPrepKey,
  defaultFoodDraft,
  defaultMealForm,
  formatLastUsed,
  formatLoggedTime,
  mealTypeLabels,
  mealTypeOrder,
  photoEstimateSceneLabels,
  prepVisibilityOptions,
  prepWindowOptions,
  weeklyPlannerDays,
  type MealReuseRangeDays,
  type MealTemplateDraft,
  type MealWorkspace,
  type PendingLogFocusTarget,
  type PhotoHistoryRangeDays,
  type PrepVisibilityMode,
  type PrepWindowMode,
  type WeeklyPrepItem,
} from './MealsView.model'

interface MealsViewProps {
  targetDate: string
  advancedOpenToken?: number
}

const primaryMealTypes: MealType[] = ['breakfast', 'lunch', 'dinner']
const visibleFoodSearchLimit = 12

export function MealsView({ advancedOpenToken = 0, targetDate }: MealsViewProps) {
  const targetWeekday = createDateFromKey(targetDate).getDay() as WeekdayIndex
  const {
    profile,
    foods,
    mealEntries,
    mealTemplates,
    photoEstimateRecords,
    weeklyMealPlans,
    weeklyWorkoutPlans,
    weeklyPrepCheckedKeys,
    workoutTemplates,
    workoutSessions,
    bodyEntries,
    recoveryEntries,
    addFood,
    addMealTemplate,
    addMealEntry,
    updateMealTemplate,
    deleteMealTemplate,
    clearWeeklyMealPlan,
    setWeeklyMealPlan,
    clearWeeklyPrepCheckedKeys,
    applyMealTemplateToDate,
    toggleWeeklyPrepCheckedKey,
    addPhotoEstimateRecord,
    updateMealEntry,
    deleteMealEntry,
    toggleFavoriteFood,
  } = useFitnessStore(
    useShallow((state) => ({
      profile: state.profile,
      foods: state.foods,
      mealEntries: state.mealEntries,
      mealTemplates: state.mealTemplates,
      photoEstimateRecords: state.photoEstimateRecords,
      weeklyMealPlans: state.weeklyMealPlans,
      weeklyWorkoutPlans: state.weeklyWorkoutPlans,
      weeklyPrepCheckedKeys: state.weeklyPrepCheckedKeys,
      workoutTemplates: state.workoutTemplates,
      workoutSessions: state.workoutSessions,
      bodyEntries: state.bodyEntries,
      recoveryEntries: state.recoveryEntries,
      addFood: state.addFood,
      addMealTemplate: state.addMealTemplate,
      addMealEntry: state.addMealEntry,
      updateMealTemplate: state.updateMealTemplate,
      deleteMealTemplate: state.deleteMealTemplate,
      clearWeeklyMealPlan: state.clearWeeklyMealPlan,
      setWeeklyMealPlan: state.setWeeklyMealPlan,
      clearWeeklyPrepCheckedKeys: state.clearWeeklyPrepCheckedKeys,
      applyMealTemplateToDate: state.applyMealTemplateToDate,
      toggleWeeklyPrepCheckedKey: state.toggleWeeklyPrepCheckedKey,
      addPhotoEstimateRecord: state.addPhotoEstimateRecord,
      updateMealEntry: state.updateMealEntry,
      deleteMealEntry: state.deleteMealEntry,
      toggleFavoriteFood: state.toggleFavoriteFood,
    })),
  )
  const [form, setForm] = useState(defaultMealForm)
  const [editingMealId, setEditingMealId] = useState<string | null>(null)
  const [libraryQuery, setLibraryQuery] = useState('')
  const [reuseQuery, setReuseQuery] = useState('')
  const [reuseSourceFilter, setReuseSourceFilter] = useState<'all' | 'favorite' | 'recent'>('all')
  const [reuseRangeDays, setReuseRangeDays] = useState<MealReuseRangeDays>(7)
  const [photoHistoryQuery, setPhotoHistoryQuery] = useState('')
  const [photoHistorySceneFilter, setPhotoHistorySceneFilter] = useState<'all' | 'meal' | 'drink' | 'protein' | 'snack'>('all')
  const [photoHistoryRangeDays, setPhotoHistoryRangeDays] = useState<PhotoHistoryRangeDays>(7)
  const [showAdvancedTools, setShowAdvancedTools] = useState(false)
  const [showFoodComposer, setShowFoodComposer] = useState(false)
  const [mealWorkspace, setMealWorkspace] = useState<MealWorkspace>('log')
  const [foodDraft, setFoodDraft] = useState(defaultFoodDraft)
  const [plannerWeekday, setPlannerWeekday] = useState<WeekdayIndex>(targetWeekday)
  const [plannerMealType, setPlannerMealType] = useState<MealType>('breakfast')
  const [prepWindowMode, setPrepWindowMode] = useState<PrepWindowMode>('3days')
  const [prepVisibilityMode, setPrepVisibilityMode] = useState<PrepVisibilityMode>('all')
  const [prepCopyStatus, setPrepCopyStatus] = useState('')
  const [templateDraft, setTemplateDraft] = useState<MealTemplateDraft | null>(null)
  const [pendingDeleteMeal, setPendingDeleteMeal] = useState<{
    id: string
    foodName: string
  } | null>(null)
  const [pendingDeleteTemplate, setPendingDeleteTemplate] = useState<{
    id: string
    name: string
  } | null>(null)
  const photoEstimatePanelRef = useRef<HTMLElement | null>(null)
  const photoEstimateQueryInputRef = useRef<HTMLInputElement | null>(null)
  const manualFoodInputRef = useRef<HTMLInputElement | null>(null)
  const favoriteFoodsSectionRef = useRef<HTMLDivElement | null>(null)
  const recentPhotoHistoryRef = useRef<HTMLElement | null>(null)
  const pendingLogFocusTargetRef = useRef<PendingLogFocusTarget | null>(null)

  const summary = buildDailySummary(
    {
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
    },
    targetDate,
  )
  const isTodayView = isTodayDateKey(targetDate)
  const caloriesLeft = Math.max(profile.dailyCalories - summary.calories, 0)

  const selectedDayMeals = useMemo(
    () =>
      mealEntries
        .filter((entry) => resolveDateKey(entry.dateKey, entry.loggedAt) === targetDate)
        .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt)),
    [mealEntries, targetDate],
  )
  const recentMealEntries = useMemo(
    () => [...mealEntries].sort((left, right) => right.loggedAt.localeCompare(left.loggedAt)).slice(0, 3),
    [mealEntries],
  )
  const selectedDayMealBuckets = useMemo(() => {
    const buckets = new Map<
      MealType,
      {
        mealType: MealType
        entries: MealEntry[]
        calories: number
        protein: number
      }
    >()

    selectedDayMeals.forEach((entry) => {
      const currentBucket = buckets.get(entry.mealType) ?? {
        mealType: entry.mealType,
        entries: [],
        calories: 0,
        protein: 0,
      }

      currentBucket.entries.push(entry)
      currentBucket.calories += entry.calories
      currentBucket.protein += entry.protein
      buckets.set(entry.mealType, currentBucket)
    })

    return mealTypeOrder
      .map((mealType) => buckets.get(mealType))
      .filter((bucket): bucket is NonNullable<typeof bucket> => bucket != null)
  }, [selectedDayMeals])

  const favoriteFoods = useMemo(() => foods.filter((food) => food.isFavorite), [foods])
  const mealReuse = useMemo(
    () =>
      buildMealReuseSummary(
        { foods },
        targetDate,
        {
          query: reuseQuery,
          source: reuseSourceFilter,
          rangeDays: reuseRangeDays,
        },
      ),
    [foods, reuseQuery, reuseRangeDays, reuseSourceFilter, targetDate],
  )
  const mealReuseSummaryLabel =
    mealReuse.totalInRange === 0
      ? `近 ${reuseRangeDays} 天 0 个可带入食物`
      : mealReuse.filteredCount === mealReuse.totalInRange
        ? `近 ${reuseRangeDays} 天共 ${mealReuse.totalInRange} 个可带入食物`
        : `近 ${reuseRangeDays} 天显示 ${mealReuse.filteredCount} / ${mealReuse.totalInRange} 个`
  const photoEstimateHistory = useMemo(
    () =>
      buildPhotoEstimateHistorySummary(
        { photoEstimateRecords },
        targetDate,
        {
          query: photoHistoryQuery,
          scene: photoHistorySceneFilter,
          rangeDays: photoHistoryRangeDays,
        },
      ),
    [photoEstimateRecords, photoHistoryQuery, photoHistoryRangeDays, photoHistorySceneFilter, targetDate],
  )
  const photoEstimateHistorySummaryLabel =
    photoEstimateHistory.totalInRange === 0
      ? `近 ${photoHistoryRangeDays} 天 0 条识别记录`
      : photoEstimateHistory.filteredCount === photoEstimateHistory.totalInRange
        ? `近 ${photoHistoryRangeDays} 天共 ${photoEstimateHistory.totalInRange} 条识别记录`
        : `近 ${photoHistoryRangeDays} 天显示 ${photoEstimateHistory.filteredCount} / ${photoEstimateHistory.totalInRange} 条`;
  const filteredFoods = useMemo(() => {
    const normalizedQuery = normalizeFoodSearchText(libraryQuery)
    const sortedFoods = [...foods].sort((left, right) => {
      if (left.isFavorite !== right.isFavorite) {
        return left.isFavorite ? -1 : 1
      }

      return (right.lastUsedAt ?? '').localeCompare(left.lastUsedAt ?? '')
    })

    if (!normalizedQuery) {
      return sortedFoods.slice(0, visibleFoodSearchLimit)
    }

    return sortedFoods
      .filter((food) => foodMatchesQuery(food, normalizedQuery))
      .slice(0, visibleFoodSearchLimit)
  }, [foods, libraryQuery])
  const sortedMealTemplates = useMemo(
    () =>
      [...mealTemplates].sort((left, right) => {
        if (left.origin !== right.origin) {
          return left.origin === 'custom' ? -1 : 1
        }

        if ((right.lastUsedAt ?? '') !== (left.lastUsedAt ?? '')) {
          return (right.lastUsedAt ?? '').localeCompare(left.lastUsedAt ?? '')
        }

        return left.name.localeCompare(right.name)
      }),
    [mealTemplates],
  )
  const plannerTemplates = useMemo(
    () => sortedMealTemplates.filter((template) => template.mealType === plannerMealType),
    [plannerMealType, sortedMealTemplates],
  )
  const selectedPlannerLabel =
    weeklyPlannerDays.find((day) => day.value === plannerWeekday)?.label ?? '鍛ㄤ竴'
  const selectedWeeklyMealPlan =
    weeklyMealPlans.find(
      (plan) => plan.weekday === plannerWeekday && plan.mealType === plannerMealType,
    ) ?? null
  const selectedPlannedTemplate =
    sortedMealTemplates.find((template) => template.id === selectedWeeklyMealPlan?.templateId) ??
    null
  const prepWindowDays = useMemo(() => {
    if (prepWindowMode === 'week') {
      return weeklyPlannerDays.map((day) => ({
        dayKey: String(day.value),
        label: day.label,
        weekday: day.value,
      }))
    }

    const rangeLength = prepWindowMode === '3days' ? 3 : 7

    return Array.from({ length: rangeLength }, (_, offset) => {
      const dateKey = shiftDateKey(targetDate, offset)
      return {
        dayKey: dateKey,
        label: formatShortDateKey(dateKey),
        weekday: createDateFromKey(dateKey).getDay() as WeekdayIndex,
      }
    })
  }, [prepWindowMode, targetDate])
  const weeklyPrepItems = useMemo<WeeklyPrepItem[]>(() => {
    const templateById = new Map(sortedMealTemplates.map((template) => [template.id, template]))
    const prepItemsByKey = new Map<string, WeeklyPrepItem>()

    prepWindowDays.forEach((windowDay) => {
      weeklyMealPlans
        .filter((plan) => plan.weekday === windowDay.weekday)
        .forEach((plan) => {
          const template = templateById.get(plan.templateId)
          if (!template) {
            return
          }

          const slotLabel = `${windowDay.label}${mealTypeLabels[plan.mealType]}`

          template.items.forEach((item) => {
            const key = buildWeeklyPrepKey(item.foodName, item.servingLabel)
            const currentItem = prepItemsByKey.get(key) ?? {
              contextLabels: [],
              foodName: item.foodName,
              key,
              servingLabel: item.servingLabel,
              templateNames: [],
              totalCalories: 0,
              totalCount: 0,
            }

            currentItem.totalCount += 1
            currentItem.totalCalories += item.calories

            if (!currentItem.contextLabels.includes(slotLabel)) {
              currentItem.contextLabels.push(slotLabel)
            }

            if (!currentItem.templateNames.includes(template.name)) {
              currentItem.templateNames.push(template.name)
            }

            prepItemsByKey.set(key, currentItem)
          })
        })
    })

    return [...prepItemsByKey.values()].sort((left, right) => {
      if (right.totalCount !== left.totalCount) {
        return right.totalCount - left.totalCount
      }

      return left.foodName.localeCompare(right.foodName)
    })
  }, [prepWindowDays, sortedMealTemplates, weeklyMealPlans])
  const visiblePrepSlots = useMemo(() => {
    const validTemplateIds = new Set(sortedMealTemplates.map((template) => template.id))

    return prepWindowDays.flatMap((windowDay) =>
      weeklyMealPlans
        .filter((plan) => plan.weekday === windowDay.weekday && validTemplateIds.has(plan.templateId))
        .map((plan) => ({
          dayKey: windowDay.dayKey,
          id: plan.id,
        })),
    )
  }, [prepWindowDays, sortedMealTemplates, weeklyMealPlans])
  const plannedWeeklySlotCount = visiblePrepSlots.length
  const plannedWeeklyDayCount = new Set(visiblePrepSlots.map((slot) => slot.dayKey)).size
  const readyWeeklyPrepCount = useMemo(
    () => weeklyPrepItems.filter((item) => weeklyPrepCheckedKeys.includes(item.key)).length,
    [weeklyPrepCheckedKeys, weeklyPrepItems],
  )
  const filteredWeeklyPrepItems = useMemo(
    () =>
      prepVisibilityMode === 'pending'
        ? weeklyPrepItems.filter((item) => !weeklyPrepCheckedKeys.includes(item.key))
        : weeklyPrepItems,
    [prepVisibilityMode, weeklyPrepCheckedKeys, weeklyPrepItems],
  )
  const prepWindowLabel =
    prepWindowOptions.find((option) => option.value === prepWindowMode)?.label ?? '近3天'
  const prepSummaryCountLabel =
    prepVisibilityMode === 'pending'
      ? `${filteredWeeklyPrepItems.length} 项待准备`
      : `${filteredWeeklyPrepItems.length} 项可见`
  const selectedPlannerStatus = selectedPlannedTemplate
    ? `${selectedPlannedTemplate.name} · ${selectedPlannedTemplate.items.length} 项`
    : selectedWeeklyMealPlan
      ? '原先关联的模板已经不存在了，请重新排一套。'
      : '还没有排餐，先从下面挑一套模板。'
  const isLogWorkspace = mealWorkspace === 'log'
  const isPlanWorkspace = mealWorkspace === 'plan'
  const selectedDayMealBucketsByType = useMemo(
    () => new Map(selectedDayMealBuckets.map((bucket) => [bucket.mealType, bucket])),
    [selectedDayMealBuckets],
  )
  const snackMealBucket = selectedDayMealBucketsByType.get('snack') ?? null

  function updateField<Key extends keyof typeof defaultMealForm>(key: Key, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
      sourceFoodId: key === 'foodName' ? null : current.sourceFoodId,
    }))
  }

  function updateFoodDraft<Key extends keyof typeof defaultFoodDraft>(
    key: Key,
    value: (typeof defaultFoodDraft)[Key],
  ) {
    setFoodDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function fillFromFood(food: Food) {
    setForm((current) => ({
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

  function fillFormFromEstimate(estimate: PhotoEstimateApplyPayload['estimate']) {
    setForm((current) => ({
      ...current,
      foodName: estimate.foodName,
      servingLabel: estimate.servingLabel,
      calories: String(estimate.calories),
      protein: String(estimate.protein),
      carbs: String(estimate.carbs),
      fat: String(estimate.fat),
      sourceFoodId: estimate.sourceFoodId,
    }))
  }

  function findFoodForEstimate(estimate: PhotoEstimateApplyPayload['estimate']) {
    if (estimate.sourceFoodId) {
      return foods.find((food) => food.id === estimate.sourceFoodId) ?? null
    }

    return (
      foods.find(
        (food) =>
          food.name.trim().toLowerCase() === estimate.foodName.trim().toLowerCase() &&
          food.servingLabel.trim().toLowerCase() === estimate.servingLabel.trim().toLowerCase(),
      ) ?? null
    )
  }

  function rememberPhotoEstimate({ estimate, meta }: PhotoEstimateApplyPayload) {
    const stamp = createDateStampForDateKey(targetDate)
    const linkedFood = findFoodForEstimate(estimate)

    addPhotoEstimateRecord({
      loggedAt: stamp.iso,
      dateKey: stamp.dateKey,
      photoName: meta.photoName,
      query: meta.query,
      scene: meta.scene,
      sceneMode: meta.sceneMode,
      portionHint: meta.portionHint,
      keywordSummary: meta.keywordSummary,
      foodName: estimate.foodName,
      servingLabel: estimate.servingLabel,
      calories: estimate.calories,
      protein: estimate.protein,
      carbs: estimate.carbs,
      fat: estimate.fat,
      sourceFoodId: linkedFood?.id ?? estimate.sourceFoodId,
      confidence: meta.confidence,
      reasons: meta.reasons,
    })

    return {
      sourceFoodId: linkedFood?.id ?? estimate.sourceFoodId,
      stamp,
    }
  }

  function fillFromEstimate(payload: PhotoEstimateApplyPayload) {
    fillFormFromEstimate(payload.estimate)
    rememberPhotoEstimate(payload)
  }

  function logEstimateAsMeal(payload: PhotoEstimateApplyPayload) {
    const { stamp, sourceFoodId } = rememberPhotoEstimate(payload)

    addMealEntry({
      mealType: form.mealType,
      foodName: payload.estimate.foodName,
      servingLabel: payload.estimate.servingLabel,
      calories: payload.estimate.calories,
      protein: payload.estimate.protein,
      carbs: payload.estimate.carbs,
      fat: payload.estimate.fat,
      loggedAt: stamp.iso,
      dateKey: stamp.dateKey,
      sourceFoodId,
    })

    resetForm(form.mealType)
  }

  function saveEstimateAsFood(payload: PhotoEstimateApplyPayload) {
    const existingFood = findFoodForEstimate(payload.estimate)

    if (existingFood) {
      fillFromFood(existingFood)
      return
    }

    const createdFood = addFood({
      name: payload.estimate.foodName,
      servingLabel: payload.estimate.servingLabel,
      calories: payload.estimate.calories,
      protein: payload.estimate.protein,
      carbs: payload.estimate.carbs,
      fat: payload.estimate.fat,
      isFavorite: true,
    })

    fillFromFood(createdFood)
  }

  function fillFromEstimateRecord(record: PhotoEstimateRecord) {
    fillFormFromEstimate({
      foodName: record.foodName,
      servingLabel: record.servingLabel,
      calories: record.calories,
      protein: record.protein,
      carbs: record.carbs,
      fat: record.fat,
      sourceFoodId: record.sourceFoodId,
    })
  }

  function revealSection(
    sectionRef: RefObject<HTMLElement | HTMLDivElement | null>,
    inputRef?: RefObject<HTMLInputElement | null>,
  ) {
    sectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })

    const focusTarget = inputRef?.current ?? sectionRef.current
    focusTarget?.focus?.()
  }

  function focusPhotoEstimate() {
    revealSection(photoEstimatePanelRef, photoEstimateQueryInputRef)
  }

  function focusManualEntry() {
    manualFoodInputRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    manualFoodInputRef.current?.focus()
  }

  function focusFavoriteFoods() {
    revealSection(favoriteFoodsSectionRef)
  }

  function focusRecentPhotoHistory() {
    revealSection(recentPhotoHistoryRef)
  }

  function focusLogWorkspaceSection(target: PendingLogFocusTarget) {
    if (target === 'photo') {
      focusPhotoEstimate()
      return
    }

    if (target === 'manual') {
      focusManualEntry()
      return
    }

    if (target === 'favorites') {
      focusFavoriteFoods()
      return
    }

    focusRecentPhotoHistory()
  }

  function switchMealWorkspace(nextWorkspace: MealWorkspace) {
    pendingLogFocusTargetRef.current = null
    setMealWorkspace(nextWorkspace)
  }

  function jumpToLogWorkspace(target: PendingLogFocusTarget) {
    setShowAdvancedTools(true)

    if (!showAdvancedTools) {
      pendingLogFocusTargetRef.current = target
      setMealWorkspace('log')
      return
    }

    if (mealWorkspace === 'log') {
      focusLogWorkspaceSection(target)
      return
    }

    pendingLogFocusTargetRef.current = target
    setMealWorkspace('log')
  }

  function startMealEntryFor(mealType: MealType) {
    setForm((current) => ({
      ...current,
      mealType,
    }))
    setShowAdvancedTools(true)
    jumpToLogWorkspace('manual')
  }

  useEffect(() => {
    if (advancedOpenToken > 0) {
      const handle = window.setTimeout(() => setShowAdvancedTools(true), 0)

      return () => window.clearTimeout(handle)
    }
  }, [advancedOpenToken])

  useEffect(() => {
    if (!showAdvancedTools || mealWorkspace !== 'log' || pendingLogFocusTargetRef.current == null) {
      return
    }

    const pendingTarget = pendingLogFocusTargetRef.current
    pendingLogFocusTargetRef.current = null
    const focusSection = (
      sectionRef: RefObject<HTMLElement | HTMLDivElement | null>,
      inputRef?: RefObject<HTMLInputElement | null>,
    ) => {
      sectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
      ;(inputRef?.current ?? sectionRef.current)?.focus?.()
    }

    if (pendingTarget === 'photo') {
      focusSection(photoEstimatePanelRef, photoEstimateQueryInputRef)
      return
    }

    if (pendingTarget === 'manual') {
      manualFoodInputRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
      manualFoodInputRef.current?.focus()
      return
    }

    if (pendingTarget === 'favorites') {
      focusSection(favoriteFoodsSectionRef)
      return
    }

    focusSection(recentPhotoHistoryRef)
  }, [mealWorkspace, showAdvancedTools])

  function logPhotoEstimateRecord(record: PhotoEstimateRecord) {
    const stamp = createDateStampForDateKey(targetDate)
    const linkedFood = findFoodForEstimate({
      foodName: record.foodName,
      servingLabel: record.servingLabel,
      calories: record.calories,
      protein: record.protein,
      carbs: record.carbs,
      fat: record.fat,
      sourceFoodId: record.sourceFoodId,
    })

    addMealEntry({
      mealType: form.mealType,
      foodName: record.foodName,
      servingLabel: record.servingLabel,
      calories: record.calories,
      protein: record.protein,
      carbs: record.carbs,
      fat: record.fat,
      loggedAt: stamp.iso,
      dateKey: stamp.dateKey,
      sourceFoodId: linkedFood?.id ?? record.sourceFoodId,
    })
  }

  function applyMealTemplate(templateId: string) {
    applyMealTemplateToDate(templateId, targetDate)
  }

  function assignWeeklyMealPlan(templateId: string) {
    setWeeklyMealPlan(plannerWeekday, plannerMealType, templateId)
  }

  function clearSelectedWeeklyMealPlan() {
    clearWeeklyMealPlan(plannerWeekday, plannerMealType)
  }

  function applySelectedWeeklyMealPlan() {
    if (!selectedWeeklyMealPlan) {
      return
    }

    applyMealTemplate(selectedWeeklyMealPlan.templateId)
  }

  async function handleCopyPrepList() {
    if (filteredWeeklyPrepItems.length === 0) {
      return
    }

    const copyHeader = `备餐清单 · ${prepWindowLabel}`
    const lines = filteredWeeklyPrepItems.map((item) => {
      const contexts = item.contextLabels.join(' 路 ')
      return `- ${item.foodName} x${item.totalCount}（${item.servingLabel}）｜${contexts}｜预计 ${item.totalCalories} kcal｜${item.templateNames.join(' / ')}`
    })
    const copyText = [copyHeader, ...lines].join('\n')

    if (!navigator.clipboard?.writeText) {
      setPrepCopyStatus('当前环境不支持直接复制。')
      return
    }

    try {
      await navigator.clipboard.writeText(copyText)
      setPrepCopyStatus(`已复制 ${filteredWeeklyPrepItems.length} 项备餐内容。`)
    } catch {
      setPrepCopyStatus('复制失败，请稍后再试。')
    }
  }

  function startTemplateCapture(mealType: MealType) {
    const targetBucket = selectedDayMealBuckets.find((bucket) => bucket.mealType === mealType)

    if (!targetBucket) {
      return
    }

    setTemplateDraft({
      id: null,
      mode: 'create',
      mealType,
      name: buildTemplateName(mealType),
      items: targetBucket.entries.map((entry) => ({
        id: crypto.randomUUID(),
        foodName: entry.foodName,
        servingLabel: entry.servingLabel,
        calories: String(entry.calories),
        protein: String(entry.protein),
        carbs: String(entry.carbs),
        fat: String(entry.fat),
      })),
    })
  }

  function startTemplateEdit(template: MealTemplate) {
    if (template.origin !== 'custom') {
      return
    }

    setTemplateDraft({
      id: template.id,
      mode: 'edit',
      mealType: template.mealType,
      name: template.name,
      items: template.items.map((item) => ({
        id: item.id,
        foodName: item.foodName,
        servingLabel: item.servingLabel,
        calories: String(item.calories),
        protein: String(item.protein),
        carbs: String(item.carbs),
        fat: String(item.fat),
      })),
    })
  }

  function updateTemplateDraftName(value: string) {
    setTemplateDraft((current) =>
      current
        ? {
            ...current,
            name: value,
          }
        : current,
    )
  }

  function updateTemplateDraftMealType(mealType: MealType) {
    setTemplateDraft((current) => (current ? { ...current, mealType } : current))
  }

  function updateTemplateDraftItem(
    itemId: string,
    field: 'foodName' | 'servingLabel' | 'calories' | 'protein' | 'carbs' | 'fat',
    value: string,
  ) {
    setTemplateDraft((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
          }
        : current,
    )
  }

  function resetTemplateDraft() {
    setTemplateDraft(null)
  }

  function handleSaveTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!templateDraft || templateDraft.items.length === 0) {
      return
    }

    const normalizedTemplate = {
      name: templateDraft.name.trim() || buildTemplateName(templateDraft.mealType),
      mealType: templateDraft.mealType,
      items: templateDraft.items.map((item) => ({
        id: item.id,
        foodName: item.foodName.trim(),
        servingLabel: item.servingLabel.trim(),
        calories: Number(item.calories),
        protein: Number(item.protein),
        carbs: Number(item.carbs),
        fat: Number(item.fat),
      })),
    }

    if (templateDraft.mode === 'edit' && templateDraft.id) {
      updateMealTemplate(templateDraft.id, normalizedTemplate)
    } else {
      addMealTemplate({
        ...normalizedTemplate,
        origin: 'custom',
        lastUsedAt: null,
      })
    }

    resetTemplateDraft()
  }

  function startEditMeal(entryId: string) {
    const entry = mealEntries.find((candidate) => candidate.id === entryId)
    if (!entry) {
      return
    }

    setEditingMealId(entry.id)
    setForm({
      mealType: entry.mealType,
      foodName: entry.foodName,
      servingLabel: entry.servingLabel,
      calories: String(entry.calories),
      protein: String(entry.protein),
      carbs: String(entry.carbs),
      fat: String(entry.fat),
      sourceFoodId: entry.sourceFoodId,
    })
  }

  function repeatMealEntry(entry: MealEntry) {
    const stamp = createDateStampForDateKey(targetDate)

    addMealEntry({
      mealType: entry.mealType,
      foodName: entry.foodName,
      servingLabel: entry.servingLabel,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      loggedAt: stamp.iso,
      dateKey: stamp.dateKey,
      sourceFoodId: entry.sourceFoodId,
    })
  }

  function resetForm(nextMealType = form.mealType) {
    setEditingMealId(null)
    setForm({
      ...defaultMealForm,
      mealType: nextMealType,
    })
  }

  function resetFoodDraft() {
    setFoodDraft(defaultFoodDraft)
    setShowFoodComposer(false)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (editingMealId) {
      updateMealEntry(editingMealId, {
        mealType: form.mealType,
        foodName: form.foodName,
        servingLabel: form.servingLabel,
        calories: Number(form.calories),
        protein: Number(form.protein),
        carbs: Number(form.carbs),
        fat: Number(form.fat),
        sourceFoodId: form.sourceFoodId,
      })
    } else {
      const stamp = createDateStampForDateKey(targetDate)
      addMealEntry({
        mealType: form.mealType,
        foodName: form.foodName,
        servingLabel: form.servingLabel,
        calories: Number(form.calories),
        protein: Number(form.protein),
        carbs: Number(form.carbs),
        fat: Number(form.fat),
        loggedAt: stamp.iso,
        dateKey: stamp.dateKey,
        sourceFoodId: form.sourceFoodId,
      })
    }

    resetForm(form.mealType)
  }

  function handleCreateFood(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const createdFood = addFood({
      name: foodDraft.name.trim(),
      servingLabel: foodDraft.servingLabel.trim(),
      calories: Number(foodDraft.calories),
      protein: Number(foodDraft.protein),
      carbs: Number(foodDraft.carbs),
      fat: Number(foodDraft.fat),
      isFavorite: foodDraft.isFavorite,
    })

    fillFromFood(createdFood)
    resetFoodDraft()
  }

  function confirmDeleteMeal() {
    if (!pendingDeleteMeal) {
      return
    }

    deleteMealEntry(pendingDeleteMeal.id)
    setPendingDeleteMeal(null)
  }

  function confirmDeleteTemplate() {
    if (!pendingDeleteTemplate) {
      return
    }

    deleteMealTemplate(pendingDeleteTemplate.id)
    setPendingDeleteTemplate(null)
  }

  return (
    <section className="feature-layout">
      <article className="feature-panel feature-panel--wide">
        <div className="panel-head">
          <div>
            <p className="section-kicker">饮食</p>
            <h2>今天吃了什么，一眼看清</h2>
          </div>
          <div className="pill-row">
            <span className="pill pill--muted">{formatDateKeyLabel(targetDate)}</span>
            <span className="pill">{summary.mealsLogged} 条记录</span>
          </div>
        </div>

        <div className="meal-summary-grid">
          <article className="meal-summary-card">
            <span>已吃热量</span>
            <strong>{summary.calories}</strong>
            <small>目标 {profile.dailyCalories} kcal</small>
          </article>
          <article className="meal-summary-card">
            <span>蛋白质</span>
            <strong>{summary.protein} g</strong>
            <small>目标 {profile.dailyProtein} g</small>
          </article>
          <article className="meal-summary-card">
            <span>剩余热量</span>
            <strong>{caloriesLeft}</strong>
            <small>{isTodayView ? '今天还能继续安排' : '对照当天目标'}</small>
          </article>
        </div>

        <div aria-label="今日三餐概览" className="meal-day-overview-grid" role="list">
          {primaryMealTypes.map((mealType) => {
            const bucket = selectedDayMealBucketsByType.get(mealType)
            const entries = bucket?.entries ?? []

            return (
              <article
                aria-label={`${mealTypeLabels[mealType]}吃了什么`}
                className={`meal-day-overview-card${entries.length > 0 ? ' has-entries' : ''}`}
                key={mealType}
                role="listitem"
              >
                <div className="meal-day-overview-head">
                  <div>
                    <p className="section-kicker">今天</p>
                    <h3>{mealTypeLabels[mealType]}</h3>
                  </div>
                  <span className="pill pill--muted">
                    {entries.length > 0 ? `${bucket?.calories ?? 0} kcal` : '未记录'}
                  </span>
                </div>

                {entries.length > 0 ? (
                  <>
                    <p className="meal-day-overview-foods">
                      {entries.map((entry) => entry.foodName).join(' · ')}
                    </p>
                    <div className="pill-row meal-day-overview-macros">
                      <span className="pill pill--muted">{bucket?.protein ?? 0} g 蛋白质</span>
                      <span className="pill pill--muted">{entries.length} 项</span>
                    </div>
                  </>
                ) : (
                  <p className="meal-day-overview-empty">还没记，点一下补这一餐。</p>
                )}

                <button
                  aria-label={`记录${mealTypeLabels[mealType]}`}
                  className="secondary-button meal-day-overview-action"
                  onClick={() => startMealEntryFor(mealType)}
                  type="button"
                >
                  {entries.length > 0 ? '继续补' : `记${mealTypeLabels[mealType]}`}
                </button>
              </article>
            )
          })}
        </div>

        <details aria-label="加餐记录折叠区" className="meal-snack-details" open={snackMealBucket != null}>
          <summary>
            <span>加餐</span>
            <small>
              {snackMealBucket
                ? `${snackMealBucket.entries.length} 项 · ${snackMealBucket.calories} kcal`
                : '需要时再展开记录'}
            </small>
          </summary>
          <div className="meal-snack-body">
            {snackMealBucket ? (
              <p>{snackMealBucket.entries.map((entry) => entry.foodName).join(' · ')}</p>
            ) : (
              <p>今天还没有加餐记录。</p>
            )}
            <button
              aria-label="记录加餐"
              className="text-action"
              onClick={() => startMealEntryFor('snack')}
              type="button"
            >
              记加餐
            </button>
          </div>
        </details>

        {showAdvancedTools ? (
          <div className="meal-capture-panel">
            <div className="meal-inline-head">
              <div>
                <p className="section-kicker">快速记录</p>
                <h3>先选入口，再把这一餐快速记下来</h3>
              </div>
              <span className="inline-note">当前默认餐次 {mealTypeLabels[form.mealType]}</span>
            </div>

            <div className="quick-grid meal-capture-grid">
              <button
                aria-label="去拍照估算"
                className="action-button meal-jump-button"
                onClick={() => jumpToLogWorkspace('photo')}
                type="button"
              >
                <Camera size={18} />
                <span>拍照估算</span>
                <small>不确定热量时先拍一下</small>
              </button>
              <button
                aria-label="去手动录入"
                className="action-button meal-jump-button"
                onClick={() => jumpToLogWorkspace('manual')}
                type="button"
              >
                <PencilLine size={18} />
                <span>手动录入</span>
                <small>直接补一餐</small>
              </button>
              <button
                aria-label="去常吃带入"
                className="action-button meal-jump-button"
                onClick={() => jumpToLogWorkspace('favorites')}
                type="button"
              >
                <Star size={18} />
                <span>常吃带入</span>
                <small>{favoriteFoods.length > 0 ? `${favoriteFoods.length} 个常用项` : '先保存几个常用'}</small>
              </button>
              <button
                aria-label="去最近识别"
                className="action-button meal-jump-button"
                onClick={() => jumpToLogWorkspace('history')}
                type="button"
              >
                <Clock3 size={18} />
                <span>最近识别</span>
                <small>
                  {photoEstimateHistory.totalInRange > 0
                    ? `${photoEstimateHistory.totalInRange} 条可复用`
                    : '拍过的会留在这里'}
                </small>
              </button>
            </div>

            <MealWorkspaceTabs activeWorkspace={mealWorkspace} onSwitch={switchMealWorkspace} />
          </div>
        ) : null}
      </article>

      <article className="feature-panel frontstage-panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">最近</p>
            <h3>最近饮食</h3>
          </div>
          <button
            className="secondary-button"
            onClick={() => setShowAdvancedTools((current) => !current)}
            type="button"
          >
            {showAdvancedTools ? '收起全部' : '查看全部饮食记录'}
          </button>
        </div>
        <div className="stack-list">
          {recentMealEntries.length > 0 ? (
            recentMealEntries.map((entry) => (
              <div className="list-item list-item--dense" key={entry.id}>
                <div>
                  <strong>{entry.foodName}</strong>
                  <p>
                    {mealTypeLabels[entry.mealType]} · {entry.servingLabel}
                  </p>
                </div>
                <div className="numeric-meta">
                  <strong>{entry.calories} kcal</strong>
                  <span>{formatShortDateKey(resolveDateKey(entry.dateKey, entry.loggedAt))}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-note">还没有饮食记录，先记一餐。</div>
          )}
        </div>
      </article>

      {showAdvancedTools && isLogWorkspace ? (
        <div
          aria-labelledby="meal-workspace-tab-log"
          className="meal-workspace-panel advanced-workspace-panel"
          id="meals-workspace-log"
          role="tabpanel"
        >
          <PhotoEstimatePanel
            activeMealType={form.mealType}
            activeMealTypeLabel={mealTypeLabels[form.mealType]}
            foods={foods}
            onApplyEstimate={fillFromEstimate}
            onLogEstimate={logEstimateAsMeal}
            onSaveEstimateFood={saveEstimateAsFood}
            panelRef={photoEstimatePanelRef}
            queryInputRef={photoEstimateQueryInputRef}
          />

          <article className="feature-panel feature-panel--wide" ref={favoriteFoodsSectionRef} tabIndex={-1}>
            <div className="panel-head">
              <div>
                <p className="section-kicker">常用带入</p>
                <h3>先点常吃项，再微调份量</h3>
              </div>
            </div>
            <div className="favorite-chip-row">
              {favoriteFoods.length > 0 ? (
                favoriteFoods.map((food) => (
                  <button
                    className="favorite-food-pill"
                    key={food.id}
                    onClick={() => fillFromFood(food)}
                    type="button"
                  >
                    <strong>{food.name}</strong>
                    <span>{food.servingLabel}</span>
                  </button>
                ))
              ) : (
                <div className="empty-note">先收藏几种常吃食物，后面记录饮食会更快。</div>
              )}
            </div>
          </article>

          <article className="feature-panel">
            <div className="panel-head">
              <div>
                <p className="section-kicker">饮食带入</p>
                <h3>把最近吃过的食物直接带回来</h3>
              </div>
              <span className="inline-note">{mealReuseSummaryLabel}</span>
            </div>

            <div className="workout-history-toolbar">
              <label className="search-field">
                <Search size={16} />
                <input
                  aria-label="搜索饮食带入"
                  onChange={(event) => setReuseQuery(event.target.value)}
                  placeholder="按食物、份量或营养数字搜索"
                  type="search"
                  value={reuseQuery}
                />
              </label>

              <div className="workout-history-filter-grid">
                <div className="segmented-control segmented-control--3">
                  {([
                    ['all', '全部'],
                    ['favorite', '常用'],
                    ['recent', '最近'],
                  ] as const).map(([value, label]) => (
                    <button
                      className={`segment-button${reuseSourceFilter === value ? ' is-active' : ''}`}
                      key={value}
                      onClick={() => setReuseSourceFilter(value)}
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
                      className={`segment-button${reuseRangeDays === value ? ' is-active' : ''}`}
                      key={value}
                      onClick={() => setReuseRangeDays(value)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="stack-list workout-history-list">
              {mealReuse.totalInRange === 0 ? (
                <div className="empty-note">{`近 ${reuseRangeDays} 天还没有可复用食物，先记录几餐再回来带入。`}</div>
              ) : mealReuse.items.length === 0 ? (
                <div className="empty-note">当前筛选没有匹配结果，换个关键词或筛选条件再试。</div>
              ) : (
                mealReuse.items.map((food) => (
                  <div className="list-item list-item--dense" key={food.id}>
                    <div>
                      <div className="list-meta-row">
                        <strong>{food.name}</strong>
                        {food.isFavorite ? <span className="pill pill--muted">常用</span> : null}
                        {food.lastUsedDateKey ? (
                          <span className="pill pill--muted">{formatShortDateKey(food.lastUsedDateKey)}</span>
                        ) : null}
                      </div>
                      <small className="subtle-caption">
                        {food.servingLabel} / {food.calories} kcal / {food.protein} g 蛋白质
                      </small>
                    </div>
                    <div className="entry-actions">
                      <div className="numeric-meta">
                        <strong>{food.lastUsedAt ? formatLastUsed(food.lastUsedAt) : '仅常用，尚未带入'}</strong>
                        <span>{food.servingLabel}</span>
                      </div>
                      <button
                        aria-label={`带入 ${food.name}`}
                        className="text-action"
                        onClick={() => fillFromFood(food)}
                        type="button"
                      >
                        带入
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="feature-panel">
            <form className="feature-form meal-form-shell" onSubmit={handleSubmit}>
              <div className="meal-inline-head">
                <div>
                  <p className="section-kicker">手动录入</p>
                  <h3>{editingMealId ? '修改这条饮食记录' : '把这一餐直接记下来'}</h3>
                </div>
                {form.sourceFoodId ? <span className="inline-note">已从常用食物带入，可继续微调</span> : null}
              </div>

              <div className="form-grid">
                <label className="field field--span-2">
                  <span>食物名称</span>
                  <input
                    onChange={(event) => updateField('foodName', event.target.value)}
                    ref={manualFoodInputRef}
                    required
                    type="text"
                    value={form.foodName}
                  />
                </label>

                <label className="field">
                  <span>餐次</span>
                  <select value={form.mealType} onChange={(event) => updateField('mealType', event.target.value)}>
                    {mealTypeOrder.map((mealType) => (
                      <option key={mealType} value={mealType}>
                        {mealTypeLabels[mealType]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>份量</span>
                  <input
                    onChange={(event) => updateField('servingLabel', event.target.value)}
                    required
                    type="text"
                    value={form.servingLabel}
                  />
                </label>
              </div>

              <div className="macro-grid">
                <label className="field">
                  <span>热量</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) => updateField('calories', event.target.value)}
                    required
                    type="number"
                    value={form.calories}
                  />
                </label>
                <label className="field">
                  <span>蛋白质</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) => updateField('protein', event.target.value)}
                    required
                    type="number"
                    value={form.protein}
                  />
                </label>
                <label className="field">
                  <span>碳水</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) => updateField('carbs', event.target.value)}
                    required
                    type="number"
                    value={form.carbs}
                  />
                </label>
                <label className="field">
                  <span>脂肪</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) => updateField('fat', event.target.value)}
                    required
                    type="number"
                    value={form.fat}
                  />
                </label>
              </div>

              <div className="form-actions form-actions--split">
                {editingMealId ? (
                  <button className="ghost-button" onClick={() => resetForm()} type="button">
                    取消编辑
                  </button>
                ) : (
                  <span className="inline-note">手填、拍照估算、常用带入都会落到这里。</span>
                )}

                <button className="primary-button" type="submit">
                  {editingMealId ? '更新饮食' : '保存饮食'}
                </button>
              </div>
            </form>
          </article>

          <article className="feature-panel meal-source-panel">
            <details className="frontstage-details">
              <summary>
                <span>找不到食物？新增常用</span>
                <small>搜索、填入和自定义只在记录时使用</small>
              </summary>

              <div className="panel-subsection meal-source-body">
                <div className="meal-inline-head">
                  <div>
                    <p className="section-kicker">常用食物</p>
                    <h3>搜一下，直接把热量带进来</h3>
                  </div>
                  <button
                    className="ghost-button inline-action-button"
                    onClick={() => setShowFoodComposer((current) => !current)}
                    type="button"
                  >
                    <Plus size={16} />
                    <span>{showFoodComposer ? '收起新增' : '新增常用食物'}</span>
                  </button>
                </div>

                {showFoodComposer ? (
                  <form className="feature-form panel-subsection" onSubmit={handleCreateFood}>
                    <div className="meal-inline-head">
                      <div>
                        <p className="section-kicker">自定义常用</p>
                        <h3>把找不到的食物保存成下次可带入</h3>
                      </div>
                      <span className="inline-note">保存后会自动回填</span>
                    </div>

                    <div className="form-grid">
                      <label className="field field--span-2">
                        <span>食物名称</span>
                        <input
                          onChange={(event) => updateFoodDraft('name', event.target.value)}
                          required
                          type="text"
                          value={foodDraft.name}
                        />
                      </label>

                      <label className="field">
                        <span>份量</span>
                        <input
                          onChange={(event) => updateFoodDraft('servingLabel', event.target.value)}
                          required
                          type="text"
                          value={foodDraft.servingLabel}
                        />
                      </label>

                      <label className="field favorite-toggle-field">
                        <span>是否常吃</span>
                        <button
                          aria-pressed={foodDraft.isFavorite}
                          className={`segment-button${foodDraft.isFavorite ? ' is-active' : ''}`}
                          onClick={() => updateFoodDraft('isFavorite', !foodDraft.isFavorite)}
                          type="button"
                        >
                          {foodDraft.isFavorite ? '加入常用' : '只保存一次'}
                        </button>
                      </label>
                    </div>

                    <div className="macro-grid">
                      <label className="field">
                        <span>热量</span>
                        <input
                          inputMode="decimal"
                          onChange={(event) => updateFoodDraft('calories', event.target.value)}
                          required
                          type="number"
                          value={foodDraft.calories}
                        />
                      </label>
                      <label className="field">
                        <span>蛋白质</span>
                        <input
                          inputMode="decimal"
                          onChange={(event) => updateFoodDraft('protein', event.target.value)}
                          required
                          type="number"
                          value={foodDraft.protein}
                        />
                      </label>
                      <label className="field">
                        <span>碳水</span>
                        <input
                          inputMode="decimal"
                          onChange={(event) => updateFoodDraft('carbs', event.target.value)}
                          required
                          type="number"
                          value={foodDraft.carbs}
                        />
                      </label>
                      <label className="field">
                        <span>脂肪</span>
                        <input
                          inputMode="decimal"
                          onChange={(event) => updateFoodDraft('fat', event.target.value)}
                          required
                          type="number"
                          value={foodDraft.fat}
                        />
                      </label>
                    </div>

                    <div className="form-actions form-actions--split">
                      <button className="ghost-button" onClick={resetFoodDraft} type="button">
                        取消
                      </button>
                      <button className="primary-button" type="submit">
                        保存为常用
                      </button>
                    </div>
                  </form>
                ) : null}

                <label className="search-field meal-source-search">
                  <Search size={16} />
                  <input
                    aria-label="搜索常用食物"
                    onChange={(event) => setLibraryQuery(event.target.value)}
                    placeholder="按食物、份量或营养数字搜索"
                    type="search"
                    value={libraryQuery}
                  />
                </label>

                <div className="stack-list">
                  {filteredFoods.length > 0 ? (
                    filteredFoods.map((food) => (
                      <div className="list-item list-item--dense" key={food.id}>
                        <div>
                          <div className="list-meta-row">
                            <strong>{food.name}</strong>
                            {food.isFavorite ? <span className="pill pill--muted">常用</span> : null}
                          </div>
                          <p>
                            {food.calories} kcal · {food.protein} g protein · {food.servingLabel}
                          </p>
                          <small className="subtle-caption">{formatLastUsed(food.lastUsedAt)}</small>
                        </div>
                        <div className="entry-actions">
                          <button
                            className="secondary-text-button"
                            onClick={() => fillFromFood(food)}
                            type="button"
                          >
                            填入
                          </button>
                          <button
                            aria-label={`${food.isFavorite ? '取消常用' : '设为常用'} ${food.name}`}
                            className="icon-button"
                            onClick={() => toggleFavoriteFood(food.id)}
                            type="button"
                          >
                            <Star fill={food.isFavorite ? 'currentColor' : 'none'} size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-note">没有匹配到食物，可以新增一个常用食物。</div>
                  )}
                </div>
              </div>
            </details>
          </article>

          <article className="feature-panel" ref={recentPhotoHistoryRef} tabIndex={-1}>
            <div className="panel-head">
              <div>
                <p className="section-kicker">最近识别</p>
                <h3>拍过的食物可以再带入</h3>
              </div>
              <span className="inline-note">{photoEstimateHistorySummaryLabel}</span>
            </div>

            <div className="workout-history-toolbar">
              <label className="search-field">
                <Search size={16} />
                <input
                  aria-label="搜索最近识别"
                  onChange={(event) => setPhotoHistoryQuery(event.target.value)}
                  placeholder="按食物、营养、原因或场景搜索"
                  type="search"
                  value={photoHistoryQuery}
                />
              </label>

              <div className="workout-history-filter-grid">
                <div className="segmented-control">
                  {([
                    ['all', '全部'],
                    ['meal', '正餐'],
                    ['drink', '饮品'],
                    ['protein', '蛋白'],
                    ['snack', '加餐'],
                  ] as const).map(([value, label]) => (
                    <button
                      className={`segment-button${photoHistorySceneFilter === value ? ' is-active' : ''}`}
                      key={value}
                      onClick={() => setPhotoHistorySceneFilter(value)}
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
                      className={`segment-button${photoHistoryRangeDays === value ? ' is-active' : ''}`}
                      key={value}
                      onClick={() => setPhotoHistoryRangeDays(value)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="stack-list workout-history-list">
              {photoEstimateHistory.totalInRange === 0 ? (
                <div className="empty-note">{`近 ${photoHistoryRangeDays} 天还没有识别记录，先拍一次再回来复用。`}</div>
              ) : photoEstimateHistory.items.length === 0 ? (
                <div className="empty-note">当前筛选没有匹配结果，换个关键词或筛选条件再试。</div>
              ) : (
                photoEstimateHistory.items.map((record) => (
                  <article className="photo-estimate-record-card" key={record.id}>
                    <div className="photo-estimate-record-copy">
                      <div className="list-meta-row">
                        <strong>{record.foodName}</strong>
                        <div className="photo-estimate-record-meta">
                          <span className="pill pill--muted">{photoEstimateSceneLabels[record.scene]}</span>
                          <span className="pill pill--muted">{record.sourceFoodId ? '常用来源' : '参考估算'}</span>
                          <span className="pill pill--muted">{record.confidence}% 置信度</span>
                        </div>
                      </div>
                      <p>
                        {record.servingLabel} · {record.calories} kcal · {record.protein} g 蛋白质
                      </p>
                      <small>
                        {record.photoName ? `${record.photoName} · ` : ''}
                        {formatShortDateKey(resolveDateKey(record.dateKey, record.loggedAt))}
                        {record.reasons[0] ? ` · ${record.reasons[0]}` : ''}
                      </small>
                    </div>
                    <div className="photo-estimate-record-actions">
                      <button
                        aria-label={`再次带入 ${record.foodName} 识别记录`}
                        className="secondary-button photo-estimate-record-button"
                        onClick={() => fillFromEstimateRecord(record)}
                        type="button"
                      >
                        再次带入
                      </button>
                      <button
                        aria-label={`记一餐 ${record.foodName} 识别记录`}
                        className="primary-button photo-estimate-record-button"
                        onClick={() => logPhotoEstimateRecord(record)}
                        type="button"
                      >
                        记一餐
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </article>

          <article className="feature-panel feature-panel--wide">
            <div className="panel-head">
              <div>
                <p className="section-kicker">{isTodayView ? '今日记录' : '所选日期记录'}</p>
                <h3>{formatDateKeyLabel(targetDate)}</h3>
              </div>
              <div className="pill-row">
                <span className="pill">{selectedDayMeals.length} 条</span>
                <span className="pill pill--muted">{selectedDayMealBuckets.length} 组</span>
              </div>
            </div>

            <div className="meal-day-group-list">
              {selectedDayMealBuckets.length > 0 ? (
                selectedDayMealBuckets.map((bucket) => (
                  <article className="meal-day-group" key={bucket.mealType}>
                    <div className="meal-day-group-head">
                      <div>
                        <p className="section-kicker">餐次分组</p>
                        <h3>{mealTypeLabels[bucket.mealType]}</h3>
                      </div>
                      <div className="pill-row">
                        <span className="pill pill--muted">
                          {bucket.entries.length} 条 · {bucket.calories} kcal
                        </span>
                        <span className="pill pill--muted">{bucket.protein} g 蛋白质</span>
                      </div>
                    </div>

                    <div className="meal-day-entry-list">
                      {bucket.entries.map((entry) => (
                        <article className="meal-day-entry-card" key={entry.id}>
                          <div className="meal-day-entry-copy">
                            <div className="list-meta-row">
                              <strong>{entry.foodName}</strong>
                              <span className="pill pill--muted">{formatLoggedTime(entry.loggedAt)}</span>
                              {entry.sourceFoodId ? <span className="pill pill--muted">常用来源</span> : null}
                            </div>
                            <p>{entry.servingLabel}</p>
                            <div className="pill-row meal-day-entry-metrics">
                              <span className="pill pill--muted">{entry.calories} kcal</span>
                              <span className="pill pill--muted">{entry.protein} g 蛋白质</span>
                              <span className="pill pill--muted">{entry.carbs} g 碳水</span>
                              <span className="pill pill--muted">{entry.fat} g 脂肪</span>
                            </div>
                          </div>
                          <div className="meal-day-entry-actions">
                            <button
                              aria-label={`再记一次 ${entry.foodName}`}
                              className="secondary-button"
                              onClick={() => repeatMealEntry(entry)}
                              type="button"
                            >
                              再记一次
                            </button>
                            <button
                              aria-label={`编辑 ${entry.foodName}`}
                              className="text-action"
                              onClick={() => startEditMeal(entry.id)}
                              type="button"
                            >
                              编辑
                            </button>
                            <button
                              aria-label={`删除 ${entry.foodName}`}
                              className="text-action text-action--danger"
                              onClick={() =>
                                setPendingDeleteMeal({
                                  id: entry.id,
                                  foodName: entry.foodName,
                                })
                              }
                              type="button"
                            >
                              删除
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-note">这一天还没有饮食记录，可以先补一餐。</div>
              )}
            </div>
          </article>
        </div>
      ) : null}

      {showAdvancedTools && isPlanWorkspace ? (
        <div
          aria-labelledby="meal-workspace-tab-plan"
          className="meal-workspace-panel advanced-workspace-panel"
          id="meals-workspace-plan"
          role="tabpanel"
        >
          <article className="feature-panel feature-panel--wide">
            <div className="panel-head">
              <div>
                <p className="section-kicker">常用组合</p>
                <h3>把已经记过的一餐留给下一次</h3>
              </div>
              <div className="pill-row">
                <span className="pill">{selectedDayMealBuckets.length} 组可保存</span>
              </div>
            </div>

            <div className="template-capture-list">
              {selectedDayMealBuckets.length > 0 ? (
                selectedDayMealBuckets.map((bucket) => (
                  <article className="template-capture-card" key={bucket.mealType}>
                    <div className="template-capture-copy">
                      <div className="list-meta-row">
                        <strong>{mealTypeLabels[bucket.mealType]}</strong>
                        <span className="pill pill--muted">{bucket.entries.length} 项</span>
                      </div>
                      <p>{bucket.entries.map((entry) => entry.foodName).join(' · ')}</p>
                      <small className="subtle-caption">
                        {bucket.calories} kcal · {bucket.protein} g 蛋白质
                      </small>
                    </div>
                    <button
                      aria-label={`把${mealTypeLabels[bucket.mealType]}设为常用组合`}
                      className="secondary-button"
                      onClick={() => startTemplateCapture(bucket.mealType)}
                      type="button"
                    >
                      存为常用
                    </button>
                  </article>
                ))
              ) : (
                <div className="empty-note">先记下一餐，系统才能帮你保存成下次可直接带入的组合。</div>
              )}
            </div>

            {templateDraft ? (
              <form className="feature-form panel-subsection" onSubmit={handleSaveTemplate}>
                <div className="meal-inline-head">
                  <div>
                    <p className="section-kicker">{templateDraft.mode === 'edit' ? '编辑模板' : '新模板'}</p>
                    <h3>
                      {templateDraft.mode === 'edit'
                        ? `调整这套${mealTypeLabels[templateDraft.mealType]}模板`
                        : `把这组${mealTypeLabels[templateDraft.mealType]}变成下次的快捷项`}
                    </h3>
                  </div>
                  <span className="inline-note">
                    {templateDraft.mode === 'edit'
                      ? '只会更新模板，不会改动历史饮食记录'
                      : `${templateDraft.items.length} 项会一起保存`}
                  </span>
                </div>
                <label className="field">
                  <span>模板名称</span>
                  <input
                    onChange={(event) => updateTemplateDraftName(event.target.value)}
                    required
                    type="text"
                    value={templateDraft.name}
                  />
                </label>
                <label className="field">
                  <span>餐次</span>
                  <select
                    onChange={(event) => updateTemplateDraftMealType(event.target.value as MealType)}
                    value={templateDraft.mealType}
                  >
                    {mealTypeOrder.map((mealType) => (
                      <option key={mealType} value={mealType}>
                        {mealTypeLabels[mealType]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="template-preview-list">
                  {templateDraft.items.map((item, index) => (
                    <div className="template-preview-item" key={item.id}>
                      <label className="field">
                        <span>{`第 ${index + 1} 项食物名称`}</span>
                        <input
                          onChange={(event) => updateTemplateDraftItem(item.id, 'foodName', event.target.value)}
                          type="text"
                          value={item.foodName}
                        />
                      </label>
                      <label className="field">
                        <span>{`第 ${index + 1} 项份量`}</span>
                        <input
                          onChange={(event) => updateTemplateDraftItem(item.id, 'servingLabel', event.target.value)}
                          type="text"
                          value={item.servingLabel}
                        />
                      </label>
                      <label className="field">
                        <span>{`第 ${index + 1} 项热量`}</span>
                        <input
                          inputMode="numeric"
                          onChange={(event) => updateTemplateDraftItem(item.id, 'calories', event.target.value)}
                          type="number"
                          value={item.calories}
                        />
                      </label>
                      <label className="field">
                        <span>{`第 ${index + 1} 项蛋白质`}</span>
                        <input
                          inputMode="numeric"
                          onChange={(event) => updateTemplateDraftItem(item.id, 'protein', event.target.value)}
                          type="number"
                          value={item.protein}
                        />
                      </label>
                      <label className="field">
                        <span>{`第 ${index + 1} 项碳水`}</span>
                        <input
                          inputMode="numeric"
                          onChange={(event) => updateTemplateDraftItem(item.id, 'carbs', event.target.value)}
                          type="number"
                          value={item.carbs}
                        />
                      </label>
                      <label className="field">
                        <span>{`第 ${index + 1} 项脂肪`}</span>
                        <input
                          inputMode="numeric"
                          onChange={(event) => updateTemplateDraftItem(item.id, 'fat', event.target.value)}
                          type="number"
                          value={item.fat}
                        />
                      </label>
                    </div>
                  ))}
                </div>
                <div className="form-actions form-actions--split">
                  <button className="ghost-button" onClick={resetTemplateDraft} type="button">
                    取消
                  </button>
                  <button className="primary-button" type="submit">
                    {templateDraft.mode === 'edit' ? '更新模板' : '保存模板'}
                  </button>
                </div>
              </form>
            ) : null}
          </article>

          <article className="feature-panel feature-panel--wide">
            <div className="panel-head">
              <div>
                <p className="section-kicker">本周吃什么</p>
                <h3>把常用组合排进这一周</h3>
              </div>
              <span className="inline-note">{selectedPlannerStatus}</span>
            </div>

            <div className="pill-row">
              {weeklyPlannerDays.map((day) => (
                <button
                  aria-label={`计划 ${day.label}`}
                  className={`segment-button${plannerWeekday === day.value ? ' is-active' : ''}`}
                  key={day.value}
                  onClick={() => setPlannerWeekday(day.value)}
                  type="button"
                >
                  {day.label}
                </button>
              ))}
            </div>

            <div className="pill-row">
              {mealTypeOrder.map((mealType) => (
                <button
                  aria-label={`计划 ${mealTypeLabels[mealType]}`}
                  className={`segment-button${plannerMealType === mealType ? ' is-active' : ''}`}
                  key={mealType}
                  onClick={() => setPlannerMealType(mealType)}
                  type="button"
                >
                  {mealTypeLabels[mealType]}
                </button>
              ))}
            </div>

            <article className="weekly-plan-current-card">
              <div>
                <strong>
                  当前槽位：{selectedPlannerLabel} · {mealTypeLabels[plannerMealType]}
                </strong>
                <p>{selectedPlannerStatus}</p>
              </div>
              <div className="entry-actions">
                <button
                  aria-label="将计划带入当前日期"
                  className="primary-button"
                  disabled={!selectedPlannedTemplate}
                  onClick={applySelectedWeeklyMealPlan}
                  type="button"
                >
                  带入 {formatShortDateKey(targetDate)}
                </button>
                <button
                  className="ghost-button"
                  disabled={!selectedWeeklyMealPlan}
                  onClick={clearSelectedWeeklyMealPlan}
                  type="button"
                >
                  清空排餐
                </button>
              </div>
            </article>

            <div className="weekly-plan-template-grid">
              {plannerTemplates.length > 0 ? (
                plannerTemplates.map((template) => {
                  const isActive = selectedPlannedTemplate?.id === template.id

                  return (
                    <button
                      aria-label={`排入 ${template.name}`}
                      className={`weekly-plan-template-card${isActive ? ' is-active' : ''}`}
                      key={`planner-${template.id}`}
                      onClick={() => assignWeeklyMealPlan(template.id)}
                      type="button"
                    >
                      <div className="list-meta-row">
                        <strong>{template.name}</strong>
                        {template.origin === 'custom' ? (
                          <span className="pill pill--muted">自定义</span>
                        ) : null}
                      </div>
                      <p>
                        {mealTypeLabels[template.mealType]} · {template.items.length} 项
                      </p>
                      <small>{template.items.map((item) => item.foodName).join(' · ')}</small>
                    </button>
                  )
                })
              ) : (
                <div className="empty-note">这个餐次还没有可用组合，先保存一套再排进来。</div>
              )}
            </div>
          </article>

          <article className="feature-panel feature-panel--wide">
            <div className="panel-head">
              <div>
                <p className="section-kicker">本周备餐</p>
                <h3>按本周安排生成备餐清单</h3>
              </div>
              <span className="inline-note">
                {weeklyPrepItems.length > 0
                  ? `已备好 ${readyWeeklyPrepCount} / ${weeklyPrepItems.length}`
                  : '先排餐再生成'}
              </span>
            </div>

            <div className="panel-subsection weekly-prep-shell">
              <div className="weekly-prep-filter-row" role="list" aria-label="备餐范围切换">
                {prepWindowOptions.map((option) => (
                  <button
                    aria-label={`查看${option.label}备餐`}
                    className={`segment-button${prepWindowMode === option.value ? ' is-active' : ''}`}
                    key={option.value}
                    onClick={() => {
                      setPrepWindowMode(option.value)
                      setPrepCopyStatus('')
                    }}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="weekly-prep-toolbar">
                <div className="weekly-prep-visibility-row" role="list" aria-label="备餐可见范围">
                  {prepVisibilityOptions.map((option) => (
                    <button
                      aria-label={option.value === 'pending' ? '只看未备好备餐项' : '查看全部备餐项'}
                      className={`segment-button${prepVisibilityMode === option.value ? ' is-active' : ''}`}
                      key={option.value}
                      onClick={() => {
                        setPrepVisibilityMode(option.value)
                        setPrepCopyStatus('')
                      }}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <button
                  aria-label="复制当前备餐清单"
                  className="ghost-button inline-action-button weekly-prep-copy-button"
                  disabled={filteredWeeklyPrepItems.length === 0}
                  onClick={handleCopyPrepList}
                  type="button"
                >
                  <Copy size={16} />
                  <span>复制清单</span>
                </button>
              </div>

              <div className="pill-row weekly-prep-summary">
                <span className="pill pill--muted">{prepWindowLabel}</span>
                <span className="pill pill--muted">{plannedWeeklySlotCount} 个槽位</span>
                <span className="pill pill--muted">{plannedWeeklyDayCount} 天覆盖</span>
                <span className="pill">{prepSummaryCountLabel}</span>
              </div>

              {filteredWeeklyPrepItems.length > 0 ? (
                <>
                  <div className="weekly-prep-list">
                    {filteredWeeklyPrepItems.map((item) => {
                      const isChecked = weeklyPrepCheckedKeys.includes(item.key)

                      return (
                        <article
                          className={`weekly-prep-card${isChecked ? ' is-complete' : ''}`}
                          key={item.key}
                        >
                          <div className="weekly-prep-copy">
                            <div className="list-meta-row">
                              <strong>{item.foodName}</strong>
                              <span className="pill pill--muted">
                                {item.servingLabel} · {item.totalCount} 次安排
                              </span>
                            </div>
                            <p>{item.contextLabels.join(' · ')}</p>
                            <small>预计 {item.totalCalories} kcal · 来自 {item.templateNames.join(' / ')}</small>
                          </div>
                          <button
                            aria-label={`${isChecked ? '取消标记' : '标记'} ${item.foodName} 已备好`}
                            aria-pressed={isChecked}
                            className={`segment-button weekly-prep-toggle${isChecked ? ' is-active' : ''}`}
                            onClick={() => toggleWeeklyPrepCheckedKey(item.key)}
                            type="button"
                          >
                            {isChecked ? '已备好' : '标记已备好'}
                          </button>
                        </article>
                      )
                    })}
                  </div>

                  <div className="form-actions form-actions--split">
                    <span className="inline-note">
                      {prepCopyStatus || '勾掉已经买齐或备好的项目，做饭前更省脑力。'}
                    </span>
                    <button
                      className="ghost-button"
                      disabled={readyWeeklyPrepCount === 0}
                      onClick={() => {
                        clearWeeklyPrepCheckedKeys()
                        setPrepCopyStatus('')
                      }}
                      type="button"
                    >
                      清空已备好
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-note">
                  {weeklyPrepItems.length === 0
                    ? `${prepWindowLabel} 里还没有安排，切个范围看看，或者先把几天计划排进去。`
                    : '这一段里已经没有待处理的备餐项了，可以切回全部看看。'}
                </div>
              )}
            </div>
          </article>

          <article className="feature-panel">
            <div className="panel-head">
              <div>
                <p className="section-kicker">常用组合</p>
                <h3>整套直接记</h3>
              </div>
            </div>

            <div className="stack-list">
              {sortedMealTemplates.map((template) => (
                <div className="list-item list-item--dense" key={template.id}>
                  <div>
                    <div className="list-meta-row">
                      <strong>{template.name}</strong>
                      <span className="pill pill--muted">
                        {template.origin === 'custom' ? '自定义' : '预设'}
                      </span>
                    </div>
                    <p>
                      {mealTypeLabels[template.mealType]} · {template.items.length} 项
                    </p>
                    <small className="subtle-caption">
                      {template.items.map((item) => item.foodName).join(' · ')}
                    </small>
                  </div>
                  <div className="entry-actions">
                    <button
                      aria-label={`使用 ${template.name}`}
                      className="secondary-button"
                      onClick={() => applyMealTemplate(template.id)}
                      type="button"
                    >
                      使用
                    </button>
                    {template.origin === 'custom' ? (
                      <>
                        <button
                          aria-label={`编辑模板 ${template.name}`}
                          className="text-action"
                          onClick={() => startTemplateEdit(template)}
                          type="button"
                        >
                          编辑
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
                          删除
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      ) : null}

      <ConfirmSheet
        confirmLabel="确认删除"
        message={
          pendingDeleteMeal
            ? `会删除“${pendingDeleteMeal.foodName}”这条饮食记录，热量和蛋白统计也会一起回退。`
            : ''
        }
        onClose={() => setPendingDeleteMeal(null)}
        onConfirm={confirmDeleteMeal}
        open={pendingDeleteMeal !== null}
        title="删除这条饮食记录？"
      />

      <ConfirmSheet
        confirmLabel="删除模板"
        message={
          pendingDeleteTemplate
            ? `会删除模板“${pendingDeleteTemplate.name}”，但已经记过的饮食记录不会受影响。`
            : ''
        }
        onClose={() => setPendingDeleteTemplate(null)}
        onConfirm={confirmDeleteTemplate}
        open={pendingDeleteTemplate !== null}
        title="删除这套模板？"
      />
    </section>
  )
}
