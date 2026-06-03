# Ranke Mobile Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the mobile-facing "燃刻" app into a simple daily execution flow: one homepage task, one-line summary, smart `+ 记录`, and business tabs that default to "today + recent 3 + view all".

**Architecture:** Add one shared focus model that computes the current daily task from existing store data. Keep existing record, template, history, backup, and settings behavior, but move complex panels behind route-local advanced sections opened by "查看全部" or Settings advanced links.

**Tech Stack:** React 19, TypeScript, Zustand, Vite, Vitest, Testing Library, lucide-react, existing CSS in `src/fitness.css`.

---

## File Structure

- Create `src/app/todayFocus.model.ts`: shared pure model for homepage focus, one-line summary, and smart record request metadata.
- Create `src/tests/today-focus.model.test.ts`: fast unit tests for focus priority and summary copy.
- Modify `src/app/FitnessApp.tsx`: remove mobile four-choice record menu as the first step, wire `+ 记录` to the shared focus model, and pass advanced-open tokens to route views.
- Modify `src/app/routes/TodayView.tsx`: replace the crowded homepage with a single focus card and light summary.
- Modify `src/app/routes/MealsView.tsx`: keep current functions, but default-render today's meal cards and recent 3 records; move food library, photo history, templates, weekly meals, and full history into an advanced section.
- Modify `src/app/routes/WorkoutsView.tsx`: default-render today's workout state and recent 3 records; move rhythm, templates, weekly plan, full form, and full history into an advanced section.
- Modify `src/app/routes/BodyView.tsx`: default-render today's body/recovery state and recent 3 body/recovery records; move forms, trend details, and complete history into an advanced section.
- Modify `src/app/routes/InsightsView.tsx`: default-render weekly summary, recent changes, and one focus point; move detailed charts and long reports into an advanced section.
- Modify `src/app/SettingsSheet.tsx`: tighten advanced feature labels and keep links into the advanced route sections.
- Modify `src/fitness.css`: add mobile simplification classes and advanced-section spacing; avoid desktop-only visual assumptions.
- Modify route and app tests under `src/tests/`: replace old workbench-first assertions with frontstage assertions plus "查看全部" advanced assertions.

## Task 1: Shared Today Focus Model

**Files:**
- Create: `src/app/todayFocus.model.ts`
- Create: `src/tests/today-focus.model.test.ts`

- [ ] **Step 1: Write failing model tests**

Create `src/tests/today-focus.model.test.ts` with priority coverage:

```tsx
import { describe, expect, it } from 'vitest'

import { buildTodayFocus } from '../app/todayFocus.model'
import { formatLocalDateKey } from '../store/date'
import type { FitnessStateSnapshot } from '../store/types'
import { useFitnessStore } from '../store/useFitnessStore'

function snapshot(patch: Partial<FitnessStateSnapshot> = {}): FitnessStateSnapshot {
  const base = useFitnessStore.getState()

  return {
    profile: base.profile,
    foods: base.foods,
    mealTemplates: base.mealTemplates,
    weeklyMealPlans: base.weeklyMealPlans,
    weeklyWorkoutPlans: base.weeklyWorkoutPlans,
    weeklyPrepCheckedKeys: base.weeklyPrepCheckedKeys,
    photoEstimateRecords: base.photoEstimateRecords,
    workoutTemplates: base.workoutTemplates,
    mealEntries: base.mealEntries,
    workoutSessions: base.workoutSessions,
    bodyEntries: base.bodyEntries,
    recoveryEntries: base.recoveryEntries,
    ...patch,
  }
}

describe('buildTodayFocus', () => {
  it('prioritizes missing breakfast before body, recovery, and workout', () => {
    const targetDate = formatLocalDateKey(new Date())
    const base = snapshot({
      mealEntries: useFitnessStore.getState().mealEntries.filter(
        (entry) => !(entry.dateKey === targetDate && entry.mealType === 'breakfast'),
      ),
      bodyEntries: [],
      recoveryEntries: [],
      workoutSessions: [],
    })

    expect(buildTodayFocus(base, targetDate)).toMatchObject({
      mode: 'meal',
      mealType: 'breakfast',
      title: '补早餐',
      actionLabel: '去记早餐',
    })
  })

  it('falls through to body, recovery, then workout after three meals exist', () => {
    const targetDate = formatLocalDateKey(new Date())
    const base = snapshot()
    const threeMeals = base.mealEntries.filter((entry) => entry.dateKey === targetDate)

    expect(buildTodayFocus(snapshot({ mealEntries: threeMeals, bodyEntries: [] }), targetDate).mode).toBe('body')
    expect(buildTodayFocus(snapshot({ mealEntries: threeMeals, recoveryEntries: [] }), targetDate).mode).toBe('recovery')
    expect(buildTodayFocus(snapshot({ mealEntries: threeMeals, workoutSessions: [] }), targetDate).mode).toBe('workout')
  })

  it('returns a one-line summary without exposing metric grids', () => {
    const targetDate = formatLocalDateKey(new Date())
    const focus = buildTodayFocus(snapshot(), targetDate)

    expect(focus.summary).toMatch(/已吃 \d+ kcal/)
    expect(focus.summary).toMatch(/训练/)
  })
})
```

- [ ] **Step 2: Run the failing model test**

Run:

```powershell
pnpm vitest run src/tests/today-focus.model.test.ts
```

Expected: fail with a module resolution error for `../app/todayFocus.model`.

- [ ] **Step 3: Implement the shared model**

Create `src/app/todayFocus.model.ts`:

```ts
import { resolveDateKey } from '../store/date'
import { buildDailySummary } from '../store/selectors'
import type { FitnessStateSnapshot, MealType } from '../store/types'

export type TodayFocusMode = 'meal' | 'body' | 'recovery' | 'workout'

export interface TodayFocus {
  mode: TodayFocusMode
  mealType?: MealType
  title: string
  summary: string
  actionLabel: string
}

const primaryMeals: MealType[] = ['breakfast', 'lunch', 'dinner']

const mealCopy: Record<MealType, { title: string; actionLabel: string }> = {
  breakfast: { title: '补早餐', actionLabel: '去记早餐' },
  lunch: { title: '补午餐', actionLabel: '去记午餐' },
  dinner: { title: '补晚餐', actionLabel: '去记晚餐' },
  snack: { title: '补加餐', actionLabel: '去记加餐' },
}

function getLoggedMealTypes(snapshot: FitnessStateSnapshot, targetDate: string) {
  return new Set(
    snapshot.mealEntries
      .filter((entry) => resolveDateKey(entry.dateKey, entry.loggedAt) === targetDate)
      .map((entry) => entry.mealType),
  )
}

function formatTrainingSummary(minutes: number) {
  return minutes > 0 ? `训练 ${minutes} 分钟` : '训练未记'
}

export function buildTodayFocus(snapshot: FitnessStateSnapshot, targetDate: string): TodayFocus {
  const daily = buildDailySummary(snapshot, targetDate)
  const loggedMealTypes = getLoggedMealTypes(snapshot, targetDate)
  const missingMeal = primaryMeals.find((mealType) => !loggedMealTypes.has(mealType))
  const summary = `已吃 ${daily.calories} kcal，${formatTrainingSummary(daily.trainingMinutes)}`

  if (missingMeal) {
    return {
      mode: 'meal',
      mealType: missingMeal,
      summary,
      ...mealCopy[missingMeal],
    }
  }

  if (!daily.hasBodyEntry) {
    return {
      mode: 'body',
      title: '记体重',
      summary,
      actionLabel: '去记体重',
    }
  }

  if (!daily.recoveryLogged) {
    return {
      mode: 'recovery',
      title: '记恢复',
      summary,
      actionLabel: '去记恢复',
    }
  }

  if (daily.trainingMinutes <= 0) {
    return {
      mode: 'workout',
      title: '记训练',
      summary,
      actionLabel: '去记训练',
    }
  }

  return {
    mode: 'meal',
    mealType: 'snack',
    title: '今天已经稳住了',
    summary,
    actionLabel: '再记一笔',
  }
}
```

- [ ] **Step 4: Verify model tests pass**

Run:

```powershell
pnpm vitest run src/tests/today-focus.model.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit task 1**

```powershell
git add -- src/app/todayFocus.model.ts src/tests/today-focus.model.test.ts
git commit -m "feat: add mobile today focus model"
```

## Task 2: Smart Mobile Record Entry In FitnessApp

**Files:**
- Modify: `src/app/FitnessApp.tsx`
- Modify: `src/tests/fitness-app.test.tsx`

- [ ] **Step 1: Update failing app-shell tests for smart `+ 记录`**

In `src/tests/fitness-app.test.tsx`, replace the old mobile record-menu expectation with a smart-record expectation:

```tsx
it('opens the smart record sheet from the mobile record button', async () => {
  const user = userEvent.setup()

  render(<FitnessApp />)

  await user.click(screen.getByRole('button', { name: '打开智能记录' }))

  const dialog = screen.getByRole('dialog', { name: '快速记录面板' })
  expect(within(dialog).getByRole('tab', { name: '饮食' })).toHaveAttribute('aria-selected', 'true')
  expect(within(dialog).getByDisplayValue('早餐')).toBeInTheDocument()
  expect(within(dialog).getByRole('tab', { name: '训练' })).toBeInTheDocument()
  expect(within(dialog).getByRole('tab', { name: '体重' })).toBeInTheDocument()
  expect(within(dialog).getByRole('tab', { name: '恢复' })).toBeInTheDocument()
})
```

Add one fallback-priority test:

```tsx
it('uses body as the smart record default after three meals are logged', async () => {
  const user = userEvent.setup()
  const targetDate = formatLocalDateKey(new Date())

  act(() => {
    const state = useFitnessStore.getState()
    state.replaceSnapshot({
      mealEntries: state.mealEntries.filter((entry) => entry.dateKey === targetDate),
      bodyEntries: [],
    })
  })

  render(<FitnessApp />)

  await user.click(screen.getByRole('button', { name: '打开智能记录' }))

  const dialog = screen.getByRole('dialog', { name: '快速记录面板' })
  expect(within(dialog).getByRole('tab', { name: '体重' })).toHaveAttribute('aria-selected', 'true')
})
```

- [ ] **Step 2: Run the targeted failing tests**

Run:

```powershell
pnpm vitest run src/tests/fitness-app.test.tsx -t "smart record"
```

Expected: fail because the mobile button is still `打开记录菜单` and opens the four-choice menu.

- [ ] **Step 3: Wire FitnessApp to the shared focus model**

In `src/app/FitnessApp.tsx`:

```tsx
import { buildTodayFocus } from './todayFocus.model'
```

Add advanced-open state near the existing state declarations:

```tsx
const [advancedWorkspaceRequest, setAdvancedWorkspaceRequest] = useState<{
  workspace: 'meals' | 'workouts' | 'body' | 'insights'
  token: number
} | null>(null)
```

Compute focus after `daily`:

```tsx
const todayFocus = buildTodayFocus(snapshot, targetDate)
```

Add helpers:

```tsx
function openSmartRecord() {
  handleQuickAction({
    mode: todayFocus.mode,
    mealType: todayFocus.mealType,
  })
}

function getAdvancedToken(workspace: 'meals' | 'workouts' | 'body' | 'insights') {
  return advancedWorkspaceRequest?.workspace === workspace ? advancedWorkspaceRequest.token : 0
}
```

Replace `openAdvancedWorkspace`:

```tsx
function openAdvancedWorkspace(tabId: 'meals' | 'workouts' | 'body' | 'insights') {
  setAdvancedWorkspaceRequest({ workspace: tabId, token: Date.now() })
  jumpToTab(tabId)
}
```

Pass advanced tokens:

```tsx
screen = <MealsView advancedOpenToken={getAdvancedToken('meals')} targetDate={targetDate} />
screen = <WorkoutsView advancedOpenToken={getAdvancedToken('workouts')} targetDate={targetDate} />
screen = <BodyView advancedOpenToken={getAdvancedToken('body')} targetDate={targetDate} />
let screen = <InsightsView advancedOpenToken={getAdvancedToken('insights')} targetDate={targetDate} />
```

Replace the mobile FAB:

```tsx
const mobileRecordMenu = !isDesktopLayout ? (
  <button
    aria-label="打开智能记录"
    className="global-record-fab"
    onClick={openSmartRecord}
    type="button"
  >
    <Plus size={22} />
    <span>记录</span>
  </button>
) : null
```

Remove `recordMenuOpen`, `record-action-sheet-backdrop`, and `record-action-grid` from the mobile path. Keep `quickEntryActions` for the desktop quickbar only.

- [ ] **Step 4: Verify targeted app tests pass**

Run:

```powershell
pnpm vitest run src/tests/fitness-app.test.tsx -t "smart record"
```

Expected: pass.

- [ ] **Step 5: Commit task 2**

```powershell
git add -- src/app/FitnessApp.tsx src/tests/fitness-app.test.tsx
git commit -m "feat: make mobile record button smart"
```

## Task 3: Simplify TodayView To One Daily Task

**Files:**
- Modify: `src/app/routes/TodayView.tsx`
- Modify: `src/tests/fitness-app.test.tsx`

- [ ] **Step 1: Replace crowded-home assertions with one-task assertions**

In `src/tests/fitness-app.test.tsx`, replace assertions for `下一件事别拖`, `阶段动力`, `阶段成就`, `明日计划`, and `今日建议` as homepage-default content with:

```tsx
it('shows one mobile homepage task and one summary line', async () => {
  const user = userEvent.setup()

  render(<FitnessApp />)

  await user.click(screen.getByRole('tab', { name: '今日' }))

  expect(screen.getByRole('heading', { level: 2, name: '补早餐' })).toBeInTheDocument()
  expect(screen.getByText(/已吃 \d+ kcal，训练/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '去记早餐' })).toBeInTheDocument()
  expect(screen.queryByText('阶段动力')).not.toBeInTheDocument()
  expect(screen.queryByText('阶段成就')).not.toBeInTheDocument()
  expect(screen.queryByText('今日建议')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the failing today test**

Run:

```powershell
pnpm vitest run src/tests/fitness-app.test.tsx -t "one mobile homepage task"
```

Expected: fail because TodayView still renders the full dashboard.

- [ ] **Step 3: Replace TodayView rendering with focus-only layout**

In `src/app/routes/TodayView.tsx`, keep only imports needed by the simplified view:

```tsx
import { Dumbbell, Scale, Sparkles, UtensilsCrossed } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import { buildTodayFocus } from '../todayFocus.model'
import type { QuickEntryRequest } from '../QuickEntrySheet'
import { formatDateKeyLabel, isTodayDateKey } from '../../store/date'
import { useFitnessStore } from '../../store/useFitnessStore'
```

Use a small icon map:

```tsx
const focusIcons = {
  meal: UtensilsCrossed,
  workout: Dumbbell,
  body: Scale,
  recovery: Sparkles,
} as const
```

Replace the component body with:

```tsx
export function TodayView({ onQuickAction, targetDate }: TodayViewProps) {
  const snapshot = useFitnessStore(
    useShallow((state) => ({
      profile: state.profile,
      foods: state.foods,
      mealTemplates: state.mealTemplates,
      weeklyMealPlans: state.weeklyMealPlans,
      weeklyWorkoutPlans: state.weeklyWorkoutPlans,
      weeklyPrepCheckedKeys: state.weeklyPrepCheckedKeys,
      photoEstimateRecords: state.photoEstimateRecords,
      workoutTemplates: state.workoutTemplates,
      mealEntries: state.mealEntries,
      workoutSessions: state.workoutSessions,
      bodyEntries: state.bodyEntries,
      recoveryEntries: state.recoveryEntries,
    })),
  )
  const focus = buildTodayFocus(snapshot, targetDate)
  const FocusIcon = focusIcons[focus.mode]
  const dateLabel = isTodayDateKey(targetDate) ? '今天' : formatDateKeyLabel(targetDate)

  function openFocusRecord() {
    onQuickAction?.({
      mode: focus.mode,
      mealType: focus.mealType,
    })
  }

  return (
    <section className="today-simple-layout">
      <article className="today-focus-card">
        <p className="section-kicker">{dateLabel}</p>
        <div className="today-focus-icon" aria-hidden="true">
          <FocusIcon size={24} />
        </div>
        <div className="today-focus-copy">
          <span>你现在最该做</span>
          <h2>{focus.title}</h2>
          <p>{focus.summary}</p>
        </div>
        <button className="primary-button today-focus-action" onClick={openFocusRecord} type="button">
          {focus.actionLabel}
        </button>
      </article>
    </section>
  )
}
```

Keep the existing `TodayViewProps` fields for compatibility, even if `onApplyMealTemplate`, `onApplyWorkoutTemplate`, and `onOpenInsights` are unused after simplification.

- [ ] **Step 4: Verify TodayView target tests pass**

Run:

```powershell
pnpm vitest run src/tests/fitness-app.test.tsx -t "one mobile homepage task"
```

Expected: pass.

- [ ] **Step 5: Commit task 3**

```powershell
git add -- src/app/routes/TodayView.tsx src/tests/fitness-app.test.tsx
git commit -m "feat: simplify mobile today view"
```

## Task 4: Meals Frontstage With Advanced Section

**Files:**
- Modify: `src/app/routes/MealsView.tsx`
- Modify: `src/tests/meals-view.test.tsx`

- [ ] **Step 1: Update MealsView tests for default frontstage**

In `src/tests/meals-view.test.tsx`, keep the current save/template/plan tests, but click the advanced button before assertions that need the hidden food, template, photo, or planning panels:

```tsx
async function openMealAdvanced(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '查看全部饮食记录' }))
}
```

Add the default simplification test:

```tsx
it('defaults to today meals, recent three, and keeps the food library hidden', () => {
  render(<MealsView targetDate={formatLocalDateKey(new Date())} />)

  expect(screen.getByRole('heading', { level: 2, name: '今天吃了什么' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 3, name: '早餐' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 3, name: '午餐' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 3, name: '晚餐' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 3, name: '加餐' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '查看全部饮食记录' })).toBeInTheDocument()
  expect(screen.queryByText('常用食物')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the failing MealsView tests**

Run:

```powershell
pnpm vitest run src/tests/meals-view.test.tsx
```

Expected: fail until the frontstage and advanced toggle are added.

- [ ] **Step 3: Add advanced prop and state**

Change props:

```tsx
interface MealsViewProps {
  targetDate: string
  advancedOpenToken?: number
}

export function MealsView({ advancedOpenToken = 0, targetDate }: MealsViewProps) {
```

Add state and effect:

```tsx
const [showAdvancedTools, setShowAdvancedTools] = useState(false)

useEffect(() => {
  if (advancedOpenToken > 0) {
    setShowAdvancedTools(true)
  }
}, [advancedOpenToken])
```

Add recent records:

```tsx
const recentMealEntries = useMemo(
  () =>
    [...mealEntries]
      .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))
      .slice(0, 3),
  [mealEntries],
)
```

- [ ] **Step 4: Add frontstage meal cards before the advanced content**

At the start of the return, render:

```tsx
<article className="feature-panel feature-panel--wide frontstage-panel">
  <div className="panel-head">
    <div>
      <p className="section-kicker">饮食</p>
      <h2>今天吃了什么</h2>
    </div>
    <span className="pill">{formatDateKeyLabel(targetDate)}</span>
  </div>

  <div className="frontstage-meal-grid" aria-label="今日餐次" role="list">
    {mealTypeOrder.map((mealType) => {
      const bucket = selectedDayMealBucketsByType.get(mealType) ?? null
      return (
        <article className="frontstage-meal-card" key={mealType} role="listitem">
          <div>
            <p className="section-kicker">{bucket ? `${bucket.entries.length} 项` : '未记录'}</p>
            <h3>{mealTypeLabels[mealType]}</h3>
          </div>
          <strong>{bucket ? `${bucket.calories} kcal` : '--'}</strong>
          <p>{bucket ? bucket.entries.map((entry) => entry.foodName).join(' · ') : '点底部记录补上这一餐'}</p>
          <small>{bucket ? `${bucket.protein} g 蛋白质` : '食物库会在录入时自动辅助'}</small>
        </article>
      )
    })}
  </div>
</article>

<article className="feature-panel frontstage-panel">
  <div className="panel-head">
    <div>
      <p className="section-kicker">最近</p>
      <h3>最近饮食记录</h3>
    </div>
    <button className="secondary-button" onClick={() => setShowAdvancedTools((current) => !current)} type="button">
      {showAdvancedTools ? '收起全部' : '查看全部饮食记录'}
    </button>
  </div>
  <div className="stack-list">
    {recentMealEntries.map((entry) => (
      <div className="list-item list-item--dense" key={entry.id}>
        <div>
          <strong>{entry.foodName}</strong>
          <p>{mealTypeLabels[entry.mealType]} · {entry.servingLabel}</p>
        </div>
        <div className="numeric-meta">
          <strong>{entry.calories} kcal</strong>
          <span>{entry.protein} g 蛋白</span>
        </div>
      </div>
    ))}
    {recentMealEntries.length === 0 ? <div className="empty-note">还没有饮食记录，先记下一餐。</div> : null}
  </div>
</article>
```

Wrap the current detailed meal workspace content in `showAdvancedTools`. The wrapper opens immediately before the current `<MealWorkspaceTabs activeWorkspace={mealWorkspace} onSwitch={switchMealWorkspace} />` line, and closes immediately after the current plan/workspace panel block but before both `ConfirmSheet` components:

```tsx
{showAdvancedTools ? (
  <div className="advanced-workspace-panel" aria-label="饮食高级功能">
    <MealWorkspaceTabs activeWorkspace={mealWorkspace} onSwitch={switchMealWorkspace} />
    {isLogWorkspace ? logWorkspaceContent : null}
    {isPlanWorkspace ? planWorkspaceContent : null}
  </div>
) : null}
```

If the current JSX is not already split into `logWorkspaceContent` and `planWorkspaceContent`, introduce those two local constants immediately before `return`. Move the current `isLogWorkspace ? (...) : null` body into `logWorkspaceContent`, and the current `isPlanWorkspace ? (...) : null` body into `planWorkspaceContent` without changing the inner handlers.

- [ ] **Step 5: Verify MealsView tests pass**

Run:

```powershell
pnpm vitest run src/tests/meals-view.test.tsx
```

Expected: pass after updating tests to open advanced before old workbench interactions.

- [ ] **Step 6: Commit task 4**

```powershell
git add -- src/app/routes/MealsView.tsx src/tests/meals-view.test.tsx
git commit -m "feat: simplify mobile meals view"
```

## Task 5: Workouts And Body Frontstage

**Files:**
- Modify: `src/app/routes/WorkoutsView.tsx`
- Modify: `src/app/routes/BodyView.tsx`
- Modify: `src/tests/workouts-view.test.tsx`
- Modify: `src/tests/body-view.test.tsx`

- [ ] **Step 1: Update WorkoutsView tests**

Add helper:

```tsx
async function openWorkoutAdvanced(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '查看全部训练记录' }))
}
```

Add default test:

```tsx
it('defaults to today workout state and recent three sessions', () => {
  render(<WorkoutsView targetDate={formatLocalDateKey(new Date())} />)

  expect(screen.getByRole('heading', { level: 2, name: '今天有没有练' })).toBeInTheDocument()
  expect(screen.getByText(/今日训练/)).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 3, name: '最近训练' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '查看全部训练记录' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { level: 3, name: '本周训练安排' })).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Update BodyView tests**

Add helper:

```tsx
async function openBodyAdvanced(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '查看全部身体记录' }))
}
```

Add default test:

```tsx
it('defaults to today body status and recent three records', () => {
  render(<BodyView targetDate={formatLocalDateKey(new Date())} />)

  expect(screen.getByRole('heading', { level: 2, name: '今天身体状态' })).toBeInTheDocument()
  expect(screen.getByText('体重')).toBeInTheDocument()
  expect(screen.getByText('恢复')).toBeInTheDocument()
  expect(screen.getByText('睡眠')).toBeInTheDocument()
  expect(screen.getByText('步数')).toBeInTheDocument()
  expect(screen.getByText('喝水')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '查看全部身体记录' })).toBeInTheDocument()
  expect(screen.queryByLabelText('搜索身体历史')).not.toBeInTheDocument()
})
```

- [ ] **Step 3: Run failing route tests**

Run:

```powershell
pnpm vitest run src/tests/workouts-view.test.tsx src/tests/body-view.test.tsx
```

Expected: fail until the default frontstage and advanced sections are implemented.

- [ ] **Step 4: Add WorkoutsView advanced prop and frontstage**

Change props:

```tsx
interface WorkoutsViewProps {
  targetDate: string
  advancedOpenToken?: number
}

export function WorkoutsView({ advancedOpenToken = 0, targetDate }: WorkoutsViewProps) {
```

Add state/effect:

```tsx
const [showAdvancedTools, setShowAdvancedTools] = useState(false)

useEffect(() => {
  if (advancedOpenToken > 0) {
    setShowAdvancedTools(true)
  }
}, [advancedOpenToken])
```

Add recent sessions:

```tsx
const recentWorkoutSessions = useMemo(
  () => [...workoutSessions].sort((left, right) => right.startedAt.localeCompare(left.startedAt)).slice(0, 3),
  [workoutSessions],
)
```

Render frontstage before the detailed workout sections:

```tsx
<article className="feature-panel feature-panel--wide frontstage-panel">
  <div className="panel-head">
    <div>
      <p className="section-kicker">训练</p>
      <h2>今天有没有练</h2>
    </div>
    <span className="pill">{formatDateKeyLabel(targetDate)}</span>
  </div>
  <div className="meal-summary-grid">
    <article className="meal-summary-card">
      <span>今日训练</span>
      <strong>{selectedSessions.length > 0 ? `${selectedSessions.length} 次` : '未记录'}</strong>
      <small>{selectedSessions.length > 0 ? `${selectedSummary.totalMinutes} 分钟` : '点底部记录补上训练'}</small>
    </article>
    <article className="meal-summary-card">
      <span>消耗</span>
      <strong>{selectedSummary.totalCalories} kcal</strong>
      <small>{selectedSummary.exerciseCount} 个动作</small>
    </article>
  </div>
</article>

<article className="feature-panel frontstage-panel">
  <div className="panel-head">
    <div>
      <p className="section-kicker">最近</p>
      <h3>最近训练</h3>
    </div>
    <button className="secondary-button" onClick={() => setShowAdvancedTools((current) => !current)} type="button">
      {showAdvancedTools ? '收起全部' : '查看全部训练记录'}
    </button>
  </div>
  <div className="stack-list">
    {recentWorkoutSessions.map((session) => (
      <div className="list-item list-item--dense" key={session.id}>
        <div>
          <strong>{session.title}</strong>
          <p>{session.kind === 'strength' ? '力量' : '有氧'} · {session.durationMinutes} 分钟</p>
        </div>
        <div className="numeric-meta">
          <strong>{session.estimatedCalories} kcal</strong>
          <span>{session.exercises.length} 个动作</span>
        </div>
      </div>
    ))}
    {recentWorkoutSessions.length === 0 ? <div className="empty-note">还没有训练记录，先记一次训练。</div> : null}
  </div>
</article>
```

Wrap the current rhythm, templates, weekly plan, form, today list, and history sections in `showAdvancedTools`. Introduce a `const workoutAdvancedContent = (...)` immediately before `return`, and move those current sections into it without changing handlers:

```tsx
{showAdvancedTools ? (
  <div className="advanced-workspace-panel" aria-label="训练高级功能">
    {workoutAdvancedContent}
  </div>
) : null}
```

- [ ] **Step 5: Add BodyView advanced prop and frontstage**

Change props:

```tsx
interface BodyViewProps {
  targetDate: string
  advancedOpenToken?: number
}

export function BodyView({ advancedOpenToken = 0, targetDate }: BodyViewProps) {
```

Add state/effect:

```tsx
const [showAdvancedTools, setShowAdvancedTools] = useState(false)

useEffect(() => {
  if (advancedOpenToken > 0) {
    setShowAdvancedTools(true)
  }
}, [advancedOpenToken])
```

Add recent combined records:

```tsx
const recentBodyRecords = useMemo(
  () =>
    [
      ...bodyEntries.map((entry) => ({
        id: `body-${entry.id}`,
        title: `${entry.weight.toFixed(1)} kg`,
        detail: buildBodyMeasurementItems(entry).join(' · ') || '体重记录',
        dateKey: resolveDateKey(entry.dateKey, entry.loggedAt),
        loggedAt: entry.loggedAt,
        kind: '体重',
      })),
      ...recoveryEntries.map((entry) => ({
        id: `recovery-${entry.id}`,
        title: `${entry.sleepHours} 小时睡眠`,
        detail: `${entry.steps} 步 · ${entry.waterLiters} L`,
        dateKey: resolveDateKey(entry.dateKey, entry.loggedAt),
        loggedAt: entry.loggedAt,
        kind: '恢复',
      })),
    ]
      .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))
      .slice(0, 3),
  [bodyEntries, recoveryEntries],
)
```

Render frontstage:

```tsx
<article className="feature-panel feature-panel--wide frontstage-panel">
  <div className="panel-head">
    <div>
      <p className="section-kicker">身体</p>
      <h2>今天身体状态</h2>
    </div>
    <span className="pill">{formatDateKeyLabel(targetDate)}</span>
  </div>
  <div className="meal-summary-grid">
    <article className="meal-summary-card"><span>体重</span><strong>{selectedBodyEntries[0] ? `${selectedBodyEntries[0].weight.toFixed(1)} kg` : '--'}</strong><small>{selectedBodyEntries[0] ? '今日已记录' : '未记录'}</small></article>
    <article className="meal-summary-card"><span>恢复</span><strong>{selectedRecoveryLatest ? `${selectedRecoveryLatest.energy} / 5` : '--'}</strong><small>{selectedRecoveryLatest ? '今日已记录' : '未记录'}</small></article>
    <article className="meal-summary-card"><span>睡眠</span><strong>{selectedRecoveryLatest ? `${selectedRecoveryLatest.sleepHours} h` : '--'}</strong><small>今晚别太晚</small></article>
    <article className="meal-summary-card"><span>步数</span><strong>{selectedRecoveryLatest ? selectedRecoveryLatest.steps : '--'}</strong><small>恢复记录里同步</small></article>
    <article className="meal-summary-card"><span>喝水</span><strong>{selectedRecoveryLatest ? `${selectedRecoveryLatest.waterLiters} L` : '--'}</strong><small>恢复记录里同步</small></article>
  </div>
</article>
```

Add the recent panel with a `查看全部身体记录` button. Then introduce `const bodyAdvancedContent = (...)` immediately before `return`, move the current trend cards, body form, recovery form, selected-day body/recovery lists, and complete history panel into it, and render:

```tsx
{showAdvancedTools ? (
  <div className="advanced-workspace-panel" aria-label="身体高级功能">
    {bodyAdvancedContent}
  </div>
) : null}
```

- [ ] **Step 6: Verify WorkoutsView and BodyView tests pass**

Run:

```powershell
pnpm vitest run src/tests/workouts-view.test.tsx src/tests/body-view.test.tsx
```

Expected: pass after tests open advanced before old form/template/history interactions.

- [ ] **Step 7: Commit task 5**

```powershell
git add -- src/app/routes/WorkoutsView.tsx src/app/routes/BodyView.tsx src/tests/workouts-view.test.tsx src/tests/body-view.test.tsx
git commit -m "feat: simplify workout and body mobile views"
```

## Task 6: Insights Summary And Settings Advanced Links

**Files:**
- Modify: `src/app/routes/InsightsView.tsx`
- Modify: `src/app/SettingsSheet.tsx`
- Modify: `src/tests/insights-view.test.tsx`
- Modify: `src/tests/settings-sheet.test.tsx`

- [ ] **Step 1: Update InsightsView tests**

Add:

```tsx
it('defaults to a weekly summary instead of a detailed report board', () => {
  render(<InsightsView targetDate={formatLocalDateKey(new Date())} />)

  expect(screen.getByRole('heading', { level: 2, name: '这周整体怎么样' })).toBeInTheDocument()
  expect(screen.getByText('最近变化')).toBeInTheDocument()
  expect(screen.getByText('建议关注')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '查看全部趋势' })).toBeInTheDocument()
  expect(screen.queryByRole('list', { name: '28天打卡热力格' })).not.toBeInTheDocument()
})
```

Update the current detailed chart tests so they click `查看全部趋势` before asserting the 28-day heatmap, metric bars, body sparkline, rhythm list, weekly report copy action, or plan-adherence details.

- [ ] **Step 2: Update SettingsSheet tests**

Add:

```tsx
it('shows simplified advanced feature entries', async () => {
  render(<SettingsSheet open onClose={vi.fn()} onOpenAdvancedWorkspace={vi.fn()} />)

  expect(screen.getByText('高级功能')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /食物库和常用食物/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /训练模板和本周安排/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /完整历史记录/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /详细趋势和周报/ })).toBeInTheDocument()
})
```

- [ ] **Step 3: Run failing tests**

Run:

```powershell
pnpm vitest run src/tests/insights-view.test.tsx src/tests/settings-sheet.test.tsx
```

Expected: fail until InsightsView advanced hiding and Settings labels are changed.

- [ ] **Step 4: Add InsightsView advanced prop and frontstage summary**

Change props:

```tsx
interface InsightsViewProps {
  targetDate: string
  advancedOpenToken?: number
}

export function InsightsView({ advancedOpenToken = 0, targetDate }: InsightsViewProps) {
```

Add state/effect:

```tsx
const [showAdvancedTools, setShowAdvancedTools] = useState(false)

useEffect(() => {
  if (advancedOpenToken > 0) {
    setShowAdvancedTools(true)
  }
}, [advancedOpenToken])
```

Render this before detailed sections:

```tsx
<article className="feature-panel feature-panel--wide frontstage-panel weekly-frontstage-panel">
  <div className="panel-head">
    <div>
      <p className="section-kicker">周报总结</p>
      <h2>这周整体怎么样</h2>
      <p className="muted-copy muted-copy--compact">{weeklyReview.topReminder?.detail ?? '这周先稳住记录，再看趋势。'}</p>
    </div>
    <span className="pill pill--muted">近 7 天</span>
  </div>
  <div className="meal-summary-grid">
    <article className="meal-summary-card">
      <span>完成度</span>
      <strong>{sevenDaySummary.averageConsistency}%</strong>
      <small>平均执行分</small>
    </article>
    <article className="meal-summary-card">
      <span>最近变化</span>
      <strong>{trend.delta.toFixed(1)} kg</strong>
      <small>{trendDirectionCopy}</small>
    </article>
    <article className="meal-summary-card">
      <span>建议关注</span>
      <strong>{weakestMetric?.label ?? '记录'}</strong>
      <small>{weeklyReview.topReminder?.targetLabel ?? '先补完整记录'}</small>
    </article>
  </div>
  <div className="form-actions">
    <button className="secondary-button" onClick={() => setShowAdvancedTools((current) => !current)} type="button">
      {showAdvancedTools ? '收起全部' : '查看全部趋势'}
    </button>
  </div>
</article>
```

Introduce `const insightsAdvancedContent = (...)` immediately before `return`, move the current phase progress, weekly review, weekly report, plan adherence, 7-day, 28-day, heatmap, metric, sparkline, and rhythm sections into it, and render it only when `showAdvancedTools` is true:

```tsx
{showAdvancedTools ? (
  <div className="advanced-workspace-panel" aria-label="趋势高级功能">
    {insightsAdvancedContent}
  </div>
) : null}
```

- [ ] **Step 5: Update SettingsSheet advanced labels**

Change advanced buttons:

```tsx
<button className="secondary-button" onClick={() => openAdvancedWorkspace('meals')} type="button">
  <Database size={16} />
  <span>食物库和常用食物</span>
</button>
<button className="secondary-button" onClick={() => openAdvancedWorkspace('workouts')} type="button">
  <CalendarClock size={16} />
  <span>训练模板和本周安排</span>
</button>
<button className="secondary-button" onClick={() => openAdvancedWorkspace('body')} type="button">
  <Gauge size={16} />
  <span>完整历史记录</span>
</button>
<button className="secondary-button" onClick={() => openAdvancedWorkspace('insights')} type="button">
  <Target size={16} />
  <span>详细趋势和周报</span>
</button>
```

- [ ] **Step 6: Verify Insights and Settings tests pass**

Run:

```powershell
pnpm vitest run src/tests/insights-view.test.tsx src/tests/settings-sheet.test.tsx
```

Expected: pass.

- [ ] **Step 7: Commit task 6**

```powershell
git add -- src/app/routes/InsightsView.tsx src/app/SettingsSheet.tsx src/tests/insights-view.test.tsx src/tests/settings-sheet.test.tsx
git commit -m "feat: simplify insights and advanced settings"
```

## Task 7: Mobile CSS And Visual Verification

**Files:**
- Modify: `src/fitness.css`
- Modify: `src/tests/fitness-app.test.tsx`

- [ ] **Step 1: Add CSS assertions where stable**

In `src/tests/fitness-app.test.tsx`, assert the new classes:

```tsx
expect(document.querySelector('.today-focus-card')).toBeInTheDocument()
expect(document.querySelector('.frontstage-panel')).toBeInTheDocument()
expect(screen.queryByRole('dialog', { name: '选择记录类型' })).not.toBeInTheDocument()
```

- [ ] **Step 2: Add mobile CSS classes**

Append focused styles in `src/fitness.css` near related mobile shell and panel rules:

```css
.today-simple-layout {
  display: grid;
  gap: 14px;
}

.today-focus-card {
  display: grid;
  gap: 14px;
  padding: 20px;
  border: 1px solid rgba(32, 37, 48, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 50px rgba(32, 37, 48, 0.08);
}

.today-focus-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 16px;
  color: #ffffff;
  background: #ff6b2d;
}

.today-focus-copy {
  display: grid;
  gap: 6px;
}

.today-focus-copy h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.1;
}

.today-focus-copy p,
.today-focus-copy span {
  margin: 0;
  color: var(--muted-text);
}

.today-focus-action {
  min-height: 48px;
}

.frontstage-panel {
  display: grid;
  gap: 14px;
}

.frontstage-meal-grid {
  display: grid;
  gap: 10px;
}

.frontstage-meal-card {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid rgba(32, 37, 48, 0.08);
  border-radius: 14px;
  background: #ffffff;
}

.frontstage-meal-card h3,
.frontstage-meal-card p,
.frontstage-meal-card small {
  margin: 0;
}

.advanced-workspace-panel {
  display: grid;
  gap: 16px;
}

@media (max-width: 767px) {
  .today-focus-copy h2 {
    font-size: 26px;
  }

  .frontstage-meal-grid,
  .meal-summary-grid {
    grid-template-columns: 1fr;
  }
}
```

If existing CSS variables differ, use existing color variables rather than adding a new palette.

- [ ] **Step 3: Run unit tests after CSS/test update**

Run:

```powershell
pnpm vitest run src/tests/fitness-app.test.tsx
```

Expected: pass.

- [ ] **Step 4: Start dev server and inspect mobile viewports**

Run:

```powershell
pnpm dev -- --host 127.0.0.1
```

Open the local app in Browser at the printed URL. Check:

- `320x740`: topbar not clipped, homepage only one focus card, bottom FAB visible.
- `390x844`: `+ 记录` opens the quick entry sheet directly.
- `430x932`: each tab first screen shows frontstage content before advanced sections.

- [ ] **Step 5: Commit task 7**

```powershell
git add -- src/fitness.css src/tests/fitness-app.test.tsx
git commit -m "style: polish simplified mobile shell"
```

## Task 8: Full Verification, APK, And Push

**Files:**
- Modify only if verification finds issues.

- [ ] **Step 1: Run full lint**

Run:

```powershell
pnpm lint
```

Expected: exit code 0.

- [ ] **Step 2: Run full tests**

Run:

```powershell
pnpm test
```

Expected: all Vitest files pass.

- [ ] **Step 3: Run production build**

Run:

```powershell
pnpm build
```

Expected: TypeScript build and Vite build pass.

- [ ] **Step 4: Build debug APK**

Run:

```powershell
pnpm run android:build:debug
```

Expected: debug APK exists at:

```text
C:\Users\33185\Documents\New project 4\android\app\build\outputs\apk\debug\app-debug.apk
```

- [ ] **Step 5: Inspect final changed files before push**

Run:

```powershell
git status --short
git log --oneline --decorate -5
```

Expected: only intentional tracked changes are committed. Existing untracked historical `tasks/` and old `docs/superpowers/` files may still appear and must not be staged.

- [ ] **Step 6: Push current branch**

Run:

```powershell
git push origin codex/peakfuel:main
```

Expected: GitHub `main` receives the latest simplification commits.

## Self-Review Notes

- Spec coverage: homepage one-task flow is covered by Tasks 1-3; smart `+ 记录` by Task 2; Meals/Workouts/Body by Tasks 4-5; Insights and Settings advanced entries by Task 6; mobile styling and visual checks by Task 7; build/APK/push by Task 8.
- Data compatibility: no task modifies store types, persistence keys, backup schema, backend routes, or Android package name.
- Scope: this is one coherent mobile simplification project. The online food lookup remains in `QuickEntrySheet` and is not changed.
- Known test churn: older tests that assert dense TodayView panels should be removed or rewritten because the design explicitly removes those panels from the homepage default.
