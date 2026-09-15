# recipe-management Specification

## Purpose

管理每周菜谱应用中的菜谱数据和用户操作，包括菜谱检索、详情、创建编辑、批量删除、点赞、保存以及 AI 草稿入库，使用户能够在菜谱库和周计划中复用同一批菜谱记录。

## Requirements

### Requirement: 菜谱列表查询
系统 SHALL 通过 `GET /api/recipes` 返回按创建时间倒序排列的菜谱，并支持按分类、菜系、菜名关键字、limit 和 offset 缩小结果范围；分类或菜系值为 `all` 时 MUST NOT 添加对应过滤条件。

#### Scenario: 默认查询菜谱
- **WHEN** 调用方请求 `GET /api/recipes`
- **THEN** 系统 MUST 返回 `{ code: 200, msg: "success", data: [...] }` 信封
- **AND** 未提供 limit 时结果数量 MUST 最多为 20 条
- **AND** 返回顺序 MUST 按创建时间从新到旧排列

#### Scenario: 按条件查询菜谱
- **WHEN** 调用方提供 category、cuisine、search、limit 或 offset 查询参数
- **THEN** 系统 MUST 使用非 `all` 的 category 和 cuisine 进行精确过滤
- **AND** 系统 MUST 使用菜名大小写不敏感的模糊匹配处理 search
- **AND** 提供 offset 时系统 MUST 按 limit 或默认 20 条计算分页范围

### Requirement: 菜谱图片访问地址
系统 SHALL 在菜谱记录包含 `image_key` 时生成 TOS 预签名 URL 并写回 `image` 字段；预签名生成失败时 MUST 保留原始 `image_key` 作为降级值，不能因为单张图片失败而中断列表或详情查询。

#### Scenario: 图片签名成功
- **WHEN** 系统读取到包含有效 `image_key` 的菜谱
- **THEN** 返回菜谱的 `image` 字段 MUST 是可访问的预签名 URL

#### Scenario: 图片签名失败
- **WHEN** 对象存储无法为某个 `image_key` 生成预签名 URL
- **THEN** 系统 MUST 继续返回该菜谱
- **AND** 该菜谱的 `image` 字段 MUST 降级为原始 `image_key`

### Requirement: 菜谱详情查询
系统 SHALL 通过 `GET /api/recipes/:id` 返回单个菜谱的完整信息，包括菜名、菜系、描述、时间、卡路里、难度、食材清单、烹饪步骤、点赞数、AI 标记和图片信息。

#### Scenario: 查询存在的菜谱
- **WHEN** 调用方使用存在的菜谱 ID 请求详情
- **THEN** 系统 MUST 返回 HTTP 200 和业务 code 200
- **AND** data MUST 包含该菜谱的食材数组与步骤数组

#### Scenario: 查询不存在的菜谱
- **WHEN** 调用方使用不存在的菜谱 ID 请求详情
- **THEN** 系统 MUST 返回 HTTP 200、业务 code 404、msg 为“菜谱不存在”，且 data 为 null

### Requirement: 菜谱创建、更新和删除
系统 SHALL 支持创建菜谱、更新菜谱、删除单个菜谱和按 ID 批量删除菜谱；更新时 MUST 写入 `updated_at`，删除菜谱时 MUST 尝试删除关联的 TOS 图片。

#### Scenario: 创建菜谱
- **WHEN** 调用方向 `POST /api/recipes` 提交菜谱字段
- **THEN** 系统 MUST 创建记录并返回业务 code 200、msg 为“创建成功”和新菜谱 data

#### Scenario: 更新菜谱
- **WHEN** 调用方向 `PUT /api/recipes/:id` 提交更新字段
- **THEN** 系统 MUST 合并更新字段、写入当前 UTC 时间到 `updated_at`，并返回更新后的菜谱

#### Scenario: 删除单个菜谱及其图片
- **WHEN** 调用方请求 `DELETE /api/recipes/:id`
- **THEN** 系统 MUST 删除对应菜谱
- **AND** 当菜谱存在 `image_key` 时 MUST 尝试删除对象存储中的图片
- **AND** 图片删除失败不能阻止菜谱删除接口返回成功

#### Scenario: 批量删除菜谱
- **WHEN** 调用方向 `POST /api/recipes/batch-delete` 提交非空 ids 数组
- **THEN** 系统 MUST 删除匹配的菜谱、尝试删除它们的图片，并返回删除数量
- **WHEN** ids 缺失、不是数组或为空数组
- **THEN** 系统 MUST 返回业务 code 400 和“缺少菜谱ID”，且 data 为 null

### Requirement: 菜谱点赞
系统 SHALL 通过 `POST /api/recipes/:id/like` 按用户切换点赞状态，并维护菜谱的 `likes_count`；同一用户重复调用 MUST 在点赞和取消点赞之间切换。

#### Scenario: 用户首次点赞
- **WHEN** 指定用户此前未点赞并调用点赞接口
- **THEN** 系统 MUST 创建点赞记录
- **AND** 系统 MUST 将该菜谱点赞数增加 1，并返回 `{ liked: true, likes_count }`

#### Scenario: 用户取消点赞
- **WHEN** 指定用户此前已点赞并再次调用点赞接口
- **THEN** 系统 MUST 删除该用户的点赞记录
- **AND** 系统 MUST 将点赞数减少，但结果不能小于 0

#### Scenario: 查询点赞状态
- **WHEN** 调用方请求 `GET /api/recipes/:id/liked?userId=...`
- **THEN** 系统 MUST 返回 `{ liked: boolean }`
- **AND** 未提供 userId 时 MUST 使用 `anonymous`

### Requirement: 菜谱保存切换
系统 SHALL 通过 `POST /api/recipes/save` 在 `recipe_saves` 中按用户加入或移出菜谱；未提供用户时 MUST 使用默认用户 `default-user`。

#### Scenario: 加入我的菜谱
- **WHEN** 用户对未保存的菜谱调用保存接口
- **THEN** 系统 MUST 创建保存记录并返回 `{ saved: true }`

#### Scenario: 移出我的菜谱
- **WHEN** 用户对已保存的菜谱再次调用保存接口
- **THEN** 系统 MUST 删除保存记录并返回 `{ saved: false }`

#### Scenario: 缺少菜谱 ID
- **WHEN** 保存请求未提供 recipeId
- **THEN** 系统 MUST 返回业务 code 400 和“缺少菜谱ID”

### Requirement: 菜谱库页面管理
菜谱库页面 SHALL 在每次显示时加载菜谱，支持菜名搜索、本地分类筛选、进入详情、进入管理模式、选择菜谱、全选当前筛选结果和批量删除。

#### Scenario: 浏览和搜索菜谱
- **WHEN** 用户进入菜谱库或输入搜索关键字
- **THEN** 页面 MUST 展示图片、菜名、菜系、卡路里和点赞数
- **AND** 清空搜索时 MUST 重新加载未按关键字过滤的菜谱

#### Scenario: 批量删除选中的菜谱
- **WHEN** 用户进入管理模式、选择一个或多个菜谱并确认删除
- **THEN** 页面 MUST 调用批量删除接口
- **AND** 删除成功后 MUST 退出管理模式、清空选择、刷新列表并提示删除数量
- **WHEN** 用户在确认弹窗中取消
- **THEN** 系统 MUST 保留当前选择且不删除菜谱

### Requirement: 菜谱详情编辑和草稿入库
菜谱详情页 SHALL 支持查看持久化菜谱或本地 AI 草稿，允许编辑基础信息、食材和步骤；草稿必须先保存入库，入库后才能使用持久化菜谱的点赞能力。

#### Scenario: 查看持久化菜谱
- **WHEN** 页面通过 id 参数打开
- **THEN** 系统 MUST 请求并展示对应菜谱详情
- **AND** 加载失败时 MUST 显示“加载失败”提示

#### Scenario: 查看本地草稿
- **WHEN** 页面通过 draft 参数打开且本地存储存在对应草稿
- **THEN** 页面 MUST 读取草稿、转换缺失字段为默认值，并立即从本地存储移除该草稿

#### Scenario: 草稿保存入库
- **WHEN** 用户在草稿详情中选择保存入库且菜名非空
- **THEN** 页面 MUST 创建菜谱、自动调用保存接口加入我的菜谱，并重定向到新菜谱的持久化详情页
- **WHEN** 菜名为空
- **THEN** 系统 MUST 提示“请输入菜谱名称”且不提交创建请求

#### Scenario: 编辑已入库菜谱
- **WHEN** 用户修改持久化菜谱并保存
- **THEN** 页面 MUST 提交更新请求，过滤空食材和空步骤，重新编号步骤，并在成功后刷新详情

#### Scenario: 未入库草稿触发点赞
- **WHEN** 用户在草稿尚未入库时点击点赞
- **THEN** 页面 MUST 提示“请先保存入库”，且不能调用点赞接口
