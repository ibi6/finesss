import fs from 'node:fs/promises'
import crypto from 'node:crypto'

import { ensureDataDir, LOG_FILE } from './paths.mjs'

async function readLogArray() {
  await ensureDataDir()

  try {
    const raw = await fs.readFile(LOG_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeLogArray(entries) {
  await ensureDataDir()
  await fs.writeFile(LOG_FILE, JSON.stringify(entries, null, 2), 'utf8')
}

export async function listLogs() {
  return readLogArray()
}

export async function getLogById(id) {
  const entries = await readLogArray()
  return entries.find((entry) => entry.id === id) ?? null
}

export async function appendLogEntry(entry) {
  const entries = await readLogArray()
  const nextEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry,
  }
  const nextEntries = [nextEntry, ...entries].slice(0, 100)
  await writeLogArray(nextEntries)
  return nextEntry
}
