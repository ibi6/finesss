import {
  ChartColumnIncreasing,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Plus,
  Scale,
  Settings2,
  Sparkles,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { QuickEntrySheet, type QuickEntryMode, type QuickEntryRequest } from './QuickEntrySheet'
import { OnboardingScreen } from './OnboardingScreen'
import { SettingsSheet } from './SettingsSheet'
import { BodyView } from './routes/BodyView'
import { InsightsView } from './routes/InsightsView'
import { MealsView } from './routes/MealsView'
import { TodayView } from './routes/TodayView'
import { WorkoutsView } from './routes/WorkoutsView'
import { formatDateKeyLabel, formatLocalDateKey, formatShortDateKey, isTodayDateKey, shiftDateKey } from '../store/date'
import { buildDailySummary } from '../store/selectors'
import { useFitnessStore } from '../store/useFitnessStore'

type TabId = 'today' | 'meals' | 'workouts' | 'body' | 'insights'
const ONBOARDING_STORAGE_KEY = 'peakfuel:onboardingSeen'
const STORE_STORAGE_KEY = 'peakfuel-store'

const quickEntryActions: Array<{
  mode: QuickEntryMode
  label: string
  ariaLabel: string
  icon: typeof Flame
}> = [
  {
    mode: 'meal',
    label: '记饮食',
    ariaLabel: '全局记饮食',
    icon: UtensilsCrossed,
  },
  {
    mode: 'workout',
    label: '记训练',
    ariaLabel: '全局记训练',
    icon: Dumbbell,
  },
  {
    mode: 'body',
    label: '记体重',
    ariaLabel: '全局记体重',
    icon: Scale,
  },
  {
    mode: 'recovery',
    label: '记恢复',
    ariaLabel: '全局记恢复',
    icon: Sparkles,
  },
]

const tabs: Array<{
  id: TabId
  label: string
  icon: typeof Flame
  desktopHint: string
  desktopTitle: string
}> = [
  {
    id: 'today',
    label: '今日',
    icon: Flame,
    desktopHint: '今天先补哪几步',
    desktopTitle: '今日总览',
  },
  {
    id: 'meals',
    label: '饮食',
    icon: UtensilsCrossed,
    desktopHint: '吃进去的东西和计划',
    desktopTitle: '饮食记录',
  },
  {
    id: 'workouts',
    label: '训练',
    icon: Dumbbell,
    desktopHint: '训练模板与当日记录',
    desktopTitle: '训练记录',
  },
  {
    id: 'body',
    label: '身体',
    icon: Scale,
    desktopHint: '体重和恢复都放这里',
    desktopTitle: '身体记录',
  },
  {
    id: 'insights',
    label: '趋势',
    icon: ChartColumnIncreasing,
    desktopHint: '阶段进度和复盘图表',
    desktopTitle: '趋势复盘',
  },
]

function getIsDesktopLayout() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(min-width: 1024px)').matches
    : false
}

function getDateOptions(targetDate: string) {
  const todayKey = formatLocalDateKey(new Date())
  const days = Array.from({ length: 5 }, (_, index) => shiftDateKey(targetDate, index - 2))
  const filtered = days.filter((date) => date <= todayKey)

  if (filtered.length > 0) {
    return filtered
  }

  return [targetDate]
}

function hasCompletedOnboarding() {
  if (typeof window === 'undefined') {
    return true
  }

  return (
    window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true' ||
    window.localStorage.getItem(STORE_STORAGE_KEY) != null
  )
}

function markOnboardingComplete() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
  }
}

export function FitnessApp() {
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const [targetDate, setTargetDate] = useState(() => formatLocalDateKey(new Date()))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [quickEntryRequest, setQuickEntryRequest] = useState<QuickEntryRequest | null>(null)
  const [recordMenuOpen, setRecordMenuOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(() => !hasCompletedOnboarding())
  const [isDesktopLayout, setIsDesktopLayout] = useState(getIsDesktopLayout)
  const [mobileViewportTick, setMobileViewportTick] = useState(0)
  const activeDateChipRef = useRef<HTMLButtonElement | null>(null)
  const snapshot = useFitnessStore()

  const todayKey = formatLocalDateKey(new Date())
  const dateOptions = useMemo(() => getDateOptions(targetDate), [targetDate])
  const daily = buildDailySummary(snapshot, targetDate)
  const caloriesLeft = Math.max(snapshot.profile.dailyCalories - daily.calories, 0)
  const proteinLeft = Math.max(snapshot.profile.dailyProtein - daily.protein, 0)
  const viewingToday = isTodayDateKey(targetDate)
  const activeTabConfig = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]
  const statusDateLabel = isDesktopLayout
    ? `${viewingToday ? '今天' : '回看'} ${formatShortDateKey(targetDate)}`
    : viewingToday
      ? '今天'
      : formatShortDateKey(targetDate)
  const caloriesStatusLabel = isDesktopLayout ? `剩余 ${caloriesLeft} kcal` : `剩 ${caloriesLeft} kcal`
  const proteinStatusLabel = isDesktopLayout ? `差 ${proteinLeft} g 蛋白` : `蛋白 ${proteinLeft}g`

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const desktopMedia = window.matchMedia('(min-width: 1024px)')
    const handleChange = () => setIsDesktopLayout(desktopMedia.matches)

    handleChange()
    desktopMedia.addEventListener('change', handleChange)

    return () => desktopMedia.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleResize = () => {
      if (!getIsDesktopLayout()) {
        setMobileViewportTick((current) => current + 1)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useLayoutEffect(() => {
    if (isDesktopLayout) {
      return
    }

    const activeDateChip = activeDateChipRef.current
    const dateStrip = activeDateChip?.parentElement

    if (!dateStrip || !activeDateChip) {
      return
    }

    const stripRect = dateStrip.getBoundingClientRect()
    const chipRect = activeDateChip.getBoundingClientRect()
    const overflowRight = chipRect.right - stripRect.right
    const overflowLeft = stripRect.left - chipRect.left

    if (overflowRight > 0) {
      dateStrip.scrollTo({
        left: dateStrip.scrollLeft + overflowRight + 12,
        behavior: 'auto',
      })
      return
    }

    if (overflowLeft > 0) {
      dateStrip.scrollTo({
        left: Math.max(0, dateStrip.scrollLeft - overflowLeft - 12),
        behavior: 'auto',
      })
      return
    }

    if (typeof activeDateChip.scrollIntoView === 'function') {
      activeDateChip.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [dateOptions, isDesktopLayout, mobileViewportTick, targetDate])

  function jumpToTab(tabId: TabId) {
    setActiveTab(tabId)
  }

  function handleQuickAction(request: QuickEntryRequest) {
    setRecordMenuOpen(false)
    setQuickEntryRequest(request)
  }

  function completeOnboarding() {
    markOnboardingComplete()
    setOnboardingOpen(false)
  }

  function handleApplyMealTemplate(templateId: string, targetDateKey?: string) {
    snapshot.applyMealTemplateToDate(templateId, targetDateKey ?? targetDate)
  }

  function handleApplyWorkoutTemplate(templateId: string, targetDateKey?: string) {
    snapshot.applyWorkoutTemplateToDate(templateId, targetDateKey ?? targetDate)
  }

  function openWorkspaceForQuickMode(mode: QuickEntryMode) {
    if (mode === 'meal') {
      jumpToTab('meals')
      return
    }

    if (mode === 'workout') {
      jumpToTab('workouts')
      return
    }

    jumpToTab('body')
  }

  function openAdvancedWorkspace(tabId: 'meals' | 'workouts' | 'body' | 'insights') {
    jumpToTab(tabId)
  }

  let screen = <InsightsView targetDate={targetDate} />

  if (activeTab === 'today') {
    screen = (
      <TodayView
        onApplyMealTemplate={handleApplyMealTemplate}
        onApplyWorkoutTemplate={handleApplyWorkoutTemplate}
        onOpenInsights={() => jumpToTab('insights')}
        onQuickAction={handleQuickAction}
        targetDate={targetDate}
      />
    )
  } else if (activeTab === 'meals') {
    screen = <MealsView targetDate={targetDate} />
  } else if (activeTab === 'workouts') {
    screen = <WorkoutsView targetDate={targetDate} />
  } else if (activeTab === 'body') {
    screen = <BodyView targetDate={targetDate} />
  }

  const navigation = (
    <nav
      aria-label="主导航"
      className={isDesktopLayout ? 'sidebar-tabbar' : 'bottom-tabbar'}
      role="tablist"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const selected = activeTab === tab.id

        return (
          <button
            aria-label={tab.label}
            aria-selected={selected}
            className={`bottom-tab${selected ? ' is-active' : ''}`}
            key={tab.id}
            onClick={() => jumpToTab(tab.id)}
            role="tab"
            type="button"
          >
            <Icon size={18} />
            <div className="tab-copy">
              <span className="tab-label">{tab.label}</span>
              {isDesktopLayout ? <small aria-hidden="true">{tab.desktopHint}</small> : null}
            </div>
          </button>
        )
      })}
    </nav>
  )

  const globalQuickBar = (
    <section
      aria-label="全局快速记录"
      className={`global-quickbar${
        isDesktopLayout
          ? ' is-desktop'
          : ' global-quickbar--mobile-compact global-quickbar--mobile-floating'
      }`}
      role="region"
    >
      {isDesktopLayout ? <p className="section-kicker">全局快速记录</p> : null}
      <div className="global-quickbar-row">
        {quickEntryActions.map((action) => {
          const Icon = action.icon

          return (
            <button
              aria-label={action.ariaLabel}
              className="global-quickbar-action"
              key={action.mode}
              onClick={() => handleQuickAction({ mode: action.mode })}
              type="button"
            >
              <Icon size={18} />
              <span>{action.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )

  const mobileRecordMenu = !isDesktopLayout ? (
    <>
      <button
        aria-label="打开记录菜单"
        className="global-record-fab"
        onClick={() => setRecordMenuOpen(true)}
        type="button"
      >
        <Plus size={22} />
        <span>记录</span>
      </button>
      {recordMenuOpen ? (
        <div className="record-action-sheet-backdrop" onClick={() => setRecordMenuOpen(false)} role="presentation">
          <section
            aria-label="选择记录类型"
            aria-modal="true"
            className="record-action-sheet"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="record-action-sheet-head">
              <div>
                <p className="section-kicker">快速记录</p>
                <h2>现在要记什么？</h2>
              </div>
              <button
                aria-label="关闭记录菜单"
                className="icon-circle-button"
                onClick={() => setRecordMenuOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <div className="record-action-grid">
              {quickEntryActions.map((action) => {
                const Icon = action.icon

                return (
                  <button
                    aria-label={`记录${action.label.replace('记', '')}`}
                    className="record-action-button"
                    key={action.mode}
                    onClick={() => handleQuickAction({ mode: action.mode })}
                    type="button"
                  >
                    <Icon size={20} />
                    <span>{action.label.replace('记', '')}</span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      ) : null}
    </>
  ) : null

  return (
    <main className="app-shell">
      <div className={`app-frame${isDesktopLayout ? ' is-desktop' : ''}`}>
        {isDesktopLayout ? (
          <aside className="app-sidebar">
            <div className="brand-row">
              <div aria-hidden="true" className="brand-mark">
                <Flame size={18} />
              </div>
              <div className="brand-copy">
                <p className="app-eyebrow">燃刻</p>
                <h1>{snapshot.profile.name || '今天的执行面板'}</h1>
              </div>
              <button
                aria-label="打开设置"
                className="icon-circle-button"
                onClick={() => setSettingsOpen(true)}
                type="button"
              >
                <Settings2 size={18} />
              </button>
            </div>

            <section className="sidebar-summary-card">
              <p className="section-kicker">当前节奏</p>
              <strong>
                {viewingToday ? '今天' : '回看'} {formatShortDateKey(targetDate)}
              </strong>
              <div className="sidebar-summary-grid">
                <div>
                  <span>剩余热量</span>
                  <strong>{caloriesLeft} kcal</strong>
                </div>
                <div>
                  <span>蛋白缺口</span>
                  <strong>{proteinLeft} g</strong>
                </div>
                <div>
                  <span>当前工作区</span>
                  <strong>{activeTabConfig.label}</strong>
                </div>
              </div>
            </section>

            {navigation}

            <div className="sidebar-note">
              <span className="section-kicker">Local-first</span>
              <p>本地优先，数据都保存在当前浏览器。</p>
            </div>
          </aside>
        ) : null}

        <div className="app-main">
          <header
            className={`app-topbar${
              isDesktopLayout ? ' is-desktop' : ' app-topbar--mobile-compact app-topbar--mobile-sticky'
            }`}
          >
            {isDesktopLayout ? (
              <div className="desktop-topbar-head">
                <div className="brand-copy">
                  <p className="app-eyebrow">当前工作区</p>
                  <h2>{activeTabConfig.desktopTitle}</h2>
                </div>
              </div>
            ) : null}

          {isDesktopLayout ? (
            <div className="status-pill-row">
              <span className="status-pill status-pill--accent">
                {statusDateLabel}
              </span>
              <span className="status-pill">{caloriesStatusLabel}</span>
              <span className="status-pill">{proteinStatusLabel}</span>
              {!viewingToday ? (
                <button
                  className="status-pill status-pill--button"
                  onClick={() => setTargetDate(todayKey)}
                  type="button"
                >
                  回今天
                </button>
              ) : null}
            </div>
          ) : null}

          <div className={`date-toolbar${isDesktopLayout ? '' : ' date-toolbar--mobile-minimal'}`}>
            <button
              aria-label="查看前一天"
              className="date-nav-button"
              onClick={() => setTargetDate((current) => shiftDateKey(current, -1))}
              type="button"
            >
              <ChevronLeft size={18} />
            </button>

            {isDesktopLayout ? (
              <div aria-label="日期选择" className="date-strip" role="list">
                {dateOptions.map((date) => (
                  <button
                    className={`date-chip${date === targetDate ? ' is-active' : ''}`}
                    key={date}
                    onClick={() => setTargetDate(date)}
                    ref={date === targetDate ? activeDateChipRef : null}
                    role="listitem"
                    type="button"
                  >
                    <span>{isTodayDateKey(date) ? '今天' : formatShortDateKey(date)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <button
                aria-label={viewingToday ? `当前日期 ${formatDateKeyLabel(targetDate)}` : `回到今天，当前 ${formatDateKeyLabel(targetDate)}`}
                className="date-chip mobile-date-chip is-active"
                onClick={() => {
                  if (!viewingToday) {
                    setTargetDate(todayKey)
                  }
                }}
                ref={activeDateChipRef}
                type="button"
              >
                <strong>{statusDateLabel}</strong>
                <span>{formatDateKeyLabel(targetDate)}</span>
              </button>
            )}

            <button
              aria-label="查看后一天"
              className="date-nav-button"
              disabled={viewingToday}
              onClick={() => setTargetDate((current) => shiftDateKey(current, 1))}
              type="button"
            >
              <ChevronRight size={18} />
            </button>
            {!isDesktopLayout ? (
              <button
                aria-label="打开设置"
                className="icon-circle-button mobile-settings-button"
                onClick={() => setSettingsOpen(true)}
                type="button"
              >
                <Settings2 size={16} />
              </button>
            ) : null}
          </div>

          {isDesktopLayout ? globalQuickBar : null}
          </header>

          <section className="screen-shell">{screen}</section>
          {isDesktopLayout ? null : mobileRecordMenu}
          {isDesktopLayout ? null : navigation}
        </div>
      </div>

      {settingsOpen ? (
        <SettingsSheet
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onOpenAdvancedWorkspace={openAdvancedWorkspace}
        />
      ) : null}
      {quickEntryRequest ? (
        <QuickEntrySheet
          key={`${quickEntryRequest?.mode ?? 'meal'}-${quickEntryRequest?.mealPrefillFoodId ?? 'none'}-${quickEntryRequest?.workoutPrefillTemplateId ?? 'none'}-${quickEntryRequest?.targetDateKey ?? targetDate}`}
          onClose={() => setQuickEntryRequest(null)}
          onOpenWorkspace={openWorkspaceForQuickMode}
          request={quickEntryRequest}
          targetDate={quickEntryRequest?.targetDateKey ?? targetDate}
        />
      ) : null}
      {onboardingOpen ? <OnboardingScreen onComplete={completeOnboarding} /> : null}
    </main>
  )
}
