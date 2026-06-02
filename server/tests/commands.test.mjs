// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { buildActionCommand, isSafeBranchName } from '../lib/commands.mjs'

describe('command safety helpers', () => {
  it('accepts safe branch names and rejects suspicious input', () => {
    expect(isSafeBranchName('project/api')).toBe(true)
    expect(isSafeBranchName('slim/minimal')).toBe(true)
    expect(isSafeBranchName('feature with spaces')).toBe(false)
    expect(isSafeBranchName('../escape')).toBe(false)
    expect(isSafeBranchName('main; rm -rf /')).toBe(false)
  })

  it('builds only whitelisted commands', () => {
    expect(buildActionCommand('ccswitch.current')).toEqual(['ccswitch', 'current'])
    expect(buildActionCommand('ccswitch.switch', { branch: 'project/api' })).toEqual([
      'ccswitch',
      'switch',
      'project/api',
    ])
    expect(() => buildActionCommand('shell.exec')).toThrow(/Unsupported action/)
  })
})
