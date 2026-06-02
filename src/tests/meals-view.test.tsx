import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MealsView } from '../app/routes/MealsView'
import { createDateFromKey, formatDateKeyLabel, formatLocalDateKey } from '../store/date'
import { useFitnessStore } from '../store/useFitnessStore'

describe('MealsView', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useFitnessStore.getState().resetToSeed()
  })

  async function switchToLogWorkspace(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('tab', { name: '切换到记录工作区' }))
  }

  async function switchToPlanWorkspace(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('tab', { name: '切换到计划工作区' }))
  }

  async function switchToLibraryWorkspace(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('tab', { name: '切换到食物库工作区' }))
  }

  it('switches between logging, planning, and library workspaces', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())

    render(<MealsView targetDate={targetDate} />)

    expect(screen.getByRole('tab', { name: '切换到记录工作区' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      screen.getByRole('heading', { level: 2, name: '把今天吃进去的东西迅速记清楚' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: formatDateKeyLabel(targetDate) }),
    ).toBeInTheDocument()

    await switchToPlanWorkspace(user)

    expect(screen.getByRole('tab', { name: '切换到计划工作区' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      screen.getByRole('heading', { level: 3, name: '把模板固定到每周的某一餐' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: '把排好的模板自动汇成采购清单' }),
    ).toBeInTheDocument()

    await switchToLibraryWorkspace(user)

    expect(screen.getByRole('tab', { name: '切换到食物库工作区' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      screen.getByRole('heading', { level: 3, name: '收藏、搜索和沉淀食物' }),
    ).toBeInTheDocument()
  })

  it('creates a custom food and reuses it for the current meal log', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())

    render(<MealsView targetDate={targetDate} />)

    await switchToLibraryWorkspace(user)
    await user.click(screen.getByRole('button', { name: /新增食物/ }))

    await user.type(screen.getByLabelText('食物名称'), '麻辣热卤')

    const servingInput = screen.getByLabelText('份量')
    const calorieInput = screen.getByLabelText('热量')
    const proteinInput = screen.getByLabelText('蛋白质')
    const carbsInput = screen.getByLabelText('碳水')
    const fatInput = screen.getByLabelText('脂肪')

    await user.clear(servingInput)
    await user.type(servingInput, '1 大碗')
    await user.clear(calorieInput)
    await user.type(calorieInput, '510')
    await user.clear(proteinInput)
    await user.type(proteinInput, '26')
    await user.clear(carbsInput)
    await user.type(carbsInput, '42')
    await user.clear(fatInput)
    await user.type(fatInput, '21')
    await user.click(screen.getByRole('button', { name: '保存到食物库' }))

    const createdFood = useFitnessStore.getState().foods.find((food) => food.name === '麻辣热卤')
    expect(createdFood).toBeDefined()
    expect(createdFood?.isFavorite).toBe(true)

    await switchToLogWorkspace(user)
    expect(screen.getByDisplayValue('麻辣热卤')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '保存饮食' }))

    const storedFood = useFitnessStore.getState().foods.find((food) => food.name === '麻辣热卤')
    expect(storedFood?.lastUsedAt).not.toBeNull()
    expect(
      useFitnessStore.getState().mealEntries.some((entry) => entry.foodName === '麻辣热卤'),
    ).toBe(true)
  })

  it('creates a custom template from current-day meal records and reuses it', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())

    render(<MealsView targetDate={targetDate} />)

    await switchToPlanWorkspace(user)
    await user.click(screen.getByRole('button', { name: /从早餐沉淀模板/ }))

    const templateNameInput = screen.getByLabelText('模板名称')
    await user.clear(templateNameInput)
    await user.type(templateNameInput, '我的早餐组合')
    await user.click(screen.getByRole('button', { name: '保存模板' }))

    const createdTemplate = useFitnessStore
      .getState()
      .mealTemplates.find((template) => template.name === '我的早餐组合')

    expect(createdTemplate).toBeDefined()
    expect(createdTemplate?.items.length).toBeGreaterThan(0)
    expect(createdTemplate?.mealType).toBe('breakfast')

    const beforeReuseCount = useFitnessStore.getState().mealEntries.length
    await user.click(screen.getByRole('button', { name: /使用 我的早餐组合/ }))

    const afterReuseCount = useFitnessStore.getState().mealEntries.length
    expect(afterReuseCount).toBe(beforeReuseCount + (createdTemplate?.items.length ?? 0))
  })

  it('edits a custom meal template and saves the updated fields', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())
    const createdTemplate = useFitnessStore.getState().addMealTemplate({
      name: '待编辑早餐模板',
      mealType: 'breakfast',
      origin: 'custom',
      lastUsedAt: null,
      items: [
        {
          id: crypto.randomUUID(),
          foodName: '希腊酸奶碗',
          servingLabel: '1 碗',
          calories: 380,
          protein: 28,
          carbs: 32,
          fat: 12,
        },
      ],
    })

    render(<MealsView targetDate={targetDate} />)

    await switchToPlanWorkspace(user)
    await user.click(screen.getByRole('button', { name: `编辑模板 ${createdTemplate.name}` }))

    const editor = screen.getByRole('button', { name: '更新模板' }).closest('form')
    expect(editor).not.toBeNull()

    const editorScope = within(editor as HTMLFormElement)
    await user.clear(editorScope.getByLabelText('模板名称'))
    await user.type(editorScope.getByLabelText('模板名称'), '编辑后的早餐模板')

    await user.selectOptions(editorScope.getByLabelText('餐次'), 'snack')

    await user.clear(editorScope.getByLabelText('第 1 项食物名称'))
    await user.type(editorScope.getByLabelText('第 1 项食物名称'), '希腊酸奶碗蓝莓版')

    await user.clear(editorScope.getByLabelText('第 1 项热量'))
    await user.type(editorScope.getByLabelText('第 1 项热量'), '410')

    await user.click(editorScope.getByRole('button', { name: '更新模板' }))

    const updatedTemplate = useFitnessStore
      .getState()
      .mealTemplates.find((template) => template.id === createdTemplate.id)

    expect(updatedTemplate).toMatchObject({
      name: '编辑后的早餐模板',
      mealType: 'snack',
    })
    expect(updatedTemplate?.items[0]).toMatchObject({
      foodName: '希腊酸奶碗蓝莓版',
      calories: 410,
    })
  })

  it('assigns a weekly meal plan slot and applies it to the current date', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())
    const weekdayLabel = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][
      createDateFromKey(targetDate).getDay()
    ]

    render(<MealsView targetDate={targetDate} />)

    await switchToPlanWorkspace(user)
    await user.click(screen.getByRole('button', { name: `计划 ${weekdayLabel}` }))
    await user.click(screen.getByRole('button', { name: '计划 早餐' }))
    await user.click(screen.getByRole('button', { name: '排入 高蛋白早餐' }))

    expect(
      useFitnessStore.getState().weeklyMealPlans.some(
        (plan) => plan.weekday === createDateFromKey(targetDate).getDay() && plan.mealType === 'breakfast',
      ),
    ).toBe(true)

    const beforeApplyCount = useFitnessStore
      .getState()
      .mealEntries.filter(
        (entry) =>
          entry.dateKey === targetDate &&
          entry.foodName === '希腊酸奶碗' &&
          entry.mealType === 'breakfast',
      ).length

    await user.click(screen.getByRole('button', { name: '将计划带入当前日期' }))

    const appliedMeals = useFitnessStore
      .getState()
      .mealEntries.filter(
        (entry) =>
          entry.dateKey === targetDate &&
          entry.foodName === '希腊酸奶碗' &&
          entry.mealType === 'breakfast',
      )

    expect(appliedMeals.length).toBeGreaterThan(beforeApplyCount)
  })

  it('clears weekly meal plan slots when deleting a custom meal template', async () => {
    const user = userEvent.setup()
    const targetDate = formatLocalDateKey(new Date())
    const weekday = createDateFromKey(targetDate).getDay()
    const weekdayLabel = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][weekday]
    const customTemplate = useFitnessStore.getState().addMealTemplate({
      name: '周计划早餐模板',
      mealType: 'breakfast',
      origin: 'custom',
      lastUsedAt: null,
      items: [
        {
          id: crypto.randomUUID(),
          foodName: '鸡蛋三明治',
          servingLabel: '1 份',
          calories: 420,
          protein: 24,
          carbs: 35,
          fat: 18,
        },
      ],
    })

    render(<MealsView targetDate={targetDate} />)

    await switchToPlanWorkspace(user)
    await user.click(screen.getByRole('button', { name: `计划 ${weekdayLabel}` }))
    await user.click(screen.getByRole('button', { name: '计划 早餐' }))
    await user.click(screen.getByRole('button', { name: `排入 ${customTemplate.name}` }))

    expect(
      useFitnessStore.getState().weeklyMealPlans.some(
        (plan) => plan.weekday === weekday && plan.mealType === 'breakfast' && plan.templateId === customTemplate.id,
      ),
    ).toBe(true)

    await user.click(screen.getByRole('button', { name: `删除模板 ${customTemplate.name}` }))
    await user.click(screen.getByRole('button', { name: '删除模板' }))

    expect(
      useFitnessStore.getState().mealTemplates.some((template) => template.id === customTemplate.id),
    ).toBe(false)
    expect(
      useFitnessStore.getState().weeklyMealPlans.some((plan) => plan.templateId === customTemplate.id),
    ).toBe(false)
  })
})
