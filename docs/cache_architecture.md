# Cache Architecture 详解

本文档详细介绍了前端缓存架构的设计原则、实现细节和最佳实践。

## 目录

1. [设计目标](#设计目标)
2. [核心组件](#核心组件)
3. [缓存工作原理](#缓存工作原理)
4. [缓存 Key 设计](#缓存-key-设计)
5. [缓存失效策略](#缓存失效策略)
6. [数据流图](#数据流图)
7. [防抖机制](#防抖机制)
8. [最佳实践](#最佳实践)
9. [测试](#测试)

---

## 设计目标

| 目标 | 实现方式 |
|------|----------|
| **减少网络请求** | React Query 自动缓存 API 响应 |
| **请求去重** | React Query 自动去重相同 queryKey 的并发请求 |
| **数据一致性** | Mutation 后通过 `invalidateQueries` 自动失效相关缓存 |
| **多用户安全** | Query key 包含 userId 防止数据泄露 |
| **快速首屏加载** | 首次渲染无延迟，仅后续变化防抖 |

---

## 核心组件

### 1. QueryClient (React Query 缓存核心)

**文件位置**: `apps/frontend/src/lib/queryClient.js`

```javascript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,     // 60 秒内数据视为 fresh，不会重新请求
            gcTime: 5 * 60 * 1000,    // 5 分钟后垃圾回收未使用的缓存
            retry: 1,                  // 失败后重试 1 次
            refetchOnWindowFocus: false, // 窗口获焦时不自动重新请求
        },
    },
})
```

**配置说明:**

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `staleTime` | 60s | 数据在 60 秒内被视为 "新鲜"，不会触发后台重新请求 |
| `gcTime` | 5min | 缓存数据在 5 分钟无人使用后被垃圾回收 |
| `retry` | 1 | 请求失败后最多重试 1 次 |
| `refetchOnWindowFocus` | false | 用户切换回窗口时不自动刷新数据 |

### 2. Query Hooks (数据获取 Hooks)

**文件位置**: `apps/frontend/src/hooks/queries/`

```
hooks/queries/
├── useBudgetQueries.js      # 预算相关 queries 和 mutations
├── useExpenseQueries.js     # 支出相关
├── useIncomeQueries.js      # 收入相关
├── useSubscriptionQueries.js # 订阅相关
├── useUserQueries.js        # 用户相关
└── useCurrencyQueries.js    # 汇率相关
```

### 3. useDebouncedValue (防抖 Hook)

**文件位置**: `apps/frontend/src/hooks/useDebouncedValue.js`

```javascript
function useDebouncedValue(value, delay = 500) {
  // 首次渲染: 立即返回 value (无延迟)
  // 后续变化: 防抖 delay 毫秒后更新
}
```

---

## 缓存工作原理

### React Query 缓存流程

```
调用 useQuery({ queryKey, queryFn })
         │
         ▼
   ┌─────────────────┐
   │ 检查缓存是否存在 │
   └─────────────────┘
         │
    ┌────┴────┐
    存在      不存在
    │           │
    ▼           ▼
┌─────────┐   执行 queryFn
│ stale?  │   ─────────────┐
└─────────┘              │
    │                    ▼
  ┌─┴──┐          缓存结果
  是   否         │
  │    │          │
  ▼    ▼          │
后台刷新 返回     │
+返回   缓存     │
缓存    值       │
  │              │
  └──────┬───────┘
         ▼
    返回数据给组件
```

### Query 示例

```javascript
// useBudgetQueries.js
export function useBudgetSummary({ month, year, userId }) {
    return useQuery({
        queryKey: budgetKeys.summary({ month, year, userId }),
        queryFn: () => getBudgetSummary({ month, year, userId }),
        enabled: !!userId && !!month && !!year,
    })
}
```

**关键点:**
- `queryKey` 是缓存的唯一标识
- `queryFn` 是实际获取数据的函数
- `enabled` 控制何时启用查询（例如等待 userId 可用）

---

## 缓存 Key 设计

### Query Keys 工厂模式

每个服务使用工厂函数生成层级化的 query keys：

```javascript
// useBudgetQueries.js
export const budgetKeys = {
    all: ['budgets'],
    lists: () => [...budgetKeys.all, 'list'],
    list: (filters) => [...budgetKeys.lists(), filters],
    summaries: () => [...budgetKeys.all, 'summary'],
    summary: (filters) => [...budgetKeys.summaries(), filters],
}
```

### 各服务的 Query Keys

| 服务 | Key 模式 | 示例 |
|------|----------|------|
| Budget | `['budgets', 'summary', { month, year, userId }]` | `['budgets', 'summary', { month: 1, year: 2026, userId: 'abc123' }]` |
| Expense | `['expenses', 'list', { month, year, userId }]` | `['expenses', 'list', { month: 1, year: 2026, userId: 'abc123' }]` |
| Income | `['incomes', 'summary', { month, year }]` | `['incomes', 'summary', { month: 1, year: 2026 }]` |
| Subscription | `['subscriptions', 'total', userId]` | `['subscriptions', 'total', 'abc123']` |
| User | `['users', 'detail', userId]` | `['users', 'detail', 'abc123']` |
| Currency | `['currency', 'rates']` | `['currency', 'rates']` |

### 为什么 userId 很重要

```
❌ 错误示例 (不含 userId):
   queryKey: ['budgets', 'summary', { month: 1, year: 2026 }]
   
   → User2 登录后访问同一月份
   → 返回 User1 的数据！(安全漏洞)

✅ 正确示例 (含 userId):
   queryKey: ['budgets', 'summary', { month: 1, year: 2026, userId: 'user1' }]
   queryKey: ['budgets', 'summary', { month: 1, year: 2026, userId: 'user2' }]
   
   → 每个用户有独立的缓存条目
```

---

## 缓存失效策略

### 1. 时间失效 (Stale Time)

默认 60 秒后数据变为 "stale"，下次访问时在后台重新获取最新数据。

### 2. 主动失效 (Mutation Invalidation)

```javascript
// useBudgetQueries.js
export function useCreateBudget() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createBudget,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: budgetKeys.all })
        },
    })
}
```

### 3. 各服务的失效规则

| 操作 | 失效的 Query Keys |
|------|-------------------|
| createBudget / updateBudget / deleteBudget | `budgetKeys.all` → `['budgets']` |
| createExpense / updateExpense / deleteExpense | `expenseKeys.all` + `budgetKeys.all` |
| createIncome / updateIncome / deleteIncome | `incomeKeys.all` → `['incomes']` |
| createSubscription / updateSubscription / deleteSubscription | `subscriptionKeys.all` → `['subscriptions']` |
| updateUser | `userKeys.detail(userId)` → `['users', 'detail', userId]` |

> **跨服务依赖**: Expense 的 CUD 操作会同时失效 `expense` 和 `budget` 缓存，因为费用会影响预算摘要。

### 跨服务失效示例

```javascript
// useExpenseQueries.js
export function useCreateExpense() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createExpense,
        onSuccess: () => {
            // Expenses affect budget summaries, so invalidate both
            queryClient.invalidateQueries({ queryKey: expenseKeys.all })
            queryClient.invalidateQueries({ queryKey: budgetKeys.all })
        },
    })
}
```

---

## 数据流图

### 完整请求流程

```
用户访问 Dashboard
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Dashboard 组件                                                  │
│   const [month, setMonth] = useState(1)                         │
│   const debouncedMonth = useDebouncedValue(month, 500)          │
│                          │                                      │
│                          ▼                                      │
│                   立即返回 month=1 (首次渲染无延迟)              │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ useBudgetSummary({ month: debouncedMonth, year, userId })       │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ React Query 缓存检查                                             │
│   queryKey: ['budgets', 'summary', { month:1, year:2026, userId }] │
│                          │                                      │
│                   检查缓存 → 未命中                              │
│                          │                                      │
│                          ▼                                      │
│                   执行 queryFn (API 请求)                        │
│                          │                                      │
│                          ▼                                      │
│                   缓存结果 (staleTime=60s)                       │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
显示数据给用户
```

### 用户快速切换月份场景

```
用户输入: 1 ──[100ms]── 2 ──[100ms]── 3 ──[100ms]── 4
                                                     │
          useDebouncedValue 保持返回 1               │
                                                     │
                                           ┌─────────┘
                                           │ 500ms 后
                                           ▼
                                    返回 4 (跳过 2, 3)
                                           │
                                           ▼
                              只触发一次 API 请求 (month=4)
```

---

## 防抖机制

### 为什么需要 useDebouncedValue?

**问题**: 用户快速切换月份 (1→2→3→4) 会触发 4 次 API 请求

**解决方案**:

```
输入:     1 ──[100ms]── 2 ──[100ms]── 3 ──[100ms]── 4
                                                    │
                                                    ▼ 500ms后
API请求:                                            4 (只请求一次)
```

### Hook 特性

| 场景 | 行为 |
|------|------|
| 首次渲染 | **立即返回** 初始值，无延迟 |
| 值变化 | **500ms 防抖** 后更新 |
| 快速连续变化 | **只保留最后一个值** |
| 组件卸载 | **清理计时器**，防止内存泄漏 |

### 使用示例

```javascript
function Dashboard() {
  const [month, setMonth] = useState(1)
  const debouncedMonth = useDebouncedValue(month, 500)
  
  // 使用 debouncedMonth 作为 query 参数
  const { data } = useBudgetSummary({
    month: debouncedMonth,
    year,
    userId
  })
}
```

---

## 最佳实践

### 1. 使用 Query Hooks 而非直接调用 Service

```javascript
// ✅ 推荐: 使用 React Query hooks
const { data, isLoading, error } = useBudgetSummary({ month, year, userId })

// ❌ 不推荐: 直接调用 service + useState + useEffect
const [data, setData] = useState(null)
useEffect(() => {
  getBudgetSummary({ month, year, userId }).then(setData)
}, [month, year, userId])
```

### 2. 设计正确的 Query Key

```javascript
// ✅ 好的 key 设计 - 包含所有影响查询的参数
budgetKeys.summary({ month, year, userId })

// ❌ 坏的 key 设计 - 缺少 userId
['budgets', 'summary', { month, year }]  // 会导致用户数据混淆
```

### 3. 正确的失效时机

```javascript
// ✅ Mutation 成功后立即失效
useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: budgetKeys.all })
    },
})

// ❌ 不失效可能导致数据不一致
useMutation({
    mutationFn: createBudget,
    // 用户回到 Dashboard 看到的还是旧数据!
})
```

### 4. 处理跨模块依赖

```javascript
// Expense 影响 Budget 摘要，需要同时失效
useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: expenseKeys.all })
        queryClient.invalidateQueries({ queryKey: budgetKeys.all })  // 费用影响预算!
    },
})
```

### 5. 使用 enabled 控制查询时机

```javascript
// ✅ 等待必要参数就绪再执行查询
useQuery({
    queryKey: budgetKeys.summary({ month, year, userId }),
    queryFn: () => getBudgetSummary({ month, year, userId }),
    enabled: !!userId && !!month && !!year,  // userId 为空时不发请求
})
```

---

## 测试

### 测试目录结构

```
apps/frontend/src/
├── __tests__/                         # 测试目录
│   ├── setup.js                       # 测试配置
│   ├── hooks/
│   │   ├── queries/                   # Query hooks 测试
│   │   │   ├── useBudgetQueries.test.js
│   │   │   ├── useExpenseQueries.test.js
│   │   │   ├── useIncomeQueries.test.js
│   │   │   └── useSubscriptionQueries.test.js
│   │   └── useDebouncedValue.test.js  # 防抖 hook 测试
│   └── integration/
│       └── crossPageDataFlow.test.js  # 跨页面数据流集成测试
```

### 运行测试

```bash
cd apps/frontend

# 运行所有测试
npm run test:run

# 运行 query hooks 测试
npm test src/__tests__/hooks/queries

# 运行集成测试
npm test src/__tests__/integration

# 监视模式
npm run test
```

### 测试覆盖范围

| 测试文件 | 覆盖内容 |
|----------|----------|
| **useBudgetQueries.test.js** | Query keys 生成、缓存失效、enabled 条件 |
| **useExpenseQueries.test.js** | 列表查询、跨服务失效 (expense → budget) |
| **useIncomeQueries.test.js** | Summary 查询、失效隔离 |
| **useSubscriptionQueries.test.js** | Total 查询、所有 mutation 类型 |
| **useDebouncedValue.test.js** | 首次立即返回、防抖行为、清理、边界情况 |
| **crossPageDataFlow.test.js** | 跨页面数据一致性、缓存共享 |

---

## 附录：从 simpleCache 到 React Query 的迁移

本项目最初设计使用自定义的 `simpleCache` 模块，后迁移到 React Query 以获得以下优势：

| 特性 | simpleCache (旧) | React Query (现) |
|------|------------------|------------------|
| 请求状态管理 | 手动管理 loading/error | 自动提供 isLoading/error |
| 后台刷新 | 需手动实现 | 自动支持 stale-while-revalidate |
| DevTools | 无 | 提供可视化 DevTools |
| 乐观更新 | 需手动实现 | 内置支持 |
| 代码量 | 自定义逻辑 | 声明式配置 |
