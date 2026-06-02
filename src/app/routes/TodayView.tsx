import { Dumbbell, Flame, Footprints, Scale, Sparkles, UtensilsCrossed } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import type { QuickEntryRequest } from '../QuickEntrySheet'
import { formatDateKeyLabel, isTodayDateKey } from '../../store/date'
import {
  buildTodayAchievementSummary,
  buildDailySummary,
  buildTodayCoachSummary,
  buildTodayMomentumSummary,
  buildTodayPlanSummary,
  buildTomorrowPlanSummary,
  buildWeeklyReviewSummary,
  buildWeightTrend,
  buildWeeklySummary,
  type TodayPlanAction,
  type TomorrowPlanAction,
} from '../../store/selectors'
import type { MealType } from '../../store/types'
import { useFitnessStore } from '../../store/useFitnessStore'

interface TodayViewProps {
  targetDate: string
  onApplyMealTemplate?: (templateId: string, targetDateKey?: string) => void
  onApplyWorkoutTemplate?: (templateId: string, targetDateKey?: string) => void
  onOpenInsights?: () => void
  onQuickAction?: (request: QuickEntryRequest) => void
}

function formatSignedNumber(value: number) {
  if (value === 0) {
    return '0'
  }

  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)
}

function getSuggestedMealType(mealsLogged: number): QuickEntryRequest['mealType'] {
  if (mealsLogged <= 0) {
    return 'breakfast'
  }

  if (mealsLogged === 1) {
    return 'lunch'
  }

  if (mealsLogged === 2) {
    return 'dinner'
  }

  return 'snack'
}

function getMealTypeLabel(mealType: MealType) {
  if (mealType === 'breakfast') {
    return '早餐'
  }

  if (mealType === 'lunch') {
    return '午餐'
  }

  if (mealType === 'dinner') {
    return '晚餐'
  }

  return '加餐'
}

function getWorkoutKindLabel(mode: 'strength' | 'cardio') {
  return mode === 'strength' ? '\u529b\u91cf' : '\u6709\u6c27'
}

function ProgressBar({
  label,
  current,
  target,
  accentClass,
  unit,
}: {
  label: string
  current: number
  target: number
  accentClass: string
  unit?: string
}) {
  const ratio = target > 0 ? Math.min(current / target, 1) : 0

  return (
    <article className="progress-card">
      <header>
        <span>{label}</span>
        <strong>
          {current}
          {unit ?? ''}
        </strong>
      </header>
      <div aria-hidden="true" className="progress-track">
        <div className={`progress-fill ${accentClass}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <p>
        目标 {target}
        {unit ?? ''}
      </p>
    </article>
  )
}

export function TodayView({
  onApplyMealTemplate,
  onApplyWorkoutTemplate,
  onOpenInsights,
  onQuickAction,
  targetDate,
}: TodayViewProps) {
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
  const daily = buildDailySummary(snapshot, targetDate)
  const weekly = buildWeeklySummary(snapshot, targetDate)
  const trend = buildWeightTrend(snapshot, targetDate)
  const coach = buildTodayCoachSummary(snapshot, targetDate)
  const momentum = buildTodayMomentumSummary(snapshot, targetDate)
  const achievements = buildTodayAchievementSummary(snapshot, targetDate)
  const weeklyReview = buildWeeklyReviewSummary(snapshot, targetDate)
  const todayPlan = buildTodayPlanSummary(snapshot, targetDate)
  const tomorrowPlan = buildTomorrowPlanSummary(snapshot, targetDate)
  const caloriesLeft = Math.max(snapshot.profile.dailyCalories - daily.calories, 0)
  const isTodayView = isTodayDateKey(targetDate)
  const showTomorrowPlanDetail =
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? true
      : window.matchMedia('(min-width: 421px)').matches
  const showAchievementDetail =
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? true
      : window.matchMedia('(min-width: 421px)').matches
  const showFocusDetail =
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? true
      : window.matchMedia('(min-width: 421px)').matches
  const showMomentumDetail =
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? true
      : window.matchMedia('(min-width: 421px)').matches
  const recoveryScoreCopy = daily.recoveryScore != null ? `${daily.recoveryScore} 分` : '--'
  const weeklyRecoveryScoreCopy =
    weekly.recoveryDays > 0 ? `${weekly.averageRecoveryScore} 分` : '--'

  function handleTomorrowPlanAction(action: TomorrowPlanAction) {
    if (action.kind === 'meal' && action.templateId) {
      onApplyMealTemplate?.(action.templateId, action.targetDateKey)
      return
    }

    if (action.id === 'planned-workout' || action.id === 'workout') {
      onQuickAction?.({
        mode: 'workout',
        targetDateKey: action.targetDateKey,
        workoutPrefillTemplateId: action.workoutTemplateId,
      })
      return
    }

    if (action.id === 'body') {
      onQuickAction?.({
        mode: 'body',
        targetDateKey: action.targetDateKey,
      })
      return
    }

    if (action.id === 'recovery') {
      onQuickAction?.({
        mode: 'recovery',
        targetDateKey: action.targetDateKey,
        recoveryPresetLabel: action.recoveryPresetLabel,
      })
    }
  }

  function handleTodayPlanAction(action: TodayPlanAction) {
    if (action.kind === 'meal' && action.templateId) {
      onApplyMealTemplate?.(action.templateId, action.targetDateKey)
      return
    }

    if (action.kind === 'workout' && action.workoutTemplateId) {
      onApplyWorkoutTemplate?.(action.workoutTemplateId, action.targetDateKey)
    }
  }

  return (
    <section className="dashboard-grid">
      <article className="focus-panel focus-panel--compact">
        <div className="focus-head">
          <div>
            <p className="section-kicker">{isTodayView ? '今日' : '回看'}</p>
            <h2>{isTodayView ? '先把今天记明白' : '回看这一天的执行'}</h2>
            {showFocusDetail ? (
              <p className="muted-copy muted-copy--compact">
                {isTodayView ? '饮食、训练、恢复和体重都在这里汇总。' : '这一天的饮食、训练和恢复会一起回到这里。'}
              </p>
            ) : null}
          </div>
          <div className="focus-score-card">
            <span>执行分</span>
            <strong className="focus-score">{daily.consistencyScore}%</strong>
          </div>
        </div>

        <div className="focus-meta-row focus-meta-row--rail focus-meta-row--compact">
          <span className="meta-chip">{formatDateKeyLabel(targetDate)}</span>
          <span className="meta-chip">{daily.mealsLogged} 餐</span>
          <span className="meta-chip meta-chip--muted">
            {daily.hasBodyEntry ? '已记体重' : '未记体重'}
          </span>
        </div>

        <div className="stat-row stat-row--metrics stat-row--metrics-rail">
          <article className="mini-stat mini-stat--compact">
            <span>剩余热量</span>
            <strong>{caloriesLeft}</strong>
          </article>
          <article className="mini-stat mini-stat--compact">
            <span>训练时长</span>
            <strong>{daily.trainingMinutes} 分钟</strong>
          </article>
          <article className="mini-stat mini-stat--compact">
            <span>7天体重</span>
            <strong>{formatSignedNumber(trend.delta)} kg</strong>
          </article>
        </div>

        <div className="progress-grid progress-grid--compact progress-grid--rail progress-grid--tight">
          <ProgressBar
            accentClass="is-orange"
            current={daily.calories}
            label="热量进度"
            target={snapshot.profile.dailyCalories}
            unit=" 千卡"
          />
          <ProgressBar
            accentClass="is-teal"
            current={daily.protein}
            label="蛋白质进度"
            target={snapshot.profile.dailyProtein}
            unit=" g"
          />
        </div>
      </article>

      <article className="signal-panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">连续记录</p>
            <h3>{isTodayView ? '别断掉这股节奏' : '看看这一天之前的连续性'}</h3>
          </div>
          <Flame size={18} />
        </div>
        <div className="signal-grid">
          <div>
            <span>连续记录</span>
            <strong>{coach.loggingStreak} 天</strong>
          </div>
          <div>
            <span>近7天完整日</span>
            <strong>{coach.completeDaysLast7} 天</strong>
          </div>
          <div>
            <span>当前最稳</span>
            <strong>{coach.strongestMetric}</strong>
          </div>
          <div>
            <span>优先补强</span>
            <strong>{coach.weakestMetric}</strong>
          </div>
        </div>
      </article>

      <article className="quick-panel quick-panel--compact">
        <div className="panel-head">
          <div>
            <p className="section-kicker">快速记录</p>
            <h3>{isTodayView ? '下一件事别拖' : '补录这一天的数据'}</h3>
          </div>
        </div>

        <div className="quick-grid quick-grid--rail">
          <button
            className="action-button"
            onClick={() =>
              onQuickAction?.({
                mode: 'meal',
                mealType: getSuggestedMealType(daily.mealsLogged),
              })
            }
            type="button"
          >
            <UtensilsCrossed size={18} />
            <span>记饮食</span>
            <small>直接填</small>
          </button>
          <button className="action-button" onClick={() => onQuickAction?.({ mode: 'workout' })} type="button">
            <Dumbbell size={18} />
            <span>记训练</span>
            <small>模板可带入</small>
          </button>
          <button className="action-button" onClick={() => onQuickAction?.({ mode: 'body' })} type="button">
            <Scale size={18} />
            <span>记体重</span>
            <small>先记一笔</small>
          </button>
          <button className="action-button" onClick={() => onQuickAction?.({ mode: 'recovery' })} type="button">
            <Sparkles size={18} />
            <span>记恢复</span>
            <small>一次补完</small>
          </button>
        </div>
      </article>

      <article className="signal-panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">恢复状态</p>
            <h3>{isTodayView ? '别只看训练，也看恢复' : '回看这一天的恢复表现'}</h3>
          </div>
          <Footprints size={18} />
        </div>
        <div className="signal-grid">
          <div>
            <span>{isTodayView ? '恢复分' : '当日恢复分'}</span>
            <strong>{recoveryScoreCopy}</strong>
          </div>
          <div>
            <span>7日均分</span>
            <strong>{weeklyRecoveryScoreCopy}</strong>
          </div>
          <div>
            <span>平均睡眠</span>
            <strong>{weekly.averageSleepHours} h</strong>
          </div>
          <div>
            <span>恢复记录天数</span>
            <strong>{weekly.recoveryDays}</strong>
          </div>
        </div>
      </article>

      <article className="feature-panel feature-panel--wide momentum-panel momentum-panel--compact">
        <div className="panel-head">
          <div>
            <p className="section-kicker">阶段动力</p>
            <h3>{momentum.headline}</h3>
            {showMomentumDetail ? <p className="muted-copy muted-copy--compact">{momentum.detail}</p> : null}
          </div>
          <div className="pill-row">
            <span className="pill">{momentum.stageLabel}</span>
          </div>
        </div>

        <div className="momentum-badge-grid momentum-badge-grid--rail">
          {momentum.badges.map((badge) => (
            <article className="momentum-badge-card" key={badge.id}>
              <span>{badge.title}</span>
              <small>{badge.detail}</small>
            </article>
          ))}
        </div>

        <div className="mission-list mission-list--rail">
          {momentum.missions.map((mission) => (
            <article className="mission-card" key={mission.id}>
              <div className="mission-head">
                <span>{mission.title}</span>
                <strong>
                  {mission.current} / {mission.target} {mission.unit}
                </strong>
              </div>
              <div aria-hidden="true" className="progress-track">
                <div
                  className={`progress-fill ${
                    mission.status === 'done'
                      ? 'is-teal'
                      : mission.status === 'watch'
                        ? 'is-orange'
                        : 'is-muted'
                  }`}
                  style={{ width: `${mission.progressPercent}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </article>

      <article className="feature-panel feature-panel--wide achievement-panel achievement-panel--compact">
        <div className="panel-head">
          <div>
            <p className="section-kicker">阶段成就</p>
            <h3>已解锁 {achievements.unlockedCount} 枚</h3>
            {showAchievementDetail ? (
              <p className="muted-copy muted-copy--compact">小节点也算数，先把最近这几枚稳稳收下。</p>
            ) : null}
          </div>
        </div>

        <div className="achievement-grid achievement-grid--rail">
          {achievements.unlocked.map((item) => (
            <article className="achievement-card achievement-card--unlocked" key={item.id}>
              <span className="achievement-status">已解锁</span>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </article>
          ))}
        </div>

        <div className="achievement-next-grid achievement-next-grid--rail">
          {achievements.nextUp.map((item) => (
            <article className="achievement-card achievement-card--progress" key={item.id}>
              <div className="mission-head">
                <span>{item.title}</span>
                <strong>{item.progressLabel}</strong>
              </div>
              <p className="muted-copy muted-copy--compact">{item.detail}</p>
              <div aria-hidden="true" className="progress-track">
                <div className="progress-fill is-orange" style={{ width: `${item.progressPercent}%` }} />
              </div>
            </article>
          ))}
        </div>
      </article>

      {weeklyReview.topReminder ? (
        <article className="feature-panel feature-panel--wide weekly-reminder-panel">
          <div className="panel-head">
            <div>
              <p className="section-kicker">本周提醒</p>
              <h3>{weeklyReview.topReminder.title}</h3>
              <p className="muted-copy muted-copy--compact">{weeklyReview.topReminder.detail}</p>
            </div>
            <div className="pill-row">
              <span className="pill pill--muted">{weeklyReview.topReminder.targetLabel}</span>
            </div>
          </div>

          {onOpenInsights ? (
            <div className="coach-item-footer">
              <button className="secondary-text-button" onClick={onOpenInsights} type="button">
                去看趋势复盘
              </button>
            </div>
          ) : null}
        </article>
      ) : null}

      {todayPlan.hasPlans ? (
        <article className="feature-panel feature-panel--wide today-plan-panel">
          <div className="panel-head">
            <div>
              <p className="section-kicker">今日计划</p>
              <h3>{todayPlan.headline}</h3>
              <p className="muted-copy muted-copy--compact">{todayPlan.detail}</p>
            </div>
            <div className="pill-row">
              <span className="pill pill--muted">{formatDateKeyLabel(todayPlan.targetDateKey)}</span>
            </div>
          </div>

          <div className="today-plan-list">
            {todayPlan.items.map((action) => (
              <article
                className={`today-plan-card is-${action.kind}${action.status === 'done' ? ' is-done' : ''}`}
                key={action.id}
              >
                <div className="today-plan-copy">
                  <strong>{action.title}</strong>
                  <p>{action.detail}</p>
                </div>
                <div className="today-plan-meta">
                  <span className="today-plan-target">{action.targetLabel}</span>
                  {action.ctaLabel ? (
                    <button className="secondary-button" onClick={() => handleTodayPlanAction(action)} type="button">
                      {action.ctaLabel}
                    </button>
                  ) : (
                    <span className="today-plan-status">已完成</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </article>
      ) : null}

      <article className="feature-panel feature-panel--wide tomorrow-plan-panel tomorrow-plan-panel--compact">
        <div className="panel-head tomorrow-plan-panel-head">
          <div>
            <p className="section-kicker">明日计划</p>
            <h3>{tomorrowPlan.headline}</h3>
            {showTomorrowPlanDetail ? <p className="muted-copy muted-copy--compact">{tomorrowPlan.detail}</p> : null}
          </div>
          <div className="pill-row">
            <span className="pill pill--muted">{formatDateKeyLabel(tomorrowPlan.targetDateKey)}</span>
          </div>
        </div>

        {tomorrowPlan.items.length > 0 ? (
          <div className="tomorrow-plan-list tomorrow-plan-list--rail">
            {tomorrowPlan.items.map((action) => (
              <article className={`tomorrow-plan-card is-${action.kind}`} key={action.id}>
                <div className="tomorrow-plan-copy">
                  <strong>{action.title}</strong>
                  <p>{action.detail}</p>
                </div>
                <div className="tomorrow-plan-meta">
                  <span className="tomorrow-plan-target">{action.targetLabel}</span>
                  <button className="secondary-button" onClick={() => handleTomorrowPlanAction(action)} type="button">
                    {action.ctaLabel}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-note">明天按现在的节奏继续记录就够了。</p>
        )}
      </article>

      <article className="feature-panel feature-panel--wide coach-panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">今日建议</p>
            <h3>{isTodayView ? '今天最值得先补的几步' : '回看这一天还缺哪些记录'}</h3>
          </div>
        </div>
        <div className="stack-list">
          {coach.actions.map((action) => (
            <div className="list-item list-item--dense coach-item" key={action.id}>
              <div className="coach-item-copy">
                <strong>{action.title}</strong>
                <p>{action.detail}</p>
              </div>
              {action.suggestions?.length ? (
                <div className="coach-suggestion-row coach-suggestion-row--rail">
                  {action.suggestions.map((suggestion) => (
                    <button
                      className="coach-suggestion-button"
                      key={suggestion.foodId}
                      onClick={() =>
                        onQuickAction?.({
                          mode: 'meal',
                          mealPrefillFoodId: suggestion.foodId,
                          mealType: getSuggestedMealType(daily.mealsLogged),
                        })
                      }
                      type="button"
                    >
                      <strong>{suggestion.name}</strong>
                      <span>
                        {suggestion.protein} g 蛋白 · {suggestion.calories} kcal
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              {action.plannedMealSuggestions?.length ? (
                <div className="coach-suggestion-row coach-suggestion-row--rail">
                  {action.plannedMealSuggestions.map((suggestion) => (
                    <button
                      className="coach-suggestion-button"
                      key={suggestion.templateId}
                      onClick={() => onApplyMealTemplate?.(suggestion.templateId)}
                      type="button"
                    >
                      <strong>{suggestion.templateName}</strong>
                      <span>
                        {getMealTypeLabel(suggestion.mealType)} {' | '} {suggestion.itemCount} 项
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              {action.workoutSuggestions?.length ? (
                <div className="coach-suggestion-row coach-suggestion-row--rail">
                  {action.workoutSuggestions.map((suggestion) => (
                    <button
                      className="coach-suggestion-button"
                      key={suggestion.templateId}
                      onClick={() =>
                        onQuickAction?.({
                          mode: 'workout',
                          workoutPrefillTemplateId: suggestion.templateId,
                        })
                      }
                      type="button"
                    >
                      <strong>{suggestion.name}</strong>
                      <span>
                        {getWorkoutKindLabel(suggestion.kind)} {' | '} {suggestion.durationMinutes}{'\u5206\u949f'} {' | '}
                        {suggestion.estimatedCalories} kcal
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              {action.recoverySuggestions?.length ? (
                <div className="coach-suggestion-row coach-suggestion-row--rail">
                  {action.recoverySuggestions.map((suggestion) => (
                    <button
                      className="coach-suggestion-button"
                      key={suggestion.label}
                      onClick={() =>
                        onQuickAction?.({
                          mode: 'recovery',
                          recoveryPresetLabel: suggestion.label,
                        })
                      }
                      type="button"
                    >
                      <strong>{suggestion.label}</strong>
                      <span>
                        {suggestion.waterLiters}L · {suggestion.steps} 步 · {suggestion.sleepHours}h
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              {action.action ? (
                <div className="coach-item-footer">
                  <button
                    className="secondary-text-button"
                    onClick={() => {
                      if (action.action === 'meal') {
                        onQuickAction?.({
                          mode: 'meal',
                          mealType: getSuggestedMealType(daily.mealsLogged),
                        })
                        return
                      }

                      if (action.action) {
                        onQuickAction?.({ mode: action.action })
                      }
                    }}
                    type="button"
                  >
                    {action.suggestions?.length ||
                    action.plannedMealSuggestions?.length ||
                    action.workoutSuggestions?.length ||
                    action.recoverySuggestions?.length
                      ? '\u624b\u52a8\u8bb0\u5f55'
                      : '\u53bb\u8bb0\u5f55'}
                  </button>
                </div>
              ) : (
                <div className="coach-item-footer">
                  <span className="pill pill--muted">已完成</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
