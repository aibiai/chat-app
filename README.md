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
