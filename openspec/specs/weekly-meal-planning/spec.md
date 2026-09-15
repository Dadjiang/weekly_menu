# weekly-meal-planning Specification

## Purpose

生成、调整、保存和复用一周三餐计划，使用户能够按菜系、口味、场景、食材和热量范围获得膳食安排，并在首页查看当天当前餐次和保存后的菜谱详情。

## Requirements

### Requirement: 周计划生成和页面归一化
每周菜谱页面 SHALL 使用筛选条件调用周计划生成接口，并将后端返回的日键对象转换为包含 day、totalCalories 和 meals 数组的页面结构；只识别 breakfast、lunch、dinner 三个餐次键。

#### Scenario: 成功生成周计划
- **WHEN** 用户点击“生成本周菜谱”且接口返回日键对象
- **THEN** 页面 MUST 为每一天生成餐次卡片
- **AND** 每个餐次 MUST 包含 key、中文餐次名、菜名、卡路里、图标和样式
- **AND** 每日 totalCalories MUST 由可解析的餐次卡路里求和得到

#### Scenario: 生成请求失败
- **WHEN** 周计划生成请求抛出异常
- **THEN** 页面 MUST 提示“生成失败，请重试”
- **AND** 不能把旧计划标记为新生成的未保存计划

### Requirement: 周计划筛选条件
每周菜谱页面 SHALL 提供可选食材、菜系选择、多口味、多用餐场景和卡路里下限设置，并将这些条件作为 filters 随计划保存。

#### Scenario: 配置筛选条件
- **WHEN** 用户添加食材、切换菜系、选择口味或场景、拖动卡路里滑块
- **THEN** 页面 MUST 更新对应的本地筛选状态
- **AND** 口味和场景 MUST 支持多选与再次点击取消

#### Scenario: 提交生成条件
- **WHEN** 页面请求生成接口
- **THEN** 请求 MUST 包含菜系中文 label、口味中文 label 数组、场景数组、卡路里上下限，以及非空时的食材数组

### Requirement: 最新计划读取
系统 SHALL 通过 `GET /api/weekly-plans/latest` 返回最新一条周计划，通过 `GET /api/weekly-plans` 返回按创建时间倒序的计划数组；页面重新进入时 MUST 加载最新计划的数组型 `plan_data`。

#### Scenario: 存在数组型最新计划
- **WHEN** 最新计划的 `plan_data` 是非空数组
- **THEN** 页面 MUST 还原每天的餐次卡片和 recipeId
- **AND** 页面 MUST 记录 savedPlanId 并将计划标记为已保存、无未保存修改

#### Scenario: 不存在计划或计划为空
- **WHEN** latest 接口返回 null，或 `plan_data` 不是非空数组
- **THEN** 每周菜谱页面 MUST 保持空计划状态，不能展示过期卡片

### Requirement: 今日计划读取
系统 SHALL 通过 `GET /api/weekly-plans/today` 读取最新计划并返回当天的 id、day、meals 和 totalCalories；服务 MUST 兼容数组结构和按中文日键存储的旧版对象结构。

#### Scenario: 最新计划包含今天
- **WHEN** 最新计划中存在与服务器星期对应的中文日键
- **THEN** 系统 MUST 返回当天 id、day、meals 和 totalCalories

#### Scenario: 最新计划不包含今天或没有计划
- **WHEN** 没有周计划，或最新计划找不到当天数据
- **THEN** 系统 MUST 返回 null

#### Scenario: 读取旧版对象结构
- **WHEN** 最新计划的 `plan_data` 是以中文日名为键、breakfast/lunch/dinner 为餐次的对象
- **THEN** 系统 MUST 将其转换为 `{ day, totalCalories, meals }` 数组结构后再查找当天

### Requirement: 首页今日菜谱展示
首页 SHALL 在每次显示时加载今日计划，展示日期、时段问候、当前餐次推荐和当天三餐；没有计划时 MUST 提供生成周计划的空态入口。

#### Scenario: 今日存在计划
- **WHEN** 首页成功加载今日计划
- **THEN** 页面 MUST 根据当前小时显示早餐、午餐、晚餐或夜宵标签
- **AND** 当前餐次不存在时 MUST 回退展示当天第一餐
- **AND** 餐次存在 recipeId 时点击卡片或列表项 MUST 打开对应菜谱详情

#### Scenario: 今日没有计划
- **WHEN** 今日计划接口返回 null 或请求失败
- **THEN** 页面 MUST 展示“还没有本周菜谱”空态
- **AND** “生成本周菜谱”按钮 MUST 进入每周菜谱页面

### Requirement: 周计划本地编辑
每周菜谱页面 SHALL 允许编辑餐次菜名和卡路里、删除单个餐次、删除整天，并在修改后重新计算当日总卡路里且标记计划存在未保存变更。

#### Scenario: 编辑餐次
- **WHEN** 用户在编辑弹窗中输入非空菜名并保存
- **THEN** 页面 MUST 更新菜名、保留或更新卡路里、重新计算当日总卡路里
- **AND** 计划 MUST 被标记为未保存
- **WHEN** 菜名为空
- **THEN** 页面 MUST 提示“菜名不能为空”并保持弹窗打开

#### Scenario: 删除餐次或整天
- **WHEN** 用户确认删除某个餐次
- **THEN** 页面 MUST 移除该餐次并重算当日总卡路里
- **WHEN** 删除后某天没有餐次
- **THEN** 页面 MUST 移除该天空日期
- **WHEN** 用户确认删除整天
- **THEN** 页面 MUST 移除整天卡片
- **AND** 删除操作 MUST 将计划标记为未保存

### Requirement: 周计划入库保存
系统 SHALL 通过 `POST /api/weekly-plans` 保存非空数组计划，并为每个餐次创建或更新关联菜谱；保存成功后周计划中的每个餐次 MUST 包含对应 recipeId。

#### Scenario: 保存新计划
- **WHEN** 调用方提交非空 planData、filters 和可选 userId
- **THEN** 系统 MUST 根据 filters 中的菜系映射菜谱 category
- **AND** 系统 MUST 为每个餐次创建 AI 生成菜谱，空食材和空步骤使用空数组
- **AND** 系统 MUST 插入包含 enriched planData、filters 和 user_id 的 weekly_plans 记录并返回保存结果

#### Scenario: 更新已有餐次关联菜谱
- **WHEN** 餐次已经带有 recipeId
- **THEN** 系统 MUST 尝试更新对应菜谱
- **AND** 更新失败时 MUST 改为创建新菜谱，不能丢失该餐次

#### Scenario: 保存空计划
- **WHEN** planData 缺失、不是数组或为空数组
- **THEN** 接口 MUST 返回业务 code 400、msg 为“缺少周计划数据”，data 为 null

#### Scenario: 前端保存并回写 recipeId
- **WHEN** 页面保存成功且返回数据包含 id 和 plan_data
- **THEN** 页面 MUST 回写每个餐次的 recipeId、记录 savedPlanId、清除未保存标记并提示“已入库保存”

### Requirement: 周计划删除和清空
系统 SHALL 支持通过 `DELETE /api/weekly-plans/:id` 删除指定计划；前端清空已保存计划时 MUST 调用删除接口，清空未保存计划时只清理本地状态。

#### Scenario: 删除已保存计划
- **WHEN** 用户确认清空且当前计划存在 savedPlanId
- **THEN** 页面 MUST 请求删除对应计划
- **AND** 无论删除请求是否成功，页面随后 MUST 清空本地计划并重置 savedPlanId

#### Scenario: 删除未保存计划
- **WHEN** 用户确认清空但当前计划尚未保存
- **THEN** 页面 MUST 清空本地计划，且不能调用删除接口
