// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { buildCoachFallback, buildFoodVisionFallback } from '../lib/ai.mjs'

describe('AI server helpers', () => {
  it('builds local coach advice when no API key is configured', () => {
    const result = buildCoachFallback({
      dateLabel: '今天',
      calories: { eaten: 860, target: 2050 },
      protein: { eaten: 52, target: 160 },
      workout: { done: false, minutes: 0 },
      body: { latestWeight: 73, targetWeight: 66 },
      recovery: { sleepHours: 6.2, steps: 4200, waterLiters: 1.2 },
    })

    expect(result.provider).toBe('fallback')
    expect(result.title).toContain('今天')
    expect(result.actions.length).toBeGreaterThanOrEqual(3)
    expect(result.actions.some((action) => action.includes('蛋白'))).toBe(true)
  })

  it('builds a food vision fallback from frontend candidates', () => {
    const result = buildFoodVisionFallback({
      photoName: 'dinner-burger-photo',
      query: '',
      candidates: [
        {
          name: '麦辣鸡腿堡',
          servingLabel: '1 个',
          calories: 520,
          protein: 24,
          carbs: 46,
          fat: 27,
          sourceFoodId: 'food-spicy-chicken-burger',
        },
      ],
    })

    expect(result.provider).toBe('fallback')
    expect(result.estimate.foodName).toBe('麦辣鸡腿堡')
    expect(result.estimate.calories).toBe(520)
    expect(result.note).toContain('本地')
  })
})
