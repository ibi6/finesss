import type { Food, MealType } from '../../store/types'

export type EstimateScene = 'meal' | 'drink' | 'protein' | 'snack'
export type EstimatePortion = 'light' | 'regular' | 'large'
export type EstimateSceneHint = EstimateScene | 'auto'

export interface PhotoEstimateCandidate {
  food: Food
  confidence: number
  reasons: string[]
  suggestedServings: number
  scene: EstimateScene
  source: 'library' | 'reference'
}

export interface PhotoEstimateAnalysis {
  scene: EstimateScene
  keywords: string[]
  candidates: PhotoEstimateCandidate[]
  contextClues: string[]
  quickKeywords: string[]
  sceneMode: 'auto' | 'manual'
}

interface EstimatePoolItem {
  food: Food
  keywords: string[]
  scene: EstimateScene
  source: 'library' | 'reference'
}

const sceneKeywordMap: Record<EstimateScene, string[]> = {
  meal: [
    '米饭',
    '鸡胸',
    '牛肉',
    '饭',
    '沙拉',
    '盖饭',
    '便当',
    '餐',
    '寿司',
    '面',
    '汉堡',
    '麦当劳',
    '麦辣',
    '鸡腿堡',
    'meal',
    'rice',
    'bowl',
    'sushi',
    'noodle',
    'burger',
    'hamburger',
  ],
  drink: [
    '奶茶',
    '咖啡',
    '可乐',
    '饮料',
    '豆浆',
    '酸奶',
    '茶',
    '果汁',
    '拿铁',
    'milk',
    'tea',
    'coffee',
    'drink',
    'juice',
    'latte',
  ],
  protein: [
    '鸡胸',
    '鸡胸肉',
    '牛肉',
    '蛋白',
    '蛋白奶昔',
    '酸奶',
    '三文鱼',
    '豆腐',
    '蛋',
    'salmon',
    'tofu',
    'protein',
    'shake',
  ],
  snack: [
    '香蕉',
    '红薯',
    '燕麦',
    '水果',
    '零食',
    '蛋糕',
    '坚果',
    'snack',
    'banana',
    'oat',
    'cake',
  ],
}

const sceneQuickKeywordMap: Record<EstimateScene, string[]> = {
  meal: ['便当', '寿司', '麻辣烫', '牛肉面'],
  drink: ['奶茶', '拿铁', '冰美式', '果汁'],
  protein: ['鸡胸肉', '蛋白奶昔', '卤牛肉', '豆腐'],
  snack: ['香蕉', '酸奶', '蛋糕', '坚果'],
}

const mealTypeCueKeywordMap: Record<MealType, string[]> = {
  breakfast: ['早餐', 'breakfast', 'morning', 'brunch'],
  lunch: ['午餐', 'lunch', 'noon'],
  dinner: ['晚餐', 'dinner', 'supper'],
  snack: ['加餐', 'snack', 'dessert', 'tea time'],
}

const postWorkoutCueKeywords = [
  'post workout',
  'after workout',
  'after training',
  'post gym',
  'after gym',
  'recovery',
  '训练后',
  '练后',
  '健身后',
]

const lateNightCueKeywords = ['late night', 'latenight', 'midnight', 'night snack', '夜宵', '深夜']

const noisyFilenameTokens = new Set([
  'img',
  'image',
  'photo',
  'pic',
  'camera',
  'screenshot',
  'screen',
  'wechat',
  'weixin',
  'wx',
  'food',
  'foods',
  'mmexport',
  'pxl',
  'dsc',
])

const contextualTokens = new Set([
  'breakfast',
  'morning',
  'brunch',
  'lunch',
  'noon',
  'dinner',
  'supper',
  'snack',
  'dessert',
  'night',
  'late',
  'latenight',
  'midnight',
  'post',
  'after',
  'before',
  'pre',
  'gym',
  'training',
  'workout',
  'recovery',
])

const mealTypeQuickKeywordMap: Record<MealType, string[]> = {
  breakfast: ['希腊酸奶碗', '燕麦片', '水煮蛋', '香蕉'],
  lunch: ['鸡胸饭', '牛肉饭', '水饺', '蛋炒饭'],
  dinner: ['三文鱼沙拉', '牛肉饭', '水饺', '蛋炒饭'],
  snack: ['香蕉', '奶茶', '蛋白奶昔', '水果酸奶杯'],
}

const mealTypeAffinityKeywordMap: Record<MealType, string[]> = {
  breakfast: ['希腊酸奶', '酸奶', '燕麦', '鸡蛋', '香蕉'],
  lunch: ['鸡胸饭', '牛肉饭', '米饭', '水饺', '蛋炒饭'],
  dinner: ['三文鱼', '牛肉饭', '水饺', '蛋炒饭', '沙拉'],
  snack: ['香蕉', '奶茶', '蛋白奶昔', '酸奶', '蛋糕'],
}

const mealTypeSceneAffinityMap: Record<MealType, EstimateScene[]> = {
  breakfast: ['protein', 'snack', 'meal'],
  lunch: ['meal', 'protein'],
  dinner: ['meal', 'protein'],
  snack: ['snack', 'drink', 'protein'],
}

const keywordAliasMap: Record<string, string[]> = {
  奶茶: ['milk tea', 'bubble tea', 'boba', 'boba tea'],
  咖啡: ['americano', 'cappuccino', 'espresso', 'coffee'],
  拿铁: ['latte'],
  可乐: ['cola', 'coke', 'soda'],
  果汁: ['juice'],
  酸奶: ['yogurt', 'yoghurt', 'greek yogurt'],
  鸡胸: ['chicken breast', 'chicken'],
  牛肉: ['beef', 'steak', 'beef bowl'],
  三文鱼: ['salmon'],
  豆腐: ['tofu'],
  燕麦: ['oats', 'oatmeal'],
  红薯: ['sweet potato'],
  水饺: ['dumpling', 'dumplings'],
  香蕉: ['banana'],
  米饭: ['rice', 'rice bowl'],
  沙拉: ['salad'],
  寿司: ['sushi'],
  蛋白奶昔: ['protein shake', 'whey shake'],
  麻辣烫: ['malatang', 'spicy hotpot'],
  牛肉面: ['beef noodle', 'ramen'],
  汉堡: ['burger'],
  麦辣鸡腿堡: ['麦辣', '麦当劳', '鸡腿堡', 'burger', 'hamburger', 'spicy chicken burger'],
  巨无霸: ['麦当劳', 'big mac', 'burger', 'hamburger'],
  中薯条: ['麦当劳', '薯条', 'fries', 'french fries'],
  麦乐鸡: ['麦当劳', '鸡块', 'nuggets', 'chicken nuggets'],
  肉包子: ['包子', 'baozi', 'bun'],
  生椰拿铁: ['瑞幸', '拿铁', 'luckin', 'coconut latte'],
}

function textIncludesAny(text: string, candidates: string[]) {
  return candidates.some((candidate) => text.includes(normalizeText(candidate)))
}

function detectMealTypeCue(text: string) {
  const normalized = normalizeText(text)

  return (Object.keys(mealTypeCueKeywordMap) as MealType[]).find((mealType) =>
    textIncludesAny(normalized, mealTypeCueKeywordMap[mealType]),
  )
}

function hasPostWorkoutCue(text: string) {
  return textIncludesAny(normalizeText(text), postWorkoutCueKeywords)
}

function hasLateNightCue(text: string) {
  return textIncludesAny(normalizeText(text), lateNightCueKeywords)
}

function getMealTypeClueLabel(mealType: MealType) {
  if (mealType === 'breakfast') {
    return '早餐'
  }

  if (mealType === 'lunch') {
    return '午餐'
  }

  if (mealType === 'dinner') {
    return '晚餐'
  }

  return '加餐'
}

function buildContextClues({
  mealTypeCue,
  postWorkoutCue,
  lateNightCue,
}: {
  mealTypeCue?: MealType
  postWorkoutCue: boolean
  lateNightCue: boolean
}) {
  const clues: string[] = []

  if (mealTypeCue) {
    clues.push(getMealTypeClueLabel(mealTypeCue))
  }

  if (postWorkoutCue) {
    clues.push('训练后')
  }

  if (lateNightCue) {
    clues.push('夜宵')
  }

  return clues
}

const referenceFoods: EstimatePoolItem[] = [
  {
    food: {
      id: 'reference-sushi-platter',
      name: '寿司拼盘',
      servingLabel: '1 盒',
      calories: 460,
      protein: 20,
      carbs: 58,
      fat: 16,
      isFavorite: false,
      lastUsedAt: null,
    },
    keywords: ['寿司', '刺身', '手卷', 'sushi'],
    scene: 'meal',
    source: 'reference',
  },
  {
    food: {
      id: 'reference-malatang',
      name: '麻辣烫',
      servingLabel: '1 大碗',
      calories: 560,
      protein: 26,
      carbs: 44,
      fat: 28,
      isFavorite: false,
      lastUsedAt: null,
    },
    keywords: ['麻辣烫', '冒菜', 'spicy hotpot', 'malatang'],
    scene: 'meal',
    source: 'reference',
  },
  {
    food: {
      id: 'reference-beef-noodle',
      name: '牛肉面',
      servingLabel: '1 碗',
      calories: 540,
      protein: 25,
      carbs: 62,
      fat: 20,
      isFavorite: false,
      lastUsedAt: null,
    },
    keywords: ['牛肉面', '面', '拉面', 'beef noodle', 'ramen'],
    scene: 'meal',
    source: 'reference',
  },
  {
    food: {
      id: 'reference-burger-combo',
      name: '炸鸡汉堡套餐',
      servingLabel: '1 套',
      calories: 690,
      protein: 28,
      carbs: 64,
      fat: 34,
      isFavorite: false,
      lastUsedAt: null,
    },
    keywords: ['汉堡', '炸鸡', 'burger', 'fried chicken'],
    scene: 'meal',
    source: 'reference',
  },
  {
    food: {
      id: 'reference-latte',
      name: '拿铁',
      servingLabel: '1 杯',
      calories: 190,
      protein: 9,
      carbs: 18,
      fat: 8,
      isFavorite: false,
      lastUsedAt: null,
    },
    keywords: ['拿铁', 'latte', 'milk coffee'],
    scene: 'drink',
    source: 'reference',
  },
  {
    food: {
      id: 'reference-americano',
      name: '冰美式',
      servingLabel: '1 杯',
      calories: 15,
      protein: 1,
      carbs: 2,
      fat: 0,
      isFavorite: false,
      lastUsedAt: null,
    },
    keywords: ['冰美式', 'americano', 'black coffee'],
    scene: 'drink',
    source: 'reference',
  },
  {
    food: {
      id: 'reference-protein-shake',
      name: '蛋白奶昔',
      servingLabel: '1 杯',
      calories: 180,
      protein: 28,
      carbs: 12,
      fat: 3,
      isFavorite: false,
      lastUsedAt: null,
    },
    keywords: ['蛋白奶昔', 'protein shake', 'whey'],
    scene: 'protein',
    source: 'reference',
  },
  {
    food: {
      id: 'reference-chicken-salad',
      name: '鸡胸沙拉',
      servingLabel: '1 盒',
      calories: 360,
      protein: 32,
      carbs: 18,
      fat: 14,
      isFavorite: false,
      lastUsedAt: null,
    },
    keywords: ['鸡胸沙拉', '沙拉', 'chicken salad'],
    scene: 'protein',
    source: 'reference',
  },
  {
    food: {
      id: 'reference-yogurt-fruit-cup',
      name: '水果酸奶杯',
      servingLabel: '1 杯',
      calories: 220,
      protein: 9,
      carbs: 31,
      fat: 6,
      isFavorite: false,
      lastUsedAt: null,
    },
    keywords: ['水果酸奶', '果杯', 'yogurt cup', 'fruit cup'],
    scene: 'snack',
    source: 'reference',
  },
  {
    food: {
      id: 'reference-cake-slice',
      name: '切片蛋糕',
      servingLabel: '1 片',
      calories: 320,
      protein: 5,
      carbs: 34,
      fat: 18,
      isFavorite: false,
      lastUsedAt: null,
    },
    keywords: ['蛋糕', '甜点', 'cake', 'dessert'],
    scene: 'snack',
    source: 'reference',
  },
]

function normalizeText(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function tokenize(text: string) {
  return normalizeText(text)
    .split(/[ /]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

function isMeaningfulToken(token: string) {
  if (!token) {
    return false
  }

  if (noisyFilenameTokens.has(token) || contextualTokens.has(token)) {
    return false
  }

  if (/^\d+$/.test(token)) {
    return false
  }

  if (/^[a-z]$/i.test(token)) {
    return false
  }

  return true
}

function expandAliasKeywords(text: string) {
  const normalized = normalizeText(text)
  const matches = new Set<string>()

  Object.entries(keywordAliasMap).forEach(([canonicalKeyword, aliases]) => {
    if ([canonicalKeyword, ...aliases].some((keyword) => normalized.includes(normalizeText(keyword)))) {
      matches.add(canonicalKeyword.toLowerCase())
    }
  })

  return Array.from(matches)
}

function detectKeywords(text: string) {
  const normalized = normalizeText(text)
  const aliasKeywords = expandAliasKeywords(normalized)
  const sceneKeywords = Object.values(sceneKeywordMap)
    .flat()
    .filter((keyword) => normalized.includes(keyword.toLowerCase()))
  const directTokens = tokenize(normalized).filter(isMeaningfulToken)
  const matchedKeywords = new Set<string>()

  ;[...aliasKeywords, ...sceneKeywords, ...directTokens].forEach((keyword) => matchedKeywords.add(keyword))

  return Array.from(matchedKeywords).slice(0, 8)
}

function classifyFood(food: Food): EstimateScene {
  const haystack = normalizeText(`${food.name} ${food.servingLabel}`)
  const solidServingHints = ['碗', '份', '盘', '盒', '个', '串']
  const liquidServingHints = ['杯', '瓶', '罐']
  const hasSolidServing = solidServingHints.some((hint) => haystack.includes(hint))
  const hasLiquidServing = liquidServingHints.some((hint) => haystack.includes(hint))
  const matchesDrink = sceneKeywordMap.drink.some((keyword) => haystack.includes(keyword))
  const matchesProtein = sceneKeywordMap.protein.some((keyword) => haystack.includes(keyword))

  if (matchesDrink && hasLiquidServing) {
    return 'drink'
  }

  if (matchesProtein && hasSolidServing) {
    return 'protein'
  }

  if (matchesProtein) {
    return 'protein'
  }

  if (matchesDrink) {
    return 'drink'
  }

  if (sceneKeywordMap.snack.some((keyword) => haystack.includes(keyword))) {
    return 'snack'
  }

  return 'meal'
}

function inferScene(query: string, fileName: string, sceneHint: EstimateSceneHint) {
  if (sceneHint !== 'auto') {
    return sceneHint
  }

  const sourceText = `${query} ${fileName}`
  const normalizedSource = normalizeText(sourceText)
  const keywords = detectKeywords(sourceText)

  const sceneScores = (Object.keys(sceneKeywordMap) as EstimateScene[]).map((scene) => ({
    scene,
    score: keywords.filter((keyword) => sceneKeywordMap[scene].includes(keyword)).length,
  }))

  sceneScores.sort((left, right) => right.score - left.score)

  if (sceneScores[0]?.score > 0) {
    return sceneScores[0].scene
  }

  if (hasPostWorkoutCue(normalizedSource)) {
    return 'protein'
  }

  if (hasLateNightCue(normalizedSource)) {
    return 'snack'
  }

  return 'meal'
}

function roundToHalf(value: number) {
  return Math.max(0.5, Math.min(3, Math.round(value * 2) / 2))
}

function getSuggestedServings(scene: EstimateScene, portion: EstimatePortion) {
  const baseByPortion: Record<EstimatePortion, number> = {
    light: 0.75,
    regular: 1,
    large: 1.4,
  }

  const sceneAdjustment: Record<EstimateScene, number> = {
    meal: 0.1,
    drink: 0,
    protein: -0.1,
    snack: -0.15,
  }

  return roundToHalf(baseByPortion[portion] + sceneAdjustment[scene])
}

function getPortionReason(portion: EstimatePortion) {
  if (portion === 'light') {
    return '你选择了轻量份'
  }

  if (portion === 'large') {
    return '你选择了加量份'
  }

  return '按标准份估算'
}

function getSceneReason(scene: EstimateScene, sceneMode: 'auto' | 'manual') {
  if (sceneMode === 'manual') {
    return '符合你手动指定的场景'
  }

  if (scene === 'drink') {
    return '更像饮品场景'
  }

  if (scene === 'protein') {
    return '更像高蛋白主食或配餐'
  }

  if (scene === 'snack') {
    return '更像加餐或零食'
  }

  return '更像正餐场景'
}

function getMealTypeReason(mealType: MealType) {
  if (mealType === 'breakfast') {
    return '更像早餐常见食物'
  }

  if (mealType === 'lunch') {
    return '更像午餐常见食物'
  }

  if (mealType === 'dinner') {
    return '更像晚餐常见食物'
  }

  return '更像加餐常见食物'
}

function dedupeByName(items: EstimatePoolItem[]) {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = normalizeText(item.food.name)
    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function getLibraryFoodKeywords(food: Food) {
  const haystack = normalizeText(`${food.name} ${food.servingLabel}`)
  const keywords = new Set<string>()

  Object.entries(keywordAliasMap).forEach(([canonicalKeyword, aliases]) => {
    if (haystack.includes(normalizeText(canonicalKeyword))) {
      keywords.add(canonicalKeyword)
      aliases.forEach((alias) => keywords.add(alias))
    }
  })

  return Array.from(keywords)
}

function buildEstimatePool(foods: Food[]) {
  const libraryItems: EstimatePoolItem[] = foods.map((food) => ({
    food,
    keywords: getLibraryFoodKeywords(food),
    scene: classifyFood(food),
    source: 'library',
  }))

  const libraryNames = new Set(libraryItems.map((item) => normalizeText(item.food.name)))
  const referenceItems = referenceFoods.filter((item) => !libraryNames.has(normalizeText(item.food.name)))

  return dedupeByName([...libraryItems, ...referenceItems])
}

function buildSearchText(item: EstimatePoolItem) {
  return normalizeText(`${item.food.name} ${item.food.servingLabel} ${item.keywords.join(' ')}`)
}

function prioritizeReasons(reasons: string[], portionHint: EstimatePortion) {
  const uniqueReasons = Array.from(new Set(reasons.filter(Boolean)))
  const stickyReasons = ['符合你手动指定的场景', '文件名更像训练后补给', '文件名更像夜宵场景']
  const prioritizedStickyReasons = stickyReasons.filter((reason) => uniqueReasons.includes(reason))
  const prioritized = [
    ...prioritizedStickyReasons.slice(0, 2),
    ...uniqueReasons
      .filter((reason) => !prioritizedStickyReasons.includes(reason))
      .slice(0, Math.max(0, 2 - prioritizedStickyReasons.length)),
  ]

  return [...prioritized, getPortionReason(portionHint)]
}

export function buildPhotoEstimateAnalysis({
  foods,
  query,
  fileName,
  portionHint,
  sceneHint = 'auto',
  mealTypeHint,
}: {
  foods: Food[]
  query: string
  fileName: string
  portionHint: EstimatePortion
  sceneHint?: EstimateSceneHint
  mealTypeHint?: MealType
}): PhotoEstimateAnalysis {
  const sourceText = `${query} ${fileName}`
  const keywords = detectKeywords(sourceText)
  const scene = inferScene(query, fileName, sceneHint)
  const sceneMode = sceneHint === 'auto' ? 'auto' : 'manual'
  const normalizedQuery = normalizeText(query)
  const normalizedFileName = normalizeText(fileName)
  const queryMirrorsFileName =
    normalizedQuery.length > 0 && normalizedFileName.length > 0 && normalizedQuery === normalizedFileName
  const hasManualQuerySignal = normalizedQuery.length > 0 && !queryMirrorsFileName
  const contextualMealTypeHint = detectMealTypeCue(sourceText)
  const effectiveMealTypeHint = mealTypeHint ?? contextualMealTypeHint
  const postWorkoutCue = hasPostWorkoutCue(sourceText)
  const lateNightCue = hasLateNightCue(sourceText)
  const contextClues = buildContextClues({
    mealTypeCue: contextualMealTypeHint,
    postWorkoutCue,
    lateNightCue,
  })
  const quickKeywords =
    !hasManualQuerySignal && postWorkoutCue
      ? sceneQuickKeywordMap.protein
      : !hasManualQuerySignal && contextualMealTypeHint
        ? mealTypeQuickKeywordMap[contextualMealTypeHint]
        : effectiveMealTypeHint && !hasManualQuerySignal
        ? mealTypeQuickKeywordMap[effectiveMealTypeHint]
        : sceneQuickKeywordMap[scene]

  const candidates = buildEstimatePool(foods)
    .map((item) => {
      const foodText = buildSearchText(item)
      const matchedKeywords = keywords.filter((keyword) => foodText.includes(normalizeText(keyword)))
      const mealTypeKeywords = effectiveMealTypeHint ? mealTypeAffinityKeywordMap[effectiveMealTypeHint] : []
      const matchedMealTypeKeywords = mealTypeKeywords.filter((keyword) => foodText.includes(normalizeText(keyword)))
      const reasons: string[] = []
      let score = item.source === 'library' ? 16 : 4

      if (matchedKeywords.length > 0) {
        score += 28 + matchedKeywords.length * 14
        reasons.push(`命中关键词：${matchedKeywords.slice(0, 2).join(' / ')}`)
      }

      if (normalizedQuery && foodText.includes(normalizedQuery)) {
        score += 26
        reasons.push(item.source === 'reference' ? '和你拍的这类食物很接近' : '和你库里的食物名称很接近')
      }

      if (item.scene === scene) {
        score += sceneMode === 'manual' ? 22 : 18
        reasons.push(getSceneReason(scene, sceneMode))
      }

      if (effectiveMealTypeHint) {
        if (matchedMealTypeKeywords.length > 0) {
          score += 20 + matchedMealTypeKeywords.length * 8
          reasons.push(getMealTypeReason(effectiveMealTypeHint))
        } else if (mealTypeSceneAffinityMap[effectiveMealTypeHint].includes(item.scene)) {
          score += 7
        }
      }

      if (postWorkoutCue) {
        if (item.scene === 'protein') {
          score += 18
          reasons.push('文件名更像训练后补给')
        } else if (item.food.protein >= 20) {
          score += 6
        }
      }

      if (lateNightCue) {
        if (item.scene === 'meal' || item.scene === 'snack' || item.scene === 'drink') {
          score += item.food.calories >= 300 ? 16 : 8
          reasons.push('文件名更像夜宵场景')
        }
      }

      if (item.source === 'library' && item.food.isFavorite) {
        score += 4
        reasons.push('你平时常用这类食物')
      }

      if (item.source === 'reference') {
        score += 6
      }

      if (portionHint === 'large' && item.food.calories >= 400) {
        score += 6
      }

      if (portionHint === 'light' && item.food.calories <= 250) {
        score += 6
      }

      const suggestedServings = getSuggestedServings(item.scene, portionHint)

      return {
        food: item.food,
        scene: item.scene,
        source: item.source,
        confidence: Math.min(98, score),
        reasons: prioritizeReasons(reasons, portionHint),
        suggestedServings,
      }
    })
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 6)

  return {
    scene,
    keywords,
    candidates,
    contextClues,
    quickKeywords,
    sceneMode,
  }
}
