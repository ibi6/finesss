import { describe, expect, it } from 'vitest'

import { buildPhotoEstimateAnalysis } from '../app/components/photoEstimate'
import { createSeedSnapshot } from '../store/seed'

describe('photo estimate analysis', () => {
  it('prioritizes milk tea when the query and file name point to a drink', () => {
    const foods = createSeedSnapshot().foods
    const analysis = buildPhotoEstimateAnalysis({
      foods,
      query: '奶茶',
      fileName: 'milk-tea-order',
      portionHint: 'large',
      sceneHint: 'auto',
    })

    expect(analysis.scene).toBe('drink')
    expect(analysis.candidates[0]?.food.name).toBe('奶茶')
    expect(analysis.candidates[0]?.suggestedServings).toBeGreaterThan(1)
  })

  it('keeps chicken rice among the top candidates for a meal-oriented query', () => {
    const foods = createSeedSnapshot().foods
    const analysis = buildPhotoEstimateAnalysis({
      foods,
      query: '鸡胸饭',
      fileName: 'lunch-meal',
      portionHint: 'regular',
      sceneHint: 'auto',
    })

    expect(analysis.scene).toBe('meal')
    expect(analysis.candidates.some((candidate) => candidate.food.name === '鸡胸饭')).toBe(true)
    expect(analysis.candidates[0]?.confidence).toBeGreaterThan(30)
  })

  it('recognizes common English aliases and maps them to local foods', () => {
    const foods = createSeedSnapshot().foods
    const analysis = buildPhotoEstimateAnalysis({
      foods,
      query: 'bubble tea',
      fileName: 'post-gym-drink',
      portionHint: 'regular',
      sceneHint: 'auto',
    })

    expect(analysis.scene).toBe('drink')
    expect(analysis.keywords).toContain('奶茶')
    expect(analysis.candidates[0]?.food.name).toBe('奶茶')
  })

  it('respects a manual scene hint when the query itself is ambiguous', () => {
    const foods = createSeedSnapshot().foods
    const analysis = buildPhotoEstimateAnalysis({
      foods,
      query: '鸡胸',
      fileName: 'after-training',
      portionHint: 'regular',
      sceneHint: 'protein',
    })

    expect(analysis.scene).toBe('protein')
    expect(analysis.sceneMode).toBe('manual')
    expect(analysis.candidates[0]?.reasons).toContain('符合你手动指定的场景')
  })

  it('keeps solid yogurt bowls out of the top drink candidates', () => {
    const foods = createSeedSnapshot().foods
    const analysis = buildPhotoEstimateAnalysis({
      foods,
      query: '',
      fileName: '',
      portionHint: 'regular',
      sceneHint: 'drink',
    })

    expect(analysis.candidates[0]?.food.name).toBe('奶茶')
  })

  it('falls back to common reference foods when the library has no direct match', () => {
    const foods = createSeedSnapshot().foods
    const analysis = buildPhotoEstimateAnalysis({
      foods,
      query: '寿司',
      fileName: 'dinner-photo',
      portionHint: 'regular',
      sceneHint: 'auto',
    })

    expect(analysis.scene).toBe('meal')
    expect(analysis.candidates[0]?.food.name).toBe('寿司拼盘')
    expect(analysis.candidates[0]?.source).toBe('reference')
  })

  it('uses the active meal context to bias empty-query candidates toward breakfast foods', () => {
    const foods = createSeedSnapshot().foods
    const analysis = buildPhotoEstimateAnalysis({
      foods,
      query: '',
      fileName: '',
      portionHint: 'regular',
      sceneHint: 'auto',
      mealTypeHint: 'breakfast',
    } as never)

    expect(analysis.candidates[0]?.food.name).toBe('希腊酸奶碗')
    expect(analysis.quickKeywords).toContain('燕麦片')
    expect(analysis.candidates[0]?.reasons.some((reason) => reason.includes('早餐'))).toBe(true)
  })

  it('surfaces greek yogurt bowls from noisy breakfast photo file names without a manual query', () => {
    const foods = createSeedSnapshot().foods
    const analysis = buildPhotoEstimateAnalysis({
      foods,
      query: '',
      fileName: 'IMG_20260531_073012_wechat_camera_breakfast_greek_yogurt_bowl_photo',
      portionHint: 'regular',
      sceneHint: 'auto',
    })

    expect(analysis.candidates[0]?.food.name).toBe('希腊酸奶碗')
    expect(analysis.quickKeywords).toContain('水煮蛋')
  })

  it('adds a workout recovery reason for post-workout shake file names', () => {
    const foods = createSeedSnapshot().foods
    const analysis = buildPhotoEstimateAnalysis({
      foods,
      query: '',
      fileName: 'post-workout-shake',
      portionHint: 'regular',
      sceneHint: 'auto',
    })

    expect(analysis.candidates[0]?.food.name).toBe('蛋白奶昔')
    expect(analysis.candidates[0]?.reasons.some((reason) => reason.includes('训练后'))).toBe(true)
  })

  it('adds a late-night reason for burger file names and prefers local foods', () => {
    const foods = createSeedSnapshot().foods
    const analysis = buildPhotoEstimateAnalysis({
      foods,
      query: '',
      fileName: 'late-night-burger-set',
      portionHint: 'regular',
      sceneHint: 'auto',
    })

    expect(analysis.candidates[0]?.food.name).toBe('麦辣鸡腿堡')
    expect(analysis.candidates[0]?.source).toBe('library')
    expect(analysis.candidates[0]?.reasons.some((reason) => reason.includes('夜宵'))).toBe(true)
  })

  it('exposes file-context clues and breakfast quick chips even when the active meal type is dinner', () => {
    const foods = createSeedSnapshot().foods
    const analysis = buildPhotoEstimateAnalysis({
      foods,
      query: '',
      fileName: 'IMG_20260531_073012_wechat_camera_breakfast_greek_yogurt_bowl_photo',
      portionHint: 'regular',
      sceneHint: 'auto',
      mealTypeHint: 'dinner',
    } as never)

    expect((analysis as { contextClues?: string[] }).contextClues).toContain('早餐')
    expect(analysis.quickKeywords).toContain('燕麦片')
    expect(analysis.candidates[0]?.food.name).toBe('希腊酸奶碗')
  })

  it('exposes a post-workout context clue for shake uploads', () => {
    const foods = createSeedSnapshot().foods
    const analysis = buildPhotoEstimateAnalysis({
      foods,
      query: '',
      fileName: 'post-workout-shake',
      portionHint: 'regular',
      sceneHint: 'auto',
    })

    expect((analysis as { contextClues?: string[] }).contextClues).toContain('训练后')
  })

  it('ignores generic camera food tokens from file names', () => {
    const foods = createSeedSnapshot().foods
    const analysis = buildPhotoEstimateAnalysis({
      foods,
      query: '',
      fileName: 'IMG_20260602_132012_camera_food',
      portionHint: 'regular',
      sceneHint: 'auto',
    })

    expect(analysis.keywords).not.toContain('food')
    expect(analysis.keywords).toHaveLength(0)
  })
})
