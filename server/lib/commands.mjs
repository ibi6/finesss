import { spawn } from 'node:child_process'
import path from 'node:path'

import { HOME_DIR } from './paths.mjs'

const SAFE_BRANCH_RE = /^[A-Za-z0-9._/-]+$/

export function isSafeBranchName(branch) {
  if (typeof branch !== 'string' || branch.length === 0) {
    return false
  }

  if (!SAFE_BRANCH_RE.test(branch)) {
    return false
  }

  if (branch.includes('..') || branch.includes('//')) {
    return false
  }

  if (branch.startsWith('/') || branch.endsWith('/')) {
    return false
  }

  return true
}

export function buildActionCommand(action, payload = {}) {
  switch (action) {
    case 'ccswitch.current':
      return ['ccswitch', 'current']
    case 'ccswitch.branches':
      return ['ccswitch', 'list', '--json']
    case 'ccswitch.switch': {
      if (!isSafeBranchName(payload.branch)) {
        throw new Error('Invalid branch name')
      }

      return ['ccswitch', 'switch', payload.branch]
    }
    case 'ccswitch.create': {
      if (!isSafeBranchName(payload.branch)) {
        throw new Error('Invalid branch name')
      }

      return ['ccswitch', 'create', payload.branch, '--no-edit']
    }
    case 'ccswitch.delete': {
      if (!isSafeBranchName(payload.branch)) {
        throw new Error('Invalid branch name')
      }

      return ['ccswitch', 'delete', payload.branch, '--force']
    }
    case 'ccswitch.auto':
      return ['ccswitch', 'auto']
    case 'ccswitch.test':
      return ['ccswitch', 'test']
    case 'hermes.version':
      return ['hermes', '--version']
    default:
      throw new Error(`Unsupported action: ${action}`)
  }
}

export async function runCommand(bin, args = [], options = {}) {
  return new Promise((resolve) => {
    const localBinDir = path.join(HOME_DIR, '.local', 'bin')
    const child = spawn(bin, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        HOME: HOME_DIR,
        PATH: `${localBinDir}${path.delimiter}${process.env.PATH ?? ''}`,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', (error) => {
      resolve({
        command: [bin, ...args].join(' '),
        exitCode: 127,
        status: 'error',
        stdout,
        stderr: stderr || error.message,
      })
    })

    child.on('close', (code) => {
      resolve({
        command: [bin, ...args].join(' '),
        exitCode: code ?? 1,
        status: code === 0 ? 'success' : 'error',
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      })
    })
  })
}

export async function runAction(action, payload = {}) {
  const [bin, ...args] = buildActionCommand(action, payload)
  const result = await runCommand(bin, args)
  return {
    action,
    ...result,
  }
}
