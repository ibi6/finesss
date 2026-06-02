import type { MealWorkspace } from './MealsView.model'

interface MealWorkspaceTabsProps {
  activeWorkspace: MealWorkspace
  onSwitch: (workspace: MealWorkspace) => void
}

export function MealWorkspaceTabs({ activeWorkspace, onSwitch }: MealWorkspaceTabsProps) {
  const isLogWorkspace = activeWorkspace === 'log'
  const isPlanWorkspace = activeWorkspace === 'plan'

  return (
    <div className="meal-workspace-switcher">
      <div aria-label="饮食记录入口" className="meal-workspace-tablist meal-workspace-tablist--frontstage" role="tablist">
        <button
          aria-controls="meals-workspace-log"
          aria-label="查看今天记录"
          aria-selected={isLogWorkspace}
          className={`meal-workspace-tab${isLogWorkspace ? ' is-active' : ''}`}
          id="meal-workspace-tab-log"
          onClick={() => onSwitch('log')}
          role="tab"
          type="button"
        >
          <strong>今天记录</strong>
          <small>拍照、手填、三餐</small>
        </button>
        <button
          aria-controls="meals-workspace-plan"
          aria-label="查看本周安排"
          aria-selected={isPlanWorkspace}
          className={`meal-workspace-tab${isPlanWorkspace ? ' is-active' : ''}`}
          id="meal-workspace-tab-plan"
          onClick={() => onSwitch('plan')}
          role="tab"
          type="button"
        >
          <strong>本周安排</strong>
          <small>常用组合、排餐、备餐</small>
        </button>
      </div>
      <p className="inline-note meal-workspace-note">
        页面先看当天吃了什么，常用食物只在录入时用来搜索和带入。
      </p>
    </div>
  )
}
