interface WorkoutDaySummary {
  totalMinutes: number
  totalCalories: number
  strengthCount: number
  cardioCount: number
  exerciseCount: number
}

interface WorkoutSummaryCardsProps {
  isTodayView: boolean
  summary: WorkoutDaySummary
}

export function WorkoutSummaryCards({ isTodayView, summary }: WorkoutSummaryCardsProps) {
  return (
    <div className="meal-summary-grid">
      <article className="meal-summary-card">
        <span>累计时长</span>
        <strong>{summary.totalMinutes} 分钟</strong>
        <small>{isTodayView ? '今天已经练了多久' : '所选日期总时长'}</small>
      </article>
      <article className="meal-summary-card">
        <span>预估消耗</span>
        <strong>{summary.totalCalories} kcal</strong>
        <small>按训练记录累计</small>
      </article>
      <article className="meal-summary-card">
        <span>力量 / 有氧</span>
        <strong>
          {summary.strengthCount} / {summary.cardioCount}
        </strong>
        <small>当日类型分布</small>
      </article>
      <article className="meal-summary-card">
        <span>记录动作数</span>
        <strong>{summary.exerciseCount}</strong>
        <small>力量训练会累计动作条目</small>
      </article>
    </div>
  )
}
