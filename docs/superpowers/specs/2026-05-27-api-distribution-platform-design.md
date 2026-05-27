# API Distribution Platform Design

## Overview

本项目要建设一个面向内部使用的大模型 API 分发平台，统一接入多个上游 provider，并向下提供两类接口：

- `OpenAI-compatible API`，尽量兼容现有客户端和 SDK
- 平台自定义增强 API，用于路由控制、诊断、运维和平台能力扩展

平台不仅要能转发请求，还要具备管理后台、请求审计、路由策略、基础统计，以及后续商业闭环能力，包括套餐、充值、支付、余额、账单。

本设计文档的目标不是一次性把所有功能同时实现，而是先定义稳定的系统边界、模块职责、关键数据模型和推荐的实施顺序，确保后续可以按阶段建设，而不是在一个过大的目标里失控。

## User

主要用户是平台维护者与内部业务接入方。

- 平台维护者需要统一管理 `provider`、上游密钥、模型映射、路由策略、请求排障、账务与支付配置。
- 内部业务接入方需要通过统一接口调用不同模型平台，而不必分别适配每家厂商。

## Goals

- 提供统一的大模型 API 分发能力，屏蔽不同 provider 的调用差异。
- 支持 `OpenAI-compatible API` 与平台增强 API 并行提供。
- 建立可登录的管理后台，支持运维配置、请求排障和基础统计。
- 设计可扩展的数据模型与模块边界，为支付、钱包、账单等商业能力预留稳定接口。
- 采用分阶段推进方式，优先建设可运行、可验证的核心底座。

## Non-Goals

- 第一阶段不要求覆盖每个 provider 的全部私有高级能力。
- 当前项目不以第一期多租户 SaaS 为目标。
- 当前项目不在第一阶段引入微服务化拆分。
- 当前项目不优先支持所有模型类型，先以主流文本/推理调用链为中心。

## Supported Providers

第一期目标 provider 范围：

- `OpenAI`
- `Anthropic`
- `Google Gemini`
- `DeepSeek`
- `Xiaomi` 以及类似的大众平台

平台架构应允许后续继续扩展新的 provider，而不需要重写网关核心。

## Recommended Architecture

推荐采用“前后端分离视角下的模块化单体（modular monolith）”：

- 前端使用一个独立的管理台应用壳，但仍与后端同仓、同项目开发。
- 后端先作为单一主服务部署。
- 在代码结构和领域层面按模块划分，后续如果流量或组织复杂度增长，再将 `gateway`、`payments` 等模块拆成独立服务。

不推荐第一期直接采用微服务。原因是代理层、后台、账务、支付同时存在时，微服务会显著增加开发、联调、部署和监控复杂度，不利于第一阶段形成稳定交付。

## System Layers

系统建议拆为五层：

### 1. Client Access Layer

对外提供两类入口：

- `OpenAI-compatible API`
- `Platform API`

这一层的职责是对接客户端和后台调用方，而不是承载 provider 差异处理逻辑。

### 2. Gateway Core

平台核心网关层，负责：

- 平台 API key 校验
- 请求规范化
- 模型映射
- 路由决策
- 失败切换
- 限流与配额
- 审计日志
- 响应标准化

所有入口流量都应先进入这里，再分发到具体 provider adapter。

### 3. Provider Adapter Layer

每个 provider 实现一个独立 adapter，例如：

- `OpenAIAdapter`
- `AnthropicAdapter`
- `GeminiAdapter`
- `DeepSeekAdapter`
- `XiaomiAdapter`

adapter 负责把平台内部统一请求结构转换为各家真实 API 请求，并把返回结果映射回平台统一响应格式。

### 4. Control Plane

管理后台和平台控制面的业务层，负责：

- `provider` 与上游密钥管理
- 模型目录与映射管理
- 路由策略管理
- 请求审计与查询
- 套餐、价格、钱包、订单、账单管理
- 系统级配置项

### 5. Data & Infra Layer

底层基础设施建议包括：

- `PostgreSQL`：主业务数据库
- `Redis`：缓存、限流、幂等与短期状态
- 对象存储：可选，用于导出报表与大体积归档
- 队列：可选，用于异步记账、聚合统计、通知与对账

## Recommended Tech Stack

建议第一期采用以下技术栈：

- 后端：`Next.js + TypeScript`
- 前端后台：`Next.js App Router + Tailwind CSS + shadcn/ui`
- ORM：`Prisma`
- 数据库：`PostgreSQL`
- 缓存：`Redis`
- 鉴权：`Auth.js / NextAuth` 或等价的 session 方案
- 日志：应用内结构化日志 + 审计表
- 监控：第一期先内建统计与错误聚合，后续再接入 `Sentry / Grafana / Loki`

推荐这套栈的原因：

- 可以在一个工程里同时交付后台、API、支付回调和管理能力。
- 第一阶段开发效率高，部署复杂度低。
- `TypeScript` 适合处理复杂 provider 差异与账务字段。
- 后续若需要拆服务，可在清晰的模块边界上逐步迁移。

## Module Boundaries

后端逻辑建议至少划分为八个模块：

### `auth`

负责后台登录、管理员身份、session 和权限校验。

### `gateway`

负责对外 API 入口、平台鉴权、统一请求建模、模型映射、路由选择、fallback、响应标准化。

### `providers`

负责所有 provider adapter 的实现与统一接口抽象。

### `catalog`

负责平台模型目录、模型别名、能力声明、provider-model 映射。

### `billing`

负责价格规则、扣费规则、钱包、账单和账务流水。

### `payments`

负责充值订单、支付发起、支付回调和支付状态同步。

### `admin`

负责后台控制面接口与页面所需的管理能力。

### `analytics`

负责请求日志、token 用量、错误统计、收入与成本统计。

## Suggested Repository Shape

建议代码组织大致如下：

```text
src/
  app/
    api/
    admin/
    login/
  modules/
    auth/
    gateway/
    providers/
    catalog/
    billing/
    payments/
    admin/
    analytics/
  lib/
    db/
    redis/
    logger/
    config/
```

这是一种“单体工程、分层模块”的组织方式，便于第一期快速落地，也方便未来解耦。

## Core Domain Model

第一期建议至少定义以下核心实体：

### `admin_users`

后台管理员账号。

关键字段：

- `email`
- `password_hash`
- `role`
- `status`
- `last_login_at`

### `providers`

上游 provider 定义。

关键字段：

- `code`
- `name`
- `base_url`
- `status`
- `adapter_type`
- `timeout_ms`

### `provider_keys`

每个 provider 关联的真实上游密钥。

关键字段：

- `provider_id`
- `key_name`
- `api_key_encrypted`
- `weight`
- `status`
- `rpm_limit`
- `tpm_limit`
- `daily_budget`

### `models`

平台统一模型目录。

关键字段：

- `model_code`
- `display_name`
- `category`
- `status`
- `is_public`

### `model_mappings`

平台模型与 provider 模型的映射关系。

关键字段：

- `model_id`
- `provider_id`
- `provider_model_name`
- `priority`
- `is_fallback`
- `pricing_rule_id`

### `routing_policies`

路由策略定义。

关键字段：

- `name`
- `strategy_type`
- `conditions_json`
- `targets_json`
- `status`

### `api_clients`

平台调用方身份。

关键字段：

- `client_name`
- `api_key_hash`
- `status`
- `quota_mode`
- `balance_enabled`

### `api_requests`

每次调用请求的审计主记录。

关键字段：

- `request_id`
- `client_id`
- `model_id`
- `provider_id`
- `provider_key_id`
- `endpoint_type`
- `status`
- `latency_ms`
- `input_tokens`
- `output_tokens`
- `estimated_cost`
- `billed_amount`
- `error_code`

### `wallet_accounts`

钱包账户。

关键字段：

- `owner_type`
- `owner_id`
- `balance`
- `frozen_balance`
- `currency`
- `status`

### `wallet_transactions`

钱包流水。

关键字段：

- `wallet_id`
- `type`
- `amount`
- `balance_before`
- `balance_after`
- `related_order_id`
- `related_request_id`
- `description`

### `payment_orders`

充值支付订单。

关键字段：

- `order_no`
- `wallet_id`
- `amount`
- `channel`
- `status`
- `paid_at`
- `third_party_trade_no`

### `billing_rules`

价格与计费规则。

关键字段：

- `name`
- `model_id`
- `billing_mode`
- `input_price`
- `output_price`
- `request_price`
- `effective_from`

## Key Data Principles

- `provider_keys.api_key` 必须加密存储，不能明文保存。
- `api_requests` 必须区分“上游成本”和“平台计费金额”。
- 钱包余额是结果字段，流水才是最终账务事实。
- 价格规则必须版本化，避免用新价格回算旧请求。
- 路由策略与模型映射尽量配置化，不把厂商逻辑写死在业务流程中。

## External APIs

### OpenAI-Compatible APIs

第一期建议优先支持：

- `POST /api/v1/chat/completions`
- `POST /api/v1/responses`
- `GET /api/v1/models`

后续扩展方向：

- `/embeddings`
- `/images`
- `/audio/*`

### Platform APIs

第一期建议至少提供：

- `POST /platform/v1/inference`
- `GET /platform/v1/providers`
- `GET /platform/v1/models`
- `POST /platform/v1/keys/test`
- `GET /platform/v1/requests/:id`

其中 `POST /platform/v1/inference` 是平台增强入口，允许后续承载路由提示、故障分析、调试参数等非兼容层能力。

## Unified Request Model

无论请求来自兼容层还是平台层，进入业务核心前都应转换成统一内部对象，例如：

```ts
type UnifiedInferenceRequest = {
  requestId: string
  clientId: string
  endpointType: "chat.completions" | "responses" | "platform.inference"
  model: string
  messages?: Array<{ role: string; content: string }>
  input?: string
  temperature?: number
  maxTokens?: number
  metadata?: Record<string, unknown>
  routingHint?: {
    preferredProvider?: string
    disableFallback?: boolean
    costPriority?: boolean
  }
}
```

这样 provider adapter、计费、日志和统计都只处理统一领域对象，降低入口差异带来的复杂度。

## Core Request Flow

主调用链建议如下：

```text
1. Client 发起请求
2. gateway 校验平台 api key
3. 识别接口类型（compatible / platform）
4. 规范化请求，转换为统一内部请求模型
5. 根据 model 与 routing policy 选择 provider/provider_key
6. 调用对应 provider adapter
7. 标准化响应结果
8. 记录 request log、token usage、cost、billing
9. 返回统一响应
```

## Routing Strategy

第一期建议支持以下四类核心能力：

- 模型映射路由
- 优先级路由
- 故障切换
- 平台增强 API 的手动指定路由

建议先不引入过度复杂的智能调度。MVP 阶段优先保证可解释、可配置、可排障。

建议的处理顺序：

```text
请求进入
-> 查模型映射
-> 取主目标 provider
-> 检查 provider/key 可用性
-> 发起上游请求
-> 命中可重试失败时切换 fallback
-> 返回结果
-> 记录完整尝试链路
```

平台必须保留“尝试过哪些 provider、为何切换、最终命中了谁”的完整记录，以支持后台排障。

## Billing and Payment Flow

请求处理和账务处理建议分成主链与账务链：

### 请求主链

- 完成请求处理
- 获取响应状态与 token 结果
- 计算上游成本

### 账务链

- 根据 `billing_rules` 计算平台计费金额
- 检查钱包余额或配额状态
- 写入钱包流水
- 回写 `api_requests.billed_amount`
- 生成账单记录

建议的扣费流程：

```text
api_request 完成
-> 统计 input/output tokens
-> 按 billing_rule 计算 billed_amount
-> 检查 wallet balance
-> 写 wallet_transaction
-> 回写 api_request
-> 生成账单记录
```

支付充值流程：

```text
创建 payment_order
-> 用户支付
-> 支付回调
-> 验签
-> 更新 payment_order.status
-> 增加 wallet_account.balance
-> 写 wallet_transaction(recharge)
```

关键原则：

- 余额变化必须通过流水落账。
- 扣费与支付回调都要做幂等。
- 账务链路不应把第三方支付状态直接当成最终余额事实。

## Admin Console Information Architecture

后台是平台的 `control plane`，第一期页面结构建议围绕“配置、观测、排障”三类目标设计。

### 1. Dashboard

建议展示：

- 总请求数
- 成功率
- 平均延迟
- 今日 token 用量
- 今日收入
- 今日上游成本
- 当前余额预警
- 最近异常 provider

并附带：

- 最近失败请求
- 最近支付异常
- 最近异常 `provider key`

### 2. Provider Management

建议拆成：

- `Providers`
- `Provider Keys`

重点能力：

- 新增/编辑 key
- 启用/禁用 key
- 测试 key 有效性
- 调整权重
- 查看健康状态与错误记录

### 3. Models and Routing

建议拆成：

- `Models`
- `Model Mappings / Routing`

需要同时展示配置态和运行态：

- 平台模型名
- 当前主 provider
- fallback provider
- 当前价格规则
- 最近成功率
- 最近平均延迟

### 4. API Clients and Request Logs

建议页面：

- `API Clients`
- `Request Logs`

请求日志需要支持按时间、模型、provider、client、状态、错误码、请求 ID 筛选，并在详情页展示：

- 基本请求信息
- 命中的平台模型
- 实际命中的 provider/provider key
- 请求耗时
- tokens
- 上游成本
- 平台计费金额
- fallback 链路
- 错误摘要

### 5. Commercial Pages

建议页面：

- `Plans / Pricing`
- `Payment Orders`
- `Wallets`
- `Transactions / Bills`

### 6. System Settings

用于承载跨模块全局配置，例如：

- 默认路由策略
- 默认超时
- 全局限流
- 支付渠道配置
- 回调域名
- 敏感配置状态检查

## Suggested Navigation

```text
Dashboard
Providers
Provider Keys
Models
Routing
API Clients
Request Logs
Pricing
Payment Orders
Wallets
Transactions
System Settings
```

## Role Model

虽然当前是内部使用，仍建议预留至少三类后台角色：

- `super_admin`
- `operator`
- `finance`

第一期实现可以只先启用管理员角色，但数据库与权限判断不应把角色模型彻底写死。

## Delivery Phases

### Phase 1: Platform Foundation

目标：打通代理主链与后台最小闭环。

范围建议：

- 项目初始化
- `PostgreSQL / Prisma / Redis`
- 后台登录
- `providers / provider_keys / models / model_mappings / routing_policies / api_clients`
- `OpenAI-compatible API`
- 平台统一推理 API
- 基础 provider adapter 框架
- 请求日志、基础 token 统计
- 最小后台页面：
  `Dashboard / Provider Keys / Models / Routing / Request Logs`

### Phase 2: Operations and Observability

目标：提升可运维性与稳定性。

范围建议：

- key 健康检查
- 权重与轮询
- fallback 与熔断增强
- 配额与限流控制
- Dashboard 图表增强
- 请求详情增强
- 系统配置中心

### Phase 3: Commercial Closure

目标：打通充值、余额、扣费与账单。

范围建议：

- `wallet_accounts / wallet_transactions / payment_orders / billing_rules`
- 套餐与价格规则
- 充值下单
- 支付回调
- 余额入账
- 请求扣费
- 账单与流水查询

### Phase 4: Enhanced Capabilities

目标：补齐长期运营能力。

范围建议：

- 多角色权限
- 更丰富的模型类型支持
- 成本分析与利润分析
- 告警通知
- 对账任务
- 数据导出
- 视需求再评估多租户化

## Recommended Build Order

建议实际开发顺序如下：

1. 先稳定数据库与领域模型
2. 再实现 provider adapter 与 gateway 主链
3. 再建设后台最小运维页面
4. 再补统计、排障和健康状态
5. 再接支付、钱包和账单
6. 最后补角色、告警和深度分析能力

这样可以保证每一步都建立在已可运行、可观测的底座上。

## Key Risks

### Provider Difference Risk

不同 provider 的请求结构、流式格式、错误码、token 口径不一致。

缓解方式：

- 使用统一请求模型
- 采用独立 adapter
- 第一阶段优先做共同能力

### Routing Complexity Risk

如果一开始做太多智能调度，平台会变得难以解释和排障。

缓解方式：

- 第一阶段只做优先级、fallback 和手动指定

### Billing Accuracy Risk

请求成功、token 统计、余额扣费之间如果没有幂等设计，容易产生错账。

缓解方式：

- 钱包流水独立建模
- 支付与扣费做幂等
- 价格规则版本化

### Admin Scope Creep

后台很容易膨胀成一个复杂运营系统。

缓解方式：

- 第一阶段只做与平台运行直接相关的页面

### Payment Integration Risk

支付回调、验签、异步状态同步都容易出错。

缓解方式：

- 将 `payments` 与 `billing` 分层
- 先保证账务模型正确，再接具体支付渠道

## Acceptance Criteria by Phase

### Phase 1

- 能配置 provider 和 key
- 能打通至少 2 到 3 家上游
- `OpenAI-compatible API` 可被真实客户端调用
- 后台可查看请求和路由结果

### Phase 2

- key 健康状态可视化
- fallback 生效且可观察
- 可通过后台定位主要故障来源

### Phase 3

- 能充值
- 能入账
- 能扣费
- 能查流水和账单
- 账务链路可追溯

### Phase 4

- 权限、告警、分析类能力满足实际运营需要

## Recommended Scope for the Next Step

下一步不建议直接开始实现整个平台。

推荐做法是：

- 先将本设计作为总 spec 固化
- 再基于本设计只为 `Phase 1: Platform Foundation` 编写 `implementation plan`
- 之后按 `Plan -> Build -> Review -> Verify` 流程推进第一阶段实现

这样既保留完整平台蓝图，也能保证第一阶段真正落地。
