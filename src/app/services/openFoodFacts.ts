import type { Food } from '../../store/types'

export interface OnlineFoodResult extends Omit<Food, 'id' | 'isFavorite' | 'lastUsedAt'> {
  id: string
  source: 'open-food-facts'
}

interface OpenFoodFactsProduct {
  code?: string
  product_name?: string
  product_name_en?: string
  generic_name?: string
  serving_size?: string
  quantity?: string
  nutriments?: Record<string, number | string | undefined>
}

interface OpenFoodFactsSearchResponse {
  products?: OpenFoodFactsProduct[]
}

const OPEN_FOOD_FACTS_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl'

function readNumber(nutriments: Record<string, number | string | undefined>, keys: string[], fallback = 0) {
  for (const key of keys) {
    const rawValue = nutriments[key]
    const value = typeof rawValue === 'string' ? Number(rawValue) : rawValue

    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.round(value)
    }
  }

  return fallback
}

function toOnlineFoodResult(product: OpenFoodFactsProduct): OnlineFoodResult | null {
  const name = product.product_name || product.product_name_en || product.generic_name

  if (!name) {
    return null
  }

  const nutriments = product.nutriments ?? {}
  const calories = readNumber(nutriments, ['energy-kcal_serving', 'energy-kcal_100g', 'energy-kcal'], 0)

  if (calories <= 0) {
    return null
  }

  return {
    id: `off-${product.code ?? name}`,
    source: 'open-food-facts',
    name,
    servingLabel: product.serving_size || product.quantity || '1 份',
    calories,
    protein: readNumber(nutriments, ['proteins_serving', 'proteins_100g', 'proteins']),
    carbs: readNumber(nutriments, ['carbohydrates_serving', 'carbohydrates_100g', 'carbohydrates']),
    fat: readNumber(nutriments, ['fat_serving', 'fat_100g', 'fat']),
  }
}

export async function searchOpenFoodFacts(query: string): Promise<OnlineFoodResult[]> {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return []
  }

  const params = new URLSearchParams({
    search_terms: trimmedQuery,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '5',
    fields: 'code,product_name,product_name_en,generic_name,serving_size,quantity,nutriments',
  })

  const response = await fetch(`${OPEN_FOOD_FACTS_SEARCH_URL}?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`Open Food Facts search failed: ${response.status}`)
  }

  const payload = (await response.json()) as OpenFoodFactsSearchResponse

  return (payload.products ?? [])
    .map(toOnlineFoodResult)
    .filter((food): food is OnlineFoodResult => food != null)
}
