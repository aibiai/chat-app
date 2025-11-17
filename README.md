# 交友聊天网站 Monorepo

一个包含前端 (Vue3+Vite) 与后端 (Express+Socket.IO) 的最小可运行骨架，支持网页端与移动端（响应式）。

## 快速开始 (Windows PowerShell)

1. 安装依赖

```powershell
npm install
```

2. 启动开发（分别起后端与前端两个窗口）

```powershell
npm run dev:win
```

- 后端默认运行在 `http://localhost:3001`
- 前端默认运行在 `http://localhost:5173`

3. 环境变量

- 复制 `apps/api/.env.example` 到 `apps/api/.env` 并按需修改。

## 项目结构

- apps/api: Node.js + Express + Socket.IO + TypeScript
- apps/web: Vite + Vue 3 + TypeScript + Tailwind + Pinia + Vue Router
- packages/shared: 前后端共享的 TypeScript 类型

## 后续

- 当前使用文件存储，后续可切换到数据库（如 PostgreSQL/MongoDB）。
- 功能点（匹配、资料、私聊群聊、通知、封禁等）可逐步按需添加。

## 前端信息页改动说明（关于/使用条款/隐私等）

- 前端 Info 页面（`apps/web/src/views/Info.vue`）会优先从后端接口读取 `sections` 内容：
	- GET `/api/content/:locale` 返回结构 `{ sections: { [key]: { title: string, content: string[] } } }`
	- 支持的 key 包含：`about`/`terms`/`privacy`/`security`/`help`/`contact`
	- 若后端无数据则回退到前端 i18n 文案
- 管理端（后端静态页）可在“前端管理”中修改相应内容：
	- 使用条款：`/admin/frontend-terms`（文件：`apps/api/public/admin/frontend-terms.html/.js`）
	- 修改逻辑：将多行文本按空行拆分为段落，保存到 `sections.terms.content`
	- 语言切换：页面左上角可切换 `zh-CN/zh-TW/en/ja/ko` 并分别保存

## 后台新增：用户参数修改页面

- 访问路径：`/admin/frontend-user-config`
- 字段展示：用户昵称、用户ID、用户邮箱、头像、会员等级、人气值、幸运星数值、授权快捷内容（开关）、操作（编辑/删除）
- 后端接口：
	- 列表：`GET /admin/api/user-config?keyword=&page=&pageSize=`
	- 更新：`PUT /admin/api/user-config/:id` (提交 nickname,email,avatarUrl,membershipLevel,popularity,luckyStars,quickTextEnabled)
	- 开关快捷内容：`PATCH /admin/api/user-config/:id/quick-text { enabled: boolean }`
	- 删除：`POST /admin/api/user-config/delete { ids: string[] }`
- 幸运星数值计算：优先使用用户对象中的 `luckyStars`；若不存在则统计 `gifts.json` 中 giftName === '幸运星' 或 giftId === 'g4' 的收到次数。
- 授权快捷内容：使用 `quick_texts.json` 存储，每个用户的 `enabled` 来控制是否显示快捷内容功能。
\n+## 新增：订单管理 & 导出功能（2025-11）
\n+为支持后台“订单管理”三页面（`总营业额`、`充值记录`、`金币消费记录`）数据打通与导出，新增以下管理员端接口（前缀：`/admin/api`）：
\n+### 订单接口
| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | /admin/api/orders | 订单列表（充值+升级），支持 page,pageSize,keyword,status,type |
| GET | /admin/api/orders/summary | 汇总统计（总营业额、分类型收入、成功率等） |
| GET | /admin/api/orders/export | 导出过滤后的全部订单 CSV |
| POST | /admin/api/orders/delete | 批量删除订单（演示用） |
\n+Query 参数说明：
- `status`: `success|failed|pending|all`（默认 all）
- `type`: `recharge|upgrade|all`（默认 all）
- `keyword`: 订单号 / Email / account / owner 模糊匹配
- `page`/`pageSize`: 分页（pageSize 最大 200）
\n+`/summary` 返回字段：
```json
{
	"ok": true,
	"totalPaid": 1234.56,
	"rechargePaid": 1000.00,
	"upgradePaid": 234.56,
	"rechargeCount": 10,
	"upgradeCount": 3,
	"successRate": 86.67,
	"orderCount": 15
}
```
\n+### 金币消费接口
| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | /admin/api/coins | 金币消费记录列表，支持 page,pageSize,keyword,status |
| GET | /admin/api/coins/export | 导出金币消费 CSV |
| POST | /admin/api/coins/delete | 批量删除消费记录 |
\n+### 权限控制
- 订单列表/汇总/导出：需权限 `orders/order-overview` 或 `orders/recharge-records`
- 删除订单：`orders/recharge-records`
- 金币消费：`orders/coin-consumption`
\n+### CSV 字段
- 订单：`id,orderNo,email,account,owner,amount,paidAmount,type,method,status,note,createdAt,paidAt`
- 金币消费：`id,orderNo,account,owner,target,item,amount,status,note,createdAt`
（已做双引号包裹与内部引号转义）
\n+### 前端改动
- `order-overview.html/.js` 增加汇总展示区与导出逻辑
- `recharge-records.js` 实现按筛选导出 CSV
- `coin-consumption.js` 实现按关键字导出 CSV
\n+### 快速验证（PowerShell）
```powershell
$base='http://localhost:3004'
$login=Invoke-RestMethod -Method Post -Uri "$base/admin/api/login" -ContentType 'application/json' -Body (@{ username='admin'; password='Azz16888'} | ConvertTo-Json)
$token=$login.token
$headers=@{ Authorization = "Bearer $token" }
$orders=Invoke-RestMethod -Headers $headers -Uri "$base/admin/api/orders?page=1&pageSize=5"
$summary=Invoke-RestMethod -Headers $headers -Uri "$base/admin/api/orders/summary"
"Orders:$($orders.items.Count)/$($orders.total) TotalPaid=$($summary.totalPaid)"
Invoke-WebRequest -Headers $headers -Uri "$base/admin/api/orders/export" -OutFile 'orders_export.csv'
Invoke-WebRequest -Headers $headers -Uri "$base/admin/api/coins/export" -OutFile 'coin_consumption_export.csv'
```
\n+### 已支持：日期范围过滤 (start / end)
\n+所有订单与金币消费端点（列表、汇总、导出）支持可选 `start` 与 `end` 查询参数进行时间范围过滤，作用于记录的 `createdAt` 字段（含边界，闭区间）。
\n+支持的格式：
\n+- 纯日期：`YYYY-MM-DD`（`start` 自动视为当天 00:00:00.000；`end` 自动扩展到当天 23:59:59.999）
- 日期 + 分钟：`YYYY-MM-DD HH:mm`（内部补 `:00` 秒）
- 日期 + 秒：`YYYY-MM-DD HH:mm:ss`
- 时间戳：10/13 位数字（秒或毫秒，会自动转换为毫秒）
- ISO 字符串（能被 `Date.parse` 正常解析的）
\n+示例：仅导出 2025 年 11 月 1 日的订单（含全部类型与状态）：
\n+```powershell
$base='http://localhost:3004'
$login=Invoke-RestMethod -Method Post -Uri "$base/admin/api/login" -ContentType 'application/json' -Body (@{ username='admin'; password='Azz16888'} | ConvertTo-Json)
$headers=@{ Authorization = "Bearer $($login.token)" }
Invoke-WebRequest -Headers $headers -Uri "$base/admin/api/orders/export?start=2025-11-01&end=2025-11-01" -OutFile 'orders_2025-11-01.csv'
Invoke-WebRequest -Headers $headers -Uri "$base/admin/api/coins/export?start=2025-11-01&end=2025-11-01" -OutFile 'coin_2025-11-01.csv'
```
\n+也可以传递更精确的区间：
\n+```powershell
# 统计某 2 小时窗口的营业额汇总
$summary=Invoke-RestMethod -Headers $headers -Uri "$base/admin/api/orders/summary?start=2025-11-01 08:00&end=2025-11-01 09:59" 
"WindowPaid=$($summary.totalPaid) SuccessRate=$($summary.successRate)% Orders=$($summary.orderCount)"
```
\n+注意：若只传 `start` 或只传 `end`，则另一端无限制。例如：`?start=2025-11-01` 表示从 11 月 1 日 00:00 起到最新；`?end=2025-11-01` 表示截止到 11 月 1 日 23:59:59.999 之前的所有记录。
\n+


