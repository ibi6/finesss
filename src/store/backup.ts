import type { FitnessStateSnapshot } from './types'

export const BACKUP_APP_NAME = '燃刻'
export const BACKUP_FORMAT_VERSION = 1

export interface FitnessBackupPayload {
  app: typeof BACKUP_APP_NAME
  version: typeof BACKUP_FORMAT_VERSION
  exportedAt: string
  data: FitnessStateSnapshot
}

export type ParsedBackupSnapshot = Partial<FitnessStateSnapshot> &
  Pick<FitnessStateSnapshot, 'profile' | 'mealEntries' | 'workoutSessions'>

export interface ParsedBackupImport {
  source: 'wrapped' | 'legacy'
  exportedAt: string | null
  data: ParsedBackupSnapshot
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function isParsedBackupSnapshot(value: unknown): value is ParsedBackupSnapshot {
  if (!isRecord(value)) {
    return false
  }

  return (
    isRecord(value.profile) &&
    Array.isArray(value.mealEntries) &&
    Array.isArray(value.workoutSessions)
  )
}

export function createBackupPayload(
  snapshot: FitnessStateSnapshot,
  exportedAt = new Date().toISOString(),
): FitnessBackupPayload {
  return {
    app: BACKUP_APP_NAME,
    version: BACKUP_FORMAT_VERSION,
    exportedAt,
    data: snapshot,
  }
}

export function parseBackupImportText(text: string): ParsedBackupImport {
  const parsed = JSON.parse(text) as unknown

  if (isRecord(parsed) && 'data' in parsed) {
    const wrapped = parsed as Record<string, unknown>

    if (
      wrapped.app !== BACKUP_APP_NAME ||
      wrapped.version !== BACKUP_FORMAT_VERSION ||
      typeof wrapped.exportedAt !== 'string' ||
      !isParsedBackupSnapshot(wrapped.data)
    ) {
      throw new Error('invalid-backup')
    }

    return {
      source: 'wrapped',
      exportedAt: wrapped.exportedAt,
      data: wrapped.data,
    }
  }

  if (isParsedBackupSnapshot(parsed)) {
    return {
      source: 'legacy',
      exportedAt: null,
      data: parsed,
    }
  }

  throw new Error('invalid-backup')
}

export function parseBackupText(text: string): ParsedBackupSnapshot {
  return parseBackupImportText(text).data
}
