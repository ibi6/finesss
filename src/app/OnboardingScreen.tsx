import { Flame } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

import type { GoalMode, Profile } from '../store/types'
import { useFitnessStore } from '../store/useFitnessStore'

interface OnboardingScreenProps {
  onComplete: () => void
}

function createOnboardingForm(profile: Profile) {
  return {
    goalMode: profile.goalMode,
    startWeight: String(profile.startWeight),
    targetWeight: String(profile.targetWeight),
    dailyCalories: String(profile.dailyCalories),
    dailyProtein: String(profile.dailyProtein),
  }
}

function parseNumberInput(value: string, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const goalModeLabels: Record<GoalMode, string> = {
  cut: '减脂',
  maintain: '维持',
  gain: '增肌',
}

const goalModeHints: Record<GoalMode, string> = {
  cut: '今天先把热量控住，蛋白吃够。',
  maintain: '保持节奏，记录饮食、训练和身体变化。',
  gain: '多吃一点，训练做扎实。',
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { profile, resetToClean, updateProfile } = useFitnessStore(
    useShallow((state) => ({
      profile: state.profile,
      resetToClean: state.resetToClean,
      updateProfile: state.updateProfile,
    })),
  )
  const [form, setForm] = useState(() => createOnboardingForm(profile))

  const previewProfile = useMemo<Partial<Profile>>(
    () => ({
      goalMode: form.goalMode,
      startWeight: parseNumberInput(form.startWeight, profile.startWeight),
      targetWeight: parseNumberInput(form.targetWeight, profile.targetWeight),
      dailyCalories: parseNumberInput(form.dailyCalories, profile.dailyCalories),
      dailyProtein: parseNumberInput(form.dailyProtein, profile.dailyProtein),
    }),
    [form, profile],
  )

  function updateField<Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function startClean() {
    resetToClean()
    updateProfile(previewProfile)
    onComplete()
  }

  return (
    <div className="onboarding-backdrop">
      <section aria-label="燃刻首次设置" aria-modal="true" className="onboarding-screen" role="dialog">
        <div className="onboarding-hero">
          <div className="onboarding-mark" aria-hidden="true">
            <Flame size={24} />
          </div>
          <div className="onboarding-copy">
            <p className="section-kicker">燃刻</p>
            <h1>先选一个目标</h1>
            <p>每天打开后，只看今天该记什么和下一步动作。</p>
          </div>
        </div>

        <div className="settings-goal-mode-block onboarding-goal-block">
          <div className="field-label">目标模式</div>
          <div className="segmented-control segmented-control--3">
            {(['cut', 'maintain', 'gain'] as GoalMode[]).map((mode) => (
              <button
                aria-pressed={form.goalMode === mode}
                className={`segment-button${form.goalMode === mode ? ' is-active' : ''}`}
                key={mode}
                onClick={() => updateField('goalMode', mode)}
                type="button"
              >
                {goalModeLabels[mode]}
              </button>
            ))}
          </div>
          <p className="onboarding-goal-hint">{goalModeHints[form.goalMode]}</p>
        </div>

        <div className="form-grid onboarding-form-grid onboarding-primary-grid">
          <label className="field">
            <span>当前体重</span>
            <input
              inputMode="decimal"
              onChange={(event) => updateField('startWeight', event.target.value)}
              type="number"
              value={form.startWeight}
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
        </div>

        <details className="onboarding-optional">
          <summary>热量和蛋白</summary>
          <div className="form-grid onboarding-form-grid">
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
              <span>每日蛋白</span>
              <input
                inputMode="numeric"
                onChange={(event) => updateField('dailyProtein', event.target.value)}
                type="number"
                value={form.dailyProtein}
              />
            </label>
          </div>
        </details>

        <div className="onboarding-actions">
          <button className="primary-button" onClick={startClean} type="button">
            开始记录
          </button>
        </div>
      </section>
    </div>
  )
}
