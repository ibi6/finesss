// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { getCorsHeaders, isAllowedOrigin, parseAllowedOrigins } from '../lib/cors.mjs'

describe('server CORS helpers', () => {
  it('allows Capacitor and local preview origins by default', () => {
    expect(isAllowedOrigin('capacitor://localhost')).toBe(true)
    expect(isAllowedOrigin('ionic://localhost')).toBe(true)
    expect(isAllowedOrigin('http://127.0.0.1:64812')).toBe(true)
  })

  it('can add explicit public origins for deployed API servers', () => {
    const allowedOrigins = parseAllowedOrigins('https://app.example.com, https://preview.example.com')

    expect(isAllowedOrigin('https://app.example.com', allowedOrigins)).toBe(true)
    expect(isAllowedOrigin('https://evil.example.com', allowedOrigins)).toBe(false)
  })

  it('builds safe CORS headers without exposing secrets', () => {
    const headers = getCorsHeaders('capacitor://localhost')

    expect(headers['Access-Control-Allow-Origin']).toBe('capacitor://localhost')
    expect(headers['Access-Control-Allow-Methods']).toContain('POST')
    expect(headers.Authorization).toBeUndefined()
    expect(headers.OPENAI_API_KEY).toBeUndefined()
  })
})
