import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FitnessApp } from '../app/FitnessApp'
import { createDateFromKey, formatDateKeyLabel, formatLocalDateKey, shiftDateKey } from '../store/date'
import { useFitnessStore } from '../store/useFitnessStore'

function mockMatchMedia(matches: boolean) {
  let currentMatches = matches
  const listeners = new Set<(event: MediaQueryListEvent) => void>()

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return currentMatches
      },
      media: query,
      onchange: null,
      addEventListener: vi.fn((type: string, listener: (event: MediaQueryListEvent) => void) => {
        if (type === 'change') {
          listeners.add(listener)
        }
      }),
      removeEventListener: vi.fn((type: string, listener: (event: MediaQueryListEvent) => void) => {
        if (type === 'change') {
          listeners.delete(listener)
        }
      }),
      addListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => listeners.add(listener)),
      removeListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener)),
      dispatchEvent: vi.fn(),
    })),
  })

  return {
    setMatches(next: boolean) {
      currentMatches = next
      const event = { matches: next, media: '(min-width: 1024px)' } as MediaQueryListEvent
      listeners.forEach((listener) => listener(event))
    },
  }
}

function getTodayQuickPanel() {
  const panel = screen.getByRole('heading', { level: 3, name: "下一件事别拖" }).closest('article')

  expect(panel).not.toBeNull()

  return panel as HTMLElement
}

describe('FitnessApp', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockMatchMedia(false)
    act(() => {
      useFitnessStore.getState().resetToSeed()
    })
  })

  it('opens on the today workspace and can switch to meals and workouts', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    expect(screen.getByRole('heading', { level: 3, name: "今天最值得先补的几步" })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: "饮食" }))

    expect(
      await screen.findByRole('heading', { level: 2, name: "把今天吃进去的东西迅速记清楚" }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: "训练" }))

    expect(
      await screen.findByRole('heading', { level: 2, name: "把训练做成能连续复用的工作台" }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: new RegExp("加动作") })).toBeInTheDocument()
  })

  it('uses a compact mobile topbar without the standalone brand block', () => {
    render(<FitnessApp />)

    const topbar = document.querySelector('.app-topbar')

    expect(topbar).not.toBeNull()
    expect(topbar).toHaveClass('app-topbar--mobile-compact')
    expect(within(topbar as HTMLElement).queryByText('燃刻')).not.toBeInTheDocument()
    expect(within(topbar as HTMLElement).getByRole('button', { name: '打开设置' })).toBeInTheDocument()
    expect(within(topbar as HTMLElement).getByText(/剩 \d+ kcal/)).toBeInTheDocument()
    expect(within(topbar as HTMLElement).getByText(/蛋白 \d+g/)).toBeInTheDocument()
  })

  it('uses a compact mobile rail for today quick actions', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '今日' }))

    const quickPanel = screen.getByRole('heading', { level: 3, name: '下一件事别拖' }).closest('article')

    expect(quickPanel).not.toBeNull()
    expect(quickPanel).toHaveClass('quick-panel', 'quick-panel--compact')
    expect((quickPanel as HTMLElement).querySelector('.quick-grid')).toHaveClass('quick-grid', 'quick-grid--rail')
  })

  it('uses denser mobile classes for the workout weekly plan workbench', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const weeklyPlanHeading = await screen.findByRole('heading', { level: 3, name: '把常练模板排进这一周' })
    const weeklyPlanPanel = weeklyPlanHeading.closest('.workout-weekly-plan-panel')

    expect(weeklyPlanPanel).not.toBeNull()
    expect((weeklyPlanPanel as HTMLElement).querySelector('.weekly-plan-shell')).toHaveClass(
      'panel-subsection',
      'weekly-plan-shell',
      'weekly-plan-shell--tight',
    )
    expect((weeklyPlanPanel as HTMLElement).querySelector('.weekly-plan-current-card')).toHaveClass(
      'weekly-plan-current-card',
      'weekly-plan-current-card--compact',
    )
    expect((weeklyPlanPanel as HTMLElement).querySelector('.weekly-workout-plan-list')).toHaveClass(
      'stack-list',
      'weekly-workout-plan-list',
      'weekly-workout-plan-list--compact',
    )
    expect(within(weeklyPlanPanel as HTMLElement).queryByText(/到了那天就能直接开练/)).not.toBeInTheDocument()
  })

  it('uses tighter mobile classes for weekly workout planner cards', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const weeklyPlanHeading = await screen.findByRole('heading', { level: 3, name: '把常练模板排进这一周' })
    const weeklyPlanPanel = weeklyPlanHeading.closest('.workout-weekly-plan-panel')

    expect(weeklyPlanPanel).not.toBeNull()
    expect((weeklyPlanPanel as HTMLElement).querySelector('.weekly-plan-current-card')).toHaveClass(
      'weekly-plan-current-card',
      'weekly-plan-current-card--compact',
      'weekly-plan-current-card--tight',
    )
    expect((weeklyPlanPanel as HTMLElement).querySelector('.weekly-plan-template-grid')).toHaveClass(
      'weekly-plan-template-grid',
      'weekly-plan-template-grid--rail',
      'weekly-plan-template-grid--compact',
    )
    expect((weeklyPlanPanel as HTMLElement).querySelector('.weekly-plan-template-card')).toHaveClass(
      'weekly-plan-template-card',
      'weekly-plan-template-card--compact',
    )
  })

  it('uses tighter mobile classes for weekly workout planner template cards', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const weeklyPlanHeading = await screen.findByRole('heading', { level: 3, name: '把常练模板排进这一周' })
    const weeklyPlanPanel = weeklyPlanHeading.closest('.workout-weekly-plan-panel')

    expect(weeklyPlanPanel).not.toBeNull()
    expect((weeklyPlanPanel as HTMLElement).querySelector('.weekly-plan-template-grid')).toHaveClass(
      'weekly-plan-template-grid',
      'weekly-plan-template-grid--rail',
      'weekly-plan-template-grid--compact',
      'weekly-plan-template-grid--tight',
    )
    expect((weeklyPlanPanel as HTMLElement).querySelector('.weekly-plan-template-card')).toHaveClass(
      'weekly-plan-template-card',
      'weekly-plan-template-card--compact',
      'weekly-plan-template-card--tight',
      'weekly-plan-template-card--ultra-tight',
    )
  })

  it('uses tighter mobile classes for weekly workout planner current card actions', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const weeklyPlanHeading = await screen.findByRole('heading', { level: 3, name: '把常练模板排进这一周' })
    const weeklyPlanPanel = weeklyPlanHeading.closest('.workout-weekly-plan-panel')

    expect(weeklyPlanPanel).not.toBeNull()

    const currentCard = (weeklyPlanPanel as HTMLElement).querySelector('.weekly-plan-current-card')

    expect(currentCard).not.toBeNull()
    expect(currentCard).toHaveClass(
      'weekly-plan-current-card',
      'weekly-plan-current-card--compact',
      'weekly-plan-current-card--tight',
      'weekly-plan-current-card--action-tight',
    )

    const actionRow = (currentCard as HTMLElement).querySelector('.entry-actions')

    expect(actionRow).not.toBeNull()
    expect(actionRow).toHaveClass('entry-actions', 'weekly-plan-current-actions--tight')
    expect(within(actionRow as HTMLElement).getByRole('button', { name: '将计划带入当前日期训练' })).toHaveClass(
      'weekly-plan-current-action-button--ultra-tight',
    )
    expect(within(actionRow as HTMLElement).getByRole('button', { name: '清空训练计划' })).toHaveClass(
      'weekly-plan-current-action-button--ultra-tight',
    )
  })

  it('uses tighter mobile classes for weekly workout planner current card copy', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const weeklyPlanHeading = await screen.findByRole('heading', { level: 3, name: '把常练模板排进这一周' })
    const weeklyPlanPanel = weeklyPlanHeading.closest('.workout-weekly-plan-panel')

    expect(weeklyPlanPanel).not.toBeNull()

    const currentCard = (weeklyPlanPanel as HTMLElement).querySelector('.weekly-plan-current-card')

    expect(currentCard).not.toBeNull()
    expect(currentCard).toHaveClass('weekly-plan-current-card--copy-tight')

    const copyBlock = (currentCard as HTMLElement).firstElementChild

    expect(copyBlock).not.toBeNull()
    expect(copyBlock).toHaveClass('weekly-plan-current-copy', 'weekly-plan-current-copy--tight')
    expect((copyBlock as HTMLElement).querySelector('strong')).toHaveClass('weekly-plan-current-copy-title--ultra-tight')
    expect((copyBlock as HTMLElement).querySelector('p')).toHaveClass('weekly-plan-current-copy-text--ultra-tight')
  })

  it('uses compact mobile rails in the today focus panel', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '今日' }))

    const focusPanel = screen.getByRole('heading', { level: 2, name: '先把今天记明白' }).closest('article')

    expect(focusPanel).not.toBeNull()
    expect(focusPanel).toHaveClass('focus-panel', 'focus-panel--compact')
    expect((focusPanel as HTMLElement).querySelector('.focus-meta-row')).toHaveClass(
      'focus-meta-row',
      'focus-meta-row--rail',
    )
    expect((focusPanel as HTMLElement).querySelector('.stat-row--metrics')).toHaveClass(
      'stat-row',
      'stat-row--metrics',
      'stat-row--metrics-rail',
    )
    expect((focusPanel as HTMLElement).querySelector('.progress-grid')).toHaveClass(
      'progress-grid',
      'progress-grid--compact',
      'progress-grid--rail',
    )
    expect(within(focusPanel as HTMLElement).queryByText(/饮食、训练、恢复和体重都在这里汇总/)).not.toBeInTheDocument()
  })

  it('keeps the compact today focus panel rails on a single line', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '今日' }))

    const focusPanel = screen.getByRole('heading', { level: 2, name: '先把今天记明白' }).closest('article')

    expect(focusPanel).not.toBeNull()
    expect((focusPanel as HTMLElement).querySelector('.focus-meta-row')).toHaveClass(
      'focus-meta-row',
      'focus-meta-row--rail',
      'focus-meta-row--compact',
    )
    expect((focusPanel as HTMLElement).querySelector('.progress-grid')).toHaveClass(
      'progress-grid',
      'progress-grid--compact',
      'progress-grid--rail',
      'progress-grid--tight',
    )
  })

  it('scrolls the selected mobile date chip into view', () => {
    const scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    })

    render(<FitnessApp />)

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'nearest',
      inline: 'nearest',
    })

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    expect(scrollIntoView).toHaveBeenCalledTimes(2)
  })

  it('uses a compact horizontal summary rail for insight phase metrics on mobile', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    const phaseHeading = await screen.findByRole('heading', { level: 2, name: "离目标还剩 5.9 kg" })
    const phasePanel = phaseHeading.closest('article')

    expect(phasePanel).not.toBeNull()
    expect(within(phasePanel as HTMLElement).getByText("当前体重")).toBeInTheDocument()
    expect(within(phasePanel as HTMLElement).getByText("目标总跨度")).toBeInTheDocument()
    expect(within(phasePanel as HTMLElement).getByText("剩余距离")).toBeInTheDocument()
    expect(within(phasePanel as HTMLElement).getByText("下一节点")).toBeInTheDocument()
    expect(within(phasePanel as HTMLElement).getByRole('list', { name: "阶段摘要" })).toBeInTheDocument()
  })

  it('uses horizontal rails for weekly review findings and recommendations on mobile', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    const reviewHeading = await screen.findByRole('heading', { level: 2, name: "本周复盘" })
    const reviewPanel = reviewHeading.closest('article')

    expect(reviewPanel).not.toBeNull()
    expect(within(reviewPanel as HTMLElement).getByRole('list', { name: "本周复盘观察" })).toBeInTheDocument()
    expect(within(reviewPanel as HTMLElement).getByRole('list', { name: "下周优先" })).toBeInTheDocument()
  })

  it('uses a mobile summary rail for weekly report preview', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    const reportHeading = await screen.findByRole('heading', { level: 2, name: /把这一周整理成一段/ })
    const reportPanel = reportHeading.closest('article')

    expect(reportPanel).not.toBeNull()
    expect(within(reportPanel as HTMLElement).getByRole('list', { name: "本周周报预览" })).toHaveClass(
      'weekly-report-preview',
      'weekly-report-preview--rail',
    )
  })

  it('uses a mobile summary rail for the recent 7-day rhythm list', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    const rhythmHeading = await screen.findByRole('heading', { level: 3, name: "近 7 天热量和蛋白质节奏" })
    const rhythmPanel = rhythmHeading.closest('article')

    expect(rhythmPanel).not.toBeNull()
    expect(within(rhythmPanel as HTMLElement).getByRole('list', { name: "最近7天热量与蛋白质节奏" })).toHaveClass(
      'bar-list',
      'insights-rhythm-list',
      'insights-rhythm-list--rail',
    )
  })

  it('uses a compact empty state for weekly plan adherence when no fixed plans exist', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    const planHeading = await screen.findByRole('heading', { level: 2, name: "这周还没有固定计划可对照" })
    const planPanel = planHeading.closest('article')

    expect(planPanel).not.toBeNull()
    expect(within(planPanel as HTMLElement).getByText("本周计划执行")).toBeInTheDocument()
    expect(within(planPanel as HTMLElement).getByText("计划外完成")).toBeInTheDocument()
    expect(within(planPanel as HTMLElement).queryByText("计划餐完成")).not.toBeInTheDocument()
    expect(within(planPanel as HTMLElement).queryByText("计划训练完成")).not.toBeInTheDocument()
    expect(within(planPanel as HTMLElement).queryByText("漏掉的计划项")).not.toBeInTheDocument()
  })

  it('uses a mobile rail for the recent 7-day insight summary cards', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    const summaryHeading = await screen.findByRole('heading', { level: 2, name: "先看这一周稳不稳" })
    const summaryPanel = summaryHeading.closest('article')

    expect(summaryPanel).not.toBeNull()
    expect(within(summaryPanel as HTMLElement).getByText("平均执行分")).toBeInTheDocument()
    expect(within(summaryPanel as HTMLElement).getByText("平均热量")).toBeInTheDocument()
    expect(within(summaryPanel as HTMLElement).getByText("蛋白达标天数")).toBeInTheDocument()
    expect(within(summaryPanel as HTMLElement).getByText("训练总时长")).toBeInTheDocument()
    expect(within(summaryPanel as HTMLElement).getByText("恢复均分")).toBeInTheDocument()
    expect(within(summaryPanel as HTMLElement).getByRole('list', { name: "近7天摘要" })).toHaveClass(
      'meal-summary-grid',
      'insights-seven-day-grid',
      'insights-seven-day-grid--rail',
    )
  })

  it('stacks the weekly report heading block vertically on mobile', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    const reportHeading = await screen.findByRole('heading', { level: 2, name: /把这一周整理成一段/ })
    const reportPanel = reportHeading.closest('article')

    expect(reportPanel).not.toBeNull()
    expect(reportPanel).toHaveClass('weekly-report-panel')
    expect((reportPanel as HTMLElement).querySelector('.panel-head')).toHaveClass('weekly-report-panel-head')
  })

  it('uses compact mobile classes for weekly review cards', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    const reviewHeading = await screen.findByRole('heading', { level: 2, name: "本周复盘" })
    const reviewPanel = reviewHeading.closest('article')

    expect(reviewPanel).not.toBeNull()
    expect((reviewPanel as HTMLElement).querySelector('.weekly-review-findings')).toHaveClass(
      'weekly-review-findings',
      'weekly-review-findings--compact',
    )
    expect((reviewPanel as HTMLElement).querySelector('.weekly-review-recommendations')).toHaveClass(
      'weekly-review-recommendations',
      'weekly-review-recommendations--compact',
    )
    expect(within(reviewPanel as HTMLElement).getByRole('list', { name: "本周复盘观察" }).querySelectorAll('[role="listitem"]')).toHaveLength(4)
  })

  it('uses a mobile rail for heatmap summary metrics', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    const heatmapHeading = await screen.findByRole('heading', { level: 3, name: "颜色越深，这段时间越稳" })
    const heatmapPanel = heatmapHeading.closest('article')

    expect(heatmapPanel).not.toBeNull()
    expect((heatmapPanel as HTMLElement).querySelector('.consistency-summary-grid')).toHaveClass(
      'signal-grid',
      'consistency-summary-grid',
      'consistency-summary-grid--rail',
    )
  })

  it('stacks the weekly plan adherence heading block vertically on mobile', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    const planHeading = await screen.findByRole('heading', { level: 2, name: "这周还没有固定计划可对照" })
    const planPanel = planHeading.closest('article')

    expect(planPanel).not.toBeNull()
    expect(planPanel).toHaveClass('plan-adherence-panel')
    expect(within(planPanel as HTMLElement).queryByText("近 7 天")).not.toBeInTheDocument()
  })

  it('uses compact mobile classes for the consistency heatmap body', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    const heatmapHeading = await screen.findByRole('heading', { level: 3, name: "颜色越深，这段时间越稳" })
    const heatmapPanel = heatmapHeading.closest('article')

    expect(heatmapPanel).not.toBeNull()
    expect((heatmapPanel as HTMLElement).querySelector('.consistency-heatmap')).toHaveClass(
      'consistency-heatmap',
      'consistency-heatmap--compact',
    )
  })

  it('hides the weekly report helper copy on mobile', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    const reportHeading = await screen.findByRole('heading', { level: 2, name: /把这一周整理成一段/ })
    const reportPanel = reportHeading.closest('article')

    expect(reportPanel).not.toBeNull()
    expect(within(reportPanel as HTMLElement).queryByText("不想自己重新组织语言时，直接复制这一版。")).not.toBeInTheDocument()
  })

  it('keeps compact phase progress rail items on mobile', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    const phaseHeading = await screen.findByRole('heading', { level: 2, name: "离目标还剩 5.9 kg" })
    const phasePanel = phaseHeading.closest('article')

    expect(phasePanel).not.toBeNull()
    expect((phasePanel as HTMLElement).querySelector('.progress-ring')).toBeInTheDocument()
    expect((phasePanel as HTMLElement).querySelector('.phase-summary-rail')).toBeInTheDocument()
  })

  it('removes the standalone weekly review recommendation heading on mobile', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    const reviewHeading = await screen.findByRole('heading', { level: 2, name: "本周复盘" })
    const reviewPanel = reviewHeading.closest('article')

    expect(reviewPanel).not.toBeNull()
    expect(within(reviewPanel as HTMLElement).queryByRole('heading', { level: 3, name: "下周优先" })).not.toBeInTheDocument()
    expect(within(reviewPanel as HTMLElement).getByRole('list', { name: "下周优先" })).toBeInTheDocument()
  })

  it('applies body recovery presets into the form', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "身体" }))
    await user.click(screen.getByRole('button', { name: new RegExp("标准日") }))

    expect(screen.getByLabelText("喝水")).toHaveValue(2.8)
    expect(screen.getByLabelText("步数")).toHaveValue(9000)
    expect(screen.getByLabelText("睡眠")).toHaveValue(7.5)
    expect(screen.getByRole('radio', { name: '4' })).toHaveAttribute('aria-checked', 'true')
  })

  it('uses compact mobile classes for body logging forms', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "身体" }))

    const bodyHeading = await screen.findByRole('heading', { level: 3, name: "先把称重、体脂和围度记下来" })
    const bodyForm = bodyHeading.closest('form')
    const recoveryHeading = await screen.findByRole('heading', { level: 3, name: "喝水、睡眠、步数一次补完" })
    const recoveryForm = recoveryHeading.closest('form')

    expect(bodyForm).not.toBeNull()
    expect(recoveryForm).not.toBeNull()
    expect(bodyForm).toHaveClass('body-form-shell')
    expect(recoveryForm).toHaveClass('body-form-shell', 'body-form-shell--recovery')
    expect(within(recoveryForm as HTMLFormElement).getByRole('list', { name: "恢复快捷预设" })).toHaveClass(
      'preset-chip-row',
      'preset-chip-row--rail',
    )
    expect(within(bodyForm as HTMLFormElement).queryByText(/补录后会同步更新/)).not.toBeInTheDocument()
    expect(within(recoveryForm as HTMLFormElement).queryByText(/步数、睡眠和喝水会一起影响/)).not.toBeInTheDocument()
  })

  it('uses tighter mobile classes for the recovery logging form', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '身体' }))

    const recoveryHeading = await screen.findByRole('heading', { level: 3, name: '喝水、睡眠、步数一次补完' })
    const recoveryForm = recoveryHeading.closest('form')

    expect(recoveryForm).not.toBeNull()
    expect(recoveryForm).toHaveClass('body-form-shell', 'body-form-shell--recovery', 'body-form-shell--tight')
    expect((recoveryForm as HTMLFormElement).querySelector('.preset-chip-row')).toHaveClass(
      'preset-chip-row',
      'preset-chip-row--rail',
      'preset-chip-row--compact',
    )
    expect((recoveryForm as HTMLFormElement).querySelector('.energy-block')).toHaveClass(
      'energy-block',
      'energy-block--compact',
    )
  })

  it('uses compact mobile rails for body insights', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '身体' }))

    const bodyPanel = screen.getByRole('heading', { level: 2, name: '把体重和恢复拆成每天都愿意补录的两步' }).closest('article')

    expect(bodyPanel).not.toBeNull()
    expect((bodyPanel as HTMLElement).querySelector('.body-insight-grid')).toHaveClass(
      'split-panel-grid',
      'body-insight-grid',
      'body-insight-grid--compact',
    )

    const stagePanel = within(bodyPanel as HTMLElement)
      .getByRole('heading', { level: 3, name: '从起点到当前的身体变化' })
      .closest('section')
    const trendPanel = within(bodyPanel as HTMLElement)
      .getByRole('heading', { level: 3, name: '最近 7 天的称重曲线' })
      .closest('section')

    expect(stagePanel).not.toBeNull()
    expect(trendPanel).not.toBeNull()
    expect(stagePanel).toHaveClass('body-stage-panel', 'body-stage-panel--compact')
    expect((stagePanel as HTMLElement).querySelector('.signal-grid')).toHaveClass(
      'signal-grid',
      'body-stage-grid',
      'body-stage-grid--rail',
    )
    expect((trendPanel as HTMLElement).querySelector('.signal-grid')).toHaveClass(
      'signal-grid',
      'body-trend-grid',
      'body-trend-grid--rail',
    )
    expect((trendPanel as HTMLElement).querySelector('.chart-frame')).toHaveClass('chart-frame', 'chart-frame--compact')
    expect(within(stagePanel as HTMLElement).queryByText(/最近 7 天基本持平/)).not.toBeInTheDocument()
  })

  it('opens quick meal entry from the today tab and saves a meal record', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "今日" }))
    await user.click(within(getTodayQuickPanel()).getByRole('button', { name: new RegExp("记饮食") }))

    const dialog = screen.getByRole('dialog', { name: "快速记录面板" })
    await user.click(within(dialog).getByRole('button', { name: new RegExp("鸡胸饭") }))
    await user.click(within(dialog).getByRole('button', { name: "保存饮食" }))

    expect(screen.queryByRole('dialog', { name: "快速记录面板" })).not.toBeInTheDocument()
    expect(
      useFitnessStore.getState().mealEntries.some(
        (entry) => entry.foodName === "鸡胸饭" && entry.sourceFoodId === 'food-chicken-rice',
      ),
    ).toBe(true)
  })

  it('reopens quick entry with the latest requested mode instead of stale state', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(within(getTodayQuickPanel()).getByRole('button', { name: new RegExp("记饮食") }))
    const mealDialog = screen.getByRole('dialog', { name: "快速记录面板" })
    await user.type(within(mealDialog).getByLabelText("食物名称"), 'salad-check')
    await user.click(within(mealDialog).getByRole('button', { name: "关闭快速记录" }))

    expect(screen.queryByRole('dialog', { name: "快速记录面板" })).not.toBeInTheDocument()

    await user.click(within(getTodayQuickPanel()).getByRole('button', { name: new RegExp("记恢复") }))

    const recoveryDialog = screen.getByRole('dialog', { name: "快速记录面板" })
    expect(within(recoveryDialog).getByRole('tab', { name: "恢复" })).toHaveAttribute('aria-selected', 'true')
    expect(within(recoveryDialog).getByLabelText("喝水")).toBeInTheDocument()
    expect(within(recoveryDialog).queryByDisplayValue('salad-check')).not.toBeInTheDocument()
  })

  it('hides the global quick bar on mobile tab switches', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "饮食" }))

    expect(screen.queryByRole('region', { name: "全局快速记录" })).not.toBeInTheDocument()
  })

  it('opens all quick entry modes from the desktop global quick bar outside today', async () => {
    const user = userEvent.setup()

    mockMatchMedia(true)

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    const quickBar = screen.getByRole('region', { name: "全局快速记录" })
    expect(quickBar).toHaveClass('global-quickbar', 'is-desktop')
    expect(within(quickBar).getByRole('button', { name: "全局记饮食" })).toBeInTheDocument()
    expect(within(quickBar).getByRole('button', { name: "全局记训练" })).toBeInTheDocument()
    expect(within(quickBar).getByRole('button', { name: "全局记体重" })).toBeInTheDocument()
    expect(within(quickBar).getByRole('button', { name: "全局记恢复" })).toBeInTheDocument()

    await user.click(within(quickBar).getByRole('button', { name: "全局记训练" }))

    const workoutDialog = screen.getByRole('dialog', { name: "快速记录面板" })
    expect(within(workoutDialog).getByRole('tab', { name: "训练" })).toHaveAttribute('aria-selected', 'true')
    await user.click(within(workoutDialog).getByRole('button', { name: "关闭快速记录" }))

    await user.click(within(quickBar).getByRole('button', { name: "全局记恢复" }))

    const recoveryDialog = screen.getByRole('dialog', { name: "快速记录面板" })
    expect(within(recoveryDialog).getByRole('tab', { name: "恢复" })).toHaveAttribute('aria-selected', 'true')
  })

  it('uses workout templates inside quick entry and saves a workout session', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "今日" }))
    await user.click(within(getTodayQuickPanel()).getByRole('button', { name: new RegExp("记训练") }))

    const dialog = screen.getByRole('dialog', { name: "快速记录面板" })
    await user.click(within(dialog).getByRole('button', { name: new RegExp("腿部日") }))

    expect(within(dialog).getByLabelText("训练标题")).toHaveValue("腿部日")
    expect(within(dialog).getByLabelText("训练类型")).toHaveValue('strength')
    await user.click(within(dialog).getByRole('button', { name: "保存训练" }))

    const storedWorkout = useFitnessStore
      .getState()
      .workoutSessions.find((session) => session.title === "腿部日")

    expect(storedWorkout).toBeDefined()
    expect(storedWorkout?.exercises.length).toBeGreaterThan(0)
  })

  it('shows a weekly workout rhythm summary and recent load inside workouts', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "训练" }))

    expect(screen.getByText("本周训练节奏")).toBeInTheDocument()
    expect(screen.getByText("本周还差 2 次训练")).toBeInTheDocument()
    expect(screen.getByText("2 / 4 次")).toBeInTheDocument()
    expect(screen.getAllByText(/109/).length).toBeGreaterThan(0)
    expect(screen.getAllByText("力量 / 有氧平衡").length).toBeGreaterThan(0)

    const loadList = screen.getByRole('list', { name: "近7天训练负荷" })
    expect(within(loadList).getAllByRole('listitem')).toHaveLength(7)
    expect(within(loadList).getByText(/74/)).toBeInTheDocument()
    expect(within(loadList).getByText(/35/)).toBeInTheDocument()
  })

  it('uses compact mobile rails for workout rhythm summary and load cards', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "训练" }))

    const rhythmHeading = await screen.findByRole('heading', { level: 3, name: "本周还差 2 次训练" })
    const rhythmPanel = rhythmHeading.closest('div')

    expect(rhythmPanel).not.toBeNull()
    expect(screen.getByRole('list', { name: "训练节奏摘要" })).toHaveClass(
      'workout-rhythm-grid',
      'workout-rhythm-grid--rail',
    )
    expect(screen.getByRole('list', { name: "近7天训练负荷" })).toHaveClass(
      'bar-list',
      'workout-load-list',
      'workout-load-list--rail',
    )
  })

  it('uses tighter mobile classes for the workout rhythm panel head and load rows', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const rhythmHeading = await screen.findByRole('heading', { level: 3, name: '本周还差 2 次训练' })
    const rhythmPanel = rhythmHeading.closest('.workout-rhythm-panel')

    expect(rhythmPanel).not.toBeNull()
    expect(rhythmPanel).toHaveClass('workout-rhythm-panel', 'workout-rhythm-panel--compact')
    expect((rhythmPanel as HTMLElement).querySelector('.meal-inline-head')).toHaveClass(
      'meal-inline-head',
      'workout-rhythm-head--compact',
    )
    expect((rhythmPanel as HTMLElement).querySelector('.workout-load-list')).toHaveClass(
      'bar-list',
      'workout-load-list',
      'workout-load-list--rail',
      'workout-load-list--compact',
    )
    expect((rhythmPanel as HTMLElement).querySelector('.workout-load-row')).toHaveClass(
      'bar-row',
      'workout-load-row',
      'workout-load-row--compact',
    )
  })

  it('uses compact mobile rails for weekly workout planning', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "训练" }))

    const plannerHeading = await screen.findByRole('heading', { level: 3, name: "把常练模板排进这一周" })
    const plannerPanel = plannerHeading.closest('div')

    expect(plannerPanel).not.toBeNull()
    expect(screen.getByRole('list', { name: "每周训练计划日期" })).toHaveClass(
      'weekly-plan-day-row',
      'weekly-plan-day-row--rail',
    )
    expect(screen.getByRole('list', { name: "训练计划模板" })).toHaveClass(
      'weekly-plan-template-grid',
      'weekly-plan-template-grid--rail',
    )
    expect(screen.queryByText("到了那天就能直接开练")).not.toBeInTheDocument()
  })

  it('uses compact mobile classes for the manual workout form', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "训练" }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: "把这次训练完整记下来" })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()
    expect(within(workoutForm as HTMLFormElement).getByLabelText("训练标题").closest('.field')).toHaveClass(
      'field',
      'field--span-2',
      'workout-form-field--full',
    )
    expect(within(workoutForm as HTMLFormElement).getByRole('button', { name: "加动作" })).toHaveClass(
      'ghost-button',
      'inline-action-button',
      'inline-action-button--compact',
    )
    expect(within(workoutForm as HTMLFormElement).getByLabelText('训练标题')).toHaveClass(
      'workout-form-primary-control--tight',
    )
    expect(within(workoutForm as HTMLFormElement).queryByText("模板、手填和补录都会统一沉到今天的训练记录里")).not.toBeInTheDocument()
  })

  it('uses tighter mobile classes for workout form fields and exercise rows', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()
    expect(workoutForm).toHaveClass('workout-form-shell', 'workout-form-shell--tight', 'workout-form-shell--ultra-tight')
    expect((workoutForm as HTMLFormElement).querySelector('.form-grid')).toHaveClass(
      'form-grid',
      'workout-form-grid--tight',
    )

    const exerciseBlock = within(workoutForm as HTMLFormElement)
      .getByRole('heading', { level: 3, name: '把组数、次数和重量顺手补齐' })
      .closest('.workout-form-exercise-block')

    expect(exerciseBlock).not.toBeNull()
    expect(exerciseBlock).toHaveClass('exercise-block', 'workout-form-exercise-block', 'workout-form-exercise-block--compact')
    expect((exerciseBlock as HTMLElement).querySelector('.workout-exercise-row')).toHaveClass(
      'exercise-row',
      'workout-exercise-row',
      'workout-exercise-row--compact',
    )
  })

  it('uses denser mobile classes for workout form base fields and notes', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()
    expect((workoutForm as HTMLFormElement).querySelector('.form-grid')).toHaveClass(
      'form-grid',
      'workout-form-grid--tight',
      'workout-form-grid--dense',
    )

    const notesField = within(workoutForm as HTMLFormElement).getByLabelText('备注').closest('label')

    expect(notesField).not.toBeNull()
    expect(notesField).toHaveClass(
      'field',
      'field--span-2',
      'workout-form-field--full',
      'workout-form-field--notes-compact',
    )
  })

  it('uses tighter mobile classes for the workout notes field', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const notesField = within(workoutForm as HTMLFormElement).getByLabelText('备注').closest('label')

    expect(notesField).not.toBeNull()
    expect(notesField).toHaveClass(
      'field',
      'field--span-2',
      'workout-form-field--full',
      'workout-form-field--notes-compact',
      'workout-form-field--notes-tight',
      'workout-form-field--notes-ultra-tight',
    )

    const notesControl = within(notesField as HTMLLabelElement).getByLabelText('备注')

    expect(notesControl).toHaveAttribute('rows', '2')
    expect(notesControl).toHaveClass('workout-form-notes-control--tight', 'workout-form-notes-control--ultra-tight')
  })

  it('uses dedicated ultra-tight classes on the workout notes field shell and copy', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const notesField = within(workoutForm as HTMLFormElement).getByLabelText('备注').closest('label')

    expect(notesField).not.toBeNull()
    expect(notesField).toHaveClass('workout-form-field--notes-ultra-tight', 'workout-form-field--notes-shell-ultra-tight')

    const notesCopy = within(notesField as HTMLLabelElement).getByText('备注')

    expect(notesCopy).toHaveClass('workout-form-notes-copy--ultra-tight')
  })

  it('uses a control-level ultra-tight class on the workout notes copy', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const notesField = within(workoutForm as HTMLFormElement).getByLabelText('备注').closest('label')

    expect(notesField).not.toBeNull()

    const notesCopy = within(notesField as HTMLLabelElement).getByText('备注')

    expect(notesCopy).toHaveClass('workout-form-notes-copy--ultra-tight', 'workout-form-notes-copy--control-ultra-tight')
  })

  it('uses a tighter line-box class on the workout notes copy', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const notesField = within(workoutForm as HTMLFormElement).getByLabelText('备注').closest('label')

    expect(notesField).not.toBeNull()

    const notesCopy = within(notesField as HTMLLabelElement).getByText('备注')

    expect(notesCopy).toHaveClass('workout-form-notes-copy--control-ultra-tight', 'workout-form-notes-copy--line-tight')
  })

  it('uses a control-level ultra-tight class on the workout notes textarea', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const notesField = within(workoutForm as HTMLFormElement).getByLabelText('备注').closest('label')

    expect(notesField).not.toBeNull()

    const notesControl = within(notesField as HTMLLabelElement).getByLabelText('备注')

    expect(notesControl).toHaveClass('workout-form-notes-control--ultra-tight', 'workout-form-notes-control--control-ultra-tight')
  })

  it('uses a compact control-level class on the workout notes textarea', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const notesField = within(workoutForm as HTMLFormElement).getByLabelText('备注').closest('label')

    expect(notesField).not.toBeNull()

    const notesControl = within(notesField as HTMLLabelElement).getByLabelText('备注')

    expect(notesControl).toHaveClass(
      'workout-form-notes-control--ultra-tight',
      'workout-form-notes-control--control-ultra-tight',
      'workout-form-notes-control--compact-control',
    )
  })

  it('uses an extra-compact control-level class on the workout notes textarea', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const notesField = within(workoutForm as HTMLFormElement).getByLabelText('备注').closest('label')

    expect(notesField).not.toBeNull()

    const notesControl = within(notesField as HTMLLabelElement).getByLabelText('备注')

    expect(notesControl).toHaveClass(
      'workout-form-notes-control--compact-control',
      'workout-form-notes-control--extra-compact-control',
    )
  })

  it('uses an ultra-compact control-level class on the workout notes textarea', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const notesField = within(workoutForm as HTMLFormElement).getByLabelText('备注').closest('label')

    expect(notesField).not.toBeNull()

    const notesControl = within(notesField as HTMLLabelElement).getByLabelText('备注')

    expect(notesControl).toHaveClass(
      'workout-form-notes-control--extra-compact-control',
      'workout-form-notes-control--ultra-compact-control',
    )
  })

  it('uses a hyper-compact control-level class on the workout notes textarea', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const notesField = within(workoutForm as HTMLFormElement).getByLabelText('备注').closest('label')

    expect(notesField).not.toBeNull()

    const notesControl = within(notesField as HTMLLabelElement).getByLabelText('备注')

    expect(notesControl).toHaveClass(
      'workout-form-notes-control--ultra-compact-control',
      'workout-form-notes-control--hyper-compact-control',
    )
  })

  it('uses a tighter shell-gap class on the workout notes field', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const notesField = within(workoutForm as HTMLFormElement).getByLabelText('备注').closest('label')

    expect(notesField).not.toBeNull()
    expect(notesField).toHaveClass('workout-form-field--notes-shell-ultra-tight', 'workout-form-field--notes-shell-gap-tight')
  })

  it('uses a triple mobile base grid for workout type, duration, and burn fields', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()
    expect((workoutForm as HTMLFormElement).querySelector('.form-grid')).toHaveClass(
      'form-grid',
      'workout-form-grid--tight',
      'workout-form-grid--dense',
      'workout-form-grid--triple',
    )

    const titleField = within(workoutForm as HTMLFormElement).getByLabelText('训练标题').closest('label')
    const kindField = within(workoutForm as HTMLFormElement).getByLabelText('训练类型').closest('label')
    const durationField = within(workoutForm as HTMLFormElement).getByLabelText('时长').closest('label')
    const burnField = within(workoutForm as HTMLFormElement).getByLabelText('预估消耗').closest('label')
    const notesField = within(workoutForm as HTMLFormElement).getByLabelText('备注').closest('label')

    expect(titleField).toHaveClass('field', 'field--span-2', 'workout-form-field--full')
    expect(kindField).toHaveClass('field', 'workout-form-field--triplet')
    expect(durationField).toHaveClass('field', 'workout-form-field--triplet')
    expect(burnField).toHaveClass('field', 'workout-form-field--triplet')
    expect(notesField).toHaveClass('field', 'field--span-2', 'workout-form-field--full')
  })

  it('uses tighter mobile classes for workout triplet fields', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const kindField = within(workoutForm as HTMLFormElement).getByLabelText('训练类型').closest('label')
    const durationField = within(workoutForm as HTMLFormElement).getByLabelText('时长').closest('label')
    const burnField = within(workoutForm as HTMLFormElement).getByLabelText('预估消耗').closest('label')
    const kindControl = within(workoutForm as HTMLFormElement).getByLabelText('训练类型')
    const durationControl = within(workoutForm as HTMLFormElement).getByLabelText('时长')
    const burnControl = within(workoutForm as HTMLFormElement).getByLabelText('预估消耗')

    expect(kindField).toHaveClass('field', 'workout-form-field--triplet', 'workout-form-field--triplet-tight')
    expect(durationField).toHaveClass('field', 'workout-form-field--triplet', 'workout-form-field--triplet-tight')
    expect(burnField).toHaveClass('field', 'workout-form-field--triplet', 'workout-form-field--triplet-tight')
    expect(kindControl).toHaveClass('workout-form-triplet-control--tight', 'workout-form-triplet-select--tight')
    expect(durationControl).toHaveClass('workout-form-triplet-control--tight', 'workout-form-triplet-input--tight')
    expect(burnControl).toHaveClass('workout-form-triplet-control--tight', 'workout-form-triplet-input--tight')
  })

  it('uses ultra-tight mobile classes for workout title and triplet controls', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const titleField = within(workoutForm as HTMLFormElement).getByLabelText('训练标题').closest('label')
    const kindField = within(workoutForm as HTMLFormElement).getByLabelText('训练类型').closest('label')
    const durationField = within(workoutForm as HTMLFormElement).getByLabelText('时长').closest('label')
    const burnField = within(workoutForm as HTMLFormElement).getByLabelText('预估消耗').closest('label')
    const titleControl = within(workoutForm as HTMLFormElement).getByLabelText('训练标题')
    const kindControl = within(workoutForm as HTMLFormElement).getByLabelText('训练类型')
    const durationControl = within(workoutForm as HTMLFormElement).getByLabelText('时长')
    const burnControl = within(workoutForm as HTMLFormElement).getByLabelText('预估消耗')

    expect(titleField).toHaveClass('workout-form-field--primary-ultra-tight')
    expect(kindField).toHaveClass('workout-form-field--triplet-ultra-tight')
    expect(durationField).toHaveClass('workout-form-field--triplet-ultra-tight')
    expect(burnField).toHaveClass('workout-form-field--triplet-ultra-tight')
    expect(titleControl).toHaveClass('workout-form-primary-control--ultra-tight')
    expect(kindControl).toHaveClass('workout-form-triplet-control--ultra-tight')
    expect(durationControl).toHaveClass('workout-form-triplet-control--ultra-tight')
    expect(burnControl).toHaveClass('workout-form-triplet-control--ultra-tight')
  })

  it('uses dedicated ultra-tight classes on the workout title field shell and copy', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const titleField = within(workoutForm as HTMLFormElement).getByLabelText('训练标题').closest('label')

    expect(titleField).not.toBeNull()
    expect(titleField).toHaveClass('workout-form-field--primary-ultra-tight', 'workout-form-field--primary-shell-ultra-tight')

    const titleCopy = within(titleField as HTMLLabelElement).getByText('训练标题')

    expect(titleCopy).toHaveClass('workout-form-primary-copy--ultra-tight')
  })

  it('uses control-level ultra-tight classes on the workout title field shell and copy', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const titleField = within(workoutForm as HTMLFormElement).getByLabelText('训练标题').closest('label')

    expect(titleField).not.toBeNull()
    expect(titleField).toHaveClass('workout-form-field--primary-shell-ultra-tight', 'workout-form-field--primary-control-ultra-tight')

    const titleCopy = within(titleField as HTMLLabelElement).getByText('训练标题')

    expect(titleCopy).toHaveClass('workout-form-primary-copy--ultra-tight', 'workout-form-primary-copy--control-ultra-tight')
  })

  it('uses tighter mobile classes for compact workout exercise metric fields', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const exerciseBlock = within(workoutForm as HTMLFormElement)
      .getByRole('heading', { level: 3, name: '把组数、次数和重量顺手补齐' })
      .closest('.workout-form-exercise-block')

    expect(exerciseBlock).not.toBeNull()

    const exerciseRow = (exerciseBlock as HTMLElement).querySelector('.workout-exercise-row')

    expect(exerciseRow).not.toBeNull()
    expect(exerciseRow).toHaveClass(
      'exercise-row',
      'workout-exercise-row',
      'workout-exercise-row--compact',
      'workout-exercise-row--tight-metrics',
    )

    const nameField = within(exerciseRow as HTMLElement).getByLabelText('动作名称').closest('label')
    const setsField = within(exerciseRow as HTMLElement).getByLabelText('组数').closest('label')
    const repsField = within(exerciseRow as HTMLElement).getByLabelText('次数').closest('label')
    const weightField = within(exerciseRow as HTMLElement).getByLabelText('重量').closest('label')
    const nameInput = within(exerciseRow as HTMLElement).getByLabelText('动作名称')
    const setsInput = within(exerciseRow as HTMLElement).getByLabelText('组数')
    const repsInput = within(exerciseRow as HTMLElement).getByLabelText('次数')
    const weightInput = within(exerciseRow as HTMLElement).getByLabelText('重量')

    expect(setsField).toHaveClass('field', 'workout-exercise-metric-field')
    expect(repsField).toHaveClass('field', 'workout-exercise-metric-field')
    expect(weightField).toHaveClass('field', 'workout-exercise-metric-field')
    expect(nameField).toHaveClass('workout-exercise-name-field--ultra-tight')
    expect(setsField).toHaveClass('workout-exercise-metric-field--ultra-tight')
    expect(repsField).toHaveClass('workout-exercise-metric-field--ultra-tight')
    expect(weightField).toHaveClass('workout-exercise-metric-field--ultra-tight')
    expect(nameInput).toHaveClass('workout-exercise-name-input--tight')
    expect(setsInput).toHaveClass('workout-exercise-metric-input--tight')
    expect(repsInput).toHaveClass('workout-exercise-metric-input--tight')
    expect(weightInput).toHaveClass('workout-exercise-metric-input--tight')
  })

  it('uses tighter mobile classes for the workout exercise block header', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const exerciseBlock = within(workoutForm as HTMLFormElement)
      .getByRole('heading', { level: 3, name: '把组数、次数和重量顺手补齐' })
      .closest('.workout-form-exercise-block')

    expect(exerciseBlock).not.toBeNull()

    const exerciseHead = (exerciseBlock as HTMLElement).querySelector('.meal-inline-head')

    expect(exerciseHead).not.toBeNull()
    expect(exerciseHead).toHaveClass(
      'meal-inline-head',
      'workout-form-exercise-head--tight',
      'workout-form-exercise-head--ultra-tight',
    )
  })

  it('uses ultra-tight classes on the workout exercise head copy stack', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const exerciseBlock = within(workoutForm as HTMLFormElement)
      .getByRole('heading', { level: 3, name: '把组数、次数和重量顺手补齐' })
      .closest('.workout-form-exercise-block')

    expect(exerciseBlock).not.toBeNull()

    const exerciseHead = (exerciseBlock as HTMLElement).querySelector('.meal-inline-head')

    expect(exerciseHead).not.toBeNull()

    const copyWrap = (exerciseHead as HTMLElement).querySelector('div')
    const heading = within(copyWrap as HTMLDivElement).getByRole('heading', { level: 3, name: '把组数、次数和重量顺手补齐' })

    expect(copyWrap).toHaveClass('workout-form-exercise-copy--ultra-tight')
    expect(heading).toHaveClass('workout-form-exercise-copy-title--ultra-tight')
  })

  it('uses ultra-tight mobile classes for workout exercise row controls', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const exerciseBlock = within(workoutForm as HTMLFormElement)
      .getByRole('heading', { level: 3, name: '把组数、次数和重量顺手补齐' })
      .closest('.workout-form-exercise-block')

    expect(exerciseBlock).not.toBeNull()

    const exerciseRow = (exerciseBlock as HTMLElement).querySelector('.workout-exercise-row')

    expect(exerciseRow).not.toBeNull()
    expect(exerciseRow).toHaveClass('workout-exercise-row--ultra-tight')

    const nameInput = within(exerciseRow as HTMLElement).getByLabelText('动作名称')
    const setsInput = within(exerciseRow as HTMLElement).getByLabelText('组数')
    const repsInput = within(exerciseRow as HTMLElement).getByLabelText('次数')
    const weightInput = within(exerciseRow as HTMLElement).getByLabelText('重量')
    const deleteButton = within(exerciseRow as HTMLElement).getByRole('button', { name: '删除第 1 个动作' })

    expect(nameInput).toHaveClass('workout-exercise-name-input--tight', 'workout-exercise-name-input--ultra-tight')
    expect(setsInput).toHaveClass('workout-exercise-metric-input--tight', 'workout-exercise-metric-input--ultra-tight')
    expect(repsInput).toHaveClass('workout-exercise-metric-input--tight', 'workout-exercise-metric-input--ultra-tight')
    expect(weightInput).toHaveClass('workout-exercise-metric-input--tight', 'workout-exercise-metric-input--ultra-tight')
    expect(deleteButton).toHaveClass('workout-exercise-delete-button--ultra-tight')
  })

  it('uses a dedicated ultra-tight class on workout metric fields', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const exerciseBlock = within(workoutForm as HTMLFormElement)
      .getByRole('heading', { level: 3, name: '把组数、次数和重量顺手补齐' })
      .closest('.workout-form-exercise-block')

    expect(exerciseBlock).not.toBeNull()

    const exerciseRow = (exerciseBlock as HTMLElement).querySelector('.workout-exercise-row')

    expect(exerciseRow).not.toBeNull()

    const setsField = within(exerciseRow as HTMLElement).getByLabelText('组数').closest('label')
    const repsField = within(exerciseRow as HTMLElement).getByLabelText('次数').closest('label')
    const weightField = within(exerciseRow as HTMLElement).getByLabelText('重量').closest('label')

    expect(setsField).toHaveClass('workout-exercise-metric-field--ultra-tight', 'workout-exercise-metric-field--control-ultra-tight')
    expect(repsField).toHaveClass('workout-exercise-metric-field--ultra-tight', 'workout-exercise-metric-field--control-ultra-tight')
    expect(weightField).toHaveClass('workout-exercise-metric-field--ultra-tight', 'workout-exercise-metric-field--control-ultra-tight')
  })

  it('uses a dedicated ultra-tight class on the workout name field shell', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const exerciseBlock = within(workoutForm as HTMLFormElement)
      .getByRole('heading', { level: 3, name: '把组数、次数和重量顺手补齐' })
      .closest('.workout-form-exercise-block')

    expect(exerciseBlock).not.toBeNull()

    const exerciseRow = (exerciseBlock as HTMLElement).querySelector('.workout-exercise-row')

    expect(exerciseRow).not.toBeNull()

    const nameField = within(exerciseRow as HTMLElement).getByLabelText('动作名称').closest('label')

    expect(nameField).toHaveClass('workout-exercise-name-field--ultra-tight', 'workout-exercise-name-field--control-ultra-tight')
  })

  it('uses a dedicated ultra-tight class on the workout name field label copy', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const exerciseBlock = within(workoutForm as HTMLFormElement)
      .getByRole('heading', { level: 3, name: '把组数、次数和重量顺手补齐' })
      .closest('.workout-form-exercise-block')

    expect(exerciseBlock).not.toBeNull()

    const exerciseRow = (exerciseBlock as HTMLElement).querySelector('.workout-exercise-row')

    expect(exerciseRow).not.toBeNull()

    const nameField = within(exerciseRow as HTMLElement).getByLabelText('动作名称').closest('label')
    const nameCopy = within(nameField as HTMLLabelElement).getByText('动作名称')

    expect(nameCopy).toHaveClass('workout-exercise-name-copy--ultra-tight')
  })

  it('uses a dedicated ultra-tight grid class on the workout exercise row shell', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const exerciseBlock = within(workoutForm as HTMLFormElement)
      .getByRole('heading', { level: 3, name: '把组数、次数和重量顺手补齐' })
      .closest('.workout-form-exercise-block')

    expect(exerciseBlock).not.toBeNull()

    const exerciseRow = (exerciseBlock as HTMLElement).querySelector('.workout-exercise-row')

    expect(exerciseRow).not.toBeNull()
    expect(exerciseRow).toHaveClass('workout-exercise-row--ultra-tight', 'workout-exercise-row--grid-ultra-tight')
  })

  it('uses a dedicated vertical ultra-tight class on the workout exercise row shell', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const exerciseBlock = within(workoutForm as HTMLFormElement)
      .getByRole('heading', { level: 3, name: '把组数、次数和重量顺手补齐' })
      .closest('.workout-form-exercise-block')

    expect(exerciseBlock).not.toBeNull()

    const exerciseRow = (exerciseBlock as HTMLElement).querySelector('.workout-exercise-row')

    expect(exerciseRow).not.toBeNull()
    expect(exerciseRow).toHaveClass('workout-exercise-row--ultra-tight', 'workout-exercise-row--vertical-ultra-tight')
  })

  it('uses tighter mobile classes for the workout exercise block shell', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const exerciseBlock = within(workoutForm as HTMLFormElement)
      .getByRole('heading', { level: 3, name: '把组数、次数和重量顺手补齐' })
      .closest('.workout-form-exercise-block')

    expect(exerciseBlock).not.toBeNull()
    expect(exerciseBlock).toHaveClass(
      'exercise-block',
      'workout-form-exercise-block',
      'workout-form-exercise-block--compact',
      'workout-form-exercise-block--tight',
    )
  })

  it('uses an ultra-tight class on the workout exercise block shell', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const exerciseBlock = within(workoutForm as HTMLFormElement)
      .getByRole('heading', { level: 3, name: '把组数、次数和重量顺手补齐' })
      .closest('.workout-form-exercise-block')

    expect(exerciseBlock).not.toBeNull()
    expect(exerciseBlock).toHaveClass('workout-form-exercise-block--tight', 'workout-form-exercise-block--ultra-tight')
  })

  it('uses tighter mobile classes for the workout exercise list stack', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const exerciseBlock = within(workoutForm as HTMLFormElement)
      .getByRole('heading', { level: 3, name: '把组数、次数和重量顺手补齐' })
      .closest('.workout-form-exercise-block')

    expect(exerciseBlock).not.toBeNull()

    const stackList = (exerciseBlock as HTMLElement).querySelector('.stack-list')

    expect(stackList).not.toBeNull()
    expect(stackList).toHaveClass('stack-list', 'workout-exercise-stack--tight')
  })

  it('uses tighter mobile classes for the workout form action row', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '训练' }))

    const formHeading = await screen.findByRole('heading', { level: 3, name: '把这次训练完整记下来' })
    const workoutForm = formHeading.closest('form')

    expect(workoutForm).not.toBeNull()

    const actionRow = (workoutForm as HTMLFormElement).querySelector('.form-actions--split')

    expect(actionRow).not.toBeNull()
    expect(actionRow).toHaveClass('form-actions', 'form-actions--split', 'workout-form-actions--tight')
  })

  it('uses compact mobile rails for photo estimate candidates and hints', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "饮食" }))

    const estimateHeading = await screen.findByRole('heading', { level: 3, name: "拍一张，先给你候选和份量建议" })
    const estimatePanel = estimateHeading.closest('article')

    expect(estimatePanel).not.toBeNull()
    expect(within(estimatePanel as HTMLElement).getByRole('list', { name: "拍照估算候选" })).toHaveClass(
      'candidate-stack',
      'candidate-stack--rail',
    )
    expect(within(estimatePanel as HTMLElement).getByRole('list', { name: "场景偏向快捷提示" })).toHaveClass(
      'scene-chip-row',
      'scene-chip-row--rail',
    )
    expect(within(estimatePanel as HTMLElement).queryByText(/会综合当前餐次/)).not.toBeInTheDocument()
  })

  it('keeps camera file names out of the visible photo keyword field', async () => {
    const user = userEvent.setup()

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:photo-preview'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "饮食" }))

    const estimateHeading = await screen.findByRole('heading', { level: 3, name: "拍一张，先给你候选和份量建议" })
    const estimatePanel = estimateHeading.closest('article')

    expect(estimatePanel).not.toBeNull()

    const uploadInput = (estimatePanel as HTMLElement).querySelector('input[type="file"]') as HTMLInputElement | null
    const keywordInput = within(estimatePanel as HTMLElement).getByPlaceholderText(
      '例如：米饭、奶茶、鸡胸肉',
    ) as HTMLInputElement

    if (!uploadInput) {
      throw new Error('Expected the photo upload input to exist')
    }

    await user.upload(uploadInput, new File(['fake image'], 'IMG_20260602_132012_camera_food.jpg', { type: 'image/jpeg' }))

    expect(within(estimatePanel as HTMLElement).getByText('IMG_20260602_132012_camera_food')).toBeInTheDocument()
    expect(keywordInput.value).toBe('')
  })

  it('opens quick entry from the today coach suggestions', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "今日" }))

    expect(screen.getByRole('heading', { level: 3, name: "别断掉这股节奏" })).toBeInTheDocument()
    expect(screen.getByText("还差 85 g 蛋白")).toBeInTheDocument()

    const coachPanel = screen.getByRole('heading', { level: 3, name: "今天最值得先补的几步" }).closest('article')
    expect(coachPanel).not.toBeNull()

    await user.click(within(coachPanel as HTMLElement).getAllByRole('button').at(-1) as HTMLButtonElement)

    expect(screen.getByRole('dialog', { name: "快速记录面板" })).toBeInTheDocument()
  })

  it('prefills the quick meal sheet from a coach food suggestion', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "今日" }))

    const coachPanel = screen.getByRole('heading', { level: 3, name: "今天最值得先补的几步" }).closest('article')
    expect(coachPanel).not.toBeNull()

    await user.click(within(coachPanel as HTMLElement).getByRole('button', { name: new RegExp("鸡胸饭") }))

    const dialog = screen.getByRole('dialog', { name: "快速记录面板" })

    expect(within(dialog).getByLabelText("食物名称")).toHaveValue("鸡胸饭")
    expect(within(dialog).getByLabelText("蛋白质")).toHaveValue(44)
  })

  it('opens quick workout entry from a today coach workout suggestion', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())

    act(() => {
      const snapshot = useFitnessStore.getState()
      snapshot.replaceSnapshot({
        workoutSessions: snapshot.workoutSessions.filter((entry) => entry.dateKey !== targetDate),
      })
    })

    render(<FitnessApp />)

    const coachPanel = screen
      .getByRole('heading', {
        level: 3,
        name: '\u4eca\u5929\u6700\u503c\u5f97\u5148\u8865\u7684\u51e0\u6b65',
      })
      .closest('article')
    expect(coachPanel).not.toBeNull()
    expect(
      within(coachPanel as HTMLElement).getByText('\u672c\u5468\u8fd8\u5dee 3 \u6b21\u8bad\u7ec3'),
    ).toBeInTheDocument()

    await user.click(
      within(coachPanel as HTMLElement).getByRole('button', { name: /\u63a8\u8bad\u7ec3/ }),
    )

    const dialog = screen.getByRole('dialog', {
      name: '\u5feb\u901f\u8bb0\u5f55\u9762\u677f',
    })

    expect(within(dialog).getByLabelText('\u8bad\u7ec3\u6807\u9898')).toHaveValue(
      '\u63a8\u8bad\u7ec3',
    )
    expect(within(dialog).getByLabelText('\u8bad\u7ec3\u7c7b\u578b')).toHaveValue('strength')

    await user.click(
      within(dialog).getByRole('button', { name: '\u4fdd\u5b58\u8bad\u7ec3' }),
    )

    expect(
      useFitnessStore
        .getState()
        .workoutSessions.some((session) => session.title === '\u63a8\u8bad\u7ec3'),
    ).toBe(true)
  })

  it('prefills quick recovery entry from a today coach recovery suggestion', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())

    act(() => {
      const snapshot = useFitnessStore.getState()
      snapshot.replaceSnapshot({
        ...snapshot,
        recoveryEntries: snapshot.recoveryEntries.filter((entry) => entry.dateKey !== targetDate),
      })
    })

    render(<FitnessApp />)

    const coachPanel = screen.getByRole('heading', { level: 3, name: "今天最值得先补的几步" }).closest('article')
    expect(coachPanel).not.toBeNull()

    await user.click(within(coachPanel as HTMLElement).getByRole('button', { name: new RegExp("高压日") }))

    const dialog = screen.getByRole('dialog', { name: "快速记录面板" })

    expect(within(dialog).getByLabelText("喝水")).toHaveValue(3.2)
    expect(within(dialog).getByLabelText("步数")).toHaveValue(6000)
    expect(within(dialog).getByLabelText("睡眠")).toHaveValue(8)
    expect(within(dialog).getByRole('radio', { name: '2' })).toHaveAttribute('aria-checked', 'true')

    await user.click(within(dialog).getByRole('button', { name: "保存恢复" }))

    expect(
      useFitnessStore
        .getState()
        .recoveryEntries.some(
          (entry) => entry.dateKey === targetDate && entry.waterLiters === 3.2 && entry.sleepHours === 8,
      ),
    ).toBe(true)
  })

  it('uses a compact mobile rail for coach suggestions in today', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '今日' }))

    const coachPanel = screen.getByRole('heading', { level: 3, name: '今天最值得先补的几步' }).closest('article')

    expect(coachPanel).not.toBeNull()
    expect(within(coachPanel as HTMLElement).getByText('还差 85 g 蛋白')).toBeInTheDocument()
    expect((coachPanel as HTMLElement).querySelector('.coach-suggestion-row')).toHaveClass(
      'coach-suggestion-row',
      'coach-suggestion-row--rail',
    )
    expect((coachPanel as HTMLElement).querySelectorAll('.coach-suggestion-button').length).toBeGreaterThanOrEqual(2)
  })

  it('applies a planned meal template from the today coach panel', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())
    const weekday = new Date().getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6

    act(() => {
      const snapshot = useFitnessStore.getState()
      snapshot.replaceSnapshot({
        weeklyMealPlans: [
          {
            id: 'weekly-plan-today-dinner',
            weekday,
            mealType: 'dinner',
            templateId: 'meal-template-cut-dinner',
          },
        ],
      })
    })

    render(<FitnessApp />)

    const coachPanel = screen
      .getByRole('heading', {
        level: 3,
        name: '\u4eca\u5929\u6700\u503c\u5f97\u5148\u8865\u7684\u51e0\u6b65',
      })
      .closest('article')
    expect(coachPanel).not.toBeNull()

    await user.click(
      within(coachPanel as HTMLElement).getByRole('button', { name: /\u51cf\u8102\u665a\u9910/ }),
    )

    const plannedDinnerEntries = useFitnessStore
      .getState()
      .mealEntries.filter(
        (entry) =>
          entry.dateKey === targetDate &&
          entry.mealType === 'dinner' &&
          entry.foodName === '\u4e09\u6587\u9c7c\u6c99\u62c9',
      )

    expect(plannedDinnerEntries).toHaveLength(1)
  })

  it('updates existing body and recovery entries from quick entry instead of duplicating them', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())
    const initialBodyCount = useFitnessStore.getState().bodyEntries.length
    const initialRecoveryCount = useFitnessStore.getState().recoveryEntries.length
    const existingBodyEntry = useFitnessStore
      .getState()
      .bodyEntries.find((entry) => entry.dateKey === targetDate)
    const existingRecoveryEntry = useFitnessStore
      .getState()
      .recoveryEntries.find((entry) => entry.dateKey === targetDate)

    expect(existingBodyEntry).toBeDefined()
    expect(existingRecoveryEntry).toBeDefined()

    render(<FitnessApp />)

    await user.click(within(getTodayQuickPanel()).getByRole('button', { name: new RegExp("记体重") }))
    const bodyDialog = screen.getByRole('dialog', { name: "快速记录面板" })
    expect(within(bodyDialog).getByRole('button', { name: "更新体重" })).toBeInTheDocument()
    await user.clear(within(bodyDialog).getByLabelText("体重"))
    await user.type(within(bodyDialog).getByLabelText("体重"), '71.2')
    await user.click(within(bodyDialog).getByRole('button', { name: "更新体重" }))

    expect(useFitnessStore.getState().bodyEntries).toHaveLength(initialBodyCount)
    expect(useFitnessStore.getState().bodyEntries.find((entry) => entry.id === existingBodyEntry?.id)).toMatchObject({
      dateKey: targetDate,
      weight: 71.2,
    })

    await user.click(within(getTodayQuickPanel()).getByRole('button', { name: new RegExp("记恢复") }))
    const recoveryDialog = screen.getByRole('dialog', { name: "快速记录面板" })
    expect(within(recoveryDialog).getByRole('button', { name: "更新恢复" })).toBeInTheDocument()
    await user.clear(within(recoveryDialog).getByLabelText("喝水"))
    await user.type(within(recoveryDialog).getByLabelText("喝水"), '2.9')
    await user.clear(within(recoveryDialog).getByLabelText("步数"))
    await user.type(within(recoveryDialog).getByLabelText("步数"), '9600')
    await user.clear(within(recoveryDialog).getByLabelText("睡眠"))
    await user.type(within(recoveryDialog).getByLabelText("睡眠"), '7.6')
    await user.click(within(recoveryDialog).getByRole('radio', { name: '3' }))
    await user.click(within(recoveryDialog).getByRole('button', { name: "更新恢复" }))

    expect(useFitnessStore.getState().recoveryEntries).toHaveLength(initialRecoveryCount)
    expect(
      useFitnessStore.getState().recoveryEntries.find((entry) => entry.id === existingRecoveryEntry?.id),
    ).toMatchObject({
      dateKey: targetDate,
      waterLiters: 2.9,
      steps: 9600,
      sleepHours: 7.6,
      energy: 3,
    })
  })

  it('updates chest and hip measurements from body quick entry', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())
    const existingBodyEntry = useFitnessStore
      .getState()
      .bodyEntries.find((entry) => entry.dateKey === targetDate)

    expect(existingBodyEntry).toBeDefined()
    expect(existingBodyEntry).toMatchObject({
      chest: 98,
      hips: 96,
    })

    render(<FitnessApp />)

    await user.click(within(getTodayQuickPanel()).getByRole('button', { name: /记体重/ }))
    const bodyDialog = screen.getByRole('dialog', { name: '快速记录面板' })

    expect(within(bodyDialog).getByLabelText('胸围')).toHaveValue(98)
    expect(within(bodyDialog).getByLabelText('臀围')).toHaveValue(96)

    await user.clear(within(bodyDialog).getByLabelText('胸围'))
    await user.type(within(bodyDialog).getByLabelText('胸围'), '99')
    await user.clear(within(bodyDialog).getByLabelText('臀围'))
    await user.type(within(bodyDialog).getByLabelText('臀围'), '97')
    await user.click(within(bodyDialog).getByRole('button', { name: '更新体重' }))

    expect(useFitnessStore.getState().bodyEntries.find((entry) => entry.id === existingBodyEntry?.id)).toMatchObject({
      dateKey: targetDate,
      chest: 99,
      hips: 97,
    })
  })

  it('shows recovery score feedback in today', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "今日" }))

    const recoveryPanel = screen
      .getByRole('heading', { level: 3, name: "别只看训练，也看恢复" })
      .closest('article')
    expect(recoveryPanel).not.toBeNull()

    expect(within(recoveryPanel as HTMLElement).getByText("恢复分")).toBeInTheDocument()
    expect(within(recoveryPanel as HTMLElement).getByText("83 分")).toBeInTheDocument()
    expect(within(recoveryPanel as HTMLElement).getByText("7日均分")).toBeInTheDocument()
    expect(within(recoveryPanel as HTMLElement).getByText("90 分")).toBeInTheDocument()
  })

  it('shows stage progress and a 28-day consistency heatmap in insights', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    expect(screen.getByText("离目标还剩 5.9 kg")).toBeInTheDocument()
    expect(screen.getByText("下一节点 71.5 kg")).toBeInTheDocument()

    const heatmap = screen.getByRole('list', { name: "28天打卡热力格" })
    expect(within(heatmap).getAllByRole('listitem')).toHaveLength(28)
    expect(screen.getByText("最长连记")).toBeInTheDocument()
  })

  it('shows stage momentum highlights and weekly missions in today', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "今日" }))

    expect(screen.getByText("阶段动力")).toBeInTheDocument()
    expect(screen.getByText("再减 0.4 kg，就能拿下 71.5 kg 节点")).toBeInTheDocument()
    expect(screen.getByText("已减 1.1 kg")).toBeInTheDocument()
    expect(screen.getByText("连记 3 天")).toBeInTheDocument()
    expect(screen.getByText("本周训练")).toBeInTheDocument()
    expect(screen.getByText("2 / 4 次")).toBeInTheDocument()
    expect(screen.getByText("2 / 5 天")).toBeInTheDocument()
  })

  it('uses compact mobile rails for momentum badges and missions', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '今日' }))

    const momentumPanel = screen
      .getByRole('heading', { level: 3, name: '再减 0.4 kg，就能拿下 71.5 kg 节点' })
      .closest('article')

    expect(momentumPanel).not.toBeNull()
    expect(momentumPanel).toHaveClass('momentum-panel', 'momentum-panel--compact')
    expect((momentumPanel as HTMLElement).querySelector('.momentum-badge-grid')).toHaveClass(
      'momentum-badge-grid',
      'momentum-badge-grid--rail',
    )
    expect((momentumPanel as HTMLElement).querySelector('.mission-list')).toHaveClass(
      'mission-list',
      'mission-list--rail',
    )
    expect(within(momentumPanel as HTMLElement).queryByText(/再坚持两天记录/)).not.toBeInTheDocument()
  })

  it('shows unlocked achievements and upcoming milestones in today', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "今日" }))

    expect(screen.getByText("阶段成就")).toBeInTheDocument()
    expect(screen.getByText("已解锁 3 枚")).toBeInTheDocument()
    expect(screen.getByText("已减重 1 kg")).toBeInTheDocument()
    expect(screen.getByText("连续记录 7 天")).toBeInTheDocument()
    expect(screen.getByText("3 / 7 天")).toBeInTheDocument()
    expect(screen.getByText('1.1 / 3 kg')).toBeInTheDocument()
  })

  it('uses compact mobile rails for unlocked achievements and next milestones', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '今日' }))

    const achievementPanel = screen.getByRole('heading', { level: 3, name: '已解锁 3 枚' }).closest('article')

    expect(achievementPanel).not.toBeNull()
    expect(achievementPanel).toHaveClass('achievement-panel', 'achievement-panel--compact')
    expect((achievementPanel as HTMLElement).querySelector('.achievement-grid')).toHaveClass(
      'achievement-grid',
      'achievement-grid--rail',
    )
    expect((achievementPanel as HTMLElement).querySelector('.achievement-next-grid')).toHaveClass(
      'achievement-next-grid',
      'achievement-next-grid--rail',
    )
    expect(within(achievementPanel as HTMLElement).queryByText(/小节点也算数/)).not.toBeInTheDocument()
  })

  it('shows one weekly reminder in today and can jump to insights review', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: "今日" }))

    const reminderPanel = screen.getByRole('heading', { level: 3, name: '先把完整记录拉回 3 天' }).closest('article')
    expect(reminderPanel).not.toBeNull()
    expect(within(reminderPanel as HTMLElement).getByText('本周提醒')).toBeInTheDocument()
    expect(
      within(reminderPanel as HTMLElement).getByText('近 7 天只有 1 天接近完整记录，很多判断还不够稳。'),
    ).toBeInTheDocument()

    await user.click(within(reminderPanel as HTMLElement).getByRole('button', { name: '去看趋势复盘' }))

    expect(screen.getByRole('heading', { level: 2, name: '本周复盘' })).toBeInTheDocument()
  })

  it('shows tomorrow plan actions in today and can apply a breakfast template to tomorrow', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '今日' }))

    const tomorrowPanel = screen
      .getByRole('heading', { level: 3, name: '明早先把高蛋白早餐带进来' })
      .closest('article')
    expect(tomorrowPanel).not.toBeNull()
    expect(within(tomorrowPanel as HTMLElement).getByText('明日计划')).toBeInTheDocument()
    expect(within(tomorrowPanel as HTMLElement).getByText('明天补一节力量训练')).toBeInTheDocument()
    expect(within(tomorrowPanel as HTMLElement).getByText('明晚把恢复记录补上')).toBeInTheDocument()

    await user.click(within(tomorrowPanel as HTMLElement).getByRole('button', { name: '带入早餐' }))

    const tomorrowDate = shiftDateKey(formatLocalDateKey(new Date()), 1)

    expect(
      useFitnessStore.getState().mealEntries.some(
        (entry) => entry.dateKey === tomorrowDate && entry.foodName === '希腊酸奶碗',
      ),
    ).toBe(true)
  })

  it('uses a compact mobile rail for the tomorrow plan panel', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '今日' }))

    const tomorrowPanel = screen
      .getByRole('heading', { level: 3, name: '明早先把高蛋白早餐带进来' })
      .closest('article')

    expect(tomorrowPanel).not.toBeNull()
    expect(tomorrowPanel).toHaveClass('tomorrow-plan-panel', 'tomorrow-plan-panel--compact')
    expect((tomorrowPanel as HTMLElement).querySelector('.panel-head')).toHaveClass('tomorrow-plan-panel-head')
    expect((tomorrowPanel as HTMLElement).querySelector('.tomorrow-plan-list')).toHaveClass(
      'tomorrow-plan-list',
      'tomorrow-plan-list--rail',
    )
    expect(within(tomorrowPanel as HTMLElement).queryByText(/明天按现在的节奏继续记录就够了/)).not.toBeInTheDocument()
  })

  it('opens tomorrow workout quick entry from the tomorrow plan panel', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '今日' }))

    const tomorrowPanel = screen
      .getByRole('heading', { level: 3, name: '明早先把高蛋白早餐带进来' })
      .closest('article')
    expect(tomorrowPanel).not.toBeNull()

    await user.click(within(tomorrowPanel as HTMLElement).getByRole('button', { name: '去记训练' }))

    const dialog = screen.getByRole('dialog', { name: '快速记录面板' })
    const tomorrowDate = shiftDateKey(formatLocalDateKey(new Date()), 1)

    expect(within(dialog).getByText(formatDateKeyLabel(tomorrowDate))).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: '训练' })).toHaveAttribute('aria-selected', 'true')
    expect(within(dialog).getByLabelText('训练标题')).toHaveValue('推训练')
  })

  it('prioritizes a planned tomorrow workout inside the tomorrow plan panel', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())
    const tomorrowDate = shiftDateKey(targetDate, 1)
    const tomorrowWeekday = createDateFromKey(tomorrowDate).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6

    act(() => {
      const snapshot = useFitnessStore.getState()
      snapshot.replaceSnapshot({
        weeklyWorkoutPlans: [
          {
            id: 'tomorrow-workout-slot',
            weekday: tomorrowWeekday,
            templateId: 'workout-template-push',
          },
        ],
      })
    })

    render(<FitnessApp />)

    await user.click(screen.getByRole('tab', { name: '今日' }))

    const tomorrowPanel = screen
      .getByRole('heading', { level: 3, name: '明早先把高蛋白早餐带进来' })
      .closest('article')
    expect(tomorrowPanel).not.toBeNull()
    expect(within(tomorrowPanel as HTMLElement).getByText('明天按计划练推训练')).toBeInTheDocument()
    expect(within(tomorrowPanel as HTMLElement).queryByText('明天补一节力量训练')).not.toBeInTheDocument()

    const workoutButtons = within(tomorrowPanel as HTMLElement).getAllByRole('button', { name: '去记训练' })
    await user.click(workoutButtons[0] as HTMLButtonElement)

    const dialog = screen.getByRole('dialog', { name: '快速记录面板' })

    expect(within(dialog).getByText(formatDateKeyLabel(tomorrowDate))).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: '训练' })).toHaveAttribute('aria-selected', 'true')
    expect(within(dialog).getByLabelText('训练标题')).toHaveValue('推训练')
  })

  it('shows a today plan panel and applies planned meal and workout templates to today', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())
    const weekday = createDateFromKey(targetDate).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6

    act(() => {
      const snapshot = useFitnessStore.getState()
      snapshot.replaceSnapshot({
        weeklyMealPlans: [
          {
            id: 'today-breakfast-slot',
            weekday,
            mealType: 'breakfast',
            templateId: 'meal-template-high-protein-breakfast',
          },
        ],
        weeklyWorkoutPlans: [
          {
            id: 'today-workout-slot',
            weekday,
            templateId: 'workout-template-push',
          },
        ],
        mealEntries: snapshot.mealEntries.filter(
          (entry) => !(entry.dateKey === targetDate && entry.mealType === 'breakfast'),
        ),
        workoutSessions: snapshot.workoutSessions.filter((entry) => entry.dateKey !== targetDate),
      })
    })

    render(<FitnessApp />)

    const todayPlanPanel = screen.getByRole('heading', { level: 3, name: '今天按计划还差 2 项' }).closest('article')
    expect(todayPlanPanel).not.toBeNull()
    expect(within(todayPlanPanel as HTMLElement).getByText('今日计划')).toBeInTheDocument()
    expect(within(todayPlanPanel as HTMLElement).getByText('按计划吃早餐')).toBeInTheDocument()
    expect(within(todayPlanPanel as HTMLElement).getByText('按计划练推训练')).toBeInTheDocument()

    await user.click(within(todayPlanPanel as HTMLElement).getByRole('button', { name: '带入早餐' }))
    await user.click(within(todayPlanPanel as HTMLElement).getByRole('button', { name: '带入训练' }))

    expect(
      useFitnessStore.getState().mealEntries.some(
        (entry) => entry.dateKey === targetDate && entry.mealType === 'breakfast' && entry.foodName === '希腊酸奶碗',
      ),
    ).toBe(true)
    expect(
      useFitnessStore.getState().workoutSessions.some(
        (session) => session.dateKey === targetDate && session.title === '推训练',
      ),
    ).toBe(true)

    const completedTodayPlanPanel = (
      await screen.findByRole('heading', { level: 3, name: '今天排好的都已经落下来了' })
    ).closest('article')
    expect(completedTodayPlanPanel).not.toBeNull()
    expect(within(completedTodayPlanPanel as HTMLElement).queryByRole('button', { name: '带入早餐' })).not.toBeInTheDocument()
    expect(within(completedTodayPlanPanel as HTMLElement).queryByRole('button', { name: '带入训练' })).not.toBeInTheDocument()
  })

  it('updates goal forecast live inside settings', async () => {
    const user = userEvent.setup()

    render(<FitnessApp />)

    await user.click(screen.getByRole('button', { name: "打开设置" }))

    expect(screen.getByText("约 12 周接近目标")).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: "冲一段" }))

    expect(screen.getByText("约 8 周接近目标")).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: "保存目标" }))

    expect(useFitnessStore.getState().profile.weeklyRateGoal).toBe(0.75)
  })

  it('switches to the desktop sidebar shell when the viewport matches desktop', async () => {
    const user = userEvent.setup()

    mockMatchMedia(true)

    render(<FitnessApp />)

    expect(screen.getByText("本地优先，数据都保存在当前浏览器。")).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: "今日总览" })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: "趋势" }))

    expect(screen.getByRole('heading', { level: 2, name: "趋势复盘" })).toBeInTheDocument()
    expect(screen.getByText("离目标还剩 5.9 kg")).toBeInTheDocument()
  })
})
