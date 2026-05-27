# API Distribution Platform Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable Phase 1 platform foundation that exposes `OpenAI-compatible API` and `Platform API`, routes requests across configured providers, records request audits, and provides a minimal admin console for provider keys, models, routing, and request logs.

**Architecture:** Use a modular Next.js monolith with thin route handlers and domain services under `src/modules`. Persist platform configuration and request audits in `PostgreSQL` via `Prisma`. Keep provider differences behind adapters and keep routing, logging, and admin queries in separate services so Phase 2 can extend health checks, fallback intelligence, and analytics without rewriting the core.

**Tech Stack:** `Next.js`, `TypeScript`, `Prisma`, `PostgreSQL`, `Vitest`, `React Testing Library`, `Tailwind CSS`, `shadcn/ui`, `Zod`

---

## Context

已批准的 `brief.md` 与设计 spec 将第一阶段范围限定为“平台底座”：

- 提供 `POST /api/v1/chat/completions`
- 提供 `POST /api/v1/responses`
- 提供 `GET /api/v1/models`
- 提供 `POST /platform/v1/inference`
- 提供最小后台页面：`Dashboard / Provider Keys / Models / Routing / Request Logs`
- 支持 `OpenAI / Anthropic / Gemini / DeepSeek / Xiaomi` 的 adapter 框架
- 记录请求日志、tokens、路由结果与错误摘要

当前仓库只有 Starter Kit 文档，没有应用代码，因此本计划从项目初始化开始，目标是在 Phase 1 结束时得到一个可以本地运行、可配置、可验证的最小平台。

## Proposed Approach

1. 初始化 `Next.js + TypeScript` 应用与测试基线。
2. 建立 Phase 1 的 `Prisma` schema、数据库访问层与环境配置。
3. 定义统一推理请求模型、provider adapter 合约与工厂。
4. 建立模型映射、路由决策、请求审计三个核心服务。
5. 暴露兼容层与平台增强层 API。
6. 实现后台登录与最小控制台页面。
7. 用单元测试、集成测试和手工联调验证主链路。

## Files to Change

- `package.json`: 声明应用、测试、Prisma 与 UI 依赖。
- `next.config.ts`: Next.js 配置。
- `tsconfig.json`: TypeScript 配置。
- `postcss.config.mjs`: Tailwind 所需配置。
- `src/app/layout.tsx`: 全局布局。
- `src/app/page.tsx`: 首页占位与跳转入口。
- `src/app/api/health/route.ts`: 基础健康检查。
- `src/app/api/v1/chat/completions/route.ts`: OpenAI-compatible 聊天入口。
- `src/app/api/v1/responses/route.ts`: OpenAI-compatible responses 入口。
- `src/app/api/v1/models/route.ts`: 平台模型列表。
- `src/app/platform/v1/inference/route.ts`: 平台增强推理入口。
- `src/app/login/page.tsx`: 后台登录页。
- `src/app/admin/page.tsx`: Dashboard。
- `src/app/admin/provider-keys/page.tsx`: Provider keys 页面。
- `src/app/admin/models/page.tsx`: Models 页面。
- `src/app/admin/routing/page.tsx`: Routing 页面。
- `src/app/admin/request-logs/page.tsx`: Request logs 页面。
- `src/lib/env.ts`: 环境变量解析。
- `src/lib/db/prisma.ts`: Prisma client 单例。
- `src/lib/crypto.ts`: API key 加密与比较。
- `src/lib/logger.ts`: 结构化日志包装。
- `src/modules/gateway/domain/unified-inference.ts`: 统一请求/响应类型。
- `src/modules/gateway/application/route-inference.ts`: 主路由服务。
- `src/modules/gateway/application/list-models.ts`: 模型列表服务。
- `src/modules/gateway/application/write-request-audit.ts`: 请求审计写入服务。
- `src/modules/providers/domain/provider-adapter.ts`: adapter 接口定义。
- `src/modules/providers/application/provider-factory.ts`: adapter 工厂。
- `src/modules/providers/adapters/*.ts`: 各 provider adapter 实现。
- `src/modules/catalog/data/catalog-repository.ts`: 模型与映射查询。
- `src/modules/catalog/data/provider-key-repository.ts`: provider key 查询。
- `src/modules/admin/data/request-log-repository.ts`: 请求日志与 dashboard 查询。
- `src/modules/auth/application/admin-auth.ts`: 管理员登录逻辑。
- `src/modules/auth/application/session.ts`: 后台 session 帮助方法。
- `prisma/schema.prisma`: Phase 1 数据模型。
- `prisma/seed.ts`: 初始管理员、provider、模型种子。
- `tests/api/health.route.test.ts`: 健康检查测试。
- `tests/modules/providers/provider-factory.test.ts`: provider 合约测试。
- `tests/modules/gateway/route-inference.test.ts`: 路由与 fallback 测试。
- `tests/api/compatible-routes.test.ts`: 兼容层 API 测试。
- `tests/app/admin/dashboard-page.test.tsx`: Dashboard 页面测试。
- `README.md`: 记录本地启动、环境变量与测试命令。
- `tasks/2026-05-27-api-distribution-platform/execution-log.md`: 记录实现与偏差。
- `tasks/2026-05-27-api-distribution-platform/verification.md`: 记录验证证据。

## Data Flow

1. 客户端使用平台 `api key` 调用兼容层或平台增强层 API。
2. 路由层把请求转换成 `UnifiedInferenceRequest`。
3. `catalog-repository` 读取平台模型与 `model_mappings`。
4. `route-inference` 选择 `provider` 和 `provider_key`。
5. `provider-factory` 返回对应 adapter。
6. adapter 调用上游并返回统一结果。
7. `write-request-audit` 写入 `api_requests`。
8. 后台页面通过 `request-log-repository` 和 `catalog-repository` 查询运行信息。

## Risks

- Provider 差异大：通过统一请求模型和 adapter 接口隔离。
- Phase 1 代码量大：通过模块化单体和薄路由减少横切耦合。
- 路由逻辑不可观察：通过 `api_requests` 保存 provider、key、latency、error。
- 后台范围失控：只交付设计 spec 中已批准的 5 个最小页面。
- 第三方 key 不可用：通过 `provider` 开关与 mock adapter 保证本地可测。

## Test Plan

- `pnpm vitest run tests/api/health.route.test.ts`: 健康检查返回 200 和 `ok: true`
- `pnpm vitest run tests/modules/providers/provider-factory.test.ts`: provider 工厂返回正确 adapter
- `pnpm vitest run tests/modules/gateway/route-inference.test.ts`: 主路由、fallback、错误记录通过
- `pnpm vitest run tests/api/compatible-routes.test.ts`: 兼容层和平台层入口返回统一结构
- `pnpm vitest run tests/app/admin/dashboard-page.test.tsx`: Dashboard 正常渲染关键卡片
- `pnpm prisma validate`: schema 合法
- 手工检查：本地启动后，用 `curl` 调 `GET /api/v1/models` 与 `POST /platform/v1/inference`

## Rollback Plan

- 如果网关主链不稳定，先关闭 `POST /platform/v1/inference`，仅保留 `GET /api/v1/models` 与健康检查。
- 如果后台页面阻塞发布，保留只读 Dashboard 和 Request Logs，推迟可编辑页面。
- 如果某个 provider adapter 不稳定，保留 adapter 接口与配置项，但在种子数据中禁用该 provider。

## Approval

- Brief approved by user on `2026-05-27`
- Design spec approved by user on `2026-05-27`
- This plan covers only `Phase 1: Platform Foundation`

### Task 1: Bootstrap the Next.js App and Test Harness

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/api/health/route.ts`
- Create: `tests/api/health.route.test.ts`

- [ ] **Step 1: Generate the base app shell**

Run:

```bash
pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir --use-pnpm --import-alias "@/*"
```

Expected: root contains `package.json`, `src/app`, Tailwind config, and `pnpm-lock.yaml`.

- [ ] **Step 2: Write the failing health route test**

```ts
import { describe, expect, it } from "vitest"
import { GET } from "@/app/api/health/route"

describe("GET /api/health", () => {
  it("returns platform health payload", async () => {
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({
      ok: true,
      service: "api-distribution-platform",
    })
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run:

```bash
pnpm vitest run tests/api/health.route.test.ts
```

Expected: FAIL with `Cannot find module '@/app/api/health/route'`.

- [ ] **Step 4: Implement the health route and minimal app shell**

```ts
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "api-distribution-platform",
  })
}
```

```tsx
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
```

```tsx
import Link from "next/link"

export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">API Distribution Platform</h1>
      <p className="mt-2 text-sm text-slate-600">
        Phase 1 foundation in progress.
      </p>
      <Link className="mt-4 inline-block underline" href="/admin">
        Open admin console
      </Link>
    </main>
  )
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run:

```bash
pnpm vitest run tests/api/health.route.test.ts
```

Expected: PASS with `1 passed`.

- [ ] **Step 6: Commit the bootstrap**

```bash
git add package.json next.config.ts tsconfig.json postcss.config.mjs src/app tests/api/health.route.test.ts
git commit -m "feat: bootstrap next app foundation"
```

### Task 2: Add Phase 1 Prisma Schema and Environment Configuration

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/env.ts`
- Create: `src/lib/db/prisma.ts`
- Create: `src/lib/crypto.ts`
- Test: `tests/modules/catalog/schema-config.test.ts`

- [ ] **Step 1: Write the failing env and schema smoke test**

```ts
import { describe, expect, it } from "vitest"
import { env } from "@/lib/env"

describe("platform env", () => {
  it("requires database url and admin seed credentials", () => {
    expect(env.DATABASE_URL).toContain("postgres")
    expect(env.ADMIN_EMAIL).toContain("@")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm vitest run tests/modules/catalog/schema-config.test.ts
```

Expected: FAIL with `Cannot find module '@/lib/env'`.

- [ ] **Step 3: Implement env parsing, Prisma client, and Phase 1 schema**

```ts
import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
})

export const env = envSchema.parse(process.env)
```

```ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
```

```prisma
model Provider {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  baseUrl     String
  adapterType String
  status      String   @default("active")
  timeoutMs   Int      @default(30000)
  keys        ProviderKey[]
  mappings    ModelMapping[]
  requests    ApiRequest[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ProviderKey {
  id              String   @id @default(cuid())
  providerId      String
  keyName         String
  apiKeyEncrypted String
  weight          Int      @default(100)
  status          String   @default("active")
  rpmLimit        Int?
  tpmLimit        Int?
  dailyBudget     Decimal? @db.Decimal(18, 6)
  provider        Provider @relation(fields: [providerId], references: [id])
  requests        ApiRequest[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

- [ ] **Step 4: Complete the remaining Phase 1 models and seed data**

Add these remaining models in `prisma/schema.prisma`:

```prisma
model AdminUser {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         String   @default("super_admin")
  status       String   @default("active")
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Model {
  id          String         @id @default(cuid())
  modelCode   String         @unique
  displayName String
  category    String         @default("chat")
  status      String         @default("active")
  isPublic    Boolean        @default(true)
  mappings    ModelMapping[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model ModelMapping {
  id                String   @id @default(cuid())
  modelId           String
  providerId        String
  providerModelName String
  priority          Int      @default(1)
  isFallback        Boolean  @default(false)
  status            String   @default("active")
  model             Model    @relation(fields: [modelId], references: [id])
  provider          Provider @relation(fields: [providerId], references: [id])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model RoutingPolicy {
  id             String   @id @default(cuid())
  name           String   @unique
  strategyType   String
  conditionsJson Json
  targetsJson    Json
  status         String   @default("active")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model ApiClient {
  id            String   @id @default(cuid())
  clientName    String   @unique
  apiKeyHash    String
  status        String   @default("active")
  quotaMode     String   @default("wallet")
  balanceEnabled Boolean @default(true)
  requests      ApiRequest[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model ApiRequest {
  id             String      @id @default(cuid())
  requestId      String      @unique
  clientId       String
  modelCode      String
  providerId     String?
  providerKeyId  String?
  endpointType   String
  status         String
  latencyMs      Int?
  inputTokens    Int         @default(0)
  outputTokens   Int         @default(0)
  estimatedCost  Decimal?    @db.Decimal(18, 6)
  billedAmount   Decimal?    @db.Decimal(18, 6)
  errorCode      String?
  client         ApiClient   @relation(fields: [clientId], references: [id])
  provider       Provider?   @relation(fields: [providerId], references: [id])
  providerKey    ProviderKey? @relation(fields: [providerKeyId], references: [id])
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}
```

Seed these records in `prisma/seed.ts`:

```ts
await prisma.adminUser.upsert({
  where: { email: env.ADMIN_EMAIL },
  update: {},
  create: {
    email: env.ADMIN_EMAIL,
    passwordHash: await hashSecret(env.ADMIN_PASSWORD),
  },
})

await prisma.provider.createMany({
  data: [
    { code: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1", adapterType: "openai" },
    { code: "anthropic", name: "Anthropic", baseUrl: "https://api.anthropic.com", adapterType: "anthropic" },
    { code: "gemini", name: "Gemini", baseUrl: "https://generativelanguage.googleapis.com", adapterType: "gemini" },
    { code: "deepseek", name: "DeepSeek", baseUrl: "https://api.deepseek.com", adapterType: "deepseek" },
    { code: "xiaomi", name: "Xiaomi", baseUrl: "https://api.xiaomi.example", adapterType: "xiaomi" },
  ],
  skipDuplicates: true,
})
```

- [ ] **Step 5: Validate schema and generate Prisma client**

Run:

```bash
pnpm prisma validate
pnpm prisma generate
```

Expected: both commands succeed with `Prisma schema loaded` and `Generated Prisma Client`.

- [ ] **Step 6: Commit database foundation**

```bash
git add prisma src/lib tests/modules/catalog/schema-config.test.ts
git commit -m "feat: add phase one schema and env config"
```

### Task 3: Define Provider Adapter Contracts and Factory

**Files:**
- Create: `src/modules/gateway/domain/unified-inference.ts`
- Create: `src/modules/providers/domain/provider-adapter.ts`
- Create: `src/modules/providers/application/provider-factory.ts`
- Create: `src/modules/providers/adapters/openai-adapter.ts`
- Create: `src/modules/providers/adapters/anthropic-adapter.ts`
- Create: `src/modules/providers/adapters/gemini-adapter.ts`
- Create: `src/modules/providers/adapters/deepseek-adapter.ts`
- Create: `src/modules/providers/adapters/xiaomi-adapter.ts`
- Test: `tests/modules/providers/provider-factory.test.ts`

- [ ] **Step 1: Write the failing adapter factory test**

```ts
import { describe, expect, it } from "vitest"
import { createProviderAdapter } from "@/modules/providers/application/provider-factory"

describe("createProviderAdapter", () => {
  it("returns an adapter for a supported provider", () => {
    const adapter = createProviderAdapter("openai")
    expect(adapter.providerCode).toBe("openai")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm vitest run tests/modules/providers/provider-factory.test.ts
```

Expected: FAIL with `Cannot find module '@/modules/providers/application/provider-factory'`.

- [ ] **Step 3: Implement the unified request model and provider interface**

```ts
export type UnifiedInferenceRequest = {
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

export type UnifiedInferenceResult = {
  providerCode: string
  providerModel: string
  outputText: string
  inputTokens: number
  outputTokens: number
  raw: unknown
}
```

```ts
import type {
  UnifiedInferenceRequest,
  UnifiedInferenceResult,
} from "@/modules/gateway/domain/unified-inference"

export interface ProviderAdapter {
  providerCode: string
  supportsResponsesApi: boolean
  infer(request: UnifiedInferenceRequest): Promise<UnifiedInferenceResult>
  listModels(): Promise<string[]>
}
```

- [ ] **Step 4: Implement the factory and five adapter shells**

```ts
import { AnthropicAdapter } from "@/modules/providers/adapters/anthropic-adapter"
import { DeepSeekAdapter } from "@/modules/providers/adapters/deepseek-adapter"
import { GeminiAdapter } from "@/modules/providers/adapters/gemini-adapter"
import { OpenAIAdapter } from "@/modules/providers/adapters/openai-adapter"
import { XiaomiAdapter } from "@/modules/providers/adapters/xiaomi-adapter"

export function createProviderAdapter(providerCode: string) {
  switch (providerCode) {
    case "openai":
      return new OpenAIAdapter()
    case "anthropic":
      return new AnthropicAdapter()
    case "gemini":
      return new GeminiAdapter()
    case "deepseek":
      return new DeepSeekAdapter()
    case "xiaomi":
      return new XiaomiAdapter()
    default:
      throw new Error(`Unsupported provider: ${providerCode}`)
  }
}
```

Each adapter should initially return a deterministic mocked result:

```ts
export class OpenAIAdapter implements ProviderAdapter {
  providerCode = "openai"
  supportsResponsesApi = true

  async infer(request: UnifiedInferenceRequest): Promise<UnifiedInferenceResult> {
    return {
      providerCode: this.providerCode,
      providerModel: request.model,
      outputText: "mock-openai-response",
      inputTokens: 10,
      outputTokens: 20,
      raw: { mocked: true },
    }
  }

  async listModels() {
    return ["gpt-4.1", "gpt-4.1-mini"]
  }
}
```

Mirror the same class shape for the other four providers with provider-specific `providerCode`.

- [ ] **Step 5: Run the test to verify it passes**

Run:

```bash
pnpm vitest run tests/modules/providers/provider-factory.test.ts
```

Expected: PASS with `1 passed`.

- [ ] **Step 6: Commit provider contracts**

```bash
git add src/modules/gateway src/modules/providers tests/modules/providers/provider-factory.test.ts
git commit -m "feat: add provider adapter contracts"
```

### Task 4: Implement Catalog, Routing, and Request Audit Services

**Files:**
- Create: `src/modules/catalog/data/catalog-repository.ts`
- Create: `src/modules/catalog/data/provider-key-repository.ts`
- Create: `src/modules/gateway/application/route-inference.ts`
- Create: `src/modules/gateway/application/list-models.ts`
- Create: `src/modules/gateway/application/write-request-audit.ts`
- Test: `tests/modules/gateway/route-inference.test.ts`

- [ ] **Step 1: Write the failing routing test**

```ts
import { describe, expect, it, vi } from "vitest"
import { routeInference } from "@/modules/gateway/application/route-inference"

describe("routeInference", () => {
  it("uses the preferred primary mapping and returns a normalized result", async () => {
    const result = await routeInference({
      requestId: "req_1",
      clientId: "client_1",
      endpointType: "platform.inference",
      model: "gpt-4.1",
      input: "hello",
    })

    expect(result.providerCode).toBe("openai")
    expect(result.outputText).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm vitest run tests/modules/gateway/route-inference.test.ts
```

Expected: FAIL with `Cannot find module '@/modules/gateway/application/route-inference'`.

- [ ] **Step 3: Implement repository contracts for model mappings and provider keys**

```ts
export async function findModelTargets(modelCode: string) {
  return prisma.modelMapping.findMany({
    where: {
      model: { modelCode },
      status: "active",
    },
    include: {
      provider: true,
      model: true,
    },
    orderBy: { priority: "asc" },
  })
}
```

```ts
export async function findActiveProviderKey(providerId: string) {
  return prisma.providerKey.findFirst({
    where: {
      providerId,
      status: "active",
    },
    orderBy: { weight: "desc" },
  })
}
```

- [ ] **Step 4: Implement routing, fallback, and request audit writing**

```ts
export async function routeInference(request: UnifiedInferenceRequest) {
  const targets = await findModelTargets(request.model)
  if (targets.length === 0) {
    throw new Error(`No active model mapping for ${request.model}`)
  }

  let lastError: unknown

  for (const target of targets) {
    try {
      const providerKey = await findActiveProviderKey(target.providerId)
      if (!providerKey) continue

      const adapter = createProviderAdapter(target.provider.code)
      const result = await adapter.infer(request)

      await writeRequestAudit({
        requestId: request.requestId,
        clientId: request.clientId,
        modelCode: request.model,
        providerId: target.providerId,
        providerKeyId: providerKey.id,
        status: "success",
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      })

      return result
    } catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error("No provider target succeeded")
}
```

`writeRequestAudit` should persist `request_id`, `status`, `provider_id`, `provider_key_id`, `input_tokens`, `output_tokens`, and `error_code`.

- [ ] **Step 5: Run the test to verify it passes**

Run:

```bash
pnpm vitest run tests/modules/gateway/route-inference.test.ts
```

Expected: PASS with the primary mapping test green. Add one more assertion in the same test file to confirm fallback moves from `openai` to `deepseek` when the first adapter throws.

- [ ] **Step 6: Commit the gateway core services**

```bash
git add src/modules/catalog src/modules/gateway tests/modules/gateway/route-inference.test.ts
git commit -m "feat: add routing and request audit services"
```

### Task 5: Expose Compatible and Platform APIs

**Files:**
- Create: `src/app/api/v1/chat/completions/route.ts`
- Create: `src/app/api/v1/responses/route.ts`
- Create: `src/app/api/v1/models/route.ts`
- Create: `src/app/platform/v1/inference/route.ts`
- Test: `tests/api/compatible-routes.test.ts`

- [ ] **Step 1: Write the failing API compatibility test**

```ts
import { describe, expect, it } from "vitest"
import { GET as getModels } from "@/app/api/v1/models/route"

describe("compatible model listing", () => {
  it("returns platform model ids", async () => {
    const response = await getModels()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(json.data)).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm vitest run tests/api/compatible-routes.test.ts
```

Expected: FAIL with `Cannot find module '@/app/api/v1/models/route'`.

- [ ] **Step 3: Implement the three OpenAI-compatible routes**

```ts
import { NextResponse } from "next/server"
import { listModels } from "@/modules/gateway/application/list-models"

export async function GET() {
  const models = await listModels()
  return NextResponse.json({
    object: "list",
    data: models.map((model) => ({
      id: model.modelCode,
      object: "model",
      owned_by: "api-distribution-platform",
    })),
  })
}
```

Use this `chat/completions` route shape:

```ts
import { NextRequest, NextResponse } from "next/server"
import { routeInference } from "@/modules/gateway/application/route-inference"

export async function POST(request: NextRequest) {
  const body = await request.json()

  const result = await routeInference({
    requestId: crypto.randomUUID(),
    clientId: "internal-client",
    endpointType: "chat.completions",
    model: body.model,
    messages: body.messages,
    temperature: body.temperature,
    maxTokens: body.max_tokens,
  })

  return NextResponse.json({
    id: `chatcmpl_${crypto.randomUUID()}`,
    object: "chat.completion",
    model: body.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: result.outputText,
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: result.inputTokens,
      completion_tokens: result.outputTokens,
      total_tokens: result.inputTokens + result.outputTokens,
    },
  })
}
```

Use this `responses` route shape:

```ts
import { NextRequest, NextResponse } from "next/server"
import { routeInference } from "@/modules/gateway/application/route-inference"

export async function POST(request: NextRequest) {
  const body = await request.json()

  const result = await routeInference({
    requestId: crypto.randomUUID(),
    clientId: "internal-client",
    endpointType: "responses",
    model: body.model,
    input: typeof body.input === "string" ? body.input : JSON.stringify(body.input),
  })

  return NextResponse.json({
    id: `resp_${crypto.randomUUID()}`,
    object: "response",
    model: body.model,
    output: [
      {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: result.outputText }],
      },
    ],
    usage: {
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      total_tokens: result.inputTokens + result.outputTokens,
    },
  })
}
```

- [ ] **Step 4: Implement the platform inference route**

Use this response shape:

```ts
return NextResponse.json({
  requestId: request.requestId,
  provider: result.providerCode,
  model: request.model,
  outputText: result.outputText,
  tokens: {
    input: result.inputTokens,
    output: result.outputTokens,
  },
})
```

- [ ] **Step 5: Run the API tests to verify they pass**

Run:

```bash
pnpm vitest run tests/api/compatible-routes.test.ts
```

Expected: PASS for `GET /api/v1/models`. Then add two more tests in the same file covering:

- `POST /api/v1/chat/completions` returns `choices[0].message.content`
- `POST /platform/v1/inference` returns `provider` and `tokens`

- [ ] **Step 6: Commit API routes**

```bash
git add src/app/api src/app/platform tests/api/compatible-routes.test.ts
git commit -m "feat: add compatible and platform inference routes"
```

### Task 6: Build Admin Auth and the Minimum Console Pages

**Files:**
- Create: `src/modules/auth/application/admin-auth.ts`
- Create: `src/modules/auth/application/session.ts`
- Create: `src/modules/admin/data/request-log-repository.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/provider-keys/page.tsx`
- Create: `src/app/admin/models/page.tsx`
- Create: `src/app/admin/routing/page.tsx`
- Create: `src/app/admin/request-logs/page.tsx`
- Test: `tests/app/admin/dashboard-page.test.tsx`

- [ ] **Step 1: Write the failing dashboard page test**

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import DashboardPage from "@/app/admin/page"

describe("DashboardPage", () => {
  it("renders core operational cards", async () => {
    render(await DashboardPage())
    expect(screen.getByText("Total Requests")).toBeInTheDocument()
    expect(screen.getByText("Success Rate")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm vitest run tests/app/admin/dashboard-page.test.tsx
```

Expected: FAIL with `Cannot find module '@/app/admin/page'`.

- [ ] **Step 3: Implement admin auth and request-log queries**

```ts
export async function authenticateAdmin(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({ where: { email } })
  if (!admin) return null

  const matches = await verifySecret(password, admin.passwordHash)
  return matches ? admin : null
}
```

```ts
export async function getDashboardMetrics() {
  const [totalRequests, successCount] = await Promise.all([
    prisma.apiRequest.count(),
    prisma.apiRequest.count({ where: { status: "success" } }),
  ])

  return {
    totalRequests,
    successRate: totalRequests === 0 ? 0 : successCount / totalRequests,
  }
}
```

- [ ] **Step 4: Implement the login page and five admin pages**

The Dashboard page should render at least these cards:

```tsx
<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  <MetricCard label="Total Requests" value={metrics.totalRequests} />
  <MetricCard label="Success Rate" value={`${(metrics.successRate * 100).toFixed(1)}%`} />
  <MetricCard label="Average Latency" value={`${metrics.averageLatencyMs} ms`} />
  <MetricCard label="Today Tokens" value={metrics.todayTokens} />
</section>
```

Use this table page shape for `/admin/provider-keys` and mirror it for the other three pages with the listed columns:

```tsx
export default async function ProviderKeysPage() {
  const rows = await listProviderKeys()

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Provider Keys</h1>
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr>
            <th>Key Name</th>
            <th>Provider</th>
            <th>Status</th>
            <th>Weight</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.keyName}</td>
              <td>{row.provider.name}</td>
              <td>{row.status}</td>
              <td>{row.weight}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
```

Mirror this structure for:

- `/admin/models`: `modelCode`, `displayName`, `status`
- `/admin/routing`: `model`, `provider`, `priority`, `isFallback`
- `/admin/request-logs`: `requestId`, `model`, `provider`, `status`, `latencyMs`

- [ ] **Step 5: Run the page test to verify it passes**

Run:

```bash
pnpm vitest run tests/app/admin/dashboard-page.test.tsx
```

Expected: PASS with the dashboard cards visible. Then add snapshot-free smoke assertions for the four table pages rendering their page titles.

- [ ] **Step 6: Commit the admin console**

```bash
git add src/modules/auth src/modules/admin src/app/login src/app/admin tests/app/admin/dashboard-page.test.tsx
git commit -m "feat: add phase one admin console"
```

### Task 7: Verify End-to-End Flow and Update Project Docs

**Files:**
- Modify: `README.md`
- Create: `.env.example`
- Create: `tasks/2026-05-27-api-distribution-platform/execution-log.md`
- Create: `tasks/2026-05-27-api-distribution-platform/verification.md`

- [ ] **Step 1: Write the failing documentation smoke checklist**

Create `tasks/2026-05-27-api-distribution-platform/verification.md` with this checklist:

```md
# Verification Report

## Commands Run

- [ ] `pnpm install`
- [ ] `pnpm prisma generate`
- [ ] `pnpm vitest run`
- [ ] `pnpm dev`
- [ ] `curl http://localhost:3000/api/health`
- [ ] `curl http://localhost:3000/api/v1/models`

## Results
```

- [ ] **Step 2: Run the full verification suite and record outputs**

Run:

```bash
pnpm install
pnpm prisma generate
pnpm vitest run
pnpm dev
```

Expected: app starts on `http://localhost:3000`.

Then in a second terminal:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/v1/models
curl -X POST http://localhost:3000/platform/v1/inference -H "Content-Type: application/json" -d "{\"model\":\"gpt-4.1\",\"input\":\"hello\"}"
```

Expected:

- `/api/health` returns `{"ok":true,"service":"api-distribution-platform"}`
- `/api/v1/models` returns a `data` array
- `/platform/v1/inference` returns `provider`, `model`, `outputText`, and `tokens`

- [ ] **Step 3: Update README with setup and Phase 1 scope**

Add a `Local Development` section with:

```md
## Local Development

1. Copy `.env.example` to `.env`
2. Start PostgreSQL
3. Run `pnpm install`
4. Run `pnpm prisma generate`
5. Run `pnpm prisma db push`
6. Run `pnpm prisma db seed`
7. Run `pnpm dev`
```

Add a `Phase 1 Features` section listing:

- compatible APIs
- platform inference API
- provider configuration
- routing and request logs
- admin console pages

- [ ] **Step 4: Record exact verification evidence**

Copy the exact command outputs and any known gaps into:

- `tasks/2026-05-27-api-distribution-platform/execution-log.md`
- `tasks/2026-05-27-api-distribution-platform/verification.md`

If one provider adapter remains mocked, write that down explicitly under `Known Gaps`.

- [ ] **Step 5: Commit docs and verification artifacts**

```bash
git add README.md .env.example tasks/2026-05-27-api-distribution-platform/execution-log.md tasks/2026-05-27-api-distribution-platform/verification.md
git commit -m "docs: add phase one setup and verification notes"
```
