## Purpose

定义每周菜谱应用前后端共同依赖的 API 路由、响应信封、网络域名拼接、服务健康检查、Supabase 凭据解析和 TOS 对象存储访问契约，使业务模块可以在 H5 与小程序端一致连接后端和媒体资源。

## ADDED Requirements

### Requirement: 统一 API 路由前缀
后端 SHALL 为所有业务控制器启用全局 `/api` 前缀；控制器装饰器路径 MUST NOT 再次包含 `api`，以避免产生重复前缀。

#### Scenario: 访问业务接口
- **WHEN** 前端请求菜谱、AI、周计划或字典接口
- **THEN** 请求路径 MUST 以 `/api/` 开头
- **AND** NestJS 控制器 MUST 只声明 `recipes`、`recipe-ai`、`weekly-plans` 或 `dictionaries` 等基础资源路径

#### Scenario: H5 本地开发代理
- **WHEN** H5 开发服务器收到 `/api/...` 请求
- **THEN** Vite dev server MUST 将请求代理到 `http://localhost:3000`
- **AND** 前端业务代码 MUST 使用相对路径而不是硬编码 localhost

### Requirement: POST 状态码统一
后端 SHALL 将成功 POST 请求的 HTTP 状态码统一为 200；全局拦截器必须在 NestJS 默认发出 201 时把响应状态改为 200。

#### Scenario: 创建或触发 POST 操作
- **WHEN** POST 处理器成功返回且底层响应状态为 201
- **THEN** 客户端收到的 HTTP 状态码 MUST 为 200

### Requirement: 业务响应信封
业务控制器 SHALL 使用 `{ code, msg, data }` 响应信封，其中 code 表示业务状态，msg 提供中文结果或错误说明，data 承载业务数据或 null。

#### Scenario: 成功响应
- **WHEN** 业务接口成功
- **THEN** 响应体 MUST 包含数值 code、字符串 msg 和业务 data
- **AND** 普通查询成功的 code MUST 为 200

#### Scenario: 已知输入错误
- **WHEN** 请求缺少菜谱 ID、菜谱 ID 数组或周计划数据
- **THEN** 业务 code MUST 为 400
- **AND** data MUST 为 null

#### Scenario: 资源不存在
- **WHEN** 查询不到指定菜谱
- **THEN** 业务 code MUST 为 404
- **AND** msg MUST 为“菜谱不存在”

### Requirement: 服务健康检查
后端 SHALL 通过 `GET /api/health` 返回服务状态和当前 ISO 时间，并通过 `GET /api/hello` 返回欢迎信息。

#### Scenario: 健康检查
- **WHEN** 调用方请求 `GET /api/health`
- **THEN** 响应 MUST 包含 `status: "success"`
- **AND** data MUST 是当前 ISO 时间字符串

#### Scenario: 欢迎接口
- **WHEN** 调用方请求 `GET /api/hello`
- **THEN** 响应 MUST 包含 `status: "success"` 和欢迎文本 data

### Requirement: 请求体大小和跨域
后端 SHALL 允许携带凭据的跨域请求，并将 JSON 和 URL-encoded 请求体大小上限配置为 50mb。

#### Scenario: 跨端访问后端
- **WHEN** H5 或小程序客户端发起跨域 API 请求
- **THEN** 服务 MUST 启用 CORS，`origin` 为 true 且 `credentials` 为 true

#### Scenario: 提交较大 JSON
- **WHEN** 请求体不超过 50mb
- **THEN** JSON 和 URL-encoded 解析器 MUST 接受该请求体

### Requirement: Network 域名拼接
前端 SHALL 只通过 `Network.request`、`Network.uploadFile` 和 `Network.downloadFile` 发起网络请求；相对 URL MUST 拼接全局 `PROJECT_DOMAIN`，已经以 `http://` 或 `https://` 开头的 URL MUST 保持原样。

#### Scenario: 请求相对 API 路径
- **WHEN** 业务代码调用 Network 并传入 `/api/recipes`
- **THEN** 实际请求 URL MUST 为 `${PROJECT_DOMAIN}/api/recipes`
- **AND** 业务代码 MUST NOT 直接调用 Taro.request、Taro.uploadFile 或 Taro.downloadFile

#### Scenario: 请求外部绝对 URL
- **WHEN** 传入的 URL 以 `http://` 或 `https://` 开头
- **THEN** Network MUST 保留完整 URL，不能重复拼接项目域名

### Requirement: Supabase 凭据解析
后端 SHALL 优先从进程环境读取 `COZE_SUPABASE_URL` 和 `COZE_SUPABASE_ANON_KEY`，缺失时尝试通过 dotenv 或 Coze 工作负载身份注入环境变量；缺少必需凭据时必须抛出明确错误。

#### Scenario: 环境变量已存在
- **WHEN** 创建 Supabase 客户端且进程环境包含 URL 和 anon key
- **THEN** 系统 MUST 直接使用这些环境变量
- **AND** 数据库请求超时时间 MUST 配置为 60 秒
- **AND** 客户端 MUST 禁用 Supabase Auth 的自动刷新和会话持久化

#### Scenario: dotenv 提供凭据
- **WHEN** 初始环境缺少凭据且 dotenv 加载后提供 URL 和 anon key
- **THEN** 系统 MUST 使用加载后的环境变量创建客户端

#### Scenario: 凭据缺失
- **WHEN** 无法获得 `COZE_SUPABASE_URL`
- **THEN** 创建客户端 MUST 失败并提示 `COZE_SUPABASE_URL is not set`
- **WHEN** 无法获得 `COZE_SUPABASE_ANON_KEY`
- **THEN** 创建客户端 MUST 失败并提示 `COZE_SUPABASE_ANON_KEY is not set`

### Requirement: Supabase 访问密钥选择
系统 SHALL 在未提供用户 token 时优先使用 `COZE_SUPABASE_SERVICE_ROLE_KEY`，未配置服务角色密钥时使用 anon key；提供用户 token 时 MUST 使用 anon key 并附加 Bearer Authorization。

#### Scenario: 服务端无用户令牌访问
- **WHEN** 服务端创建客户端且没有用户 token
- **THEN** 系统 MUST 优先使用服务角色密钥
- **AND** 服务角色密钥缺失时 MUST 降级为 anon key

#### Scenario: 代表用户访问
- **WHEN** 创建客户端时提供用户 token
- **THEN** 系统 MUST 使用 anon key
- **AND** 全局 headers MUST 包含 `Authorization: Bearer <token>`

### Requirement: TOS 图片预签名访问
后端 SHALL 使用区域为 `cn-beijing` 的 S3/TOS 存储封装，菜谱图片读取时通过对象 key 生成默认 7 天有效的预签名 URL；前端只消费返回 URL，不直接打包业务图片。

#### Scenario: 生成图片 URL
- **WHEN** 服务使用有效对象 key 调用签名逻辑且未指定过期时间
- **THEN** 返回 URL 的有效期 MUST 为 604800 秒

#### Scenario: 指定存储桶或过期时间
- **WHEN** 调用方提供 bucket 或 expireTime
- **THEN** 签名请求 MUST 使用调用方提供的覆盖值

### Requirement: TOS 文件生命周期操作
服务端对象存储封装 SHALL 支持从 Buffer、流和远程 URL 保存文件，并支持读取、存在性检查、删除和按前缀列出文件。

#### Scenario: 保存和读取文件
- **WHEN** 服务传入文件内容、文件名和内容类型
- **THEN** 存储封装 MUST 返回保存后的对象 key
- **WHEN** 服务使用该 key 读取文件
- **THEN** 存储封装 MUST 返回文件 Buffer

#### Scenario: 删除菜谱关联图片
- **WHEN** 删除菜谱且记录包含图片 key
- **THEN** 菜谱服务 MUST 尝试删除对象存储文件
- **AND** 对象存储删除失败只能记录为图片清理失败，不能回滚已经完成的菜谱删除

### Requirement: 静态资源边界
除微信小程序 TabBar 强制要求的本地 PNG 图标外，业务图片和视频 SHALL 通过 TOS 对象存储 URL 引用，不能把大图片或视频作为打包资源。

#### Scenario: 展示业务图片
- **WHEN** 页面展示菜谱封面或其他业务图片
- **THEN** 图片来源 MUST 是后端或对象存储返回的 URL
- **AND** 代码 MUST NOT 使用占位符服务、虚构本地图片路径或示例域名

#### Scenario: 展示 TabBar
- **WHEN** 应用渲染微信小程序 TabBar
- **THEN** 图标 MUST 使用 `src/assets/tabbar` 下的本地 PNG 文件
