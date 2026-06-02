// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { maskEnvContent } from '../lib/configs.mjs'

describe('config masking', () => {
  it('masks values in env-style content while preserving keys', () => {
    const masked = maskEnvContent([
      'OPENAI_API_KEY=sk-live-secret',
      'OPENROUTER_API_KEY=or-secret',
      '',
      '# comment',
    ].join('\n'))

    expect(masked).toContain('OPENAI_API_KEY=********')
    expect(masked).toContain('OPENROUTER_API_KEY=********')
    expect(masked).toContain('# comment')
    expect(masked).not.toContain('sk-live-secret')
    expect(masked).not.toContain('or-secret')
  })
})
