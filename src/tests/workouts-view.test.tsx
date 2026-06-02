import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { WorkoutsView } from '../app/routes/WorkoutsView'
import { createDateFromKey, createDateStampForDateKey, formatLocalDateKey, shiftDateKey } from '../store/date'
import { useFitnessStore } from '../store/useFitnessStore'

describe('WorkoutsView', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useFitnessStore.getState().resetToSeed()
  })

  it('renders logging, rhythm, and history sections together in the continuous layout', () => {
    const targetDate = formatLocalDateKey(new Date())

    render(<WorkoutsView targetDate={targetDate} />)

    expect(screen.getByRole('heading', { level: 3, name: '训练历史工作台' })).toBeInTheDocument()
    expect(screen.getByLabelText('搜索训练历史')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '全部' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '近 7 天' })).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '把训练做成能连续复用的工作台' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: '本周还差 2 次训练' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: '2 天有训练，先把节奏稳住' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: '先带入常练模板，再补细节' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: '把这次训练完整记下来' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: '共 74 分钟 · 约 420 千卡' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /再练一次/ })).toHaveLength(2)

    const loadList = screen.getByRole('list', { name: '近7天训练负荷' })
    expect(within(loadList).getAllByRole('listitem')).toHaveLength(7)
  })

  it('can edit and confirm-delete workout records for a selected day', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())

    render(<WorkoutsView targetDate={targetDate} />)

    const selectedDayPanel = screen.getByRole('heading', { level: 3, name: '共 74 分钟 · 约 420 千卡' }).closest('article')
    expect(selectedDayPanel).not.toBeNull()

    await user.click(within(selectedDayPanel as HTMLElement).getByRole('button', { name: '编辑 腿部日' }))
    await user.clear(screen.getByLabelText('训练标题'))
    await user.type(screen.getByLabelText('训练标题'), '腿部自测日')
    await user.clear(screen.getByLabelText('时长'))
    await user.type(screen.getByLabelText('时长'), '82')
    await user.clear(screen.getByLabelText('预估消耗'))
    await user.type(screen.getByLabelText('预估消耗'), '468')
    await user.clear(screen.getByLabelText('备注'))
    await user.type(screen.getByLabelText('备注'), '补了台阶蹲和髋外展。')
    await user.click(screen.getByRole('button', { name: '更新训练' }))

    await waitFor(() => {
      expect(
        useFitnessStore
          .getState()
          .workoutSessions.some(
            (session) =>
              session.dateKey === targetDate &&
              session.title === '腿部自测日' &&
              session.durationMinutes === 82 &&
              session.estimatedCalories === 468 &&
              session.notes === '补了台阶蹲和髋外展。',
          ),
      ).toBe(true)
    })

    const updatedSelectedDayPanel = screen.getByRole('heading', { level: 3, name: '共 82 分钟 · 约 468 千卡' }).closest('article')
    expect(updatedSelectedDayPanel).not.toBeNull()
    expect(within(updatedSelectedDayPanel as HTMLElement).getByText('腿部自测日')).toBeInTheDocument()
    expect(within(updatedSelectedDayPanel as HTMLElement).getByText('力量 · 82 分钟')).toBeInTheDocument()

    await user.click(within(updatedSelectedDayPanel as HTMLElement).getByRole('button', { name: '删除 腿部自测日' }))
    expect(screen.getByText('删除这条训练记录？')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '先取消' }))
    expect(screen.queryByText('删除这条训练记录？')).not.toBeInTheDocument()
    expect(
      useFitnessStore.getState().workoutSessions.some((session) => session.title === '腿部自测日'),
    ).toBe(true)

    await user.click(within(updatedSelectedDayPanel as HTMLElement).getByRole('button', { name: '删除 腿部自测日' }))
    await user.click(screen.getByRole('button', { name: '确认删除' }))

    await waitFor(() => {
      expect(
        useFitnessStore.getState().workoutSessions.some((session) => session.title === '腿部自测日'),
      ).toBe(false)
    })

    expect(screen.getByRole('heading', { level: 3, name: '共 0 分钟 · 约 0 千卡' })).toBeInTheDocument()
    expect(screen.getByText('这一天还没有训练记录，可以先补一次训练。')).toBeInTheDocument()
  })

  it('relogs a recent workout directly into the selected date', async () => {
    const user = userEvent.setup()
    const targetDate = shiftDateKey(formatLocalDateKey(new Date()), 1)

    render(<WorkoutsView targetDate={targetDate} />)

    expect(screen.getByRole('heading', { level: 3, name: '共 0 分钟 · 约 0 千卡' })).toBeInTheDocument()
    expect(screen.getByText('这一天还没有训练记录，可以先补一次训练。')).toBeInTheDocument()
    const historyPanel = screen.getByRole('heading', { level: 3, name: '训练历史工作台' }).closest('article')
    expect(historyPanel).not.toBeNull()

    await user.click(within(historyPanel as HTMLElement).getByRole('button', { name: '再练一次 腿部日' }))

    await waitFor(() => {
      const reloggedSession = useFitnessStore
        .getState()
        .workoutSessions.find((session) => session.dateKey === targetDate && session.title === '腿部日')

      expect(reloggedSession).toMatchObject({
        kind: 'strength',
        durationMinutes: 74,
        estimatedCalories: 420,
      })
      expect(reloggedSession?.exercises).toHaveLength(2)
    })

    const selectedDayPanel = screen.getByRole('heading', { level: 3, name: '共 74 分钟 · 约 420 千卡' }).closest('article')
    expect(selectedDayPanel).not.toBeNull()
    expect(within(selectedDayPanel as HTMLElement).getByText('腿部日')).toBeInTheDocument()
    expect(within(selectedDayPanel as HTMLElement).getByText('力量 · 74 分钟')).toBeInTheDocument()
    expect(within(selectedDayPanel as HTMLElement).getByText('420 千卡')).toBeInTheDocument()
  })

  it('filters workout history by keyword across title and exercise names', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())

    render(<WorkoutsView targetDate={targetDate} />)

    const historyPanel = screen.getByRole('heading', { level: 3, name: '训练历史工作台' }).closest('article')
    expect(historyPanel).not.toBeNull()

    expect(within(historyPanel as HTMLElement).getByText('腿部日')).toBeInTheDocument()
    expect(within(historyPanel as HTMLElement).getByText('坡走')).toBeInTheDocument()

    await user.type(within(historyPanel as HTMLElement).getByLabelText('搜索训练历史'), '罗马尼亚')

    expect(within(historyPanel as HTMLElement).getByText('腿部日')).toBeInTheDocument()
    expect(within(historyPanel as HTMLElement).queryByText('坡走')).not.toBeInTheDocument()
  })

  it('switches history range and kind filters without leaving the workouts view', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())
    const olderDate = shiftDateKey(targetDate, -20)
    const olderStamp = createDateStampForDateKey(olderDate)

    useFitnessStore.getState().addWorkoutSession({
      kind: 'cardio',
      title: '训练营单车',
      startedAt: olderStamp.iso,
      dateKey: olderStamp.dateKey,
      durationMinutes: 48,
      estimatedCalories: 330,
      notes: '恢复周长有氧',
      exercises: [],
    })

    render(<WorkoutsView targetDate={targetDate} />)
    const historyPanel = screen.getByRole('heading', { level: 3, name: '训练历史工作台' }).closest('article')
    expect(historyPanel).not.toBeNull()

    expect(within(historyPanel as HTMLElement).queryByText('训练营单车')).not.toBeInTheDocument()

    await user.click(within(historyPanel as HTMLElement).getByRole('button', { name: '近 30 天' }))

    expect(within(historyPanel as HTMLElement).getByText('训练营单车')).toBeInTheDocument()

    await user.click(within(historyPanel as HTMLElement).getByRole('button', { name: '有氧' }))

    expect(within(historyPanel as HTMLElement).getByText('坡走')).toBeInTheDocument()
    expect(within(historyPanel as HTMLElement).getByText('训练营单车')).toBeInTheDocument()
    expect(within(historyPanel as HTMLElement).queryByText('腿部日')).not.toBeInTheDocument()
  })

  it('loads a history session into the edit form and keeps its original date on save', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())
    const originalSession = useFitnessStore
      .getState()
      .workoutSessions.find((session) => session.title === '坡走')

    expect(originalSession).toBeDefined()

    render(<WorkoutsView targetDate={targetDate} />)
    const historyPanel = screen.getByRole('heading', { level: 3, name: '训练历史工作台' }).closest('article')
    expect(historyPanel).not.toBeNull()

    await user.click(within(historyPanel as HTMLElement).getByRole('button', { name: '编辑 坡走' }))

    expect(screen.getByLabelText('训练标题')).toHaveValue('坡走')
    expect(screen.getByLabelText('训练类型')).toHaveValue('cardio')
    expect(screen.getByLabelText('时长')).toHaveValue(35)
    expect(screen.getByLabelText('预估消耗')).toHaveValue(260)

    await user.clear(screen.getByLabelText('训练标题'))
    await user.type(screen.getByLabelText('训练标题'), '坡走间歇')
    await user.click(screen.getByRole('button', { name: '更新训练' }))

    await waitFor(() => {
      expect(
        useFitnessStore
          .getState()
          .workoutSessions.find((session) => session.id === originalSession?.id),
      ).toMatchObject({
        title: '坡走间歇',
        dateKey: originalSession?.dateKey,
      })
    })
  })

  it('can schedule a weekly workout plan, apply it to the selected date, and clear the slot', async () => {
    const user = userEvent.setup()
    const targetDate = shiftDateKey(formatLocalDateKey(new Date()), -10)
    const targetWeekday = createDateFromKey(targetDate).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6

    render(<WorkoutsView targetDate={targetDate} />)

    expect(screen.getByText('训练周计划')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: '把常练模板排进这一周' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '安排 推训练' }))

    expect(
      useFitnessStore.getState().weeklyWorkoutPlans.some(
        (plan) => plan.weekday === targetWeekday && plan.templateId === 'workout-template-push',
      ),
    ).toBe(true)
    expect(screen.getAllByText('推训练').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: '将计划带入当前日期训练' }))

    await waitFor(() => {
      const savedWorkout = useFitnessStore
        .getState()
        .workoutSessions.find((session) => session.dateKey === targetDate && session.title === '推训练')

      expect(savedWorkout).toMatchObject({
        kind: 'strength',
        durationMinutes: 65,
        estimatedCalories: 380,
      })
    })

    await user.click(screen.getByRole('button', { name: '清空训练计划' }))

    expect(useFitnessStore.getState().weeklyWorkoutPlans.some((plan) => plan.weekday === targetWeekday)).toBe(false)
  })

  it('loads a workout template into the manual form and saves it into the selected day', async () => {
    const user = userEvent.setup()
    const targetDate = shiftDateKey(formatLocalDateKey(new Date()), -10)

    render(<WorkoutsView targetDate={targetDate} />)

    await user.click(screen.getByRole('button', { name: '推训练65 min · 力量' }))

    expect(screen.getByLabelText('训练标题')).toHaveValue('推训练')
    expect(screen.getByLabelText('训练类型')).toHaveValue('strength')
    expect(screen.getByLabelText('时长')).toHaveValue(65)
    expect(screen.getByLabelText('预估消耗')).toHaveValue(380)
    expect(screen.getAllByLabelText('动作名称')[0]).toHaveValue('卧推')
    expect(screen.getAllByLabelText('动作名称')[1]).toHaveValue('上斜哑铃卧推')

    await user.click(screen.getByRole('button', { name: '保存训练' }))

    await waitFor(() => {
      const savedWorkout = useFitnessStore
        .getState()
        .workoutSessions.find((session) => session.dateKey === targetDate && session.title === '推训练')

      expect(savedWorkout).toMatchObject({
        kind: 'strength',
        durationMinutes: 65,
        estimatedCalories: 380,
      })
      expect(savedWorkout?.exercises).toHaveLength(2)
    })

    const selectedDayPanel = screen.getByRole('heading', { level: 3, name: '共 65 分钟 · 约 380 千卡' }).closest('article')
    expect(selectedDayPanel).not.toBeNull()
    expect(within(selectedDayPanel as HTMLElement).getByText('推训练')).toBeInTheDocument()
    expect(within(selectedDayPanel as HTMLElement).getByText('力量 · 65 分钟')).toBeInTheDocument()
    expect(within(selectedDayPanel as HTMLElement).getByText('380 千卡')).toBeInTheDocument()
  })

  it('captures a logged workout into a custom template', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())
    const initialTemplateCount = useFitnessStore.getState().workoutTemplates.length

    render(<WorkoutsView targetDate={targetDate} />)

    await user.click(screen.getAllByRole('button', { name: '将 腿部日 存为模板' })[0] as HTMLButtonElement)

    const templateEditorHeading = screen.getByRole('heading', {
      level: 3,
      name: '把这次训练存成下次的快捷模板',
    })
    expect(templateEditorHeading).toBeInTheDocument()

    const templateEditor = templateEditorHeading.closest('form')
    expect(templateEditor).not.toBeNull()

    await user.clear(within(templateEditor as HTMLFormElement).getByLabelText('模板名称'))
    await user.type(within(templateEditor as HTMLFormElement).getByLabelText('模板名称'), '我的腿部模板')
    await user.click(within(templateEditor as HTMLFormElement).getByRole('button', { name: '保存模板' }))

    const createdTemplate = useFitnessStore
      .getState()
      .workoutTemplates.find((template) => template.name === '我的腿部模板')

    expect(useFitnessStore.getState().workoutTemplates).toHaveLength(initialTemplateCount + 1)
    expect(createdTemplate).toMatchObject({
      kind: 'strength',
      durationMinutes: 74,
      estimatedCalories: 420,
    })
    expect(createdTemplate?.exercises).toHaveLength(2)
    expect(screen.getByRole('button', { name: /^我的腿部模板/ })).toBeInTheDocument()
  })

  it('can edit an existing workout template', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())

    render(<WorkoutsView targetDate={targetDate} />)

    await user.click(screen.getByRole('button', { name: '编辑模板 推训练' }))

    const templateEditorHeading = screen.getByRole('heading', { level: 3, name: '修改这套训练模板' })
    expect(templateEditorHeading).toBeInTheDocument()

    const templateEditor = templateEditorHeading.closest('form')
    expect(templateEditor).not.toBeNull()

    await user.clear(within(templateEditor as HTMLFormElement).getByLabelText('模板名称'))
    await user.type(within(templateEditor as HTMLFormElement).getByLabelText('模板名称'), '推训练 v2')
    await user.clear(within(templateEditor as HTMLFormElement).getByLabelText('时长'))
    await user.type(within(templateEditor as HTMLFormElement).getByLabelText('时长'), '67')
    await user.clear(within(templateEditor as HTMLFormElement).getByLabelText('预估消耗'))
    await user.type(within(templateEditor as HTMLFormElement).getByLabelText('预估消耗'), '395')
    await user.click(within(templateEditor as HTMLFormElement).getByRole('button', { name: '更新模板' }))

    expect(
      useFitnessStore.getState().workoutTemplates.find((template) => template.id === 'workout-template-push'),
    ).toMatchObject({
      name: '推训练 v2',
      durationMinutes: 67,
      estimatedCalories: 395,
    })
    expect(screen.getByRole('button', { name: /^推训练 v2/ })).toBeInTheDocument()
  })

  it('deletes a workout template and clears any weekly workout plan slot using it', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())
    const targetWeekday = createDateFromKey(targetDate).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6

    render(<WorkoutsView targetDate={targetDate} />)

    await user.click(screen.getByRole('button', { name: '安排 推训练' }))

    expect(
      useFitnessStore.getState().weeklyWorkoutPlans.some(
        (plan) => plan.weekday === targetWeekday && plan.templateId === 'workout-template-push',
      ),
    ).toBe(true)

    await user.click(screen.getByRole('button', { name: '删除模板 推训练' }))
    expect(screen.getByText('删除这套训练模板？')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '删除模板' }))

    expect(
      useFitnessStore.getState().workoutTemplates.some((template) => template.id === 'workout-template-push'),
    ).toBe(false)
    expect(
      useFitnessStore.getState().weeklyWorkoutPlans.some((plan) => plan.templateId === 'workout-template-push'),
    ).toBe(false)
  })
})
