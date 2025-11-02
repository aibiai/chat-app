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

## 系统验证

运行以下命令验证系统是否正常工作：

```powershell
npm run verify
```

该脚本会：
- 检查所有构建输出是否存在
- 启动 API 服务器
- 测试健康检查端点
- 验证系统功能正常

## 项目结构

- apps/api: Node.js + Express + Socket.IO + TypeScript
- apps/web: Vite + Vue 3 + TypeScript + Tailwind + Pinia + Vue Router
- packages/shared: 前后端共享的 TypeScript 类型

## 后续

- 当前使用文件存储，后续可切换到数据库（如 PostgreSQL/MongoDB）。
- 功能点（匹配、资料、私聊群聊、通知、封禁等）可逐步按需添加。
