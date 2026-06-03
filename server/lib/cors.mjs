const LOCAL_PREVIEW_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i
const CAPACITOR_ORIGINS = new Set(['capacitor://localhost', 'ionic://localhost'])

export function parseAllowedOrigins(value = process.env.SERVER_CORS_ORIGINS ?? process.env.CORS_ORIGINS ?? '') {
  return new Set(
    value
      .split(',')
      .map((origin) => origin.trim().replace(/\/+$/, ''))
      .filter(Boolean),
  )
}

export function isAllowedOrigin(origin, allowedOrigins = parseAllowedOrigins()) {
  if (!origin) {
    return false
  }

  const normalizedOrigin = origin.trim().replace(/\/+$/, '')

  return (
    CAPACITOR_ORIGINS.has(normalizedOrigin) ||
    LOCAL_PREVIEW_ORIGIN_PATTERN.test(normalizedOrigin) ||
    allowedOrigins.has(normalizedOrigin)
  )
}

export function getCorsHeaders(origin, allowedOrigins = parseAllowedOrigins()) {
  if (!isAllowedOrigin(origin, allowedOrigins)) {
    return {}
  }

  return {
    'Access-Control-Allow-Origin': origin.trim().replace(/\/+$/, ''),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

export function applyCors(req, res, next) {
  const headers = getCorsHeaders(req.headers.origin)

  for (const [name, value] of Object.entries(headers)) {
    res.setHeader(name, value)
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  next()
}
