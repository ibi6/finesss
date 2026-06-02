import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { BodyView } from '../app/routes/BodyView'
import { formatLocalDateKey, shiftDateKey } from '../store/date'
import { useFitnessStore } from '../store/useFitnessStore'

describe('BodyView', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useFitnessStore.getState().resetToSeed()
  })

  it('shows body stage comparison and a 7-day weight trend chart', () => {
    const targetDate = formatLocalDateKey(new Date())

    render(<BodyView targetDate={targetDate} />)

    expect(screen.getByText('阶段对比')).toBeInTheDocument()
    expect(screen.getByText('起点体重')).toBeInTheDocument()
    expect(screen.getByText('当前体重')).toBeInTheDocument()
    expect(screen.getByText('目标体重')).toBeInTheDocument()
    expect(screen.getByText('离目标还差')).toBeInTheDocument()
    expect(screen.getByText('5.9 kg')).toBeInTheDocument()

    const chart = screen.getByRole('img', { name: '身体页7天体重趋势图' })
    expect(chart.querySelectorAll('circle')).toHaveLength(2)
  })

  it('captures chest and hip measurements in body records and keeps them visible after edit', async () => {
    const user = userEvent.setup()
    const targetDate = shiftDateKey(formatLocalDateKey(new Date()), -11)

    render(<BodyView targetDate={targetDate} />)

    const selectedBodyPanel = screen.getByText('所选日期体重').closest('article')
    const recentPanel = screen.getByText('最近身体记录').closest('article')

    expect(selectedBodyPanel).not.toBeNull()
    expect(recentPanel).not.toBeNull()

    await user.clear(screen.getByLabelText('体重'))
    await user.type(screen.getByLabelText('体重'), '70.4')
    await user.clear(screen.getByLabelText('体脂'))
    await user.type(screen.getByLabelText('体脂'), '19.8')
    await user.clear(screen.getByLabelText('腰围'))
    await user.type(screen.getByLabelText('腰围'), '77')
    await user.clear(screen.getByLabelText('胸围'))
    await user.type(screen.getByLabelText('胸围'), '96')
    await user.clear(screen.getByLabelText('臀围'))
    await user.type(screen.getByLabelText('臀围'), '95')
    await user.click(screen.getByRole('button', { name: '保存体重' }))

    const createdEntry = useFitnessStore
      .getState()
      .bodyEntries.find((entry) => entry.weight === 70.4 && entry.dateKey === targetDate)

    expect(createdEntry).toMatchObject({
      dateKey: targetDate,
      weight: 70.4,
      bodyFat: 19.8,
      waist: 77,
      chest: 96,
      hips: 95,
    })
    expect(within(selectedBodyPanel!).getByText('胸围 96 cm')).toBeInTheDocument()
    expect(within(selectedBodyPanel!).getByText('臀围 95 cm')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '编辑 70.4 kg 体重记录' }))
    await user.clear(screen.getByLabelText('胸围'))
    await user.type(screen.getByLabelText('胸围'), '97')
    await user.clear(screen.getByLabelText('臀围'))
    await user.type(screen.getByLabelText('臀围'), '96')
    await user.click(screen.getByRole('button', { name: '更新体重' }))

    expect(
      useFitnessStore.getState().bodyEntries.find((entry) => entry.id === createdEntry?.id),
    ).toMatchObject({
      chest: 97,
      hips: 96,
    })
    const editedRecentEntry = within(recentPanel!).getByText('70.4 kg').closest('.list-item')

    expect(editedRecentEntry).not.toBeNull()
    expect(within(selectedBodyPanel!).getByText('胸围 97 cm')).toBeInTheDocument()
    expect(within(selectedBodyPanel!).getByText('臀围 96 cm')).toBeInTheDocument()
    expect(editedRecentEntry).toHaveTextContent('胸围 97 cm')
    expect(editedRecentEntry).toHaveTextContent('臀围 96 cm')
  })

  it('can create, edit, and confirm-delete body and recovery records for a selected day', async () => {
    const user = userEvent.setup()
    const targetDate = shiftDateKey(formatLocalDateKey(new Date()), -10)
    const initialRecoveryCount = useFitnessStore.getState().recoveryEntries.length

    render(<BodyView targetDate={targetDate} />)

    await user.clear(screen.getByLabelText('体重'))
    await user.type(screen.getByLabelText('体重'), '70.4')
    await user.clear(screen.getByLabelText('体脂'))
    await user.type(screen.getByLabelText('体脂'), '19.8')
    await user.clear(screen.getByLabelText('腰围'))
    await user.type(screen.getByLabelText('腰围'), '77')
    await user.click(screen.getByRole('button', { name: '保存体重' }))

    expect(
      useFitnessStore.getState().bodyEntries.some(
        (entry) => entry.weight === 70.4 && entry.dateKey === targetDate,
      ),
    ).toBe(true)

    await user.click(screen.getByRole('button', { name: '编辑 70.4 kg 体重记录' }))
    await user.clear(screen.getByLabelText('体重'))
    await user.type(screen.getByLabelText('体重'), '69.9')
    await user.click(screen.getByRole('button', { name: '更新体重' }))

    expect(
      useFitnessStore.getState().bodyEntries.some(
        (entry) => entry.weight === 69.9 && entry.dateKey === targetDate,
      ),
    ).toBe(true)

    await user.click(screen.getByRole('button', { name: '删除 69.9 kg 体重记录' }))
    expect(screen.getByText('删除这条体重记录？')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '确认删除' }))

    expect(
      useFitnessStore.getState().bodyEntries.some(
        (entry) => entry.weight === 69.9 && entry.dateKey === targetDate,
      ),
    ).toBe(false)

    await user.clear(screen.getByLabelText('喝水'))
    await user.type(screen.getByLabelText('喝水'), '3.1')
    await user.clear(screen.getByLabelText('步数'))
    await user.type(screen.getByLabelText('步数'), '10500')
    await user.clear(screen.getByLabelText('睡眠'))
    await user.type(screen.getByLabelText('睡眠'), '8.2')
    await user.click(screen.getByRole('radio', { name: '5' }))
    await user.click(screen.getByRole('button', { name: '保存恢复' }))

    const selectedRecoveryPanel = screen.getByText('所选日期恢复').closest('article')

    const createdRecoveryEntry = useFitnessStore
      .getState()
      .recoveryEntries.find(
        (entry) =>
          entry.dateKey === targetDate &&
          entry.waterLiters === 3.1 &&
          entry.steps === 10500 &&
          entry.sleepHours === 8.2 &&
          entry.energy === 5,
      )

    expect(createdRecoveryEntry).toMatchObject({
      dateKey: targetDate,
      waterLiters: 3.1,
      steps: 10500,
      sleepHours: 8.2,
      energy: 5,
    })
    expect(useFitnessStore.getState().recoveryEntries).toHaveLength(initialRecoveryCount + 1)
    expect(selectedRecoveryPanel).not.toBeNull()
    expect(within(selectedRecoveryPanel!).getByText('8.2 小时睡眠')).toBeInTheDocument()
    expect(within(selectedRecoveryPanel!).getByText('10500')).toBeInTheDocument()
    expect(within(selectedRecoveryPanel!).getByText('3.1 L 喝水')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '编辑 8.2 小时睡眠恢复记录' }))
    await user.clear(screen.getByLabelText('喝水'))
    await user.type(screen.getByLabelText('喝水'), '2.7')
    await user.clear(screen.getByLabelText('步数'))
    await user.type(screen.getByLabelText('步数'), '9800')
    await user.clear(screen.getByLabelText('睡眠'))
    await user.type(screen.getByLabelText('睡眠'), '7.9')
    await user.click(screen.getByRole('radio', { name: '2' }))
    await user.click(screen.getByRole('button', { name: '更新恢复' }))

    expect(
      useFitnessStore.getState().recoveryEntries.find(
        (entry) => entry.id === createdRecoveryEntry?.id,
      ),
    ).toMatchObject({
      dateKey: targetDate,
      waterLiters: 2.7,
      steps: 9800,
      sleepHours: 7.9,
      energy: 2,
    })
    expect(within(selectedRecoveryPanel!).getByText('7.9 小时睡眠')).toBeInTheDocument()
    expect(within(selectedRecoveryPanel!).getByText('9800')).toBeInTheDocument()
    expect(within(selectedRecoveryPanel!).getByText('2.7 L 喝水')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '删除 7.9 小时睡眠恢复记录' }))
    expect(screen.getByText('删除这条恢复记录？')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '确认删除' }))

    expect(
      useFitnessStore.getState().recoveryEntries.some(
        (entry) => entry.sleepHours === 7.9 && entry.dateKey === targetDate,
      ),
    ).toBe(false)
    expect(useFitnessStore.getState().recoveryEntries).toHaveLength(initialRecoveryCount)
  }, 10000)

  it('filters full body history after opening the tucked-away controls', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())
    const olderDate = shiftDateKey(targetDate, -20)

    useFitnessStore.getState().addBodyEntry({
      loggedAt: `${olderDate}T08:00:00.000Z`,
      dateKey: olderDate,
      weight: 70.8,
      bodyFat: 20.4,
      waist: 78,
      chest: 95,
      hips: 94,
    })
    useFitnessStore.getState().addRecoveryEntry({
      loggedAt: `${olderDate}T21:00:00.000Z`,
      dateKey: olderDate,
      waterLiters: 3.1,
      steps: 10500,
      sleepHours: 8.2,
      energy: 5,
    })

    render(<BodyView targetDate={targetDate} />)

    expect(screen.getByText('最近身体记录')).toBeInTheDocument()
    expect(screen.queryByLabelText('搜索身体历史')).not.toBeInTheDocument()

    const historyPanel = screen.getByText('最近身体记录').closest('article')

    expect(historyPanel).not.toBeNull()
    await user.click(within(historyPanel!).getByText('查看全部身体记录'))

    expect(within(historyPanel!).queryByText('70.8 kg')).not.toBeInTheDocument()
    expect(within(historyPanel!).queryByText('8.2 小时睡眠')).not.toBeInTheDocument()

    await user.click(within(historyPanel!).getByRole('button', { name: '近 30 天' }))

    expect(within(historyPanel!).getByText('70.8 kg')).toBeInTheDocument()
    expect(within(historyPanel!).getByText('8.2 小时睡眠')).toBeInTheDocument()

    await user.type(screen.getByLabelText('搜索身体历史'), '10500')
    expect(within(historyPanel!).queryByText('70.8 kg')).not.toBeInTheDocument()
    expect(within(historyPanel!).getByText('8.2 小时睡眠')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('搜索身体历史'))
    await user.click(within(historyPanel!).getByRole('button', { name: '体重' }))

    expect(within(historyPanel!).getByText('70.8 kg')).toBeInTheDocument()
    expect(within(historyPanel!).queryByText('8.2 小时睡眠')).not.toBeInTheDocument()

    await user.click(within(historyPanel!).getByRole('button', { name: '编辑 70.8 kg 身体记录' }))
    expect(screen.getByRole('button', { name: '更新体重' })).toBeInTheDocument()
    expect(screen.getByLabelText('体重')).toHaveValue(70.8)
    expect(screen.getByLabelText('胸围')).toHaveValue(95)

    await user.click(within(historyPanel!).getByRole('button', { name: '恢复' }))
    await user.click(within(historyPanel!).getByRole('button', { name: '编辑 8.2 小时睡眠 恢复记录' }))

    expect(screen.getByRole('button', { name: '更新恢复' })).toBeInTheDocument()
    expect(screen.getByLabelText('步数')).toHaveValue(10500)
    expect(screen.getByLabelText('睡眠')).toHaveValue(8.2)
  })
})
