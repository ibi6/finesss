import fs from 'node:fs/promises'

import { runCommand } from './commands.mjs'
import { CLAUDE_DIR, HERMES_DIR } from './paths.mjs'
import { listLogs } from './logs.mjs'

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

export function parseGitBranchOutput(stdout, currentBranch) {
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...summaryParts] = line.split('|')

      return {
        name: name.trim(),
        isCurrent: name.trim() === currentBranch,
        lastCommit: summaryParts.join('|').trim(),
      }
    })
}

export async function getBranchState() {
  const versionResult = await runCommand('ccswitch', ['--version'])

  if (versionResult.exitCode !== 0) {
    return {
      installed: false,
      currentBranch: null,
      branches: [],
      rawError: versionResult.stderr || versionResult.stdout,
    }
  }

  if (!(await pathExists(CLAUDE_DIR))) {
    return {
      installed: true,
      currentBranch: null,
      branches: [],
      rawError: 'No ~/.claude directory found',
    }
  }

  const [currentResult, branchListResult] = await Promise.all([
    runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: CLAUDE_DIR }),
    runCommand('git', ['for-each-ref', 'refs/heads', '--format=%(refname:short)|%(subject)'], {
      cwd: CLAUDE_DIR,
    }),
  ])

  if (currentResult.exitCode !== 0 || branchListResult.exitCode !== 0) {
    return {
      installed: true,
      currentBranch: null,
      branches: [],
      rawError:
        currentResult.stderr ||
        branchListResult.stderr ||
        currentResult.stdout ||
        branchListResult.stdout,
    }
  }

  const currentBranch = currentResult.stdout.trim() || null
  const branches = parseGitBranchOutput(branchListResult.stdout, currentBranch)

  return {
    installed: true,
    currentBranch,
    branches,
    rawError: '',
  }
}

export async function getHermesState() {
  const versionResult = await runCommand('hermes', ['--version'])

  return {
    installed: versionResult.exitCode === 0,
    version:
      versionResult.exitCode === 0
        ? versionResult.stdout.split('\n')[0] ?? ''
        : '未安装',
    configExists: await pathExists(`${HERMES_DIR}/config.yaml`),
    envExists: await pathExists(`${HERMES_DIR}/.env`),
    soulExists: await pathExists(`${HERMES_DIR}/SOUL.md`),
  }
}

export async function getOverviewState() {
  const [branchState, hermesState, logs] = await Promise.all([
    getBranchState(),
    getHermesState(),
    listLogs(),
  ])

  return {
    ccswitchInstalled: branchState.installed,
    currentBranch: branchState.currentBranch,
    branchCount: branchState.branches.length,
    hermesInstalled: hermesState.installed,
    hermesVersion: hermesState.version,
    lastAction: logs[0] ?? null,
  }
}
