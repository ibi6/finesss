function normalizeApiPath(path: string) {
  return path.startsWith('/') ? path : `/${path}`
}

function normalizeApiBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, '')
}

export function buildApiUrl(path: string, baseUrl = import.meta.env.VITE_API_BASE_URL ?? '') {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = normalizeApiPath(path)
  const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl)

  return normalizedBaseUrl ? `${normalizedBaseUrl}${normalizedPath}` : normalizedPath
}
