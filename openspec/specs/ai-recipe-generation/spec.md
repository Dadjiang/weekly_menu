# ai-recipe-generation Specification

## Purpose

根据用户提供的食材、菜系、口味和热量条件生成可查看、编辑并保存入库的菜谱建议，同时在外部大模型不可用或返回异常时提供模板结果，保证核心生成流程仍可完成。

## Requirements

### Requirement: 单餐菜谱 AI 生成
系统 SHALL 通过 `POST /api/recipe-ai/generate` 接收食材数组、菜系、口味和热量条件，生成 2 到 3 个菜谱建议；未提供菜系时默认“家常菜”，未提供口味时默认“清淡”。

#### Scenario: 模型返回有效菜谱数组
- **WHEN** 调用方提交至少一种食材且模型返回可解析 JSON 数组
- **THEN** 每个结果 MUST 包含 name、description、time、calories、difficulty、ingredients 和 steps
- **AND** ingredients 每项 MUST 包含 name 和 amount
- **AND** steps 每项 MUST 包含 step 和 description
- **AND** 每个结果 MUST 包含请求菜系、映射后的 category、`is_ai_generated: true` 和空 image

#### Scenario: 模型调用失败或结果不可解析
- **WHEN** 模型调用抛出错误、未返回内容或内容中无法提取 JSON 数组
- **THEN** 系统 MUST 使用内置模板返回菜谱建议
- **AND** 模板结果 MUST 保持与模型结果相同的菜谱字段结构
- **AND** 接口仍 MUST 返回业务 code 200 和“生成成功”

### Requirement: 生成输入校验和结果归一化
智能生成页面 SHALL 要求至少一种食材、已选菜系和已选口味，并将后端结果归一化为页面可展示的菜谱草稿；缺失的食材、步骤或基础字段 MUST 被过滤或填充默认值。

#### Scenario: 缺少生成条件
- **WHEN** 用户未添加任何食材就触发生成
- **THEN** 页面 MUST 提示“请至少添加一种食材”
- **WHEN** 菜系或口味未选择
- **THEN** 页面 MUST 提示“请选择菜系和口味”
- **AND** 这些情况下 MUST NOT 请求生成接口

#### Scenario: 管理食材
- **WHEN** 用户输入食材并确认或点击添加按钮
- **THEN** 页面 MUST 添加去空格后的非空食材，且不能重复添加同名食材
- **WHEN** 用户点击常用食材
- **THEN** 尚未选中的常用食材 MUST 被加入食材清单

#### Scenario: 归一化模型结果
- **WHEN** 后端返回数组或包含 `recipes` 数组的对象
- **THEN** 页面 MUST 提取菜谱数组并过滤空食材、空步骤
- **AND** 缺失菜名、时间、卡路里、难度、菜系或图片时 MUST 使用页面默认值

### Requirement: 生成结果草稿查看
智能生成页面 SHALL 展示生成结果的标签、时间、卡路里、菜名、食材和步骤摘要，并允许用户把结果作为本地草稿打开到菜谱详情页。

#### Scenario: 查看生成结果详情
- **WHEN** 用户点击某个生成结果的“查看详情”
- **THEN** 页面 MUST 以 `recipe_draft_<id>` 为键保存草稿
- **AND** 页面 MUST 跳转到菜谱详情页并携带 draft 参数

#### Scenario: 生成结果为空或请求失败
- **WHEN** 接口成功返回但无法得到任何菜谱
- **THEN** 页面 MUST 提示“生成结果为空，请重试”
- **WHEN** 请求抛出异常
- **THEN** 页面 MUST 提示“生成失败，请重试”

### Requirement: 一周三餐 AI 生成
系统 SHALL 通过 `POST /api/recipe-ai/weekly-plan` 接收菜系、可选食材、口味、场景和卡路里上下限，并生成以周一到周日为键、每天包含 breakfast、lunch、dinner 的 JSON 对象；默认卡路里范围为 200 到 600 千卡。

#### Scenario: 模型返回有效周计划
- **WHEN** 模型返回可解析 JSON 对象
- **THEN** 结果 MUST 为七个日键，并且每个餐次包含 name 和 calories
- **AND** 提供食材时提示词 MUST 要求优先使用用户食材，不足时补充常见食材

#### Scenario: 周计划模型失败
- **WHEN** 模型调用失败或无法提取 JSON 对象
- **THEN** 系统 MUST 使用内置菜谱池随机生成七天三餐计划
- **AND** 降级结果 MUST 保持每天 breakfast、lunch、dinner 的结构

### Requirement: 生成选项字典加载
智能生成页面 SHALL 从字典接口加载菜系和口味选项，使用选项的中文 label 调用生成接口，并兼容 `flavor`、`taste` 两种口味类型键以及 label/value、name/code 两组字段名。

#### Scenario: 字典加载成功
- **WHEN** 页面加载后字典接口返回菜系和口味列表
- **THEN** 页面 MUST 默认选择第一项菜系和第一项口味
- **AND** 发起生成时 MUST 提交选项中文 label，而不是只提交英文 code

#### Scenario: 字典加载失败
- **WHEN** 字典接口请求失败
- **THEN** 页面 MUST 在控制台记录失败，并且不能阻塞用户查看生成表单
