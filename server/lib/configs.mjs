import fs from 'node:fs/promises'
import path from 'node:path'

import { CONFIG_TARGETS } from './paths.mjs'

export function maskEnvContent(content) {
  return content
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()

      if (trimmed.length === 0 || trimmed.startsWith('#') || !line.includes('=')) {
        return line
      }

      const [key] = line.split('=', 1)
      return `${key}=********`
    })
    .join('\n')
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

export async function listConfigTargets() {
  const targets = Object.values(CONFIG_TARGETS)
  return Promise.all(
    targets.map(async (target) => ({
      id: target.id,
      label: target.label,
      path: target.path,
      exists: await exists(target.path),
    })),
  )
}

export async function readConfigTarget(name) {
  const target = CONFIG_TARGETS[name]

  if (!target) {
    throw new Error('Unknown config target')
  }

  const targetExists = await exists(target.path)

  if (!targetExists) {
    return {
      id: target.id,
      label: target.label,
      path: target.path,
      exists: false,
      content: '',
      masked: false,
    }
  }

  if (target.kind === 'directory') {
    const entries = await fs.readdir(target.path, { withFileTypes: true })
    const content = entries
      .map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name))
      .sort((a, b) => a.localeCompare(b))
      .join('\n')

    return {
      id: target.id,
      label: target.label,
      path: target.path,
      exists: true,
      content,
      masked: false,
    }
  }

  const raw = await fs.readFile(target.path, 'utf8')
  const content = target.sensitive ? maskEnvContent(raw) : raw

  return {
    id: target.id,
    label: target.label,
    path: target.path,
    exists: true,
    content,
    masked: target.sensitive,
  }
}

export async function writeConfigTarget(name, content) {
  const target = CONFIG_TARGETS[name]

  if (!target || target.kind !== 'file') {
    throw new Error('Config target is not writable')
  }

  await fs.mkdir(path.dirname(target.path), { recursive: true })
  await fs.writeFile(target.path, content, 'utf8')

  return readConfigTarget(name)
}
