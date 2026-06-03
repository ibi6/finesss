import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const FALLBACK_FOOD = {
  foodName: '手动估算餐食',
  servingLabel: '1 份',
  calories: 380,
  protein: 22,
  carbs: 42,
  fat: 12,
  sourceFoodId: null,
}

function loadLocalEnvFile() {
  const envPath = path.join(PROJECT_ROOT, '.env')

  if (!fs.existsSync(envPath)) {
    return
  }

  const envContent = fs.readFileSync(envPath, 'utf8')

  for (const line of envContent.split(/\r?\n/)) {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmedLine.indexOf('=')

    if (separatorIndex <= 0) {
      continue
    }

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim()
    const value = rawValue.replace(/^["']|["']$/g, '')

    if (key && process.env[key] == null) {
      process.env[key] = value
    }
  }
}

loadLocalEnvFile()

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(toNumber(value, min), min), max)
}

function firstMeaningfulString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? ''
}

function normalizeActionList(actions) {
  if (!Array.isArray(actions)) {
    return []
  }

  return actions
    .map((action) => (typeof action === 'string' ? action.trim() : ''))
    .filter(Boolean)
    .slice(0, 4)
}

function normalizeEstimate(estimate) {
  if (!estimate || typeof estimate !== 'object') {
    return { ...FALLBACK_FOOD }
  }

  return {
    foodName: firstMeaningfulString(estimate.foodName, estimate.name, FALLBACK_FOOD.foodName),
    servingLabel: firstMeaningfulString(estimate.servingLabel, FALLBACK_FOOD.servingLabel),
    calories: Math.round(clampNumber(estimate.calories, 1, 3000)),
    protein: Math.round(clampNumber(estimate.protein, 0, 300)),
    carbs: Math.round(clampNumber(estimate.carbs, 0, 500)),
    fat: Math.round(clampNumber(estimate.fat, 0, 300)),
    sourceFoodId: typeof estimate.sourceFoodId === 'string' && estimate.sourceFoodId.trim()
      ? estimate.sourceFoodId.trim()
      : null,
  }
}

function getOpenAiApiKey() {
  return process.env.OPENAI_API_KEY?.trim() ?? ''
}

function getOpenAiModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL
}

function getResponseText(responseJson) {
  if (typeof responseJson?.output_text === 'string') {
    return responseJson.output_text
  }

  if (!Array.isArray(responseJson?.output)) {
    return ''
  }

  return responseJson.output
    .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
    .map((content) => content?.text ?? content?.output_text ?? '')
    .filter((text) => typeof text === 'string')
    .join('\n')
}

function parseJsonObject(text) {
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) {
      throw new Error('AI response did not include JSON.')
    }

    return JSON.parse(match[0])
  }
}

async function callOpenAiJson({ schemaName, schema, prompt, imageDataUrl }) {
  const apiKey = getOpenAiApiKey()

  if (!apiKey) {
    return null
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)

  try {
    const content = [{ type: 'input_text', text: prompt }]

    if (imageDataUrl) {
      content.push({ type: 'input_image', image_url: imageDataUrl })
    }

    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getOpenAiModel(),
        input: [{ role: 'user', content }],
        text: {
          format: {
            type: 'json_schema',
            name: schemaName,
            schema,
            strict: true,
          },
        },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      return null
    }

    const responseJson = await response.json()
    const outputText = getResponseText(responseJson)

    if (!outputText) {
      return null
    }

    return parseJsonObject(outputText)
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export function buildCoachFallback(payload = {}) {
  const dateLabel = firstMeaningfulString(payload.dateLabel, '今天')
  const caloriesEaten = toNumber(payload.calories?.eaten)
  const caloriesTarget = toNumber(payload.calories?.target)
  const proteinEaten = toNumber(payload.protein?.eaten)
  const proteinTarget = toNumber(payload.protein?.target)
  const proteinGap = Math.max(Math.round(proteinTarget - proteinEaten), 0)
  const calorieGap = Math.max(Math.round(caloriesTarget - caloriesEaten), 0)
  const workoutDone = Boolean(payload.workout?.done) || toNumber(payload.workout?.minutes) > 0
  const sleepHours = toNumber(payload.recovery?.sleepHours)
  const waterLiters = toNumber(payload.recovery?.waterLiters)
  const steps = toNumber(payload.recovery?.steps)
  const actions = []

  if (proteinGap > 0) {
    actions.push(`补 ${proteinGap}g 蛋白，优先选鸡胸、牛肉、鱼虾、蛋或无糖酸奶。`)
  } else {
    actions.push('蛋白已经接近目标，晚点别硬塞，保持清淡就行。')
  }

  if (calorieGap > 0) {
    actions.push(`还剩约 ${calorieGap} kcal，下一餐用主食 + 蛋白 + 蔬菜配齐。`)
  } else {
    actions.push('热量接近目标，下一餐少油少糖，把饱腹感稳住。')
  }

  if (!workoutDone) {
    actions.push('安排 20-30 分钟快走、力量小循环或拉伸，先把训练记录续上。')
  } else {
    actions.push('训练已经完成，晚上把恢复和睡眠留足。')
  }

  if (sleepHours > 0 && sleepHours < 7) {
    actions.push('今晚优先早睡，睡眠低时训练强度别硬拉满。')
  } else if (waterLiters > 0 && waterLiters < 2) {
    actions.push('再补 500ml 水，让恢复数据更稳。')
  } else if (steps > 0 && steps < 7000) {
    actions.push('饭后散步 10-15 分钟，把步数补一点。')
  }

  return {
    provider: 'fallback',
    title: `${dateLabel}先把蛋白和执行节奏稳住`,
    summary: '没有配置 AI key 时，先按你的目标和当天记录给一版本地建议。',
    actions: actions.slice(0, 4),
  }
}

export function buildFoodVisionFallback(payload = {}) {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : []
  const candidate = candidates
    .map((item) => normalizeEstimate({ ...item, foodName: item?.foodName ?? item?.name }))
    .find((item) => item.foodName && item.calories > 0) ?? null

  return {
    provider: 'fallback',
    estimate: candidate ?? { ...FALLBACK_FOOD },
    confidence: candidate ? 72 : 48,
    note: candidate ? '本地候选估算，建议按实际份量微调。' : '本地没有足够候选，已给一份保守估算。',
  }
}

function normalizeCoachAdvice(advice, fallback) {
  const actions = normalizeActionList(advice?.actions)

  return {
    provider: 'openai',
    title: firstMeaningfulString(advice?.title, fallback.title),
    summary: firstMeaningfulString(advice?.summary, fallback.summary),
    actions: actions.length > 0 ? actions : fallback.actions,
  }
}

function normalizeFoodVisionAdvice(advice, fallback) {
  return {
    provider: 'openai',
    estimate: normalizeEstimate(advice?.estimate),
    confidence: Math.round(clampNumber(advice?.confidence, 1, 100)),
    note: firstMeaningfulString(advice?.note, fallback.note),
  }
}

export async function createCoachAdvice(payload = {}) {
  const fallback = buildCoachFallback(payload)
  const advice = await callOpenAiJson({
    schemaName: 'coach_advice',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'summary', 'actions'],
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
        actions: {
          type: 'array',
          minItems: 3,
          maxItems: 4,
          items: { type: 'string' },
        },
      },
    },
    prompt: [
      '你是“燃刻”App 的健身饮食 AI 教练。',
      '请根据用户当天记录，输出简短、可执行、不夸张的中文建议。',
      '不要诊断疾病，不要承诺医疗效果，不要要求极端节食。',
      '返回 JSON，不要 Markdown。',
      `当天数据：${JSON.stringify(payload)}`,
    ].join('\n'),
  })

  return advice ? normalizeCoachAdvice(advice, fallback) : fallback
}

export async function createFoodVisionEstimate(payload = {}) {
  const fallback = buildFoodVisionFallback(payload)
  const candidates = Array.isArray(payload.candidates) ? payload.candidates.slice(0, 6) : []
  const advice = await callOpenAiJson({
    schemaName: 'food_vision_estimate',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['estimate', 'confidence', 'note'],
      properties: {
        estimate: {
          type: 'object',
          additionalProperties: false,
          required: ['foodName', 'servingLabel', 'calories', 'protein', 'carbs', 'fat', 'sourceFoodId'],
          properties: {
            foodName: { type: 'string' },
            servingLabel: { type: 'string' },
            calories: { type: 'number' },
            protein: { type: 'number' },
            carbs: { type: 'number' },
            fat: { type: 'number' },
            sourceFoodId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          },
        },
        confidence: { type: 'number' },
        note: { type: 'string' },
      },
    },
    imageDataUrl: typeof payload.imageDataUrl === 'string' ? payload.imageDataUrl : '',
    prompt: [
      '你是“燃刻”App 的食物照片识别助手。',
      '请结合照片、文件名、搜索词和本地候选，估算一份餐食营养。',
      '优先贴近本地候选；如果照片信息不足，选择最可能候选或保守估算。',
      '只返回 JSON，不要 Markdown。',
      `照片名：${firstMeaningfulString(payload.photoName, 'unknown')}`,
      `搜索词：${firstMeaningfulString(payload.query, '') || '无'}`,
      `本地候选：${JSON.stringify(candidates)}`,
    ].join('\n'),
  })

  return advice ? normalizeFoodVisionAdvice(advice, fallback) : fallback
}

export function getAiStatus() {
  return {
    provider: getOpenAiApiKey() ? 'openai' : 'fallback',
    model: getOpenAiApiKey() ? getOpenAiModel() : null,
    configured: Boolean(getOpenAiApiKey()),
  }
}
