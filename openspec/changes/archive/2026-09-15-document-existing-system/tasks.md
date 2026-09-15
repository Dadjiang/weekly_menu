## 1. 现有系统盘点

- [x] 1.1 盘点 Taro 页面、路由和 TabBar，并验证页面行为来自 `src/pages` 与 `src/app.config.ts`
- [x] 1.2 盘点 NestJS 控制器、服务、数据集合和存储封装，并验证接口路径来自 `server/src/modules` 与 `server/src/main.ts`

## 2. OpenSpec 建档

- [x] 2.1 创建 proposal.md 和 design.md，并验证六个能力边界覆盖现有前后端代码
- [x] 2.2 为菜谱管理、AI 生成、每周计划、字典、导航个人中心、平台契约编写 delta specs，并验证每个需求至少包含一个场景

## 3. 校验与同步

- [x] 3.1 运行 `openspec validate document-existing-system --strict`，并验证变更工件结构与内容通过校验
- [x] 3.2 运行 `openspec validate --specs --strict`，并验证同步后的主规格通过校验
- [x] 3.3 将 delta specs 同步到 `openspec/specs`，并验证主规格不包含 ADDED/MODIFIED/REMOVED 等 delta 标题

## 4. 归档

- [x] 4.1 检查所有工件和任务均已完成，并验证变更可以进入归档流程
- [x] 4.2 归档 `document-existing-system`，并验证变更目录移动到当日 archive 路径
