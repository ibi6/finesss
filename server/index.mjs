import express from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'

import { readConfigTarget, listConfigTargets, writeConfigTarget } from './lib/configs.mjs'
import { appendLogEntry, getLogById, listLogs } from './lib/logs.mjs'
import { DIST_DIR } from './lib/paths.mjs'
import { getBranchState, getHermesState, getOverviewState } from './lib/overview.mjs'
import { runAction } from './lib/commands.mjs'

const app = express()
const host = process.env.CONSOLE_HOST ?? '127.0.0.1'
const port = Number(process.env.CONSOLE_PORT ?? '4318')

app.use(express.json({ limit: '1mb' }))

function asyncRoute(handler) {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

async function runLoggedAction(tool, action, payload = {}) {
  const result = await runAction(action, payload)
  const summary = result.stdout || result.stderr || result.command
  const logEntry = await appendLogEntry({
    tool,
    action,
    command: result.command,
    exitCode: result.exitCode,
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    summary,
  })

  return { ...result, logEntry }
}

app.get('/api/system/overview', asyncRoute(async (_req, res) => {
  res.json(await getOverviewState())
}))

app.get('/api/ccswitch/status', asyncRoute(async (_req, res) => {
  res.json(await getBranchState())
}))

app.get('/api/ccswitch/branches', asyncRoute(async (_req, res) => {
  res.json(await getBranchState())
}))

app.post('/api/ccswitch/switch', asyncRoute(async (req, res) => {
  res.json(await runLoggedAction('ccswitch', 'ccswitch.switch', req.body))
}))

app.post('/api/ccswitch/create', asyncRoute(async (req, res) => {
  res.json(await runLoggedAction('ccswitch', 'ccswitch.create', req.body))
}))

app.post('/api/ccswitch/delete', asyncRoute(async (req, res) => {
  res.json(await runLoggedAction('ccswitch', 'ccswitch.delete', req.body))
}))

app.post('/api/ccswitch/auto', asyncRoute(async (_req, res) => {
  res.json(await runLoggedAction('ccswitch', 'ccswitch.auto'))
}))

app.post('/api/ccswitch/test', asyncRoute(async (_req, res) => {
  res.json(await runLoggedAction('ccswitch', 'ccswitch.test'))
}))

app.get('/api/hermes/status', asyncRoute(async (_req, res) => {
  res.json(await getHermesState())
}))

app.post('/api/hermes/version', asyncRoute(async (_req, res) => {
  res.json(await runLoggedAction('hermes', 'hermes.version'))
}))

app.get('/api/configs', asyncRoute(async (_req, res) => {
  res.json(await listConfigTargets())
}))

app.get('/api/configs/:name', asyncRoute(async (req, res) => {
  res.json(await readConfigTarget(req.params.name))
}))

app.post('/api/configs/:name', asyncRoute(async (req, res) => {
  const next = await writeConfigTarget(req.params.name, req.body.content ?? '')
  await appendLogEntry({
    tool: 'config',
    action: `config.write.${req.params.name}`,
    command: `write ${req.params.name}`,
    exitCode: 0,
    status: 'success',
    stdout: '',
    stderr: '',
    summary: `Updated ${req.params.name}`,
  })
  res.json(next)
}))

app.get('/api/logs', asyncRoute(async (_req, res) => {
  res.json({ entries: await listLogs() })
}))

app.get('/api/logs/:id', asyncRoute(async (req, res) => {
  const entry = await getLogById(req.params.id)
  if (!entry) {
    res.status(404).json({ error: 'Log entry not found' })
    return
  }
  res.json(entry)
}))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use(express.static(DIST_DIR))

app.get('/{*splat}', asyncRoute(async (_req, res) => {
  const indexPath = path.join(DIST_DIR, 'index.html')
  const html = await fs.readFile(indexPath, 'utf8')
  res.type('html').send(html)
}))

app.listen(port, host, () => {
  console.log(`CCSwitch Hermes Console listening on http://${host}:${port}`)
})
