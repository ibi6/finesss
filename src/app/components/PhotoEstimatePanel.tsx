import { Camera, Search, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useState, type RefObject } from 'react'

import type { Food, MealType } from '../../store/types'
import {
  buildPhotoEstimateAnalysis,
  type EstimatePortion,
  type EstimateScene,
  type EstimateSceneHint,
} from './photoEstimate'

interface PhotoEstimatePanelProps {
  activeMealType: MealType
  activeMealTypeLabel: string
  foods: Food[]
  onApplyEstimate: (payload: PhotoEstimateApplyPayload) => void
  onLogEstimate: (payload: PhotoEstimateApplyPayload) => void
  onSaveEstimateFood: (payload: PhotoEstimateApplyPayload) => void
  panelRef?: RefObject<HTMLElement | null>
  queryInputRef?: RefObject<HTMLInputElement | null>
}

export interface PhotoEstimateApplyPayload {
  estimate: {
    foodName: string
    servingLabel: string
    calories: number
    protein: number
    carbs: number
    fat: number
    sourceFoodId: string | null
  }
  meta: {
    photoName: string
    query: string
    scene: EstimateScene
    sceneMode: 'auto' | 'manual'
    portionHint: EstimatePortion
    keywordSummary: string[]
    confidence: number
    reasons: string[]
    candidateSource: 'library' | 'reference'
  }
}

function multiplyMacro(value: number, servings: number) {
  return Number((value * servings).toFixed(0))
}

const portionLabels: Record<EstimatePortion, string> = {
  light: '轻量',
  regular: '标准',
  large: '加量',
}

const sceneLabels: Record<EstimateScene, string> = {
  meal: '正餐',
  drink: '饮品',
  protein: '高蛋白',
  snack: '加餐',
}

const sceneHintLabels: Record<EstimateSceneHint, string> = {
  auto: '自动',
  meal: '正餐',
  drink: '饮品',
  protein: '蛋白',
  snack: '加餐',
}

export function PhotoEstimatePanel({
  activeMealType,
  activeMealTypeLabel,
  foods,
  onApplyEstimate,
  onLogEstimate,
  onSaveEstimateFood,
  panelRef,
  queryInputRef,
}: PhotoEstimatePanelProps) {
  const [query, setQuery] = useState('')
  const [servings, setServings] = useState('1')
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [photoName, setPhotoName] = useState('')
  const [portionHint, setPortionHint] = useState<EstimatePortion>('regular')
  const [sceneHint, setSceneHint] = useState<EstimateSceneHint>('auto')

  const analysis = useMemo(
    () =>
      buildPhotoEstimateAnalysis({
        foods,
        query,
        fileName: photoName,
        portionHint,
        sceneHint,
        mealTypeHint: activeMealType,
      }),
    [activeMealType, foods, photoName, portionHint, query, sceneHint],
  )

  const resolvedSelectedFoodId = analysis.candidates.some(
    (candidate) => candidate.food.id === selectedFoodId,
  )
    ? selectedFoodId
    : (analysis.candidates[0]?.food.id ?? null)
  const activeCandidate =
    analysis.candidates.find((candidate) => candidate.food.id === resolvedSelectedFoodId) ?? null
  const servingsValue =
    Number(servings || String(activeCandidate?.suggestedServings ?? 1)) > 0
      ? Number(servings || String(activeCandidate?.suggestedServings ?? 1))
      : 1
  const hasPhoto = photoPreviewUrl !== null
  const keywordSummary = analysis.keywords.length > 0 ? analysis.keywords.join(' / ') : '未提取到'
  const needsKeywordHint = analysis.keywords.length === 0
  const showRecognitionInlineNote =
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? true
      : window.matchMedia('(min-width: 421px)').matches

  useEffect(
    () => () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl)
      }
    },
    [photoPreviewUrl],
  )

  function resetEstimateSelection() {
    setSelectedFoodId(null)
    setServings('')
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl)
    }

    const nextUrl = URL.createObjectURL(file)
    const normalizedName = file.name.replace(/\.[^.]+$/, '')

    setPhotoPreviewUrl(nextUrl)
    setPhotoName(normalizedName)
    resetEstimateSelection()
  }

  function buildApplyPayload(): PhotoEstimateApplyPayload | null {
    if (!activeCandidate) {
      return null
    }

    return {
      estimate: {
        foodName: activeCandidate.food.name,
        servingLabel:
          servingsValue === 1
            ? activeCandidate.food.servingLabel
            : `${servingsValue} x ${activeCandidate.food.servingLabel}`,
        calories: multiplyMacro(activeCandidate.food.calories, servingsValue),
        protein: multiplyMacro(activeCandidate.food.protein, servingsValue),
        carbs: multiplyMacro(activeCandidate.food.carbs, servingsValue),
        fat: multiplyMacro(activeCandidate.food.fat, servingsValue),
        sourceFoodId: activeCandidate.source === 'library' ? activeCandidate.food.id : null,
      },
      meta: {
        photoName,
        query: query.trim(),
        scene: analysis.scene,
        sceneMode: analysis.sceneMode,
        portionHint,
        keywordSummary: analysis.keywords,
        confidence: activeCandidate.confidence,
        reasons: activeCandidate.reasons,
        candidateSource: activeCandidate.source,
      },
    }
  }

  function handleApplyEstimate() {
    const payload = buildApplyPayload()
    if (!payload) {
      return
    }

    onApplyEstimate(payload)
  }

  function handleLogEstimate() {
    const payload = buildApplyPayload()
    if (!payload) {
      return
    }

    onLogEstimate(payload)
  }

  function handleSaveEstimateFood() {
    const payload = buildApplyPayload()
    if (!payload) {
      return
    }

    onSaveEstimateFood(payload)
  }

  function clearPhoto() {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl)
    }

    setPhotoPreviewUrl(null)
    setPhotoName('')
    resetEstimateSelection()
  }

  return (
    <article
      className="feature-panel feature-panel--wide photo-estimate-panel"
      id="photo-estimate-panel"
      ref={panelRef}
      tabIndex={-1}
    >
      <div className="panel-head">
        <div>
          <p className="section-kicker">拍照估算</p>
          <h3>拍一张，先给你候选和份量建议</h3>
        </div>
        <span className="inline-note">当前餐次 {activeMealTypeLabel}</span>
      </div>

      <div className="photo-estimate-layout">
        <div className={`photo-preview-card${hasPhoto ? ' has-photo' : ' is-empty'}`}>
          {hasPhoto ? (
            <>
              <img alt="食物预览" className="photo-preview" src={photoPreviewUrl} />
              <button
                aria-label="移除照片"
                className="icon-circle-button photo-clear-button"
                onClick={clearPhoto}
                type="button"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <div className="photo-placeholder">
              <Camera size={18} />
              <div className="photo-placeholder-copy">
                <strong>先拍照或上传</strong>
                <span>陌生食物也会先从常见参考里给一版热量估算</span>
              </div>
            </div>
          )}
        </div>

        <div className="photo-estimate-controls">
          {photoName ? (
            <div className="photo-file-note">
              <span className="field-label">当前照片</span>
              <strong>{photoName}</strong>
            </div>
          ) : null}

          <label className="photo-upload-field">
            <span className="field-label">拍照 / 上传</span>
            <input
              accept="image/*"
              capture="environment"
              className="visually-hidden-input"
              onChange={handlePhotoChange}
              type="file"
            />
            <span className="photo-upload-trigger">
              <Upload size={16} />
              <span>{hasPhoto ? '重新拍一张' : '打开相机或相册'}</span>
            </span>
            <small>照片看不清时，下面补一个关键词会更稳。</small>
          </label>

          <div className="form-grid">
            <label className="field field--span-2">
              <span>食物关键词</span>
              <div className="search-field">
                <Search size={16} />
                <input
                  onChange={(event) => {
                    setQuery(event.target.value)
                    resetEstimateSelection()
                  }}
                  placeholder="例如：米饭、奶茶、鸡胸肉"
                  ref={queryInputRef}
                  type="text"
                  value={query}
                />
              </div>
            </label>
          </div>

          <div className="recognition-summary">
            <div className="recognition-badge-row">
              <span className="pill pill--muted">识别场景：{sceneLabels[analysis.scene]}</span>
              <span className="pill pill--muted">
                {analysis.sceneMode === 'manual' ? `手动偏向：${sceneHintLabels[sceneHint]}` : '自动判断'}
              </span>
              {analysis.contextClues.map((clue) => (
                <span className="pill pill--muted" key={`context-${clue}`}>
                  文件名线索：{clue}
                </span>
              ))}
              <span className="pill">关键词：{keywordSummary}</span>
            </div>
            <p className={`recognition-quality-note${needsKeywordHint ? ' is-warning' : ''}`}>
              {needsKeywordHint
                ? '还没抓到明确食物词，先按餐次给候选；补一个食物名会准很多。'
                : '这是关键词估算，点候选后再微调份量会更稳。'}
            </p>
            {showRecognitionInlineNote ? (
              <p className="inline-note">
                会综合当前餐次、照片文件名、关键词、份量偏好和常见食物参考，先帮你缩小候选范围。
              </p>
            ) : null}
          </div>

          <div className="scene-hint-section">
            <span className="field-label">场景偏向</span>
            <div className="scene-chip-row scene-chip-row--rail" role="radiogroup" aria-label="场景偏向">
              {(Object.keys(sceneHintLabels) as EstimateSceneHint[]).map((scene) => (
                <button
                  aria-checked={sceneHint === scene}
                  className={`scene-chip${sceneHint === scene ? ' is-active' : ''}`}
                  key={scene}
                  onClick={() => {
                    setSceneHint(scene)
                    resetEstimateSelection()
                  }}
                  role="radio"
                  type="button"
                >
                  {sceneHintLabels[scene]}
                </button>
              ))}
            </div>
          </div>

          <div className="scene-hint-section">
            <span className="field-label">常见线索</span>
            <div className="scene-chip-row scene-chip-row--rail" role="list" aria-label="场景偏向快捷提示">
              {analysis.quickKeywords.map((keyword) => (
                <button
                  className="scene-chip scene-chip--ghost"
                  key={keyword}
                  onClick={() => {
                    setQuery(keyword)
                    resetEstimateSelection()
                  }}
                  type="button"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>

          <div className="portion-selector">
            <span className="field-label">份量偏好</span>
            <div
              className="segmented-control segmented-control--3"
              role="radiogroup"
              aria-label="份量偏好"
            >
              {(Object.keys(portionLabels) as EstimatePortion[]).map((portion) => (
                <button
                  aria-checked={portionHint === portion}
                  className={`segment-button${portionHint === portion ? ' is-active' : ''}`}
                  key={portion}
                  onClick={() => {
                    setPortionHint(portion)
                    setServings('')
                  }}
                  role="radio"
                  type="button"
                >
                  {portionLabels[portion]}
                </button>
              ))}
            </div>
          </div>

          <div className="candidate-stack">
            {analysis.candidates.length > 0 ? (
              <div aria-label="拍照估算候选" className="candidate-stack candidate-stack--rail" role="list">
                {analysis.candidates.map((candidate) => {
                const isActive = activeCandidate?.food.id === candidate.food.id

                return (
                  <div key={candidate.food.id} role="listitem">
                    <button
                      aria-pressed={isActive}
                      className={`candidate-card${isActive ? ' is-active' : ''}`}
                      onClick={() => {
                        setSelectedFoodId(candidate.food.id)
                        setServings('')
                      }}
                      type="button"
                    >
                      <div className="candidate-card-head">
                        <div className="candidate-title-block">
                          <strong>{candidate.food.name}</strong>
                          <span className="pill pill--muted">
                            {candidate.source === 'library' ? '食物库' : '常见参考'}
                          </span>
                        </div>
                        <span className="candidate-score">{candidate.confidence}%</span>
                      </div>
                      <div className="candidate-card-meta">
                        <span>{candidate.food.servingLabel}</span>
                        <span>建议 {candidate.suggestedServings} 份</span>
                        <span>{candidate.food.calories} kcal / 份</span>
                      </div>
                      <small>{candidate.reasons.join(' · ')}</small>
                    </button>
                  </div>
                )
              })}
              </div>
            ) : (
              <div className="empty-note">还没匹配到候选，试试换个关键词，或者切一下场景偏向。</div>
            )}
          </div>

          <div className="form-grid">
            <label className="field">
              <span>最终份数</span>
              <input
                inputMode="decimal"
                min="0.5"
                onChange={(event) => setServings(event.target.value)}
                step="0.5"
                type="number"
                value={servings || String(activeCandidate?.suggestedServings ?? 1)}
              />
            </label>
          </div>

          {activeCandidate ? (
            <div className="estimate-summary">
              <div>
                <span>估算热量</span>
                <strong>{multiplyMacro(activeCandidate.food.calories, servingsValue)} 千卡</strong>
              </div>
              <div>
                <span>蛋白质</span>
                <strong>{multiplyMacro(activeCandidate.food.protein, servingsValue)} g</strong>
              </div>
              <div>
                <span>碳水</span>
                <strong>{multiplyMacro(activeCandidate.food.carbs, servingsValue)} g</strong>
              </div>
              <div>
                <span>脂肪</span>
                <strong>{multiplyMacro(activeCandidate.food.fat, servingsValue)} g</strong>
              </div>
            </div>
          ) : null}

          <div className="form-actions form-actions--split photo-estimate-actions">
            <button
              className="primary-button"
              disabled={!activeCandidate}
              onClick={handleApplyEstimate}
              type="button"
            >
              按建议带入表单
            </button>
            <button
              className="secondary-button"
              disabled={!activeCandidate}
              onClick={handleLogEstimate}
              type="button"
            >
              直接记到当前餐次
            </button>
            {activeCandidate?.source === 'reference' ? (
              <button className="ghost-button" onClick={handleSaveEstimateFood} type="button">
                存进食物库
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}
