# dictionaries Specification

## Purpose

集中提供菜谱生成和筛选所需的可配置选项，使菜系、口味等字典数据能够按类型查询、按排序值展示，并在前端统一转换为页面需要的 label/value 结构。

## Requirements

### Requirement: 字典全量分组查询
系统 SHALL 通过 `GET /api/dictionaries` 读取 `dictionaries` 集合，并按 `type` 将字典项分组返回；每个分组内 MUST 按 `sort_order` 升序排列。

#### Scenario: 查询所有字典
- **WHEN** 调用方请求 `GET /api/dictionaries`
- **THEN** 系统 MUST 返回 `{ code: 200, msg: "success", data: { ... } }`
- **AND** data 的键 MUST 来自字典记录的 type
- **AND** 每个分组中的项目 MUST 按 type 升序、sort_order 升序返回

#### Scenario: 字典数据读取失败
- **WHEN** 数据库返回读取错误
- **THEN** 服务 MUST 抛出包含“查询字典数据失败”的错误，不能返回伪造字典

### Requirement: 按类型查询字典
系统 SHALL 通过 `GET /api/dictionaries/:type` 返回指定类型的字典项，并按 `sort_order` 升序排列。

#### Scenario: 查询存在的类型
- **WHEN** 调用方请求已存在的 type
- **THEN** 系统 MUST 仅返回该类型的字典项数组
- **AND** 数组顺序 MUST 按 sort_order 升序

#### Scenario: 查询不存在的类型
- **WHEN** 调用方请求没有数据的 type
- **THEN** 系统 MUST 返回业务 code 200 和空数组，而不是伪造默认选项

### Requirement: 字典字段映射
系统 SHALL 将数据库中的 `id`、`type`、`name`、`code`、`sort_order` 映射为 API 使用的 `id`、`type`、`label`、`value`、`sort_order`。

#### Scenario: 转换数据库字典行
- **WHEN** 数据库返回一行包含 name 和 code 的字典记录
- **THEN** 返回项 MUST 使用 name 作为 label
- **AND** 返回项 MUST 使用 code 作为 value
- **AND** id、type 和 sort_order MUST 保持原值

### Requirement: 前端字典兼容
智能生成和每周菜谱页面 SHALL 从全量字典接口读取选项，并兼容后端直接返回 label/value 或历史字段 name/code 的数据结构。

#### Scenario: 智能生成页读取菜系和口味
- **WHEN** 全量字典返回 cuisine 数组以及 flavor 或 taste 数组
- **THEN** 页面 MUST 选择第一个可用的 flavor/taste 键作为口味来源
- **AND** 页面 MUST 为缺失 label/value 的项目回填 name/code
- **AND** 智能生成页 MUST 默认选中第一项菜系和第一项口味

#### Scenario: 每周菜谱页读取菜系和口味
- **WHEN** 每周菜谱页拿到菜系选项
- **THEN** 页面 MUST 默认选中第一项菜系
- **AND** 口味选项 MUST 可以多选，但页面 MUST 在字典缺失时保持空选择

#### Scenario: 字典加载失败
- **WHEN** 页面无法加载字典
- **THEN** 页面 MUST 在控制台记录失败
- **AND** 页面不能崩溃或阻断用户查看已存在内容
