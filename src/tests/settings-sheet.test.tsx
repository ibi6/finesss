import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, vi } from 'vitest'

import { SettingsSheet } from '../app/SettingsSheet'
import { createSeedSnapshot } from '../store/seed'
import { useFitnessStore } from '../store/useFitnessStore'
import { BACKUP_APP_NAME, BACKUP_FORMAT_VERSION } from '../store/backup'

describe('SettingsSheet backup actions', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useFitnessStore.getState().resetToSeed()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exports a versioned backup payload from the current snapshot', async () => {
    const user = userEvent.setup()
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:backup')
    const revokeObjectURL = vi.fn()
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    })

    render(<SettingsSheet onClose={() => {}} open />)

    await user.click(screen.getByRole('button', { name: '导出备份' }))

    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:backup')

    const [[blob]] = createObjectURL.mock.calls
    const payload = JSON.parse(await blob.text())

    expect(payload.app).toBe(BACKUP_APP_NAME)
    expect(payload.version).toBe(BACKUP_FORMAT_VERSION)
    expect(payload.data.profile.name).toBe('Mika')
    expect(screen.getByText('备份已导出到本地文件。')).toBeInTheDocument()
  })

  it('asks for confirmation before importing a backup and only replaces state after confirm', async () => {
    const user = userEvent.setup()
    const snapshot = JSON.parse(JSON.stringify(createSeedSnapshot()))
    snapshot.profile.name = 'Luna'
    snapshot.profile.dailyCalories = 2300
    snapshot.mealEntries = []
    snapshot.workoutSessions = []
    snapshot.bodyEntries = [snapshot.bodyEntries[0]]
    snapshot.recoveryEntries = []

    const file = new File(
      [
        JSON.stringify({
          app: BACKUP_APP_NAME,
          version: BACKUP_FORMAT_VERSION,
          exportedAt: '2026-05-31T04:00:00.000Z',
          data: snapshot,
        }),
      ],
      'ranke-backup.json',
      { type: 'application/json' },
    )

    render(<SettingsSheet onClose={() => {}} open />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    expect(screen.getByText('导入这份备份？')).toBeInTheDocument()
    expect(screen.getByText('Luna')).toBeInTheDocument()
    expect(screen.getByText('2026-05-31')).toBeInTheDocument()
    expect(screen.getByText('0 条饮食记录')).toBeInTheDocument()
    expect(screen.getByText('1 条身体记录')).toBeInTheDocument()
    expect(useFitnessStore.getState().profile.name).toBe('Mika')

    await user.click(screen.getByRole('button', { name: '确认导入' }))

    await waitFor(() => {
      expect(useFitnessStore.getState().profile.name).toBe('Luna')
    })

    expect(useFitnessStore.getState().profile.dailyCalories).toBe(2300)
    expect(useFitnessStore.getState().mealEntries).toHaveLength(0)
    expect(useFitnessStore.getState().bodyEntries).toHaveLength(1)
    expect(screen.getByText('已导入备份：ranke-backup.json')).toBeInTheDocument()
  })

  it('keeps current local data when backup import is canceled', async () => {
    const user = userEvent.setup()
    const snapshot = JSON.parse(JSON.stringify(createSeedSnapshot()))
    snapshot.profile.name = 'Nova'

    const file = new File(
      [
        JSON.stringify({
          app: BACKUP_APP_NAME,
          version: BACKUP_FORMAT_VERSION,
          exportedAt: '2026-05-31T04:00:00.000Z',
          data: snapshot,
        }),
      ],
      'cancel-import.json',
      { type: 'application/json' },
    )

    render(<SettingsSheet onClose={() => {}} open />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    expect(screen.getByText('导入这份备份？')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '先取消' }))

    expect(useFitnessStore.getState().profile.name).toBe('Mika')
    expect(screen.queryByText('导入这份备份？')).not.toBeInTheDocument()
    expect(screen.queryByText('已导入备份：cancel-import.json')).not.toBeInTheDocument()
  })

  it('clears local records into the clean product starter state after confirmation', async () => {
    const user = userEvent.setup()

    render(<SettingsSheet onClose={() => {}} open />)

    await user.click(screen.getByRole('button', { name: '清空记录' }))

    expect(screen.getByText('清空本地记录？')).toBeInTheDocument()
    expect(useFitnessStore.getState().mealEntries).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: '清空' }))

    await waitFor(() => {
      expect(useFitnessStore.getState().profile.name).toBe('我')
    })

    const state = useFitnessStore.getState()

    expect(state.mealEntries).toHaveLength(0)
    expect(state.workoutSessions).toHaveLength(0)
    expect(state.bodyEntries).toHaveLength(0)
    expect(state.recoveryEntries).toHaveLength(0)
    expect(state.photoEstimateRecords).toHaveLength(0)
    expect(state.weeklyMealPlans).toHaveLength(0)
    expect(state.weeklyWorkoutPlans).toHaveLength(0)
    expect(state.foods.some((food) => food.id === 'food-chicken-rice')).toBe(true)
    expect(state.mealTemplates.some((template) => template.id === 'meal-template-high-protein-breakfast')).toBe(
      true,
    )
    expect(screen.getByText('已清空为成品初始状态。')).toBeInTheDocument()
  })
})
