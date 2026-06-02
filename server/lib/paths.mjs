import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'

export const HOME_DIR = os.homedir()
export const CLAUDE_DIR = path.join(HOME_DIR, '.claude')
export const HERMES_DIR = path.join(HOME_DIR, '.hermes')
export const DATA_DIR = path.join(HOME_DIR, '.ccswitch-hermes-console')
export const LOG_FILE = path.join(DATA_DIR, 'logs.json')
export const DIST_DIR = path.resolve(process.cwd(), 'dist')

export const CONFIG_TARGETS = {
  'claude-root': {
    id: 'claude-root',
    label: '~/.claude',
    path: CLAUDE_DIR,
    sensitive: false,
    kind: 'directory',
  },
  'hermes-config': {
    id: 'hermes-config',
    label: 'config.yaml',
    path: path.join(HERMES_DIR, 'config.yaml'),
    sensitive: false,
    kind: 'file',
  },
  'hermes-env': {
    id: 'hermes-env',
    label: '.env',
    path: path.join(HERMES_DIR, '.env'),
    sensitive: true,
    kind: 'file',
  },
  'hermes-soul': {
    id: 'hermes-soul',
    label: 'SOUL.md',
    path: path.join(HERMES_DIR, 'SOUL.md'),
    sensitive: false,
    kind: 'file',
  },
}

export async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}
