import { Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'

import { formatDateKeyLabel, resolveDateKey } from '../../store/date'
import { buildDailySummary } from '../../store/selectors'
import type { BodyEntry, FitnessStateSnapshot, RecoveryEntry, WorkoutSession } from '../../store/types'
import { buildApiUrl } from '../services/api'

interface AiCoachPanelProps {
  snapshot: FitnessStateSnapshot
  targetDate: string
}

interface AiCoachAdvice {
  provider: 'fallback' | 'openai' | string
  title: string
  summary: string
  actions: string[]
}

function sortByLoggedAt<T extends { loggedAt: string }>(entries: T[]) {
  return [...entries].sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))
}

function getWorkoutDateKey(session: WorkoutSession) {
  return resolveDateKey(session.dateKey, session.startedAt)
}

function getLoggedDateKey(entry: BodyEntry | RecoveryEntry) {
  return resolveDateKey(entry.dateKey, entry.loggedAt)
}

function getLatestEntryOnOrBefore<T extends BodyEntry | RecoveryEntry>(
  entries: T[],
  targetDate: string,
) {
  return sortByLoggedAt(entries).find((entry) => getLoggedDateKey(entry) <= targetDate) ?? null
}

function normalizeAdvice(data: Partial<AiCoachAdvice>): AiCoachAdvice {
  const actions = Array.isArray(data.actions)
    ? data.actions.filter((action): action is string => typeof action === 'string' && action.trim().length > 0)
    : []

  return {
    provider: data.provider ?? 'fallback',
    title: data.title?.trim() || '今天先把关键动作做完',
    summary: data.summary?.trim() || '我会根据你今天的记录给出下一步建议。',
    actions: actions.length > 0 ? actions.slice(0, 4) : ['补一笔饮食记录', '安排一次轻训练', '睡前补一下恢复记录'],
  }
}

function buildCoachPayload(snapshot: FitnessStateSnapshot, targetDate: string) {
  const daily = buildDailySummary(snapshot, targetDate)
  const workouts = snapshot.workoutSessions.filter((session) => getWorkoutDateKey(session) === targetDate)
  const latestBody = getLatestEntryOnOrBefore(snapshot.bodyEntries, targetDate)
  const latestRecovery = getLatestEntryOnOrBefore(snapshot.recoveryEntries, targetDate)

  return {
    dateLabel: formatDateKeyLabel(targetDate),
    calories: {
      eaten: daily.calories,
      target: snapshot.profile.dailyCalories,
    },
    protein: {
      eaten: daily.protein,
      target: snapshot.profile.dailyProtein,
    },
    workout: {
      done: workouts.length > 0,
      minutes: daily.trainingMinutes,
      calories: daily.trainingCalories,
    },
    body: {
      latestWeight: latestBody?.weight ?? snapshot.profile.startWeight,
      targetWeight: snapshot.profile.targetWeight,
      loggedToday: latestBody ? getLoggedDateKey(latestBody) === targetDate : false,
    },
    recovery: {
      sleepHours: latestRecovery?.sleepHours ?? 0,
      steps: latestRecovery?.steps ?? 0,
      waterLiters: latestRecovery?.waterLiters ?? 0,
      energy: latestRecovery?.energy ?? 0,
      loggedToday: latestRecovery ? getLoggedDateKey(latestRecovery) === targetDate : false,
    },
  }
}

export function AiCoachPanel({ snapshot, targetDate }: AiCoachPanelProps) {
  const [advice, setAdvice] = useState<AiCoachAdvice | null>(null)
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const payload = useMemo(() => buildCoachPayload(snapshot, targetDate), [snapshot, targetDate])

  async function requestAdvice() {
    setIsLoading(true)
    setStatus('生成中...')

    try {
      const response = await fetch(buildApiUrl('/api/ai/coach'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('AI coach request failed')
      }

      setAdvice(normalizeAdvice(await response.json()))
      setStatus('')
    } catch {
      setAdvice(normalizeAdvice({
        provider: 'fallback',
        title: 'AI 教练暂时没连上',
        summary: '可以先按本地记录做三件小事，不影响继续使用。',
        actions: ['补齐下一餐蛋白', '做 20 分钟轻运动', '睡前记录喝水和睡眠'],
      }))
      setStatus('已切换成本地建议')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <article className="ai-coach-panel">
      <div className="ai-coach-panel__head">
        <div aria-hidden="true" className="ai-coach-panel__icon">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="section-kicker">AI 教练</p>
          <h2>{advice?.title ?? '让 AI 帮你看今天怎么收尾'}</h2>
          <p>{advice?.summary ?? '按当天饮食、训练和恢复记录，生成几条能马上执行的建议。'}</p>
        </div>
      </div>

      {advice ? (
        <ul className="ai-coach-actions">
          {advice.actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      ) : null}

      <div className="ai-coach-panel__footer">
        <button className="primary-button ai-coach-panel__button" disabled={isLoading} onClick={requestAdvice} type="button">
          {isLoading ? '生成中...' : '生成今日建议'}
        </button>
        {status ? <span className="inline-note">{status}</span> : null}
      </div>
    </article>
  )
}
