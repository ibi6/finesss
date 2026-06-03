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
    expect(screen.getByRole('heading', { level: 1, name: '先选一个目标' })).toBeInTheDocument()

    await user.clear(screen.getByLabelText('当前体重'))
    await user.type(screen.getByLabelText('当前体重'), '80')
    await user.clear(screen.getByLabelText('目标体重'))
    await user.type(screen.getByLabelText('目标体重'), '72')
    await user.click(screen.getByRole('button', { name: '开始记录' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '燃刻首次设置' })).not.toBeInTheDocument()
    })

    expect(window.localStorage.getItem('peakfuel:onboardingSeen')).toBe('true')
    expect(useFitnessStore.getState().profile.startWeight).toBe(80)
    expect(useFitnessStore.getState().profile.targetWeight).toBe(72)
    expect(useFitnessStore.getState().mealEntries).toHaveLength(0)
  })

  it('does not offer demo records from onboarding', async () => {
    const { FitnessApp } = await import('../app/FitnessApp')

    render(<FitnessApp />)

    expect(screen.queryByRole('button', { name: '看看示例' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '载入示例' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开始记录' })).toBeInTheDocument()
  })
})
