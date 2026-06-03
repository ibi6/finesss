import { buildApiUrl } from '../app/services/api'

describe('API URL builder', () => {
  it('keeps relative API paths when no backend base URL is configured', () => {
    expect(buildApiUrl('/api/ai/coach')).toBe('/api/ai/coach')
    expect(buildApiUrl('api/ai/food-vision')).toBe('/api/ai/food-vision')
  })

  it('targets a configured backend base URL for APK builds', () => {
    expect(buildApiUrl('/api/ai/coach', 'https://api.example.com/')).toBe(
      'https://api.example.com/api/ai/coach',
    )
    expect(buildApiUrl('api/ai/food-vision', 'https://api.example.com/base')).toBe(
      'https://api.example.com/base/api/ai/food-vision',
    )
  })
})
