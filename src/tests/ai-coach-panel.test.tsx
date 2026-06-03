import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AiCoachPanel } from '../app/components/AiCoachPanel'
import { formatLocalDateKey } from '../store/date'
import { createSeedSnapshot } from '../store/seed'

describe('AiCoachPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('requests a coach summary through the server proxy and displays the advice', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        provider: 'openai',
        title: '今天先把蛋白补齐',
        summary: '晚餐优先选高蛋白，训练保持轻量完成。',
        actions: ['晚餐吃一份鸡胸饭', '睡前补 500ml 水', '做 25 分钟坡走'],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AiCoachPanel snapshot={createSeedSnapshot()} targetDate={formatLocalDateKey(new Date())} />)

    await user.click(screen.getByRole('button', { name: '生成今日建议' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/ai/coach',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })

    expect(await screen.findByText('今天先把蛋白补齐')).toBeInTheDocument()
    expect(screen.getByText('晚餐吃一份鸡胸饭')).toBeInTheDocument()
  })
})
