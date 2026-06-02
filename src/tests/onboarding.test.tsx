import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('first-run onboarding', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.resetModules()
    mockMatchMedia(false)
  })

  it('shows goal setup on first install and stores a ui-only completion marker', async () => {
    const user = userEvent.setup()
    const [{ FitnessApp }, { useFitnessStore }] = await Promise.all([
      import('../app/FitnessApp'),
      import('../store/useFitnessStore'),
    ])

    render(<FitnessApp />)

    expect(screen.getByRole('dialog', { name: '燃刻首次设置' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: '先把燃刻调成你的节奏' })).toBeInTheDocument()

    await user.clear(screen.getByLabelText('当前体重'))
    await user.type(screen.getByLabelText('当前体重'), '80')
    await user.clear(screen.getByLabelText('目标体重'))
    await user.type(screen.getByLabelText('目标体重'), '72')
    await user.click(screen.getByRole('button', { name: '空白开始' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '燃刻首次设置' })).not.toBeInTheDocument()
    })

    expect(window.localStorage.getItem('peakfuel:onboardingSeen')).toBe('true')
    expect(useFitnessStore.getState().profile.startWeight).toBe(80)
    expect(useFitnessStore.getState().profile.targetWeight).toBe(72)
    expect(useFitnessStore.getState().mealEntries).toHaveLength(0)
  })

  it('can load the demo records from onboarding when requested', async () => {
    const user = userEvent.setup()
    const [{ FitnessApp }, { useFitnessStore }] = await Promise.all([
      import('../app/FitnessApp'),
      import('../store/useFitnessStore'),
    ])

    render(<FitnessApp />)

    await user.click(screen.getByRole('button', { name: '载入示例' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '燃刻首次设置' })).not.toBeInTheDocument()
    })

    expect(window.localStorage.getItem('peakfuel:onboardingSeen')).toBe('true')
    expect(useFitnessStore.getState().mealEntries.length).toBeGreaterThan(0)
    expect(useFitnessStore.getState().workoutSessions.length).toBeGreaterThan(0)
  })
})
