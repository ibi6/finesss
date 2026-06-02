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

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { profile, resetToClean, resetToSeed, updateProfile } = useFitnessStore(
    useShallow((state) => ({
      profile: state.profile,
      resetToClean: state.resetToClean,
      resetToSeed: state.resetToSeed,
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

  function completeWith(mode: 'clean' | 'demo') {
    if (mode === 'demo') {
      resetToSeed()
    } else {
      resetToClean()
    }

    updateProfile(previewProfile)
    onComplete()
  }

  return (
    <div className="onboarding-backdrop">
      <section aria-label="燃刻首次设置" aria-modal="true" className="onboarding-screen" role="dialog">
        <div className="onboarding-mark" aria-hidden="true">
          <Flame size={24} />
        </div>
        <div className="onboarding-copy">
          <p className="section-kicker">燃刻</p>
          <h1>先把燃刻调成你的节奏</h1>
          <p>设置几个核心目标，之后每天只管记录饮食、训练和身体状态。</p>
        </div>

        <div className="settings-goal-mode-block">
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
        </div>

        <div className="form-grid onboarding-form-grid">
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

        <div className="onboarding-actions">
          <button className="primary-button" onClick={() => completeWith('clean')} type="button">
            空白开始
          </button>
          <button className="secondary-button" onClick={() => completeWith('demo')} type="button">
            载入示例
          </button>
        </div>
      </section>
    </div>
  )
}
