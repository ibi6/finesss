# Desktop Todo Reminder Design

## Summary

第一版采用“桌面应用 + 本地服务 + 手机 Web”的方案。桌面端是主应用，负责本地 SQLite 数据、提醒调度、系统通知、系统托盘和后台运行；手机端是在同一 Wi-Fi 下打开的响应式 Web 页面，通过配对 token 调用电脑端本地 API。

这个方案优先满足“桌面待办提醒工具”的核心体验，同时让手机端和电脑端共享同一份数据。它暂不引入账号、云同步和移动端原生推送，为后续云同步留出清晰接口。

## Approved Product Shape

用户已选择方案 B：桌面应用 + 手机 Web。

比较过的方案：

- `Web / PWA first`: 开发最快，但系统托盘、后台运行和提醒可靠性不足。
- `Desktop app + mobile Web`: 桌面提醒可靠，手机端可用，复杂度适合第一版。
- `Full native suite`: 最终体验完整，但账号、云端、推送和打包发布会让第一版过大。

## Users And Jobs

目标用户是在电脑前工作、需要准时提醒的个人用户。

核心任务：

- 快速记录待办事项。
- 给任务设置明确提醒时间。
- 到点收到桌面系统通知。
- 在手机上查看、添加、完成或调整任务。
- 在电脑重启后保留任务和提醒状态。

## Functional Scope

### Desktop App

- 今日、即将到期、全部、已完成四个视图。
- 快速添加任务，字段包括标题、备注、提醒时间、优先级和完成状态。
- 编辑、完成、删除、稍后提醒。
- 后台提醒调度，到点触发系统通知。
- 系统托盘菜单：打开窗口、暂停/恢复提醒、显示手机配对码、退出。
- 本地设置：开机启动开关、提醒提前量、手机端服务开关。

### Mobile Web

- 通过桌面端显示的二维码或配对链接进入。
- 适配手机窄屏，提供任务列表、快速添加、完成和修改提醒时间。
- 手机端不负责后台通知；它只读写电脑端的数据。
- 网络断开时显示离线/不可连接状态，并允许用户重试。

### Pairing And Security

- 桌面端启动局域网 HTTP 服务，只监听用户选择的本地端口。
- 用户主动打开“手机配对”后生成短期 token。
- 二维码包含电脑局域网地址和 token。
- 手机端请求必须带 token；token 过期或关闭配对后失效。
- 第一版不暴露公网访问，不保存账号密码。

## Architecture

```text
Tauri desktop shell
  -> React desktop UI
  -> Reminder scheduler
  -> Tray and notification adapter
  -> Local API server
  -> SQLite task store

Mobile browser
  -> Responsive React mobile UI
  -> Local API server with pairing token
  -> SQLite task store
```

### Components

- `desktop-shell`: Tauri 主进程，负责窗口、托盘、系统通知、开机启动和应用生命周期。
- `task-store`: SQLite 数据访问层，提供任务 CRUD、提醒查询和状态更新。
- `reminder-engine`: 定时扫描未完成且到期的任务，触发通知并记录提醒状态。
- `local-api`: 电脑端本地 HTTP API，供桌面 UI 和手机 Web 访问。
- `pairing-service`: 生成、校验和撤销手机端 token。
- `desktop-ui`: 面向电脑大屏的任务管理界面。
- `mobile-ui`: 面向手机窄屏的任务管理界面。

## Data Model

`tasks`

- `id`: string
- `title`: string
- `notes`: string
- `dueAt`: datetime or null
- `remindAt`: datetime or null
- `priority`: `low | normal | high`
- `status`: `active | completed | deleted`
- `snoozedUntil`: datetime or null
- `lastNotifiedAt`: datetime or null
- `createdAt`: datetime
- `updatedAt`: datetime

`settings`

- `key`: string
- `value`: string

`pairing_tokens`

- `tokenHash`: string
- `expiresAt`: datetime
- `createdAt`: datetime
- `revokedAt`: datetime or null

## Data Flow

1. 用户在桌面端或手机端创建任务。
2. UI 调用 `local-api`。
3. `local-api` 校验输入；手机请求额外校验 token。
4. `task-store` 写入 SQLite。
5. `reminder-engine` 定期查询 `active` 且 `remindAt <= now` 的任务。
6. 到点后 `desktop-shell` 触发系统通知。
7. 用户点击完成或稍后提醒，状态写回 SQLite。
8. 手机端刷新后读取同一份 SQLite 数据。

## Error Handling

- API 输入无效：返回字段级错误，UI 保持用户已输入内容。
- 手机 token 无效或过期：显示重新配对提示。
- 手机无法连接电脑：显示同一 Wi-Fi、服务开关和防火墙检查提示。
- SQLite 写入失败：显示保存失败，并保留本地表单状态。
- 系统通知失败：在应用内提醒中心记录失败状态。
- 提醒调度重复触发：通过 `lastNotifiedAt` 和状态检查避免同一时间重复通知。

## Testing Strategy

- 单元测试：任务状态转换、提醒到期筛选、token 过期校验。
- API 测试：任务 CRUD、手机 token 鉴权、无效输入返回。
- UI 测试：桌面任务列表、手机窄屏任务列表、快速添加流程。
- 手动验证：启动桌面应用、创建 1 分钟后的提醒、收到系统通知、手机扫码添加任务、电脑端看到同步结果。

## Implementation Boundaries

第一版实现本地优先可用闭环。后续云同步可以通过替换或扩展 `local-api` 和 `task-store` 实现，不改变 UI 的核心任务模型。

不在第一版实现：

- 云账号与远程同步。
- 手机端后台推送。
- 多用户协作。
- 第三方日历双向同步。
- AI 自动排程。

## Acceptance Criteria

- 桌面端可本地运行并管理任务。
- 到点提醒可通过系统通知出现。
- 系统托盘提供常用控制入口。
- 手机端在同一局域网内通过配对 token 访问并修改同一份任务数据。
- 重启应用后任务数据仍保留。
- 文档说明如何安装依赖、启动开发环境、运行测试和手动验证手机端访问。
