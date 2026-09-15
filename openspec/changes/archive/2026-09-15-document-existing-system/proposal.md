## Why

项目已经具备每周菜谱、智能生成、菜谱库、菜谱详情和 NestJS 后端，但仓库此前没有 OpenSpec 主规格，已有能力只能从代码中推断。本变更将现有可观察行为反向记录为规格，为后续修改、评审和归档提供可核对的系统契约。

## What Changes

- 新建菜谱管理规格，覆盖菜谱浏览、搜索、详情、创建、编辑、删除、点赞、保存和草稿入库。
- 新建 AI 菜谱生成规格，覆盖按食材、菜系、口味和热量生成菜谱，以及模型不可用时的模板降级。
- 新建每周膳食计划规格，覆盖周计划生成、最新计划读取、本地编辑、删除、入库保存和首页今日餐次展示。
- 新建字典规格，覆盖菜系、口味等选项的分组查询和单类型查询。
- 新建应用导航与个人中心规格，覆盖 TabBar、页面入口、首页问候与当前餐次、个人中心菜单和静态信息。
- 新建服务端平台契约规格，覆盖 `/api` 路由前缀、统一响应信封、健康检查、Network 域名拼接、Supabase 凭据解析以及 TOS 图片预签名访问。

## Capabilities

### New Capabilities

- `recipe-management`: 管理菜谱库中的菜谱详情、食材步骤、检索、批量删除、点赞、保存和草稿入库。
- `ai-recipe-generation`: 根据食材、菜系、口味和热量条件生成单餐菜谱建议，并在 AI 服务失败时提供模板结果。
- `weekly-meal-planning`: 生成、查看、编辑、保存和删除一周三餐计划，并向首页提供今日餐次。
- `dictionaries`: 提供按类型组织、按排序值排列的菜系和口味等选项。
- `app-navigation-profile`: 提供跨 H5 与小程序的主导航、快捷入口、今日菜谱入口和个人中心页面。
- `service-platform-contracts`: 约定前后端网络访问、API 前缀、响应格式、健康检查、数据连接凭据和 TOS 图片 URL 行为。

### Modified Capabilities

无。本变更是首次为现有系统建立 OpenSpec 规格，不修改既有主规格。

## Impact

- 前端页面：`src/pages/index`、`src/pages/generate`、`src/pages/library`、`src/pages/recipe-detail`、`src/pages/weekly-plan`、`src/pages/profile`。
- 前端基础设施：`src/network.ts`、`src/app.config.ts`、`config/index.ts`。
- 后端模块：`recipes`、`recipe-ai`、`weekly-plans`、`dictionaries`、根健康检查控制器。
- 后端基础设施：`server/src/main.ts`、HTTP 状态拦截器、Supabase 客户端、TOS 对象存储封装。
- 数据集合：`recipes`、`recipe_likes`、`recipe_saves`、`weekly_plans`、`dictionaries`。
- 本变更只新增 OpenSpec 文档，不改动运行时代码。
