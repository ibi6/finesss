import { createSeedSnapshot } from '../store/seed'
import {
  BACKUP_APP_NAME,
  BACKUP_FORMAT_VERSION,
  createBackupPayload,
  parseBackupImportText,
  parseBackupText,
} from '../store/backup'

describe('backup helpers', () => {
  it('creates a versioned backup payload around the snapshot', () => {
    const snapshot = createSeedSnapshot()
    const exportedAt = '2026-05-31T04:00:00.000Z'

    expect(createBackupPayload(snapshot, exportedAt)).toEqual({
      app: BACKUP_APP_NAME,
      version: BACKUP_FORMAT_VERSION,
      exportedAt,
      data: snapshot,
    })
  })

  it('parses wrapped backups and legacy raw snapshots', () => {
    const snapshot = createSeedSnapshot()
    const wrapped = JSON.stringify({
      app: BACKUP_APP_NAME,
      version: BACKUP_FORMAT_VERSION,
      exportedAt: '2026-05-31T04:00:00.000Z',
      data: snapshot,
    })

    expect(parseBackupText(wrapped)).toEqual(snapshot)
    expect(parseBackupText(JSON.stringify(snapshot))).toEqual(snapshot)
  })

  it('extracts backup metadata for confirmation previews', () => {
    const snapshot = createSeedSnapshot()
    const wrapped = JSON.stringify({
      app: BACKUP_APP_NAME,
      version: BACKUP_FORMAT_VERSION,
      exportedAt: '2026-05-31T04:00:00.000Z',
      data: snapshot,
    })

    expect(parseBackupImportText(wrapped)).toEqual({
      source: 'wrapped',
      exportedAt: '2026-05-31T04:00:00.000Z',
      data: snapshot,
    })

    expect(parseBackupImportText(JSON.stringify(snapshot))).toEqual({
      source: 'legacy',
      exportedAt: null,
      data: snapshot,
    })
  })

  it('rejects malformed backup payloads', () => {
    expect(() =>
      parseBackupText(
        JSON.stringify({
          app: BACKUP_APP_NAME,
          version: BACKUP_FORMAT_VERSION,
          data: { profile: { name: 'broken' } },
        }),
      ),
    ).toThrow('invalid-backup')
  })
})
