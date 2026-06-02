import type { EnergyLevel } from './types'

export interface RecoveryPreset {
  label: '通勤日' | '标准日' | '高压日'
  waterLiters: number
  steps: number
  sleepHours: number
  energy: EnergyLevel
}

export const recoveryPresets: RecoveryPreset[] = [
  {
    label: '通勤日',
    waterLiters: 2.2,
    steps: 7000,
    sleepHours: 7.0,
    energy: 3,
  },
  {
    label: '标准日',
    waterLiters: 2.8,
    steps: 9000,
    sleepHours: 7.5,
    energy: 4,
  },
  {
    label: '高压日',
    waterLiters: 3.2,
    steps: 6000,
    sleepHours: 8.0,
    energy: 2,
  },
]

export type RecoveryPresetLabel = RecoveryPreset['label']

export function getRecoveryPresetByLabel(label: RecoveryPresetLabel | null | undefined) {
  if (!label) {
    return null
  }

  return recoveryPresets.find((preset) => preset.label === label) ?? null
}
