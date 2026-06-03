import type { Food } from '../store/types'

const foodAliasMap: Record<string, string[]> = {
  麦辣鸡腿堡: ['汉堡', '麦当劳', '麦辣', '鸡腿堡', 'burger', 'hamburger', 'spicy chicken burger'],
  巨无霸: ['汉堡', '麦当劳', 'big mac', 'burger', 'hamburger'],
  中薯条: ['薯条', '麦当劳', 'fries', 'french fries'],
  麦乐鸡: ['鸡块', '麦当劳', 'nuggets', 'chicken nuggets'],
  肯德基原味鸡: ['肯德基', 'kfc', '炸鸡', 'original chicken'],
  肉包子: ['包子', '早餐', 'baozi', 'bun'],
  油条: ['早餐', 'fried dough'],
  牛肉面: ['拉面', '面条', 'beef noodle', 'noodle'],
  麻辣烫: ['冒菜', 'malatang', 'spicy hotpot'],
  螺蛳粉: ['米粉', 'luosifen'],
  酸辣粉: ['粉', '米粉', 'sour spicy noodle'],
  便利店饭团: ['饭团', 'onigiri'],
  肠粉: ['广东肠粉', 'rice roll'],
  生椰拿铁: ['瑞幸', '拿铁', '咖啡', 'luckin', 'coconut latte'],
  无糖乌龙茶: ['乌龙茶', '茶饮', 'oolong tea'],
}

export function normalizeFoodSearchText(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function buildFoodSearchText(food: Food) {
  return normalizeFoodSearchText(
    [
      food.id,
      food.name,
      food.servingLabel,
      `${food.calories}`,
      `${food.protein}`,
      ...(foodAliasMap[food.name] ?? []),
    ].join(' '),
  )
}

export function foodMatchesQuery(food: Food, query: string) {
  const normalizedQuery = normalizeFoodSearchText(query)

  return !normalizedQuery || buildFoodSearchText(food).includes(normalizedQuery)
}
