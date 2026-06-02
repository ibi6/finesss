import { describe, expect, it } from 'vitest'

import {
  createDateFromKey,
  createDateStampForDateKey,
  formatLocalDateKey,
  formatShortDateKey,
  shiftDateKey,
} from '../store/date'
import { createSeedSnapshot } from '../store/seed'
import {
  buildAdherenceMetrics,
  buildBodyHistorySummary,
  buildDailySummary,
  buildGoalForecastSummary,
  buildMealReuseSummary,
  buildPhotoEstimateHistorySummary,
  buildTodayAchievementSummary,
  buildConsistencyCalendar,
  buildGoalProgressSummary,
  buildRangeSummary,
  buildTodayCoachSummary,
  buildTodayMomentumSummary,
  buildTodayPlanSummary,
  buildTomorrowPlanSummary,
  buildWorkoutHistorySummary,
  buildWeeklyPlanAdherenceSummary,
  buildWeeklyReportSummary,
  buildWeeklyReviewSummary,
  buildWorkoutRhythmSummary,
} from '../store/selectors'

describe('fitness selectors', () => {
  it('builds 28-day range summaries from the current snapshot', () => {
    const snapshot = createSeedSnapshot()
    const summary = buildRangeSummary(snapshot, formatLocalDateKey(new Date()), 28)

    expect(summary.trainingSessions).toBe(2)
    expect(summary.bodyEntryDays).toBe(2)
    expect(summary.recoveryDays).toBe(2)
    expect(summary.averageSleepHours).toBe(7.4)
    expect(summary.averageRecoveryScore).toBe(90)
    expect(summary.weightDelta).toBeCloseTo(-0.9, 1)
  })

  it('builds a lightweight recovery score from the selected day recovery entry', () => {
    const snapshot = createSeedSnapshot()
    const summary = buildDailySummary(snapshot, formatLocalDateKey(new Date()))

    expect(summary.recoveryLogged).toBe(true)
    expect(summary.recoveryScore).toBe(83)
  })

  it('sorts adherence metrics from strongest to weakest', () => {
    const snapshot = createSeedSnapshot()
    const metrics = buildAdherenceMetrics(snapshot, formatLocalDateKey(new Date()), 28)

    expect(metrics).toHaveLength(5)
    expect(metrics[0].score).toBeGreaterThanOrEqual(metrics[1].score)
    expect(metrics[1].score).toBeGreaterThanOrEqual(metrics[2].score)
    expect(metrics.at(-1)?.label).toBeDefined()
  })

  it('builds a today coach summary with streaks and focused actions', () => {
    const snapshot = createSeedSnapshot()
    const coach = buildTodayCoachSummary(snapshot, formatLocalDateKey(new Date()))

    expect(coach.loggingStreak).toBe(3)
    expect(coach.completeDaysLast7).toBe(1)
    expect(coach.strongestMetric).toBe('训练记录')
    expect(coach.weakestMetric).toBe('蛋白达标')
    expect(coach.actions[0]?.action).toBe('meal')
    expect(coach.actions[0]?.title).toContain('还差 85 g 蛋白')
  })

  it('adds workout template suggestions when today has no logged workout', () => {
    const snapshot = createSeedSnapshot()
    const targetDate = formatLocalDateKey(new Date())
    snapshot.workoutSessions = snapshot.workoutSessions.filter((entry) => entry.dateKey !== targetDate)

    const coach = buildTodayCoachSummary(snapshot, targetDate)
    const workoutAction = coach.actions.find((action) => action.id === 'workout')

    expect(workoutAction?.title).toBe('\u672c\u5468\u8fd8\u5dee 3 \u6b21\u8bad\u7ec3')
    expect(workoutAction?.workoutSuggestions?.map((item) => item.templateId)).toEqual([
      'workout-template-push',
      'workout-template-legs',
    ])
  })

  it('adds concrete food suggestions when today is short on protein', () => {
    const snapshot = createSeedSnapshot()
    const coach = buildTodayCoachSummary(snapshot, formatLocalDateKey(new Date()))
    const mealAction = coach.actions.find((action) => action.id === 'protein')

    expect(mealAction?.suggestions).toBeDefined()
    expect(mealAction?.suggestions).toHaveLength(3)
    expect(mealAction?.suggestions?.map((item) => item.name)).toEqual(
      expect.arrayContaining(['鸡胸饭', '希腊酸奶碗']),
    )
  })

  it('adds recovery preset suggestions when today is missing a recovery log', () => {
    const snapshot = createSeedSnapshot()
    const targetDate = formatLocalDateKey(new Date())
    snapshot.recoveryEntries = snapshot.recoveryEntries.filter((entry) => entry.dateKey !== targetDate)

    const coach = buildTodayCoachSummary(snapshot, targetDate)
    const recoveryAction = coach.actions.find((action) => action.id === 'recovery')

    expect(recoveryAction?.recoverySuggestions?.map((item) => item.label)).toEqual([
      '高压日',
      '标准日',
    ])
  })

  it('adds weekly meal plan suggestions when today still has planned slots to log', () => {
    const snapshot = createSeedSnapshot()
    const targetDate = formatLocalDateKey(new Date())
    const weekday = new Date().getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6

    snapshot.weeklyMealPlans = [
      {
        id: 'weekly-plan-today-dinner',
        weekday,
        mealType: 'dinner',
        templateId: 'meal-template-cut-dinner',
      },
    ]

    const coach = buildTodayCoachSummary(snapshot, targetDate)
    const mealPlanAction = coach.actions.find((action) => action.id === 'meal-plan')

    expect(mealPlanAction?.plannedMealSuggestions).toHaveLength(1)
    expect(mealPlanAction?.plannedMealSuggestions?.[0]).toMatchObject({
      templateId: 'meal-template-cut-dinner',
      mealType: 'dinner',
      itemCount: 1,
    })
  })

  it('builds a stage progress summary from latest weight and goal range', () => {
    const snapshot = createSeedSnapshot()
    const progress = buildGoalProgressSummary(snapshot, formatLocalDateKey(new Date()))

    expect(progress.direction).toBe('cut')
    expect(progress.currentWeight).toBe(71.9)
    expect(progress.completedChange).toBeCloseTo(1.1, 1)
    expect(progress.remainingChange).toBeCloseTo(5.9, 1)
    expect(progress.progressPercent).toBe(16)
    expect(progress.nextMilestoneWeight).toBe(71.5)
  })

  it('builds a 28-day consistency calendar with blanks and streaks', () => {
    const snapshot = createSeedSnapshot()
    const targetDate = formatLocalDateKey(new Date())
    const calendar = buildConsistencyCalendar(snapshot, targetDate, 28)

    expect(calendar.days).toHaveLength(28)
    expect(calendar.days.at(-1)?.dateKey).toBe(targetDate)
    expect(calendar.fullDays).toBe(1)
    expect(calendar.blankDays).toBe(24)
    expect(calendar.bestLoggingStreak).toBe(3)
  })

  it('builds a today momentum summary with highlights and weekly missions', () => {
    const snapshot = createSeedSnapshot()
    const momentum = buildTodayMomentumSummary(snapshot, formatLocalDateKey(new Date()))

    expect(momentum.stageLabel).toBe('减脂阶段')
    expect(momentum.headline).toContain('71.5 kg')
    expect(momentum.badges[0]?.title).toContain('已减 1.1 kg')
    expect(momentum.badges[1]?.title).toContain('连记 3 天')
    expect(momentum.missions).toHaveLength(3)
    expect(momentum.missions[0]).toMatchObject({
      title: '本周训练',
      current: 2,
      target: 4,
    })
    expect(momentum.missions[1]).toMatchObject({
      title: '蛋白达标',
      current: 0,
      target: 4,
    })
    expect(momentum.missions[2]).toMatchObject({
      title: '恢复记录',
      current: 2,
      target: 5,
    })
  })

  it('builds a today plan summary from weekly slots and marks logged items as done', () => {
    const snapshot = createSeedSnapshot()
    const targetDate = formatLocalDateKey(new Date())
    const weekday = createDateFromKey(targetDate).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
    const stamp = createDateStampForDateKey(targetDate)

    snapshot.weeklyMealPlans = [
      {
        id: 'today-breakfast-slot',
        weekday,
        mealType: 'breakfast',
        templateId: 'meal-template-high-protein-breakfast',
      },
      {
        id: 'today-dinner-slot',
        weekday,
        mealType: 'dinner',
        templateId: 'meal-template-cut-dinner',
      },
    ]
    snapshot.weeklyWorkoutPlans = [
      {
        id: 'today-workout-slot',
        weekday,
        templateId: 'workout-template-push',
      },
    ]
    snapshot.mealEntries = [
      {
        id: 'today-breakfast-entry',
        mealType: 'breakfast',
        foodName: '希腊酸奶碗',
        servingLabel: '1 碗',
        calories: 420,
        protein: 31,
        carbs: 42,
        fat: 11,
        loggedAt: stamp.iso,
        dateKey: stamp.dateKey,
        sourceFoodId: 'food-greek-yogurt',
      },
    ]
    snapshot.workoutSessions = []

    const summary = buildTodayPlanSummary(snapshot, targetDate)

    expect(summary.hasPlans).toBe(true)
    expect(summary.pendingCount).toBe(2)
    expect(summary.completedCount).toBe(1)
    expect(summary.headline).toBe('今天按计划还差 2 项')
    expect(summary.items.map((item) => item.id)).toEqual(['meal-dinner', 'workout', 'meal-breakfast'])
    expect(summary.items.find((item) => item.id === 'meal-dinner')).toMatchObject({
      status: 'pending',
      ctaLabel: '带入晚餐',
      targetLabel: '减脂晚餐',
    })
    expect(summary.items.find((item) => item.id === 'workout')).toMatchObject({
      status: 'pending',
      ctaLabel: '带入训练',
      workoutTemplateId: 'workout-template-push',
    })
    expect(summary.items.find((item) => item.id === 'meal-breakfast')).toMatchObject({
      status: 'done',
      ctaLabel: null,
      title: '早餐已记',
    })
  })

  it('returns no today plan panel data when the selected day has no weekly slots', () => {
    const snapshot = createSeedSnapshot()
    const summary = buildTodayPlanSummary(snapshot, formatLocalDateKey(new Date()))

    expect(summary.hasPlans).toBe(false)
    expect(summary.items).toHaveLength(0)
  })

  it('builds unlocked and upcoming achievements for today', () => {
    const snapshot = createSeedSnapshot()
    const achievements = buildTodayAchievementSummary(snapshot, formatLocalDateKey(new Date()))

    expect(achievements.unlockedCount).toBe(3)
    expect(achievements.unlocked.map((item) => item.title)).toEqual(
      expect.arrayContaining(['已减重 1 kg', '连续记录 3 天', '本周完成 2 次训练']),
    )
    expect(achievements.nextUp[0]).toMatchObject({
      title: '连续记录 7 天',
      progressLabel: '3 / 7 天',
    })
    expect(achievements.nextUp[1]).toMatchObject({
      title: '已减重 3 kg',
      progressLabel: '1.1 / 3 kg',
    })
  })

  it('builds a goal forecast summary from current weight and weekly rate', () => {
    const snapshot = createSeedSnapshot()
    const targetDate = formatLocalDateKey(new Date())
    const forecast = buildGoalForecastSummary(snapshot, targetDate)

    expect(forecast.currentWeight).toBe(71.9)
    expect(forecast.remainingChange).toBeCloseTo(5.9, 1)
    expect(forecast.etaWeeks).toBe(12)
    expect(forecast.etaDateKey).toBe(shiftDateKey(targetDate, 84))
  })

  it('builds a weekly review summary from seed data', () => {
    const snapshot = createSeedSnapshot()
    const summary = buildWeeklyReviewSummary(snapshot, formatLocalDateKey(new Date()))

    expect(summary.findings).toHaveLength(3)
    expect(summary.findings[0]).toMatchObject({
      id: 'strongest',
      tone: 'positive',
      title: '这周最稳的是训练记录',
    })
    expect(summary.findings[1]).toMatchObject({
      id: 'trend',
      tone: 'positive',
    })
    expect(summary.findings[2]).toMatchObject({
      id: 'gap',
      tone: 'watch',
      title: '这周最拖后腿的是蛋白达标',
    })

    expect(summary.recommendations.map((item) => item.id)).toEqual([
      'consistency',
      'recovery',
      'protein',
    ])
    expect(summary.topReminder).toMatchObject({
      id: 'consistency',
      title: '先把完整记录拉回 3 天',
      targetLabel: '完整日 >= 3 / 7',
    })
    expect(summary.risk).toMatchObject({
      id: 'fragmented-logging',
    })
  })

  it('raises a missing-body risk when a cut week lacks enough weigh-ins', () => {
    const snapshot = createSeedSnapshot()
    snapshot.bodyEntries = snapshot.bodyEntries.slice(-1)

    const summary = buildWeeklyReviewSummary(snapshot, formatLocalDateKey(new Date()))

    expect(summary.risk).toMatchObject({
      id: 'missing-body',
      title: '这周体重记录太少',
    })
  })

  it('builds a tomorrow plan summary from seed data', () => {
    const snapshot = createSeedSnapshot()
    const summary = buildTomorrowPlanSummary(snapshot, formatLocalDateKey(new Date()))

    expect(summary.items.map((item) => item.id)).toEqual(['protein-meal', 'workout', 'recovery'])
    expect(summary.primaryItem).toMatchObject({
      id: 'protein-meal',
      title: '明早先把高蛋白早餐带进来',
      ctaLabel: '带入早餐',
      targetLabel: '蛋白达标 >= 4 / 7',
    })
    expect(summary.items[1]).toMatchObject({
      id: 'workout',
      title: '明天补一节力量训练',
      workoutTemplateId: 'workout-template-push',
    })
    expect(summary.items[2]).toMatchObject({
      id: 'recovery',
      title: '明晚把恢复记录补上',
      recoveryPresetLabel: '标准日',
    })
  })

  it('prioritizes tomorrow weekly meal plans ahead of generic protein actions', () => {
    const snapshot = createSeedSnapshot()
    const targetDate = formatLocalDateKey(new Date())
    const tomorrowDate = shiftDateKey(targetDate, 1)
    const tomorrowWeekday = createDateFromKey(tomorrowDate).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6

    snapshot.weeklyMealPlans = [
      {
        id: 'tomorrow-breakfast-slot',
        weekday: tomorrowWeekday,
        mealType: 'breakfast',
        templateId: 'meal-template-high-protein-breakfast',
      },
    ]

    const summary = buildTomorrowPlanSummary(snapshot, targetDate)

    expect(summary.items[0]).toMatchObject({
      id: 'planned-meal',
      title: '明早先把计划早餐带进来',
      templateId: 'meal-template-high-protein-breakfast',
      mealType: 'breakfast',
    })
    expect(summary.items.map((item) => item.id)).not.toContain('protein-meal')
  })

  it('uses tomorrow weekly workout plans ahead of generic workout suggestions', () => {
    const snapshot = createSeedSnapshot()
    const targetDate = formatLocalDateKey(new Date())
    const tomorrowDate = shiftDateKey(targetDate, 1)
    const tomorrowWeekday = createDateFromKey(tomorrowDate).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6

    snapshot.weeklyWorkoutPlans = [
      {
        id: 'tomorrow-workout-slot',
        weekday: tomorrowWeekday,
        templateId: 'workout-template-push',
      },
    ]

    const summary = buildTomorrowPlanSummary(snapshot, targetDate)

    expect(summary.items.map((item) => item.id)).toContain('planned-workout')
    expect(summary.items.map((item) => item.id)).not.toContain('workout')
    expect(summary.items.find((item) => item.id === 'planned-workout')).toMatchObject({
      title: '明天按计划练推训练',
      workoutTemplateId: 'workout-template-push',
      ctaLabel: '去记训练',
      targetLabel: '按计划完成训练',
    })
  })

  it('skips the protein-meal action when tomorrow breakfast is already logged', () => {
    const snapshot = createSeedSnapshot()
    const targetDate = formatLocalDateKey(new Date())
    const tomorrowDate = shiftDateKey(targetDate, 1)
    const stamp = createDateStampForDateKey(tomorrowDate)

    snapshot.mealEntries.push({
      id: 'tomorrow-breakfast-entry',
      mealType: 'breakfast',
      foodName: '希腊酸奶碗',
      servingLabel: '1 碗',
      calories: 420,
      protein: 31,
      carbs: 42,
      fat: 11,
      loggedAt: stamp.iso,
      dateKey: stamp.dateKey,
      sourceFoodId: 'food-greek-yogurt',
    })

    const summary = buildTomorrowPlanSummary(snapshot, targetDate)

    expect(summary.items.map((item) => item.id)).not.toContain('protein-meal')
  })

  it('builds a copy-ready weekly report summary from seed data', () => {
    const snapshot = createSeedSnapshot()
    const targetDate = formatLocalDateKey(new Date())
    const summary = buildWeeklyReportSummary(snapshot, targetDate)

    expect(summary.title).toBe('本周周报')
    expect(summary.periodLabel).toBe(
      `${formatShortDateKey(shiftDateKey(targetDate, -6))} - ${formatShortDateKey(targetDate)}`,
    )
    expect(summary.sections.map((section) => section.id)).toEqual([
      'progress',
      'execution',
      'strength',
      'gap',
      'next',
    ])
    expect(summary.sections[2]).toMatchObject({
      label: '最稳项',
      text: '训练记录',
    })
    expect(summary.sections[3]).toMatchObject({
      label: '当前缺口',
      text: '蛋白达标',
    })
    expect(summary.sections[4]?.text).toContain('先把完整记录拉回 3 天')
    expect(summary.sections[4]?.text).toContain('恢复记录补到 5 / 7 天')
    expect(summary.shareText).toContain('燃刻本周周报｜')
    expect(summary.shareText).toContain('最稳项：训练记录')
    expect(summary.shareText).toContain('下周优先：先把完整记录拉回 3 天；再把恢复记录补到 5 / 7 天。')
  })

  it('builds a weekly plan adherence summary from planned and actual execution', () => {
    const snapshot = createSeedSnapshot()
    const targetDate = formatLocalDateKey(new Date())
    const dayMinus1 = shiftDateKey(targetDate, -1)
    const dayMinus2 = shiftDateKey(targetDate, -2)
    const dayMinus3 = shiftDateKey(targetDate, -3)
    const todayWeekday = createDateFromKey(targetDate).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
    const weekdayMinus1 = createDateFromKey(dayMinus1).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
    const weekdayMinus2 = createDateFromKey(dayMinus2).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
    const stampToday = createDateStampForDateKey(targetDate)
    const stampMinus2 = createDateStampForDateKey(dayMinus2)
    const stampMinus3 = createDateStampForDateKey(dayMinus3)

    snapshot.weeklyMealPlans = [
      {
        id: 'today-breakfast-slot',
        weekday: todayWeekday,
        mealType: 'breakfast',
        templateId: 'meal-template-high-protein-breakfast',
      },
      {
        id: 'yesterday-breakfast-slot',
        weekday: weekdayMinus1,
        mealType: 'breakfast',
        templateId: 'meal-template-high-protein-breakfast',
      },
      {
        id: 'day-minus-2-dinner-slot',
        weekday: weekdayMinus2,
        mealType: 'dinner',
        templateId: 'meal-template-cut-dinner',
      },
    ]
    snapshot.weeklyWorkoutPlans = [
      {
        id: 'today-workout-slot',
        weekday: todayWeekday,
        templateId: 'workout-template-push',
      },
      {
        id: 'day-minus-2-workout-slot',
        weekday: weekdayMinus2,
        templateId: 'workout-template-legs',
      },
    ]
    snapshot.mealEntries = [
      {
        id: 'today-breakfast-entry',
        mealType: 'breakfast',
        foodName: '希腊酸奶碗',
        servingLabel: '1 碗',
        calories: 420,
        protein: 31,
        carbs: 42,
        fat: 11,
        loggedAt: stampToday.iso,
        dateKey: stampToday.dateKey,
        sourceFoodId: 'food-greek-yogurt',
      },
      {
        id: 'day-minus-2-lunch-entry',
        mealType: 'lunch',
        foodName: '鸡胸饭',
        servingLabel: '1 份',
        calories: 610,
        protein: 44,
        carbs: 55,
        fat: 16,
        loggedAt: stampMinus2.iso,
        dateKey: stampMinus2.dateKey,
        sourceFoodId: 'food-chicken-rice',
      },
    ]
    snapshot.workoutSessions = [
      {
        id: 'day-minus-2-workout',
        kind: 'strength',
        title: '腿部日',
        startedAt: stampMinus2.iso,
        dateKey: stampMinus2.dateKey,
        durationMinutes: 75,
        estimatedCalories: 420,
        notes: '',
        exercises: [],
      },
      {
        id: 'day-minus-3-unplanned-workout',
        kind: 'cardio',
        title: '坡走',
        startedAt: stampMinus3.iso,
        dateKey: stampMinus3.dateKey,
        durationMinutes: 35,
        estimatedCalories: 260,
        notes: '',
        exercises: [],
      },
    ]

    const summary = buildWeeklyPlanAdherenceSummary(snapshot, targetDate)

    expect(summary).toMatchObject({
      plannedMeals: 3,
      completedMeals: 1,
      missedMeals: 2,
      plannedWorkouts: 2,
      completedWorkouts: 1,
      missedWorkouts: 1,
      unplannedMealLogs: 1,
      unplannedWorkoutLogs: 1,
      mealCompletionRate: 33,
      workoutCompletionRate: 50,
      headline: '这周按计划落下了 2 / 5 项',
    })
    expect(summary.signals[0]).toMatchObject({
      id: 'missed-workout',
      title: '这周漏了 1 次计划训练',
    })
    expect(summary.signals[1]).toMatchObject({
      id: 'missed-meal',
      title: '这周漏了 2 顿计划餐',
    })
    expect(summary.signals[2]).toMatchObject({
      id: 'unplanned-workout',
      title: '有 1 次训练发生在计划外',
    })
  })

  it('returns a no-plan weekly adherence summary when the week has no fixed plans', () => {
    const snapshot = createSeedSnapshot()
    const summary = buildWeeklyPlanAdherenceSummary(snapshot, formatLocalDateKey(new Date()))

    expect(summary.headline).toBe('这周还没有固定计划可对照')
    expect(summary.signals).toHaveLength(0)
    expect(summary.plannedMeals).toBe(0)
    expect(summary.plannedWorkouts).toBe(0)
  })

  it('builds a workout rhythm summary for the recent 7-day training load', () => {
    const snapshot = createSeedSnapshot()
    const rhythm = buildWorkoutRhythmSummary(snapshot, formatLocalDateKey(new Date()))

    expect(rhythm.weeklyTarget).toBe(4)
    expect(rhythm.sessionCount).toBe(2)
    expect(rhythm.remainingSessions).toBe(2)
    expect(rhythm.activeDays).toBe(2)
    expect(rhythm.totalMinutes).toBe(109)
    expect(rhythm.totalCalories).toBe(680)
    expect(rhythm.strengthSessions).toBe(1)
    expect(rhythm.cardioSessions).toBe(1)
    expect(rhythm.averageSessionMinutes).toBe(55)
    expect(rhythm.focusLabel).toBe('力量 / 有氧平衡')
    expect(rhythm.headline).toBe('本周还差 2 次训练')
    expect(rhythm.days).toHaveLength(7)
    expect(rhythm.days.at(-3)).toMatchObject({
      minutes: 35,
      sessionCount: 1,
      intensity: 'medium',
    })
    expect(rhythm.days.at(-1)).toMatchObject({
      minutes: 74,
      sessionCount: 1,
      intensity: 'high',
    })
  })

  it('builds workout history results with target-date range, kind, and keyword filters', () => {
    const snapshot = createSeedSnapshot()
    const targetDate = formatLocalDateKey(new Date())
    const olderDate = shiftDateKey(targetDate, -20)
    const olderStamp = createDateStampForDateKey(olderDate)

    snapshot.workoutSessions.push({
      id: 'workout-session-history-older',
      kind: 'cardio',
      title: '训练营单车',
      startedAt: olderStamp.iso,
      dateKey: olderStamp.dateKey,
      durationMinutes: 48,
      estimatedCalories: 330,
      notes: '恢复周的长有氧',
      exercises: [
        {
          id: 'workout-session-history-older-exercise',
          name: '单车爬坡',
          sets: 1,
          reps: 1,
          weight: 0,
        },
      ],
    })

    const weekHistory = buildWorkoutHistorySummary(snapshot, targetDate, {
      query: '',
      kind: 'all',
      rangeDays: 7,
    })
    const monthHistory = buildWorkoutHistorySummary(snapshot, targetDate, {
      query: '',
      kind: 'all',
      rangeDays: 30,
    })
    const cardioHistory = buildWorkoutHistorySummary(snapshot, targetDate, {
      query: '',
      kind: 'cardio',
      rangeDays: 30,
    })
    const exerciseSearch = buildWorkoutHistorySummary(snapshot, targetDate, {
      query: '罗马尼亚',
      kind: 'all',
      rangeDays: 30,
    })
    const notesSearch = buildWorkoutHistorySummary(snapshot, targetDate, {
      query: '恢复周',
      kind: 'all',
      rangeDays: 30,
    })

    expect(weekHistory.totalInRange).toBe(2)
    expect(weekHistory.filteredCount).toBe(2)
    expect(weekHistory.items.map((session) => session.title)).toEqual(['腿部日', '坡走'])

    expect(monthHistory.totalInRange).toBe(3)
    expect(monthHistory.filteredCount).toBe(3)
    expect(monthHistory.items.map((session) => session.title)).toEqual(['腿部日', '坡走', '训练营单车'])

    expect(cardioHistory.totalInRange).toBe(3)
    expect(cardioHistory.filteredCount).toBe(2)
    expect(cardioHistory.items.map((session) => session.title)).toEqual(['坡走', '训练营单车'])

    expect(exerciseSearch.filteredCount).toBe(1)
    expect(exerciseSearch.items.map((session) => session.title)).toEqual(['腿部日'])

    expect(notesSearch.filteredCount).toBe(1)
    expect(notesSearch.items.map((session) => session.title)).toEqual(['训练营单车'])
  })

  it('builds unified body history results with target-date range, kind, and keyword filters', () => {
    const snapshot = createSeedSnapshot()
    const targetDate = formatLocalDateKey(new Date())
    const olderDate = shiftDateKey(targetDate, -20)
    const olderStamp = createDateStampForDateKey(olderDate)

    snapshot.bodyEntries.push({
      id: 'body-history-older',
      loggedAt: olderStamp.iso,
      dateKey: olderStamp.dateKey,
      weight: 70.8,
      bodyFat: 20.4,
      waist: 78,
      chest: 95,
      hips: 94,
    })
    snapshot.recoveryEntries.push({
      id: 'recovery-history-older',
      loggedAt: olderStamp.iso,
      dateKey: olderStamp.dateKey,
      waterLiters: 3.1,
      steps: 10500,
      sleepHours: 8.2,
      energy: 5,
    })

    const weekHistory = buildBodyHistorySummary(snapshot, targetDate, {
      query: '',
      kind: 'all',
      rangeDays: 7,
    })
    const monthHistory = buildBodyHistorySummary(snapshot, targetDate, {
      query: '',
      kind: 'all',
      rangeDays: 30,
    })
    const bodyHistory = buildBodyHistorySummary(snapshot, targetDate, {
      query: '',
      kind: 'body',
      rangeDays: 30,
    })
    const recoveryHistory = buildBodyHistorySummary(snapshot, targetDate, {
      query: '',
      kind: 'recovery',
      rangeDays: 30,
    })
    const bodySearch = buildBodyHistorySummary(snapshot, targetDate, {
      query: '胸围 95',
      kind: 'all',
      rangeDays: 30,
    })
    const recoverySearch = buildBodyHistorySummary(snapshot, targetDate, {
      query: '10500',
      kind: 'all',
      rangeDays: 30,
    })

    expect(weekHistory.totalInRange).toBe(4)
    expect(weekHistory.filteredCount).toBe(4)
    expect(weekHistory.items.map((item) => item.id)).toEqual([
      'recovery-seed-1',
      'body-entry-2',
      'recovery-seed-2',
      'body-entry-1',
    ])

    expect(monthHistory.totalInRange).toBe(6)
    expect(monthHistory.filteredCount).toBe(6)
    expect(monthHistory.items.map((item) => item.id)).toEqual([
      'recovery-seed-1',
      'body-entry-2',
      'recovery-seed-2',
      'body-entry-1',
      'body-history-older',
      'recovery-history-older',
    ])

    expect(bodyHistory.totalInRange).toBe(6)
    expect(bodyHistory.filteredCount).toBe(3)
    expect(bodyHistory.items.map((item) => item.id)).toEqual([
      'body-entry-2',
      'body-entry-1',
      'body-history-older',
    ])

    expect(recoveryHistory.totalInRange).toBe(6)
    expect(recoveryHistory.filteredCount).toBe(3)
    expect(recoveryHistory.items.map((item) => item.id)).toEqual([
      'recovery-seed-1',
      'recovery-seed-2',
      'recovery-history-older',
    ])

    expect(bodySearch.filteredCount).toBe(1)
    expect(bodySearch.items.map((item) => item.id)).toEqual(['body-history-older'])

    expect(recoverySearch.filteredCount).toBe(1)
    expect(recoverySearch.items.map((item) => item.id)).toEqual(['recovery-history-older'])
  })

  it('builds meal reuse results with target-date range, source, and keyword filters', () => {
    const snapshot = createSeedSnapshot()
    const targetDate = formatLocalDateKey(new Date())
    const olderDate = shiftDateKey(targetDate, -20)
    const olderStamp = createDateStampForDateKey(olderDate)

    snapshot.foods.push({
      id: 'food-history-older',
      name: '鸡胸拌饭',
      servingLabel: '1 碗',
      calories: 520,
      protein: 36,
      carbs: 48,
      fat: 14,
      isFavorite: false,
      lastUsedAt: olderStamp.iso,
    })
    snapshot.foods.push({
      id: 'food-favorite-only',
      name: '乳清蛋白',
      servingLabel: '1 勺',
      calories: 130,
      protein: 24,
      carbs: 4,
      fat: 2,
      isFavorite: true,
      lastUsedAt: null,
    })

    const weekReuse = buildMealReuseSummary(snapshot, targetDate, {
      query: '',
      source: 'all',
      rangeDays: 7,
    })
    const monthReuse = buildMealReuseSummary(snapshot, targetDate, {
      query: '',
      source: 'all',
      rangeDays: 30,
    })
    const favoriteReuse = buildMealReuseSummary(snapshot, targetDate, {
      query: '',
      source: 'favorite',
      rangeDays: 30,
    })
    const recentReuse = buildMealReuseSummary(snapshot, targetDate, {
      query: '',
      source: 'recent',
      rangeDays: 30,
    })
    const servingSearch = buildMealReuseSummary(snapshot, targetDate, {
      query: '1 勺',
      source: 'all',
      rangeDays: 30,
    })
    const macroSearch = buildMealReuseSummary(snapshot, targetDate, {
      query: '520',
      source: 'all',
      rangeDays: 30,
    })

    expect(weekReuse.totalInRange).toBeGreaterThanOrEqual(1)
    expect(weekReuse.items.some((item) => item.id === 'food-history-older')).toBe(false)

    expect(monthReuse.items.map((item) => item.id)).toContain('food-history-older')
    expect(monthReuse.items.map((item) => item.id)).toContain('food-favorite-only')

    expect(favoriteReuse.items.map((item) => item.id)).toContain('food-favorite-only')
    expect(favoriteReuse.items.every((item) => item.isFavorite)).toBe(true)

    expect(recentReuse.items.map((item) => item.id)).toContain('food-history-older')
    expect(recentReuse.items.map((item) => item.id)).not.toContain('food-favorite-only')

    expect(servingSearch.filteredCount).toBe(1)
    expect(servingSearch.items.map((item) => item.id)).toEqual(['food-favorite-only'])

    expect(macroSearch.filteredCount).toBe(1)
    expect(macroSearch.items.map((item) => item.id)).toEqual(['food-history-older'])
  })

  it('builds photo estimate history results with target-date range, scene, and keyword filters', () => {
    const snapshot = createSeedSnapshot()
    const targetDate = formatLocalDateKey(new Date())
    const olderDate = shiftDateKey(targetDate, -20)
    const olderStamp = createDateStampForDateKey(olderDate)

    snapshot.photoEstimateRecords.push({
      id: 'photo-history-older',
      loggedAt: olderStamp.iso,
      dateKey: olderStamp.dateKey,
      photoName: 'older-protein.jpg',
      query: '蛋白奶昔',
      scene: 'protein',
      sceneMode: 'manual',
      portionHint: 'regular',
      keywordSummary: ['蛋白', '奶昔'],
      foodName: '蛋白奶昔',
      servingLabel: '1 杯',
      calories: 260,
      protein: 32,
      carbs: 18,
      fat: 6,
      sourceFoodId: null,
      confidence: 87,
      reasons: ['高蛋白液体补给'],
    })

    snapshot.photoEstimateRecords.push({
      id: 'photo-history-recent',
      loggedAt: createDateStampForDateKey(shiftDateKey(targetDate, -1)).iso,
      dateKey: shiftDateKey(targetDate, -1),
      photoName: 'tea.jpg',
      query: '奶茶',
      scene: 'drink',
      sceneMode: 'auto',
      portionHint: 'large',
      keywordSummary: ['奶茶'],
      foodName: '奶茶',
      servingLabel: '1 杯',
      calories: 340,
      protein: 6,
      carbs: 52,
      fat: 9,
      sourceFoodId: null,
      confidence: 78,
      reasons: ['含糖饮品'],
    })

    const weekHistory = buildPhotoEstimateHistorySummary(snapshot, targetDate, {
      query: '',
      scene: 'all',
      rangeDays: 7,
    })
    const monthHistory = buildPhotoEstimateHistorySummary(snapshot, targetDate, {
      query: '',
      scene: 'all',
      rangeDays: 30,
    })
    const proteinHistory = buildPhotoEstimateHistorySummary(snapshot, targetDate, {
      query: '',
      scene: 'protein',
      rangeDays: 30,
    })
    const queryHistory = buildPhotoEstimateHistorySummary(snapshot, targetDate, {
      query: '高蛋白液体补给',
      scene: 'all',
      rangeDays: 30,
    })

    expect(weekHistory.items.map((item) => item.id)).toContain('photo-history-recent')
    expect(weekHistory.items.map((item) => item.id)).not.toContain('photo-history-older')

    expect(monthHistory.items.map((item) => item.id)).toContain('photo-history-older')
    expect(monthHistory.items.map((item) => item.id)).toContain('photo-history-recent')

    expect(proteinHistory.filteredCount).toBe(1)
    expect(proteinHistory.items.map((item) => item.id)).toEqual(['photo-history-older'])

    expect(queryHistory.filteredCount).toBe(1)
    expect(queryHistory.items.map((item) => item.id)).toEqual(['photo-history-older'])
  })
})
