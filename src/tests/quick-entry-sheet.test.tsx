import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { QuickEntrySheet } from '../app/QuickEntrySheet'
import { formatLocalDateKey } from '../store/date'
import { useFitnessStore } from '../store/useFitnessStore'

describe('QuickEntrySheet food lookup', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useFitnessStore.getState().resetToClean()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('manual online lookup can fill a meal and ask whether to save it locally', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [
          {
            product_name: 'Protein Bar',
            serving_size: '1 bar',
            nutriments: {
              'energy-kcal_serving': 210,
              proteins_serving: 20,
              carbohydrates_serving: 23,
              fat_serving: 7,
            },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <QuickEntrySheet
        onClose={() => {}}
        request={{ mode: 'meal' }}
        targetDate={formatLocalDateKey(new Date())}
      />,
    )

    const dialog = screen.getByRole('dialog', { name: '快速记录面板' })
    await user.type(within(dialog).getByLabelText('搜索食物或商品'), 'Protein Bar')

    await user.click(within(dialog).getByRole('button', { name: '联网查一下' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    await user.click(await within(dialog).findByRole('button', { name: '带入 Protein Bar' }))

    expect(within(dialog).getByLabelText('食物名称')).toHaveValue('Protein Bar')
    expect(within(dialog).getByLabelText('热量')).toHaveValue(210)
    expect(within(dialog).getByLabelText('蛋白质')).toHaveValue(20)

    await user.click(within(dialog).getByLabelText('保存为常用'))
    await user.click(within(dialog).getByRole('button', { name: '保存饮食' }))

    const state = useFitnessStore.getState()
    expect(state.foods.some((food) => food.name === 'Protein Bar' && food.isFavorite)).toBe(true)
    expect(state.mealEntries.some((entry) => entry.foodName === 'Protein Bar')).toBe(true)
  })
})
