import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { formatDateKeyLabel, formatShortDateKey, shiftDateKey } from '../../store/date'
import {
  buildAdherenceMetrics,
  buildConsistencyCalendar,
  buildDailySummary,
  buildGoalProgressSummary,
  buildRangeSummary,
  buildWeeklyPlanAdherenceSummary,
  buildWeeklyReportSummary,
  buildWeeklyReviewSummary,
  buildWeightTrend,
} from '../../store/selectors'
import { useFitnessStore } from '../../store/useFitnessStore'
import { WeightSparkline } from '../components/WeightSparkline'

function getRecentDates(targetDate: string, span: number) {
  return Array.from({ length: span }, (_, index) => shiftDateKey(targetDate, -(span - 1 - index)))
}

function matchesCompactCopyViewport() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true
  }

  return window.matchMedia('(min-width: 421px)').matches
}

function ProgressRing({ value }: { value: number }) {
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (Math.max(0, Math.min(value, 100)) / 100) * circumference

  return (
    <div aria-label={`阶段进度 ${value}%`} className="progress-ring" role="img">
      <svg viewBox="0 0 96 96">
        <defs>
          <linearGradient id="progress-ring-gradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff8d4d" />
            <stop offset="100%" stopColor="#4bd8cb" />
          </linearGradient>
        </defs>
        <circle className="progress-ring-track" cx="48" cy="48" r={radius} />
        <circle
          className="progress-ring-value"
          cx="48"
          cy="48"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="progress-ring-copy">
        <strong>{value}%</strong>
        <span>完成</span>
      </div>
    </div>
  )
}

function getGoalDirectionCopy(direction: 'cut' | 'gain' | 'maintain') {
  if (direction === 'cut') {
    return '减脂阶段'
  }

  if (direction === 'gain') {
    return '增肌阶段'
  }

  return '维持阶段'
}

function getWeeklyReviewLabel(tone: 'positive' | 'watch' | 'risk') {
  if (tone === 'positive') {
    return '稳项'
  }

  if (tone === 'risk') {
    return '风险'
  }

  return '观察'
}

function getPlanSignalLabel(tone: 'positive' | 'watch') {
  return tone === 'positive' ? '亮点' : '提醒'
}

interface InsightsViewProps {
  targetDate: string
}

export function InsightsView({ targetDate }: InsightsViewProps) {
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
  const sevenDaySummary = buildRangeSummary(snapshot, targetDate, 7)
  const twentyEightDaySummary = buildRangeSummary(snapshot, targetDate, 28)
  const trend = buildWeightTrend(snapshot, targetDate)
  const adherenceMetrics = buildAdherenceMetrics(snapshot, targetDate, 28)
  const goalProgress = buildGoalProgressSummary(snapshot, targetDate)
  const consistencyCalendar = buildConsistencyCalendar(snapshot, targetDate, 28)
  const weeklyReview = buildWeeklyReviewSummary(snapshot, targetDate)
  const weeklyReport = buildWeeklyReportSummary(snapshot, targetDate)
  const weeklyPlanAdherence = buildWeeklyPlanAdherenceSummary(snapshot, targetDate)
  const strongestMetric = adherenceMetrics[0]
  const weakestMetric = adherenceMetrics.at(-1)
  const recentRecoveryCopy =
    sevenDaySummary.latestRecoveryScore != null
      ? `最近 ${sevenDaySummary.latestRecoveryScore} 分`
      : '近 7 天还没有恢复记录'
  const [weeklyReportCopyStatus, setWeeklyReportCopyStatus] = useState('')

  const timeline = getRecentDates(targetDate, 7).map((date) => {
    const daily = buildDailySummary(snapshot, date)

    return {
      date: formatShortDateKey(date),
      calories: daily.calories,
      protein: daily.protein,
    }
  })

  const maxCalories = Math.max(...timeline.map((point) => point.calories), 1)
  const trendDirectionCopy =
    trend.direction === 'down' ? '下降' : trend.direction === 'up' ? '上升' : '持平'
  const signedCompletedChange =
    goalProgress.direction === 'gain'
      ? `+${goalProgress.completedChange.toFixed(1)} kg`
      : goalProgress.direction === 'cut'
        ? `-${goalProgress.completedChange.toFixed(1)} kg`
        : '0.0 kg'

  async function handleCopyWeeklyReport() {
    if (!navigator.clipboard?.writeText) {
      setWeeklyReportCopyStatus('当前环境不支持直接复制。')
      return
    }

    try {
      await navigator.clipboard.writeText(weeklyReport.shareText)
      setWeeklyReportCopyStatus('已复制本周周报。')
    } catch {
      setWeeklyReportCopyStatus('复制失败，请稍后再试。')
    }
  }

  return (
    <section className="feature-layout">
      <article className="feature-panel feature-panel--wide">
        <div className="panel-head">
          <div>
            <p className="section-kicker">阶段进度</p>
            <h2>
              {goalProgress.direction === 'maintain'
                ? '当前体重维持在目标附近'
                : `离目标还剩 ${goalProgress.remainingChange.toFixed(1)} kg`}
            </h2>
          </div>
          <div className="pill-row">
            <span className="pill">{getGoalDirectionCopy(goalProgress.direction)}</span>
            {goalProgress.nextMilestoneWeight != null ? (
              <span className="pill pill--muted">下一节点 {goalProgress.nextMilestoneWeight.toFixed(1)} kg</span>
            ) : (
              <span className="pill pill--muted">已到目标区间</span>
            )}
          </div>
        </div>

        <div className="phase-progress-layout">
          <div className="phase-progress-hero">
            <ProgressRing value={goalProgress.progressPercent} />
            <div className="phase-progress-copy">
              <strong>较起点已变化 {signedCompletedChange}</strong>
              <p>
                起点 {goalProgress.startWeight.toFixed(1)} kg，目标 {goalProgress.targetWeight.toFixed(1)} kg。
              </p>
            </div>
          </div>

          <div aria-label="阶段摘要" className="phase-summary-rail" role="list">
            <article className="meal-summary-card phase-summary-card" role="listitem">
              <span>当前体重</span>
              <strong>{goalProgress.currentWeight.toFixed(1)} kg</strong>
              <small>以最近一次身体记录为准</small>
            </article>
            <article className="meal-summary-card phase-summary-card" role="listitem">
              <span>目标总跨度</span>
              <strong>{goalProgress.totalChange.toFixed(1)} kg</strong>
              <small>从起点到目标的总距离</small>
            </article>
            <article className="meal-summary-card phase-summary-card" role="listitem">
              <span>剩余距离</span>
              <strong>{goalProgress.remainingChange.toFixed(1)} kg</strong>
              <small>越接近 0，阶段越完整</small>
            </article>
            <article className="meal-summary-card phase-summary-card" role="listitem">
              <span>下一节点</span>
              <strong>
                {goalProgress.nextMilestoneWeight != null
                  ? `${goalProgress.nextMilestoneWeight.toFixed(1)} kg`
                  : '已完成'}
              </strong>
              <small>
                {goalProgress.nextMilestoneWeight != null
                  ? `再走 ${goalProgress.nextMilestoneChange.toFixed(1)} kg`
                  : '可以进入下一阶段目标'}
              </small>
            </article>
          </div>
        </div>
      </article>

      <article className="feature-panel feature-panel--wide weekly-review-panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">周判断</p>
            <h2>本周复盘</h2>
            <p className="muted-copy muted-copy--compact">先判断这周哪里最稳，哪里最该优先修。</p>
          </div>
          <div className="pill-row">
            <span className="pill pill--muted">近 7 天</span>
          </div>
        </div>

        <div className="weekly-review-stack">
          <div aria-label="本周复盘观察" className="weekly-review-findings weekly-review-findings--compact" role="list">
            {weeklyReview.findings.map((finding) => (
              <article className={`weekly-review-card is-${finding.tone}`} key={finding.id} role="listitem">
                <span className="weekly-review-label">{getWeeklyReviewLabel(finding.tone)}</span>
                <strong>{finding.title}</strong>
                <p>{finding.detail}</p>
              </article>
            ))}
            {weeklyReview.risk ? (
              <article className="weekly-review-card is-risk" role="listitem">
                <span className="weekly-review-label">{getWeeklyReviewLabel('risk')}</span>
                <strong>{weeklyReview.risk.title}</strong>
                <p>{weeklyReview.risk.detail}</p>
              </article>
            ) : null}
          </div>

          <section className="weekly-review-section">
            {matchesCompactCopyViewport() ? <h3>下周优先</h3> : null}
            <div
              aria-label="下周优先"
              className="weekly-review-recommendations weekly-review-recommendations--compact"
              role="list"
            >
              {weeklyReview.recommendations.map((recommendation) => (
                <article className="weekly-review-recommendation" key={recommendation.id} role="listitem">
                  <div className="weekly-review-recommendation-head">
                    <strong>{recommendation.title}</strong>
                    <span className="weekly-review-target">{recommendation.targetLabel}</span>
                  </div>
                  <p>{recommendation.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </article>

      <article className="feature-panel feature-panel--wide weekly-report-panel">
        <div className="panel-head weekly-report-panel-head">
          <div>
            <p className="section-kicker">{weeklyReport.title}</p>
            <h2>把这一周整理成一段能直接发出去的话</h2>
            {matchesCompactCopyViewport() ? (
              <p className="muted-copy muted-copy--compact">不想自己重新组织语言时，直接复制这一版。</p>
            ) : null}
          </div>
          <div className="pill-row">
            <span className="pill pill--muted">{weeklyReport.periodLabel}</span>
          </div>
        </div>

        <div aria-label="本周周报预览" className="weekly-report-preview weekly-report-preview--rail" role="list">
          {weeklyReport.sections.map((section) => (
            <div className="weekly-report-line" key={section.id} role="listitem">
              <span className="weekly-report-line-label">{section.label}</span>
              <strong>{section.text}</strong>
            </div>
          ))}
        </div>

        <div className="weekly-report-actions">
          <button className="secondary-button" onClick={handleCopyWeeklyReport} type="button">
            复制周报
          </button>
          {weeklyReportCopyStatus ? (
            <p aria-live="polite" className="inline-note weekly-report-status">
              {weeklyReportCopyStatus}
            </p>
          ) : null}
        </div>
      </article>

      <article className="feature-panel feature-panel--wide plan-adherence-panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">本周计划执行</p>
            <h2>{weeklyPlanAdherence.headline}</h2>
            {weeklyPlanAdherence.plannedMeals + weeklyPlanAdherence.plannedWorkouts > 0 ? (
              <p className="muted-copy muted-copy--compact">{weeklyPlanAdherence.detail}</p>
            ) : null}
          </div>
          {weeklyPlanAdherence.plannedMeals + weeklyPlanAdherence.plannedWorkouts > 0 ? (
            <div className="pill-row">
              <span className="pill pill--muted">近 7 天</span>
            </div>
          ) : null}
        </div>

        {weeklyPlanAdherence.plannedMeals + weeklyPlanAdherence.plannedWorkouts > 0 ? (
          <div className="meal-summary-grid">
            <article className="meal-summary-card">
              <span>计划餐完成</span>
              <strong>
                {weeklyPlanAdherence.completedMeals} / {weeklyPlanAdherence.plannedMeals}
              </strong>
              <small>完成率 {weeklyPlanAdherence.mealCompletionRate}%</small>
            </article>
            <article className="meal-summary-card">
              <span>计划训练完成</span>
              <strong>
                {weeklyPlanAdherence.completedWorkouts} / {weeklyPlanAdherence.plannedWorkouts}
              </strong>
              <small>完成率 {weeklyPlanAdherence.workoutCompletionRate}%</small>
            </article>
            <article className="meal-summary-card">
              <span>漏掉的计划项</span>
              <strong>{weeklyPlanAdherence.missedMeals + weeklyPlanAdherence.missedWorkouts}</strong>
              <small>
                饮食 {weeklyPlanAdherence.missedMeals} · 训练 {weeklyPlanAdherence.missedWorkouts}
              </small>
            </article>
            <article className="meal-summary-card">
              <span>计划外完成</span>
              <strong>{weeklyPlanAdherence.unplannedMealLogs + weeklyPlanAdherence.unplannedWorkoutLogs}</strong>
              <small>
                饮食 {weeklyPlanAdherence.unplannedMealLogs} · 训练 {weeklyPlanAdherence.unplannedWorkoutLogs}
              </small>
            </article>
          </div>
        ) : (
          <div className="meal-summary-grid plan-adherence-empty-grid">
            <article className="meal-summary-card">
              <span>计划外完成</span>
              <strong>{weeklyPlanAdherence.unplannedMealLogs + weeklyPlanAdherence.unplannedWorkoutLogs}</strong>
              <small>
                饮食 {weeklyPlanAdherence.unplannedMealLogs} · 训练 {weeklyPlanAdherence.unplannedWorkoutLogs}
              </small>
            </article>
          </div>
        )}

        {weeklyPlanAdherence.signals.length > 0 ? (
          <div aria-label="本周计划执行信号" className="weekly-review-findings" role="list">
            {weeklyPlanAdherence.signals.map((signal) => (
              <article className={`weekly-review-card is-${signal.tone}`} key={signal.id} role="listitem">
                <span className="weekly-review-label">{getPlanSignalLabel(signal.tone)}</span>
                <strong>{signal.title}</strong>
                <p>{signal.detail}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-note">还没有固定计划，先去饮食或训练里把常用内容排进这一周。</p>
        )}
      </article>

      <article className="feature-panel feature-panel--wide">
        <div className="panel-head">
          <div>
            <p className="section-kicker">近 7 天</p>
            <h2>先看这一周稳不稳</h2>
          </div>
          <div className="pill-row">
            <span className="pill">截止 {formatDateKeyLabel(targetDate)}</span>
          </div>
        </div>

        <div aria-label="近7天摘要" className="meal-summary-grid insights-seven-day-grid insights-seven-day-grid--rail" role="list">
          <article className="meal-summary-card" role="listitem">
            <span>平均执行分</span>
            <strong>{sevenDaySummary.averageConsistency}%</strong>
            <small>包含饮食、训练、恢复、体重</small>
          </article>
          <article className="meal-summary-card" role="listitem">
            <span>平均热量</span>
            <strong>{sevenDaySummary.averageCalories}</strong>
            <small>目标 {snapshot.profile.dailyCalories} 千卡</small>
          </article>
          <article className="meal-summary-card" role="listitem">
            <span>蛋白达标天数</span>
            <strong>{sevenDaySummary.proteinGoalDays} / 7</strong>
            <small>平均 {sevenDaySummary.averageProtein} g / 天</small>
          </article>
          <article className="meal-summary-card" role="listitem">
            <span>训练总时长</span>
            <strong>{sevenDaySummary.trainingMinutes} 分钟</strong>
            <small>{sevenDaySummary.trainingSessions} 次训练</small>
          </article>
          <article className="meal-summary-card" role="listitem">
            <span>恢复均分</span>
            <strong>
              {sevenDaySummary.recoveryDays > 0 ? `${sevenDaySummary.averageRecoveryScore} 分` : '--'}
            </strong>
            <small>{recentRecoveryCopy}</small>
          </article>
        </div>
      </article>

      <article className="feature-panel feature-panel--wide">
        <div className="panel-head">
          <div>
            <p className="section-kicker">近 28 天</p>
            <h3>看节奏，不看单日波动</h3>
          </div>
        </div>

        <div className="meal-summary-grid">
          <article className="meal-summary-card">
            <span>体重变化</span>
            <strong>{twentyEightDaySummary.weightDelta.toFixed(1)} kg</strong>
            <small>近 28 天的整体方向</small>
          </article>
          <article className="meal-summary-card">
            <span>恢复记录天数</span>
            <strong>{twentyEightDaySummary.recoveryDays} / 28</strong>
            <small>平均睡眠 {twentyEightDaySummary.averageSleepHours} h</small>
          </article>
          <article className="meal-summary-card">
            <span>体重记录天数</span>
            <strong>{twentyEightDaySummary.bodyEntryDays} / 28</strong>
            <small>越稳定，趋势越可信</small>
          </article>
          <article className="meal-summary-card">
            <span>热量落点稳定天数</span>
            <strong>{twentyEightDaySummary.calorieGoalDays} / 28</strong>
            <small>按目标 85% 以上计入</small>
          </article>
        </div>
      </article>

      <article className="feature-panel feature-panel--wide">
        <div className="panel-head">
          <div>
            <p className="section-kicker">28 天打卡热力格</p>
            <h3>颜色越深，这段时间越稳</h3>
          </div>
          <div className="pill-row">
            <span className="pill">完整日 {consistencyCalendar.fullDays} / 28</span>
            <span className="pill pill--muted">空白日 {consistencyCalendar.blankDays}</span>
          </div>
        </div>

        <div className="consistency-heatmap-layout">
          <div
            className="signal-grid consistency-summary-grid consistency-summary-grid--rail"
            aria-label="热力格摘要"
            role="list"
          >
            <div role="listitem">
              <span>平均执行分</span>
              <strong>{consistencyCalendar.averageScore}%</strong>
            </div>
            <div role="listitem">
              <span>最长连记</span>
              <strong>{consistencyCalendar.bestLoggingStreak} 天</strong>
            </div>
            <div role="listitem">
              <span>高强度日</span>
              <strong>{consistencyCalendar.fullDays} 天</strong>
            </div>
            <div role="listitem">
              <span>最后一天</span>
              <strong>{formatShortDateKey(consistencyCalendar.days.at(-1)?.dateKey ?? targetDate)}</strong>
            </div>
          </div>

          <div className="consistency-heatmap-shell">
            <div aria-label="28天打卡热力格" className="consistency-heatmap consistency-heatmap--compact" role="list">
              {consistencyCalendar.days.map((day) => (
                <div
                  aria-label={`${formatDateKeyLabel(day.dateKey)} 执行分 ${day.score}%`}
                  className={`heatmap-cell is-${day.intensity}`}
                  key={day.dateKey}
                  role="listitem"
                >
                  <span>{day.dateKey.slice(8)}</span>
                </div>
              ))}
            </div>

            <div className="heatmap-legend">
              <span>低</span>
              <div aria-hidden="true" className="heatmap-legend-scale">
                <span className="heatmap-cell is-none" />
                <span className="heatmap-cell is-low" />
                <span className="heatmap-cell is-medium" />
                <span className="heatmap-cell is-high" />
                <span className="heatmap-cell is-full" />
              </div>
              <span>高</span>
            </div>
          </div>
        </div>
      </article>

      <article className="feature-panel feature-panel--wide">
        <div className="panel-head">
          <div>
            <p className="section-kicker">执行拆解</p>
            <h3>找出最稳项和补强项</h3>
          </div>
          <div className="pill-row">
            <span className="pill pill--muted">最稳：{strongestMetric?.label ?? '--'}</span>
            <span className="pill">补强：{weakestMetric?.label ?? '--'}</span>
          </div>
        </div>

        <div className="metric-bar-list">
          {adherenceMetrics.map((metric) => (
            <div className="metric-bar-row" key={metric.id}>
              <div className="metric-bar-head">
                <span>{metric.label}</span>
                <strong>{metric.score}%</strong>
              </div>
              <div className="bar-track">
                <div className="metric-bar-fill" style={{ width: `${metric.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="feature-panel feature-panel--wide">
        <div className="panel-head">
          <div>
            <p className="section-kicker">体重趋势</p>
            <h3>
              7 天变化：{trendDirectionCopy} {trend.delta.toFixed(1)} kg
            </h3>
          </div>
        </div>
        <WeightSparkline
          ariaLabel="7天体重趋势图"
          emptyMessage="先记几次体重，趋势线就会亮起来。"
          gradientId="insights-weight-line-gradient"
          points={trend.points}
        />
      </article>

      <article className="feature-panel feature-panel--wide">
        <div className="panel-head">
          <div>
            <p className="section-kicker">最近节奏</p>
            <h3>近 7 天热量和蛋白质节奏</h3>
          </div>
        </div>
        <div
          aria-label="最近7天热量与蛋白质节奏"
          className="bar-list insights-rhythm-list insights-rhythm-list--rail"
          role="list"
        >
          {timeline.map((point) => (
            <div className="bar-row" key={point.date} role="listitem">
              <span>{point.date}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(point.calories / maxCalories) * 100}%` }} />
              </div>
              <strong>{point.calories} kcal</strong>
              <small>{point.protein} g</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
