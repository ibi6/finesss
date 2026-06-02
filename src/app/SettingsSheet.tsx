import {
  CalendarClock,
  Database,
  Download,
  Gauge,
  RotateCcw,
  Settings2,
  Target,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { ConfirmSheet } from './components/ConfirmSheet'
import type { ParsedBackupImport, ParsedBackupSnapshot } from '../store/backup'
import { createBackupPayload, parseBackupImportText } from '../store/backup'
import { formatLocalDateKey, formatShortDateKey } from '../store/date'
import { buildGoalForecastSummary, buildGoalProgressSummary } from '../store/selectors'
import type { FitnessStateSnapshot, GoalMode, Profile } from '../store/types'
import { useFitnessStore } from '../store/useFitnessStore'

interface SettingsSheetProps {
  open: boolean
  onClose: () => void
}

interface PendingImportState {
  fileName: string
  source: ParsedBackupImport['source']
  exportedAt: string | null
  data: ParsedBackupSnapshot
}

function createProfileForm(profile: Profile) {
  return {
    name: profile.name,
    goalMode: profile.goalMode,
    dailyCalories: String(profile.dailyCalories),
    dailyProtein: String(profile.dailyProtein),
    dailyCarbs: String(profile.dailyCarbs),
    dailyFat: String(profile.dailyFat),
    startWeight: String(profile.startWeight),
    targetWeight: String(profile.targetWeight),
    weeklyRateGoal: String(profile.weeklyRateGoal),
  }
}

function parseNumberInput(value: string, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function formatRateLabel(value: number) {
  return `${Number(value.toFixed(2))} kg / 周`
}

function formatBackupExportDate(exportedAt: string | null) {
  if (!exportedAt) {
    return '未知'
  }

  return exportedAt.slice(0, 10)
}

const goalModeLabels: Record<GoalMode, string> = {
  cut: '减脂',
  maintain: '维持',
  gain: '增肌',
}

const goalModeDescriptions: Record<GoalMode, string> = {
  cut: '热量更克制，优先保住蛋白和训练质量。',
  maintain: '把体重波动收窄，训练、睡眠和饮食都更稳。',
  gain: '让训练和进食配合起来，往上增得更干净。',
}

const weeklyRatePresets = [
  { label: '稳一点', value: 0.3, note: '压力小一点' },
  { label: '标准', value: 0.5, note: '大多数人够用' },
  { label: '冲一段', value: 0.75, note: '阶段性提速' },
] as const

export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const {
    profile,
    foods,
    mealTemplates,
    weeklyMealPlans,
    weeklyWorkoutPlans,
    weeklyPrepCheckedKeys,
    photoEstimateRecords,
    workoutTemplates,
    mealEntries,
    workoutSessions,
    bodyEntries,
    recoveryEntries,
    updateProfile,
    replaceSnapshot,
    resetToClean,
    resetToSeed,
  } = useFitnessStore(
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
      updateProfile: state.updateProfile,
      replaceSnapshot: state.replaceSnapshot,
      resetToClean: state.resetToClean,
      resetToSeed: state.resetToSeed,
    })),
  )
  const [form, setForm] = useState(() => createProfileForm(profile))
  const [status, setStatus] = useState('')
  const [confirmCleanOpen, setConfirmCleanOpen] = useState(false)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState<PendingImportState | null>(null)
  const importInputId = useId()

  const targetDateKey = useMemo(() => formatLocalDateKey(new Date()), [])

  const previewProfile = useMemo<Profile>(
    () => ({
      name: form.name.trim() || profile.name,
      goalMode: form.goalMode,
      dailyCalories: parseNumberInput(form.dailyCalories, profile.dailyCalories),
      dailyProtein: parseNumberInput(form.dailyProtein, profile.dailyProtein),
      dailyCarbs: parseNumberInput(form.dailyCarbs, profile.dailyCarbs),
      dailyFat: parseNumberInput(form.dailyFat, profile.dailyFat),
      startWeight: parseNumberInput(form.startWeight, profile.startWeight),
      targetWeight: parseNumberInput(form.targetWeight, profile.targetWeight),
      weeklyRateGoal: parseNumberInput(form.weeklyRateGoal, profile.weeklyRateGoal),
    }),
    [form, profile],
  )

  const previewSnapshot = useMemo<FitnessStateSnapshot>(
    () => ({
      profile: previewProfile,
      foods,
      mealTemplates,
      weeklyMealPlans,
      weeklyWorkoutPlans,
      weeklyPrepCheckedKeys,
      photoEstimateRecords,
      workoutTemplates,
      mealEntries,
      workoutSessions,
      bodyEntries,
      recoveryEntries,
    }),
    [
      previewProfile,
      foods,
      mealTemplates,
      weeklyMealPlans,
      weeklyWorkoutPlans,
      weeklyPrepCheckedKeys,
      photoEstimateRecords,
      workoutTemplates,
      mealEntries,
      workoutSessions,
      bodyEntries,
      recoveryEntries,
    ],
  )

  const goalProgress = useMemo(
    () => buildGoalProgressSummary(previewSnapshot, targetDateKey),
    [previewSnapshot, targetDateKey],
  )
  const goalForecast = useMemo(
    () => buildGoalForecastSummary(previewSnapshot, targetDateKey),
    [previewSnapshot, targetDateKey],
  )

  const totalLoggedCount =
    mealEntries.length + workoutSessions.length + bodyEntries.length + recoveryEntries.length

  const forecastHeadline =
    goalForecast.status === 'active'
      ? `约 ${goalForecast.etaWeeks} 周接近目标`
      : goalForecast.status === 'paused'
        ? '先定每周节奏'
        : '已经接近目标区间'

  const forecastDetail =
    goalForecast.status === 'active'
      ? `按每周 ${formatRateLabel(goalForecast.weeklyRateGoal)}，预计 ${formatShortDateKey(goalForecast.etaDateKey ?? targetDateKey)} 接近 ${goalForecast.targetWeight.toFixed(1)} kg。`
      : goalForecast.status === 'paused'
        ? '把每周目标速度填上，系统会立刻给你算出预计周期。'
        : `当前 ${goalForecast.currentWeight.toFixed(1)} kg，接下来重点是稳住记录和恢复节奏。`

  const progressTone =
    goalForecast.direction === 'gain'
      ? 'is-teal'
      : goalForecast.status === 'active'
        ? 'is-orange'
        : 'is-muted'

  if (!open) {
    return null
  }

  function updateField<Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateProfile(previewProfile)
    setStatus('目标设置已保存。')
  }

  function exportBackup() {
    const snapshot: FitnessStateSnapshot = {
      profile,
      foods,
      mealTemplates,
      weeklyMealPlans,
      weeklyWorkoutPlans,
      weeklyPrepCheckedKeys,
      photoEstimateRecords,
      workoutTemplates,
      mealEntries,
      workoutSessions,
      bodyEntries,
      recoveryEntries,
    }

    const payload = createBackupPayload(snapshot)
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `ranke-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('备份已导出到本地文件。')
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const parsedImport = parseBackupImportText(text)

      setPendingImport({
        fileName: file.name,
        source: parsedImport.source,
        exportedAt: parsedImport.exportedAt,
        data: parsedImport.data,
      })
    } catch {
      setPendingImport(null)
      setStatus('导入失败，备份文件格式不正确。')
    } finally {
      event.target.value = ''
    }
  }

  function confirmImport() {
    if (!pendingImport) {
      return
    }

    replaceSnapshot(pendingImport.data)
    setForm(createProfileForm(pendingImport.data.profile))
    setStatus(`已导入备份：${pendingImport.fileName}`)
    setPendingImport(null)
  }

  function cancelImport() {
    setPendingImport(null)
  }

  function handleClean() {
    resetToClean()
    setForm(createProfileForm(useFitnessStore.getState().profile))
    setStatus('已清空为成品初始状态。')
    setConfirmCleanOpen(false)
  }

  function handleReset() {
    resetToSeed()
    setForm(createProfileForm(useFitnessStore.getState().profile))
    setStatus('已恢复示例数据。')
    setConfirmResetOpen(false)
  }

  const pendingImportRecordSummary = pendingImport
    ? [
        { label: '饮食记录', count: pendingImport.data.mealEntries.length },
        { label: '训练记录', count: pendingImport.data.workoutSessions.length },
        { label: '身体记录', count: pendingImport.data.bodyEntries?.length ?? 0 },
        { label: '恢复记录', count: pendingImport.data.recoveryEntries?.length ?? 0 },
      ]
    : []

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <section
        aria-label="设置面板"
        aria-modal="true"
        className="settings-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="settings-head">
          <div>
            <p className="section-kicker">设置</p>
            <h2>目标、节奏与备份</h2>
          </div>
          <button
            aria-label="关闭设置"
            className="icon-circle-button"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="settings-summary">
          <div className="settings-summary-card">
            <Settings2 size={18} />
            <div>
              <strong>{goalModeLabels[previewProfile.goalMode]}</strong>
              <span>{previewProfile.dailyCalories} kcal / 天</span>
            </div>
          </div>
          <div className="settings-summary-card settings-summary-card--accent">
            <CalendarClock size={18} />
            <div>
              <strong>{goalForecast.etaDateKey ? '目标 ETA' : '等待生成 ETA'}</strong>
              <span>
                {goalForecast.etaDateKey
                  ? `${formatShortDateKey(goalForecast.etaDateKey)} · ${goalForecast.targetWeight.toFixed(1)} kg`
                  : '把速度定下来就能看到 ETA'}
              </span>
            </div>
          </div>
        </div>

        <form className="feature-form" onSubmit={handleSubmit}>
          <section className="panel-subsection settings-workspace">
            <div className="panel-head">
              <div>
                <p className="section-kicker">目标规划</p>
                <h3>把这段节奏定清楚</h3>
              </div>
              <span className="meta-chip">{totalLoggedCount} 条记录</span>
            </div>

            <label className="field">
              <span>称呼</span>
              <input
                onChange={(event) => updateField('name', event.target.value)}
                type="text"
                value={form.name}
              />
            </label>

            <div className="settings-goal-mode-block">
              <div className="field-label">目标模式</div>
              <div className="segmented-control segmented-control--3">
                {(['cut', 'maintain', 'gain'] as GoalMode[]).map((mode) => (
                  <button
                    key={mode}
                    aria-pressed={form.goalMode === mode}
                    className={`segment-button${form.goalMode === mode ? ' is-active' : ''}`}
                    onClick={() => updateField('goalMode', mode)}
                    type="button"
                  >
                    {goalModeLabels[mode]}
                  </button>
                ))}
              </div>
              <p className="inline-note settings-inline-note">
                {goalModeDescriptions[previewProfile.goalMode]}
              </p>
            </div>

            <article className="settings-forecast-card">
              <div className="settings-forecast-head">
                <div className="settings-forecast-copy">
                  <p className="section-kicker">阶段预估</p>
                  <strong>{forecastHeadline}</strong>
                  <p className="muted-copy">{forecastDetail}</p>
                </div>
                <div className="settings-forecast-pill">
                  <Target size={16} />
                  <span>{goalProgress.progressPercent}%</span>
                </div>
              </div>

              <div className="progress-track">
                <div
                  className={`progress-fill ${progressTone}`}
                  style={{ width: `${goalProgress.progressPercent}%` }}
                />
              </div>

              <div className="settings-kpi-grid">
                <div className="settings-kpi-card">
                  <span>当前体重</span>
                  <strong>{goalForecast.currentWeight.toFixed(1)} kg</strong>
                </div>
                <div className="settings-kpi-card">
                  <span>还差</span>
                  <strong>{goalForecast.remainingChange.toFixed(1)} kg</strong>
                </div>
                <div className="settings-kpi-card">
                  <span>每周速度</span>
                  <strong>{formatRateLabel(Math.max(goalForecast.weeklyRateGoal, 0))}</strong>
                </div>
              </div>
            </article>

            <div className="settings-rate-block">
              <div className="panel-head">
                <div>
                  <p className="section-kicker">速率预设</p>
                  <h3>给自己一个能执行的节奏</h3>
                </div>
                <div className="settings-rate-badge">
                  <Gauge size={16} />
                  <span>{formatRateLabel(previewProfile.weeklyRateGoal)}</span>
                </div>
              </div>

              <div className="settings-rate-preset-grid">
                {weeklyRatePresets.map((preset) => {
                  const isActive = previewProfile.weeklyRateGoal === preset.value

                  return (
                    <button
                      key={preset.label}
                      aria-label={preset.label}
                      className={`settings-rate-preset${isActive ? ' is-active' : ''}`}
                      onClick={() => updateField('weeklyRateGoal', String(preset.value))}
                      type="button"
                    >
                      <strong>{preset.label}</strong>
                      <span>{formatRateLabel(preset.value)}</span>
                      <small>{preset.note}</small>
                    </button>
                  )
                })}
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>每周目标速度</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) => updateField('weeklyRateGoal', event.target.value)}
                    type="number"
                    value={form.weeklyRateGoal}
                  />
                </label>

                <label className="field">
                  <span>目标体重</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) => updateField('targetWeight', event.target.value)}
                    type="number"
                    value={form.targetWeight}
                  />
                </label>

                <label className="field">
                  <span>起始体重</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) => updateField('startWeight', event.target.value)}
                    type="number"
                    value={form.startWeight}
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="panel-subsection">
            <div className="panel-head">
              <div>
                <p className="section-kicker">营养目标</p>
                <h3>把每天的配额定下来</h3>
              </div>
              <div className="settings-rate-badge">
                <Database size={16} />
                <span>{previewProfile.dailyProtein} g 蛋白</span>
              </div>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>每日热量</span>
                <input
                  inputMode="numeric"
                  onChange={(event) => updateField('dailyCalories', event.target.value)}
                  type="number"
                  value={form.dailyCalories}
                />
              </label>

              <label className="field">
                <span>每日蛋白质</span>
                <input
                  inputMode="numeric"
                  onChange={(event) => updateField('dailyProtein', event.target.value)}
                  type="number"
                  value={form.dailyProtein}
                />
              </label>

              <label className="field">
                <span>每日碳水</span>
                <input
                  inputMode="numeric"
                  onChange={(event) => updateField('dailyCarbs', event.target.value)}
                  type="number"
                  value={form.dailyCarbs}
                />
              </label>

              <label className="field">
                <span>每日脂肪</span>
                <input
                  inputMode="numeric"
                  onChange={(event) => updateField('dailyFat', event.target.value)}
                  type="number"
                  value={form.dailyFat}
                />
              </label>
            </div>
          </section>

          <div className="form-actions settings-submit-row">
            <button className="primary-button" type="submit">
              保存目标
            </button>
          </div>
        </form>

        <div className="settings-actions">
          <button className="secondary-button" onClick={exportBackup} type="button">
            <Download size={16} />
            <span>导出备份</span>
          </button>

          <label className="secondary-button settings-file-button" htmlFor={importInputId}>
            <Upload size={16} />
            <span>导入备份</span>
          </label>
          <input
            accept="application/json,.json"
            hidden
            id={importInputId}
            onChange={handleImport}
            type="file"
          />

          <button
            className="ghost-button danger-button"
            onClick={() => setConfirmCleanOpen(true)}
            type="button"
          >
            <Trash2 size={16} />
            <span>清空记录</span>
          </button>

          <button
            className="ghost-button"
            onClick={() => setConfirmResetOpen(true)}
            type="button"
          >
            <RotateCcw size={16} />
            <span>恢复示例</span>
          </button>
        </div>

        {status ? <p className="settings-status">{status}</p> : null}
      </section>

      <ConfirmSheet
        confirmLabel="清空"
        message="会清空本地饮食、训练、身体、恢复、照片估算和周计划记录，并回到成品初始目标；预置常用食物和快捷模板会保留。"
        onClose={() => setConfirmCleanOpen(false)}
        onConfirm={handleClean}
        open={confirmCleanOpen}
        title="清空本地记录？"
      />
      <ConfirmSheet
        confirmLabel="仍然恢复"
        message="会用示例数据覆盖当前本地记录。更稳妥的做法是先导出一份备份。"
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleReset}
        open={confirmResetOpen}
        title="恢复示例数据？"
      />
      <ConfirmSheet
        confirmLabel="确认导入"
        message={
          pendingImport ? (
            <div className="confirm-sheet-stack">
              <p className="confirm-sheet-message">
                导入后会用备份数据覆盖当前本地记录。如果还没导出过当前数据，可以先备份一份再继续。
              </p>
              <dl className="confirm-sheet-detail-list">
                <div>
                  <dt>文件</dt>
                  <dd>{pendingImport.fileName}</dd>
                </div>
                <div>
                  <dt>用户</dt>
                  <dd>{pendingImport.data.profile.name}</dd>
                </div>
                <div>
                  <dt>导出日期</dt>
                  <dd>{formatBackupExportDate(pendingImport.exportedAt)}</dd>
                </div>
                <div>
                  <dt>备份类型</dt>
                  <dd>{pendingImport.source === 'legacy' ? '旧版兼容备份' : '版本化备份'}</dd>
                </div>
              </dl>
              <div className="confirm-sheet-record-grid">
                {pendingImportRecordSummary.map((item) => (
                  <div key={item.label} className="confirm-sheet-record-card">
                    <strong>{item.count} 条{item.label}</strong>
                    <span>会在导入后覆盖本地同类数据</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        }
        onClose={cancelImport}
        onConfirm={confirmImport}
        open={pendingImport != null}
        title="导入这份备份？"
      />
    </div>
  )
}
