import { render, screen } from '@testing-library/react'

import { formatLocalDateKey } from '../store/date'

describe('persisted store hydration', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.resetModules()
  })

  it('starts from a clean product snapshot when there is no local data', async () => {
    const { useFitnessStore } = await import('../store/useFitnessStore')
    const state = useFitnessStore.getState()

    expect(state.profile.name).toBe('我')
    expect(state.mealEntries).toHaveLength(0)
    expect(state.workoutSessions).toHaveLength(0)
    expect(state.bodyEntries).toHaveLength(0)
    expect(state.recoveryEntries).toHaveLength(0)
    expect(state.photoEstimateRecords).toHaveLength(0)
    expect(state.foods.length).toBeGreaterThan(0)
    expect(state.foods.length).toBeGreaterThanOrEqual(30)
    expect(state.foods.some((food) => food.name === '全麦面包')).toBe(true)
    expect(state.foods.some((food) => food.name === '可口可乐')).toBe(true)
    expect(state.mealTemplates.length).toBeGreaterThan(0)
    expect(state.workoutTemplates.length).toBeGreaterThan(0)
    expect(state.foods.some((food) => food.isFavorite)).toBe(false)
  })

  it('removes bundled demo records from older persisted app data', async () => {
    const { createSeedSnapshot } = await import('../store/seed')
    const demoSnapshot = createSeedSnapshot()

    window.localStorage.setItem(
      'peakfuel-store',
      JSON.stringify({
        state: demoSnapshot,
        version: 4,
      }),
    )

    const { useFitnessStore } = await import('../store/useFitnessStore')
    const state = useFitnessStore.getState()

    expect(state.profile.name).toBe('我')
    expect(state.mealEntries).toHaveLength(0)
    expect(state.workoutSessions).toHaveLength(0)
    expect(state.bodyEntries).toHaveLength(0)
    expect(state.recoveryEntries).toHaveLength(0)
    expect(state.foods.some((food) => food.id === 'food-chicken-rice')).toBe(true)
    expect(state.mealTemplates.some((template) => template.id === 'meal-template-high-protein-breakfast')).toBe(
      true,
    )
  })

  it('hydrates a legacy persisted snapshot into the today UI after reload', async () => {
    const today = new Date()
    today.setHours(8, 0, 0, 0)
    const todayDateKey = formatLocalDateKey(today)

    window.localStorage.setItem(
      'peakfuel-store',
      JSON.stringify({
        state: {
          foods: [
            {
              id: 'food-custom-wrap',
              name: '自定义卷饼',
              servingLabel: '1 份',
              calories: 430,
              protein: 26,
              carbs: 41,
              fat: 18,
              isFavorite: true,
              lastUsedAt: null,
            },
          ],
          mealEntries: [
            {
              id: 'legacy-meal-entry',
              mealType: 'breakfast',
              foodName: '隔夜燕麦',
              servingLabel: '1 碗',
              calories: 320,
              protein: 22,
              carbs: 38,
              fat: 9,
              loggedAt: today.toISOString(),
              sourceFoodId: null,
            },
          ],
        },
        version: 2,
      }),
    )

    const [{ FitnessApp }, { useFitnessStore }] = await Promise.all([
      import('../app/FitnessApp'),
      import('../store/useFitnessStore'),
    ])

    render(<FitnessApp />)

    expect(screen.getByRole('heading', { level: 2, name: '补午餐' })).toBeInTheDocument()
    expect(screen.getByText('已吃 320 kcal，训练未记')).toBeInTheDocument()
    expect(useFitnessStore.getState().mealEntries[0]).toMatchObject({
      id: 'legacy-meal-entry',
      foodName: '隔夜燕麦',
      dateKey: todayDateKey,
    })
    expect(useFitnessStore.getState().foods.some((food) => food.id === 'food-custom-wrap')).toBe(true)
    expect(useFitnessStore.getState().foods.some((food) => food.id === 'food-chicken-rice')).toBe(true)
  })
})
