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

  it('finds common market foods locally without requiring online lookup', async () => {
    const user = userEvent.setup()

    render(
      <QuickEntrySheet
        onClose={() => {}}
        request={{ mode: 'meal' }}
        targetDate={formatLocalDateKey(new Date())}
      />,
    )

    const dialog = screen.getByRole('dialog', { name: '快速记录面板' })
    const searchInput = within(dialog).getByLabelText('搜索食物或商品')

    await user.clear(searchInput)
    await user.type(searchInput, '汉堡')

    await user.click(await within(dialog).findByRole('button', { name: '带入 麦辣鸡腿堡' }))

    expect(within(dialog).getByLabelText('食物名称')).toHaveValue('麦辣鸡腿堡')
    expect(within(dialog).getByLabelText('热量')).toHaveValue(520)
  })

  it('can estimate calories from a quick photo upload and fill the meal form', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:quick-food-photo'),
      revokeObjectURL: vi.fn(),
    })

    render(
      <QuickEntrySheet
        onClose={() => {}}
        request={{ mode: 'meal' }}
        targetDate={formatLocalDateKey(new Date())}
      />,
    )

    const dialog = screen.getByRole('dialog', { name: '快速记录面板' })
    const photoInput = within(dialog).getByLabelText('拍照或上传食物照片')

    await user.upload(photoInput, new File(['fake image'], 'dinner-burger-photo.jpg', { type: 'image/jpeg' }))

    await user.click(await within(dialog).findByRole('button', { name: '按照片带入 麦辣鸡腿堡' }))

    expect(within(dialog).getByLabelText('食物名称')).toHaveValue('麦辣鸡腿堡')
    expect(within(dialog).getByLabelText('热量')).toHaveValue(520)
  })

  it('can ask the server proxy to identify a quick food photo', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:quick-food-photo'),
      revokeObjectURL: vi.fn(),
    })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        provider: 'openai',
        estimate: {
          foodName: 'AI 识别鸡肉卷',
          servingLabel: '1 个',
          calories: 430,
          protein: 26,
          carbs: 44,
          fat: 14,
          sourceFoodId: null,
        },
        confidence: 82,
        note: '按照片识别估算。',
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
    const photoInput = within(dialog).getByLabelText('拍照或上传食物照片')

    await user.upload(photoInput, new File(['fake image'], 'dinner-wrap.jpg', { type: 'image/jpeg' }))
    await user.click(await within(dialog).findByRole('button', { name: 'AI 识别照片' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/ai/food-vision',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })

    expect(within(dialog).getByLabelText('食物名称')).toHaveValue('AI 识别鸡肉卷')
    expect(within(dialog).getByLabelText('热量')).toHaveValue(430)
  })
})
