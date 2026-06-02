import type { MealWorkspace } from './MealsView.model'

interface MealWorkspaceTabsProps {
  activeWorkspace: MealWorkspace
  onSwitch: (workspace: MealWorkspace) => void
}

export function MealWorkspaceTabs({ activeWorkspace, onSwitch }: MealWorkspaceTabsProps) {
  const isLogWorkspace = activeWorkspace === 'log'
  const isPlanWorkspace = activeWorkspace === 'plan'
  const isLibraryWorkspace = activeWorkspace === 'library'

  return (
    <div className="meal-workspace-switcher">
      <div aria-label="饮食工作区" className="meal-workspace-tablist" role="tablist">
        <button
          aria-controls="meals-workspace-log"
          aria-label="切换到记录工作区"
          aria-selected={isLogWorkspace}
          className={`meal-workspace-tab${isLogWorkspace ? ' is-active' : ''}`}
          id="meal-workspace-tab-log"
          onClick={() => onSwitch('log')}
          role="tab"
          type="button"
        >
          <strong>记录</strong>
          <small>拍照、手填、当天记录</small>
        </button>
        <button
          aria-controls="meals-workspace-plan"
          aria-label="切换到计划工作区"
          aria-selected={isPlanWorkspace}
          className={`meal-workspace-tab${isPlanWorkspace ? ' is-active' : ''}`}
          id="meal-workspace-tab-plan"
          onClick={() => onSwitch('plan')}
          role="tab"
          type="button"
        >
          <strong>计划</strong>
          <small>模板沉淀、排餐、备餐</small>
        </button>
        <button
          aria-controls="meals-workspace-library"
          aria-label="切换到食物库工作区"
          aria-selected={isLibraryWorkspace}
          className={`meal-workspace-tab${isLibraryWorkspace ? ' is-active' : ''}`}
          id="meal-workspace-tab-library"
          onClick={() => onSwitch('library')}
          role="tab"
          type="button"
        >
          <strong>食物库</strong>
          <small>搜索、收藏、自定义</small>
        </button>
      </div>
      <p className="inline-note meal-workspace-note">
        记录区专注当天录入，计划区集中模板与排餐，食物库单独沉淀常吃项。
      </p>
    </div>
  )
}
