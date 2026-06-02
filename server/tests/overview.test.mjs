// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { parseGitBranchOutput } from '../lib/overview.mjs'

describe('parseGitBranchOutput', () => {
  it('maps git for-each-ref output into branch entries', () => {
    const branches = parseGitBranchOutput(
      ['main|base profile', 'project/api|api profile', 'slim/minimal|'].join('\n'),
      'project/api',
    )

    expect(branches).toEqual([
      { name: 'main', isCurrent: false, lastCommit: 'base profile' },
      { name: 'project/api', isCurrent: true, lastCommit: 'api profile' },
      { name: 'slim/minimal', isCurrent: false, lastCommit: '' },
    ])
  })
})
