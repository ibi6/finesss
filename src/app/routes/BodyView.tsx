import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Search } from 'lucide-react'

import { ConfirmSheet } from '../components/ConfirmSheet'
import { WeightSparkline } from '../components/WeightSparkline'
import {
  createDateStampForDateKey,
  formatDateKeyLabel,
  formatShortDateKey,
  isTodayDateKey,
  resolveDateKey,
} from '../../store/date'
import { recoveryPresets } from '../../store/recoveryPresets'
import { buildBodyHistorySummary, buildGoalProgressSummary, buildWeightTrend } from '../../store/selectors'
import { useFitnessStore } from '../../store/useFitnessStore'

interface BodyViewProps {
  targetDate: string
}

function buildBodyMeasurementItems(entry: {
  bodyFat: number | null
  waist: number | null
  chest: number | null
  hips: number | null
}) {
  const items: string[] = []

  if (entry.bodyFat != null) {
    items.push(`体脂 ${entry.bodyFat}%`)
  }

  if (entry.waist != null) {
    items.push(`腰围 ${entry.waist} cm`)
  }

  if (entry.chest != null) {
    items.push(`胸围 ${entry.chest} cm`)
  }

  if (entry.hips != null) {
    items.push(`臀围 ${entry.hips} cm`)
  }

  return items
}

type BodyHistoryRangeDays = 7 | 30

export function BodyView({ targetDate }: BodyViewProps) {
  const {
    addBodyEntry,
    addRecoveryEntry,
    updateBodyEntry,
    deleteBodyEntry,
    updateRecoveryEntry,
    deleteRecoveryEntry,
    profile,
    foods,
    mealEntries,
    mealTemplates,
    weeklyMealPlans,
    weeklyWorkoutPlans,
    weeklyPrepCheckedKeys,
    photoEstimateRecords,
    workoutTemplates,
    workoutSessions,
    bodyEntries,
    recoveryEntries,
  } = useFitnessStore(
    useShallow((state) => ({
      addBodyEntry: state.addBodyEntry,
      addRecoveryEntry: state.addRecoveryEntry,
      updateBodyEntry: state.updateBodyEntry,
      deleteBodyEntry: state.deleteBodyEntry,
      updateRecoveryEntry: state.updateRecoveryEntry,
      deleteRecoveryEntry: state.deleteRecoveryEntry,
      profile: state.profile,
      foods: state.foods,
      mealEntries: state.mealEntries,
      mealTemplates: state.mealTemplates,
      weeklyMealPlans: state.weeklyMealPlans,
      weeklyWorkoutPlans: state.weeklyWorkoutPlans,
      weeklyPrepCheckedKeys: state.weeklyPrepCheckedKeys,
      photoEstimateRecords: state.photoEstimateRecords,
      workoutTemplates: state.workoutTemplates,
      workoutSessions: state.workoutSessions,
      bodyEntries: state.bodyEntries,
      recoveryEntries: state.recoveryEntries,
    })),
  )
  const [weight, setWeight] = useState('71.8')
  const [bodyFat, setBodyFat] = useState('21.5')
  const [waist, setWaist] = useState('79')
  const [chest, setChest] = useState('')
  const [hips, setHips] = useState('')
  const [waterLiters, setWaterLiters] = useState('2.5')
  const [steps, setSteps] = useState('9000')
  const [sleepHours, setSleepHours] = useState('7.4')
  const [energy, setEnergy] = useState('4')
  const [editingBodyEntryId, setEditingBodyEntryId] = useState<string | null>(null)
  const [editingRecoveryEntryId, setEditingRecoveryEntryId] = useState<string | null>(null)
  const [historyQuery, setHistoryQuery] = useState('')
  const [historyKindFilter, setHistoryKindFilter] = useState<'all' | 'body' | 'recovery'>('all')
  const [historyRangeDays, setHistoryRangeDays] = useState<BodyHistoryRangeDays>(7)
  const [showHistoryControls, setShowHistoryControls] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{
    kind: 'body' | 'recovery'
    id: string
    label: string
  } | null>(null)

  const selectedBodyEntries = useMemo(
    () =>
      [...bodyEntries]
        .filter((entry) => resolveDateKey(entry.dateKey, entry.loggedAt) === targetDate)
        .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt)),
    [bodyEntries, targetDate],
  )
  const bodySnapshot = useMemo(
    () => ({
      profile,
      foods,
      mealEntries,
      mealTemplates,
      weeklyMealPlans,
      weeklyWorkoutPlans,
      weeklyPrepCheckedKeys,
      photoEstimateRecords,
      workoutTemplates,
      workoutSessions,
      bodyEntries,
      recoveryEntries,
    }),
    [
      profile,
      foods,
      mealEntries,
      mealTemplates,
      weeklyMealPlans,
      weeklyWorkoutPlans,
      weeklyPrepCheckedKeys,
      photoEstimateRecords,
      workoutTemplates,
      workoutSessions,
      bodyEntries,
      recoveryEntries,
    ],
  )
  const selectedRecoveryEntries = useMemo(
    () =>
      [...recoveryEntries]
        .filter((entry) => resolveDateKey(entry.dateKey, entry.loggedAt) === targetDate)
        .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt)),
    [recoveryEntries, targetDate],
  )
  const weightTrend = buildWeightTrend(bodySnapshot, targetDate)
  const goalProgress = buildGoalProgressSummary(bodySnapshot, targetDate)
  const bodyHistory = useMemo(
    () =>
      buildBodyHistorySummary(
        {
          bodyEntries,
          recoveryEntries,
        },
        targetDate,
        {
          query: historyQuery,
          kind: historyKindFilter,
          rangeDays: historyRangeDays,
        },
      ),
    [bodyEntries, historyKindFilter, historyQuery, historyRangeDays, recoveryEntries, targetDate],
  )
  const historySummaryLabel =
    bodyHistory.totalInRange === 0
      ? `近 ${historyRangeDays} 天 0 条记录`
      : bodyHistory.filteredCount === bodyHistory.totalInRange
        ? `近 ${historyRangeDays} 天共 ${bodyHistory.totalInRange} 条记录`
        : `近 ${historyRangeDays} 天显示 ${bodyHistory.filteredCount} / ${bodyHistory.totalInRange} 条`
  const latestBodyEntry = [...bodyEntries].sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))[0] ?? null
  const latestRecoveryEntry = [...recoveryEntries].sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))[0] ?? null
  const selectedRecoveryLatest = selectedRecoveryEntries[0] ?? null
  const isTodayView = isTodayDateKey(targetDate)
  const showBodyFormHelperCopy =
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? true
      : window.matchMedia('(min-width: 421px)').matches
  const trendStartPoint = weightTrend.points[0] ?? null
  const trendEndPoint = weightTrend.points.at(-1) ?? null
  const signedCompletedChange =
    goalProgress.direction === 'gain'
      ? `+${goalProgress.completedChange.toFixed(1)} kg`
      : goalProgress.direction === 'cut'
        ? `-${goalProgress.completedChange.toFixed(1)} kg`
        : '0.0 kg'
  const remainingGoalCopy =
    goalProgress.direction === 'maintain' ? '已在目标区间' : `${goalProgress.remainingChange.toFixed(1)} kg`
  const trendDeltaCopy =
    weightTrend.points.length < 2 || weightTrend.delta === 0
      ? '最近 7 天基本持平'
      : `最近 7 天${weightTrend.direction === 'down' ? '下降' : '上升'} ${Math.abs(weightTrend.delta).toFixed(1)} kg`
  const showBodyInsightDetailCopy =
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? true
      : window.matchMedia('(min-width: 421px)').matches

  function resetBodyForm() {
    setEditingBodyEntryId(null)
    setWeight('71.8')
    setBodyFat('21.5')
    setWaist('79')
    setChest('')
    setHips('')
  }

  function resetRecoveryForm() {
    setEditingRecoveryEntryId(null)
    setWaterLiters('2.5')
    setSteps('9000')
    setSleepHours('7.4')
    setEnergy('4')
  }

  function startEditBody(entryId: string) {
    const entry = bodyEntries.find((candidate) => candidate.id === entryId)

    if (!entry) {
      return
    }

    setEditingBodyEntryId(entry.id)
    setWeight(String(entry.weight))
    setBodyFat(entry.bodyFat != null ? String(entry.bodyFat) : '')
    setWaist(entry.waist != null ? String(entry.waist) : '')
    setChest(entry.chest != null ? String(entry.chest) : '')
    setHips(entry.hips != null ? String(entry.hips) : '')
  }

  function startEditRecovery(entryId: string) {
    const entry = recoveryEntries.find((candidate) => candidate.id === entryId)

    if (!entry) {
      return
    }

    setEditingRecoveryEntryId(entry.id)
    setWaterLiters(String(entry.waterLiters))
    setSteps(String(entry.steps))
    setSleepHours(String(entry.sleepHours))
    setEnergy(String(entry.energy))
  }

  function handleBodySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (editingBodyEntryId) {
      updateBodyEntry(editingBodyEntryId, {
        weight: Number(weight),
        bodyFat: bodyFat ? Number(bodyFat) : null,
        waist: waist ? Number(waist) : null,
        chest: chest ? Number(chest) : null,
        hips: hips ? Number(hips) : null,
      })
      resetBodyForm()
      return
    }

    const stamp = createDateStampForDateKey(targetDate)
    addBodyEntry({
      loggedAt: stamp.iso,
      dateKey: stamp.dateKey,
      weight: Number(weight),
      bodyFat: bodyFat ? Number(bodyFat) : null,
      waist: waist ? Number(waist) : null,
      chest: chest ? Number(chest) : null,
      hips: hips ? Number(hips) : null,
    })
    resetBodyForm()
  }

  function handleRecoverySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (editingRecoveryEntryId) {
      updateRecoveryEntry(editingRecoveryEntryId, {
        waterLiters: Number(waterLiters),
        steps: Number(steps),
        sleepHours: Number(sleepHours),
        energy: Number(energy) as 1 | 2 | 3 | 4 | 5,
      })
      resetRecoveryForm()
      return
    }

    const stamp = createDateStampForDateKey(targetDate)
    addRecoveryEntry({
      loggedAt: stamp.iso,
      dateKey: stamp.dateKey,
      waterLiters: Number(waterLiters),
      steps: Number(steps),
      sleepHours: Number(sleepHours),
      energy: Number(energy) as 1 | 2 | 3 | 4 | 5,
    })
    resetRecoveryForm()
  }

  function applyRecoveryPreset(preset: (typeof recoveryPresets)[number]) {
    setWaterLiters(String(preset.waterLiters))
    setSteps(String(preset.steps))
    setSleepHours(String(preset.sleepHours))
    setEnergy(String(preset.energy))
  }

  function confirmDeleteEntry() {
    if (!pendingDelete) {
      return
    }

    if (pendingDelete.kind === 'body') {
      deleteBodyEntry(pendingDelete.id)
      if (editingBodyEntryId === pendingDelete.id) {
        resetBodyForm()
      }
    } else {
      deleteRecoveryEntry(pendingDelete.id)
      if (editingRecoveryEntryId === pendingDelete.id) {
        resetRecoveryForm()
      }
    }

    setPendingDelete(null)
  }

  return (
    <section className="feature-layout">
      <article className="feature-panel feature-panel--wide">
        <div className="panel-head">
          <div>
            <p className="section-kicker">身体</p>
            <h2>今天身体状态，一眼看清</h2>
          </div>
          <div className="pill-row">
            <span className="pill">{formatDateKeyLabel(targetDate)}</span>
          </div>
        </div>

        <div className="meal-summary-grid">
          <article className="meal-summary-card">
            <span>最新体重</span>
            <strong>{latestBodyEntry ? `${latestBodyEntry.weight.toFixed(1)} kg` : '--'}</strong>
            <small>{latestBodyEntry ? resolveDateKey(latestBodyEntry.dateKey, latestBodyEntry.loggedAt) : '还没有记录'}</small>
          </article>
          <article className="meal-summary-card">
            <span>7天变化</span>
            <strong>{weightTrend.delta.toFixed(1)} kg</strong>
            <small>向 {weightTrend.direction === 'down' ? '下' : weightTrend.direction === 'up' ? '上' : '平'} 变化</small>
          </article>
          <article className="meal-summary-card">
            <span>{isTodayView ? '今日喝水' : '当日喝水'}</span>
            <strong>{selectedRecoveryLatest ? `${selectedRecoveryLatest.waterLiters} L` : '--'}</strong>
            <small>{selectedRecoveryLatest ? `${selectedRecoveryLatest.steps} 步` : '还没有恢复记录'}</small>
          </article>
          <article className="meal-summary-card">
            <span>{isTodayView ? '今日睡眠' : '当日睡眠'}</span>
            <strong>{selectedRecoveryLatest ? `${selectedRecoveryLatest.sleepHours} h` : '--'}</strong>
            <small>{selectedRecoveryLatest ? `${selectedRecoveryLatest.energy} / 5 精力` : '补录后会显示'}</small>
          </article>
        </div>

        <div className="split-panel-grid body-insight-grid body-insight-grid--compact">
          <section className="panel-subsection body-stage-panel body-stage-panel--compact">
            <div className="meal-inline-head">
              <div>
                <p className="section-kicker">阶段对比</p>
                <h3>从起点到当前的身体变化</h3>
              </div>
              {showBodyInsightDetailCopy ? <span className="inline-note">{trendDeltaCopy}</span> : null}
            </div>

            <div aria-label="身体阶段摘要" className="signal-grid body-stage-grid body-stage-grid--rail" role="list">
              <div role="listitem">
                <span>起点体重</span>
                <strong>{goalProgress.startWeight.toFixed(1)} kg</strong>
              </div>
              <div role="listitem">
                <span>当前体重</span>
                <strong>{goalProgress.currentWeight.toFixed(1)} kg</strong>
              </div>
              <div role="listitem">
                <span>目标体重</span>
                <strong>{goalProgress.targetWeight.toFixed(1)} kg</strong>
              </div>
              <div role="listitem">
                <span>离目标还差</span>
                <strong>{remainingGoalCopy}</strong>
              </div>
            </div>

            {showBodyInsightDetailCopy ? (
              <p className="muted-copy muted-copy--compact body-stage-note">
                已较起点 {signedCompletedChange}
                {goalProgress.direction !== 'maintain' && goalProgress.nextMilestoneWeight != null
                  ? ` · 下一节点 ${goalProgress.nextMilestoneWeight.toFixed(1)} kg`
                  : ''}
              </p>
            ) : null}
          </section>

          <section className="panel-subsection body-trend-panel body-trend-panel--compact">
            <div className="meal-inline-head">
              <div>
                <p className="section-kicker">体重趋势</p>
                <h3>最近 7 天的称重曲线</h3>
              </div>
              <span className="inline-note">
                {weightTrend.points.length > 0 ? `${weightTrend.points.length} 个称重点` : '还没有趋势点'}
              </span>
            </div>

            <WeightSparkline
              ariaLabel="身体页7天体重趋势图"
              className="chart-frame--compact"
              emptyMessage="先记几次体重，这里会开始画出身体趋势。"
              gradientId="body-weight-line-gradient"
              points={weightTrend.points}
            />

            {trendStartPoint && trendEndPoint ? (
              <div aria-label="身体趋势摘要" className="signal-grid body-trend-grid body-trend-grid--rail" role="list">
                <div role="listitem">
                  <span>起始点</span>
                  <strong>{trendStartPoint.weight.toFixed(1)} kg</strong>
                  <small>{formatShortDateKey(trendStartPoint.date)}</small>
                </div>
                <div role="listitem">
                  <span>最新点</span>
                  <strong>{trendEndPoint.weight.toFixed(1)} kg</strong>
                  <small>{formatShortDateKey(trendEndPoint.date)}</small>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <div className="split-panel-grid">
          <form className="feature-form panel-subsection body-form-shell" onSubmit={handleBodySubmit}>
            <div className="meal-inline-head">
              <div>
                <p className="section-kicker">记录今天</p>
                <h3>{editingBodyEntryId ? '修改这条体重记录' : '记录今天的体重、体脂和围度'}</h3>
              </div>
              {editingBodyEntryId ? <span className="inline-note">编辑中，保存后会覆盖原记录</span> : null}
            </div>

            <div className="form-grid">
              <label className="field">
                <span>体重</span>
                <input
                  inputMode="decimal"
                  onChange={(event) => setWeight(event.target.value)}
                  required
                  type="number"
                  value={weight}
                />
              </label>
              <label className="field">
                <span>体脂</span>
                <input
                  inputMode="decimal"
                  onChange={(event) => setBodyFat(event.target.value)}
                  type="number"
                  value={bodyFat}
                />
              </label>
              <label className="field">
                <span>腰围</span>
                <input
                  inputMode="decimal"
                  onChange={(event) => setWaist(event.target.value)}
                  type="number"
                  value={waist}
                />
              </label>
              <label className="field">
                <span>胸围</span>
                <input
                  inputMode="decimal"
                  onChange={(event) => setChest(event.target.value)}
                  type="number"
                  value={chest}
                />
              </label>
              <label className="field">
                <span>臀围</span>
                <input
                  inputMode="decimal"
                  onChange={(event) => setHips(event.target.value)}
                  type="number"
                  value={hips}
                />
              </label>
            </div>

            <div className="form-actions form-actions--split">
              {editingBodyEntryId ? (
                <button className="ghost-button" onClick={resetBodyForm} type="button">
                  取消编辑
                </button>
              ) : showBodyFormHelperCopy ? (
                <span className="inline-note">补录后会同步更新当日摘要和趋势</span>
              ) : null}
              <button className="primary-button" type="submit">
                {editingBodyEntryId ? '更新体重' : '保存体重'}
              </button>
            </div>
          </form>

          <form
            className="feature-form panel-subsection body-form-shell body-form-shell--recovery body-form-shell--tight"
            onSubmit={handleRecoverySubmit}
          >
            <div className="meal-inline-head">
              <div>
                <p className="section-kicker">恢复状态</p>
                <h3>{editingRecoveryEntryId ? '修改这条恢复记录' : '记录今天的喝水、睡眠和步数'}</h3>
              </div>
              {latestRecoveryEntry ? (
                <span className="inline-note">最近一次精力 {latestRecoveryEntry.energy} / 5</span>
              ) : null}
            </div>

            <div aria-label="恢复快捷预设" className="preset-chip-row preset-chip-row--rail preset-chip-row--compact" role="list">
              {recoveryPresets.map((preset) => (
                <button
                  className="favorite-food-pill"
                  key={preset.label}
                  onClick={() => applyRecoveryPreset(preset)}
                  type="button"
                >
                  <strong>{preset.label}</strong>
                  <span>
                    {preset.waterLiters}L · {preset.steps} 步
                  </span>
                </button>
              ))}
            </div>

            <div className="form-grid">
              <label className="field">
                <span>喝水</span>
                <input
                  inputMode="decimal"
                  onChange={(event) => setWaterLiters(event.target.value)}
                  type="number"
                  value={waterLiters}
                />
              </label>
              <label className="field">
                <span>步数</span>
                <input
                  inputMode="numeric"
                  onChange={(event) => setSteps(event.target.value)}
                  type="number"
                  value={steps}
                />
              </label>
              <label className="field">
                <span>睡眠</span>
                <input
                  inputMode="decimal"
                  onChange={(event) => setSleepHours(event.target.value)}
                  type="number"
                  value={sleepHours}
                />
              </label>
            </div>

            <div className="energy-block energy-block--compact">
              <span className="field-label">精力评分</span>
              <div className="segmented-control" role="radiogroup" aria-label="精力评分">
                {['1', '2', '3', '4', '5'].map((option) => (
                  <button
                    aria-checked={energy === option}
                    className={`segment-button${energy === option ? ' is-active' : ''}`}
                    key={option}
                    onClick={() => setEnergy(option)}
                    role="radio"
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-actions form-actions--split">
              {editingRecoveryEntryId ? (
                <button className="ghost-button" onClick={resetRecoveryForm} type="button">
                  取消编辑
                </button>
              ) : showBodyFormHelperCopy ? (
                <span className="inline-note">步数、睡眠和喝水会一起影响恢复面板</span>
              ) : null}
              <button className="primary-button" type="submit">
                {editingRecoveryEntryId ? '更新恢复' : '保存恢复'}
              </button>
            </div>
          </form>
        </div>
      </article>

      <article className="feature-panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">{isTodayView ? '今日体重' : '所选日期体重'}</p>
            <h3>{selectedBodyEntries.length > 0 ? formatDateKeyLabel(targetDate) : '这一天还没有体重记录'}</h3>
          </div>
        </div>
        <div className="stack-list">
          {selectedBodyEntries.length > 0 ? (
            selectedBodyEntries.map((entry) => (
              <div className="list-item list-item--dense" key={entry.id}>
                <div>
                  <strong>{entry.weight.toFixed(1)} kg</strong>
                  <p>{resolveDateKey(entry.dateKey, entry.loggedAt)}</p>
                </div>
                <div className="entry-actions">
                  <div className="body-entry-metrics">
                    {buildBodyMeasurementItems(entry).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <div className="action-row">
                    <button
                      aria-label={`编辑 ${entry.weight.toFixed(1)} kg 体重记录`}
                      className="text-action"
                      onClick={() => startEditBody(entry.id)}
                      type="button"
                    >
                      编辑
                    </button>
                    <button
                      aria-label={`删除 ${entry.weight.toFixed(1)} kg 体重记录`}
                      className="text-action text-action--danger"
                      onClick={() =>
                        setPendingDelete({
                          kind: 'body',
                          id: entry.id,
                          label: `${entry.weight.toFixed(1)} kg`,
                        })
                      }
                      type="button"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-note">这一天还没有体重记录，可以补一次称重。</div>
          )}
        </div>
      </article>

      <article className="feature-panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">{isTodayView ? '今日恢复' : '所选日期恢复'}</p>
            <h3>{selectedRecoveryEntries.length > 0 ? '喝水、睡眠和步数' : '这一天还没有恢复记录'}</h3>
          </div>
        </div>
        <div className="stack-list">
          {selectedRecoveryEntries.length > 0 ? (
            selectedRecoveryEntries.map((entry) => (
              <div className="list-item list-item--dense" key={entry.id}>
                <div>
                  <strong>{entry.sleepHours} 小时睡眠</strong>
                  <p>{resolveDateKey(entry.dateKey, entry.loggedAt)}</p>
                </div>
                <div className="entry-actions">
                  <div className="numeric-meta">
                    <strong>{entry.steps}</strong>
                    <span>{entry.waterLiters} L 喝水</span>
                  </div>
                  <div className="action-row">
                    <button
                      aria-label={`编辑 ${entry.sleepHours} 小时睡眠恢复记录`}
                      className="text-action"
                      onClick={() => startEditRecovery(entry.id)}
                      type="button"
                    >
                      编辑
                    </button>
                    <button
                      aria-label={`删除 ${entry.sleepHours} 小时睡眠恢复记录`}
                      className="text-action text-action--danger"
                      onClick={() =>
                        setPendingDelete({
                          kind: 'recovery',
                          id: entry.id,
                          label: `${entry.sleepHours} 小时睡眠`,
                        })
                      }
                      type="button"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-note">这一天还没有恢复记录，可以补上步数、睡眠和喝水。</div>
          )}
        </div>
      </article>

      <article className="feature-panel feature-panel--wide">
        <div className="panel-head">
          <div>
            <p className="section-kicker">最近身体</p>
            <h3>最近身体记录</h3>
          </div>
          <span className="inline-note">{historySummaryLabel}</span>
        </div>
        <div className="frontstage-details history-controls-details">
          <button
            aria-expanded={showHistoryControls}
            className="frontstage-summary-button"
            onClick={() => setShowHistoryControls((current) => !current)}
            type="button"
          >
            <span>查看全部身体记录</span>
            <small>搜索、筛选和更久记录放在这里</small>
          </button>
          {showHistoryControls ? (
            <div className="workout-history-toolbar">
              <label className="search-field">
                <Search size={16} />
                <input
                  aria-label="搜索身体历史"
                  onChange={(event) => setHistoryQuery(event.target.value)}
                  placeholder="按体重、围度、睡眠、步数或喝水搜索"
                  type="search"
                  value={historyQuery}
                />
              </label>
              <div className="workout-history-filter-grid">
                <div className="segmented-control segmented-control--3">
                  {([
                    ['all', '全部'],
                    ['body', '体重'],
                    ['recovery', '恢复'],
                  ] as const).map(([value, label]) => (
                    <button
                      className={`segment-button${historyKindFilter === value ? ' is-active' : ''}`}
                      key={value}
                      onClick={() => setHistoryKindFilter(value)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="workout-history-range-row">
                  {([
                    [7, '近 7 天'],
                    [30, '近 30 天'],
                  ] as const).map(([value, label]) => (
                    <button
                      className={`segment-button${historyRangeDays === value ? ' is-active' : ''}`}
                      key={value}
                      onClick={() => setHistoryRangeDays(value)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <div className="stack-list workout-history-list">
          {bodyHistory.totalInRange === 0 ? (
            <div className="empty-note">近 {historyRangeDays} 天还没有身体记录，先补一次体重或恢复。</div>
          ) : bodyHistory.items.length === 0 ? (
            <div className="empty-note">当前筛选没有匹配结果，换个关键词或筛选条件再试。</div>
          ) : (
            bodyHistory.items.map((item) => (
              <div className="list-item list-item--dense" key={item.id}>
                <div>
                  <div className="list-meta-row">
                    <strong>{item.title}</strong>
                    <span className="pill pill--muted">{item.kind === 'body' ? '体重' : '恢复'}</span>
                    <span className="pill pill--muted">{formatShortDateKey(item.dateKey)}</span>
                  </div>
                  <small className="subtle-caption">{item.detail}</small>
                </div>
                <div className="entry-actions">
                  <div className="numeric-meta">
                    <strong>{item.kind === 'body' ? '身体记录' : '恢复记录'}</strong>
                    <span>{item.dateKey}</span>
                  </div>
                  <div className="action-row">
                    <button
                      aria-label={item.kind === 'body' ? `编辑 ${item.title} 身体记录` : `编辑 ${item.title} 恢复记录`}
                      className="text-action"
                      onClick={() => (item.kind === 'body' ? startEditBody(item.id) : startEditRecovery(item.id))}
                      type="button"
                    >
                      编辑
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </article>

      <ConfirmSheet
        confirmLabel="确认删除"
        message={
          pendingDelete
            ? pendingDelete.kind === 'body'
              ? `会删除“${pendingDelete.label}”这条身体记录，相关趋势也会随之回退。`
              : `会删除“${pendingDelete.label}”这条恢复记录，恢复面板和执行分也会一起回退。`
            : ''
        }
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDeleteEntry}
        open={pendingDelete !== null}
        title={pendingDelete?.kind === 'body' ? '删除这条体重记录？' : '删除这条恢复记录？'}
      />
    </section>
  )
}
