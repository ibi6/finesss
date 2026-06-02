import userEvent from '@testing-library/user-event'
import { render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'

import { InsightsView } from '../app/routes/InsightsView'
import { createDateFromKey, createDateStampForDateKey, formatLocalDateKey, shiftDateKey } from '../store/date'
import { useFitnessStore } from '../store/useFitnessStore'

describe('InsightsView', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useFitnessStore.getState().resetToSeed()
  })

  it('renders progress, heatmap, sparkline, and recent rhythm charts for the selected date', () => {
    const targetDate = formatLocalDateKey(new Date())

    const { container } = render(<InsightsView targetDate={targetDate} />)

    expect(screen.getByRole('img', { name: '阶段进度 16%' })).toBeInTheDocument()

    const heatmap = screen.getByRole('list', { name: '28天打卡热力格' })
    expect(within(heatmap).getAllByRole('listitem')).toHaveLength(28)

    const sparkline = screen.getByRole('img', { name: '7天体重趋势图' })
    expect(sparkline.querySelectorAll('circle')).toHaveLength(2)

    const rhythmList = screen.getByRole('list', { name: '最近7天热量与蛋白质节奏' })
    expect(within(rhythmList).getAllByRole('listitem')).toHaveLength(7)

    expect(container.querySelectorAll('.metric-bar-row')).toHaveLength(5)
  })

  it('shows recovery score feedback alongside the recent summaries', () => {
    const targetDate = formatLocalDateKey(new Date())

    render(<InsightsView targetDate={targetDate} />)

    expect(screen.getByText('恢复均分')).toBeInTheDocument()
    expect(screen.getByText('90 分')).toBeInTheDocument()
    expect(screen.getByText('最近 83 分')).toBeInTheDocument()
  })

  it('renders the weekly plan adherence panel with completion counts and signals', () => {
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

    useFitnessStore.getState().replaceSnapshot({
      weeklyMealPlans: [
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
      ],
      weeklyWorkoutPlans: [
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
      ],
      mealEntries: [
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
      ],
      workoutSessions: [
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
      ],
    })

    render(<InsightsView targetDate={targetDate} />)

    const planPanel = screen.getByRole('heading', { level: 2, name: '这周按计划落下了 2 / 5 项' }).closest('article')

    expect(planPanel).not.toBeNull()
    expect(within(planPanel as HTMLElement).getByText('本周计划执行')).toBeInTheDocument()
    expect(within(planPanel as HTMLElement).getByText('计划餐完成')).toBeInTheDocument()
    expect(within(planPanel as HTMLElement).getByText('1 / 3')).toBeInTheDocument()
    expect(within(planPanel as HTMLElement).getByText('计划训练完成')).toBeInTheDocument()
    expect(within(planPanel as HTMLElement).getByText('1 / 2')).toBeInTheDocument()
    expect(within(planPanel as HTMLElement).getByText('这周漏了 1 次计划训练')).toBeInTheDocument()
    expect(within(planPanel as HTMLElement).getByText('这周漏了 2 顿计划餐')).toBeInTheDocument()
    expect(within(planPanel as HTMLElement).getByText('有 1 次训练发生在计划外')).toBeInTheDocument()
  })

  it('renders the weekly review panel with findings, recommendations, and a risk warning', () => {
    const targetDate = formatLocalDateKey(new Date())

    render(<InsightsView targetDate={targetDate} />)

    const weeklyReviewPanel = screen.getByRole('heading', { level: 2, name: '本周复盘' }).closest('article')

    expect(weeklyReviewPanel).not.toBeNull()
    expect(within(weeklyReviewPanel as HTMLElement).getByText('本周复盘')).toBeInTheDocument()
    expect(within(weeklyReviewPanel as HTMLElement).getByText('这周最稳的是训练记录')).toBeInTheDocument()
    expect(within(weeklyReviewPanel as HTMLElement).getByText('这周最拖后腿的是蛋白达标')).toBeInTheDocument()
    expect(within(weeklyReviewPanel as HTMLElement).getByText('下周优先')).toBeInTheDocument()
    expect(within(weeklyReviewPanel as HTMLElement).getByText('先把完整记录拉回 3 天')).toBeInTheDocument()
    expect(within(weeklyReviewPanel as HTMLElement).getByText('先把恢复记录补到 5 / 7 天')).toBeInTheDocument()
    expect(within(weeklyReviewPanel as HTMLElement).getByText('这周记录偏碎，先补齐再看趋势')).toBeInTheDocument()
  })

  it('renders a weekly report panel and copies the generated report text', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())
    const writeText = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    render(<InsightsView targetDate={targetDate} />)

    const reportPanel = screen.getByRole('heading', { level: 2, name: '把这一周整理成一段能直接发出去的话' }).closest('article')

    expect(reportPanel).not.toBeNull()
    expect(within(reportPanel as HTMLElement).getByText('本周周报')).toBeInTheDocument()
    expect(within(reportPanel as HTMLElement).getByText('阶段进度')).toBeInTheDocument()
    expect(within(reportPanel as HTMLElement).getByText('本周执行')).toBeInTheDocument()
    expect(within(reportPanel as HTMLElement).getByText('下周优先')).toBeInTheDocument()

    await user.click(within(reportPanel as HTMLElement).getByRole('button', { name: '复制周报' }))

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText.mock.calls[0][0]).toContain('燃刻本周周报｜')
    expect(writeText.mock.calls[0][0]).toContain('最稳项：训练记录')
    expect(within(reportPanel as HTMLElement).getByText('已复制本周周报。')).toBeInTheDocument()
  })

  it('shows an unsupported-copy status when the clipboard API is missing', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })

    render(<InsightsView targetDate={targetDate} />)

    const reportPanel = screen.getByRole('heading', { level: 2, name: '把这一周整理成一段能直接发出去的话' }).closest('article')

    expect(reportPanel).not.toBeNull()

    await user.click(within(reportPanel as HTMLElement).getByRole('button', { name: '复制周报' }))

    expect(within(reportPanel as HTMLElement).getByText('当前环境不支持直接复制。')).toBeInTheDocument()
  })
})
