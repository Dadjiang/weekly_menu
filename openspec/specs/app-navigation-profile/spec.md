# app-navigation-profile Specification

## Purpose

提供每周菜谱应用在 H5、微信小程序和抖音小程序中的主导航、快捷入口、首页今日推荐、个人中心入口和页面间跳转，让用户能够在生成、周计划、菜谱库和个人中心之间稳定移动。

## Requirements

### Requirement: 应用页面注册
应用 SHALL 注册首页、智能生成、菜谱库、个人中心、每周菜谱和菜谱详情六个页面，并将窗口标题配置为“每周菜谱”。

#### Scenario: 启动应用
- **WHEN** 用户打开应用
- **THEN** 应用 MUST 提供 pages/index/index 作为首个页面
- **AND** 所有已注册页面 MUST 可以通过配置的路径打开
- **AND** 导航栏 MUST 使用浅色背景、黑色文本和标题“每周菜谱”

### Requirement: 主导航 TabBar
应用 SHALL 提供首页、智能生成、菜谱库和我的四个主导航项，并使用本地 PNG 作为普通态和选中态图标；未选中颜色为暖棕色，选中颜色为焦糖色。

#### Scenario: 切换主导航
- **WHEN** 用户点击任一 TabBar 项
- **THEN** 应用 MUST 使用 switchTab 切换到对应 Tab 页面
- **AND** 当前项 MUST 显示选中态图标和选中色

#### Scenario: 小程序图标加载
- **WHEN** 应用在微信小程序中显示 TabBar
- **THEN** 每个导航项 MUST 能读取 `./assets/tabbar/*.png` 普通图标和 active 图标
- **AND** 图标资源 MUST 保持在本地以满足小程序 TabBar 要求

### Requirement: 首页快捷入口
首页 SHALL 提供智能生成、每周菜谱、菜谱库和我的四个快捷入口，并根据目标是否为 Tab 页选择 switchTab 或 navigateTo。

#### Scenario: 使用快捷入口
- **WHEN** 用户点击智能生成、菜谱库或我的
- **THEN** 页面 MUST 切换到对应 Tab
- **WHEN** 用户点击每周菜谱
- **THEN** 页面 MUST 导航到每周菜谱页面

### Requirement: 首页日期问候和当前餐次
首页 SHALL 根据当前日期显示中文日期和星期，并根据当前小时显示早安、下午好或晚上好，以及早餐、午餐、晚餐或夜宵的当前餐次标签。

#### Scenario: 按时间显示问候
- **WHEN** 当前小时早于 12 点
- **THEN** 页面 MUST 显示“早上好”
- **WHEN** 当前小时在 12 点到 18 点之间
- **THEN** 页面 MUST 显示“下午好”
- **WHEN** 当前小时在 18 点之后
- **THEN** 页面 MUST 显示“晚上好”

#### Scenario: 选择当前餐次
- **WHEN** 当前小时早于 10 点
- **THEN** 当前餐次 MUST 为早餐
- **WHEN** 当前小时在 10 点到 14 点之间
- **THEN** 当前餐次 MUST 为午餐
- **WHEN** 当前小时在 14 点到 20 点之间
- **THEN** 当前餐次 MUST 为晚餐
- **WHEN** 当前小时在 20 点之后
- **THEN** 当前餐次 MUST 为夜宵

### Requirement: 页面间详情导航
应用 SHALL 支持从菜谱库、今日菜谱和已保存周计划餐次进入菜谱详情；只有存在 recipeId 的餐次或卡片才执行详情跳转。

#### Scenario: 从菜谱库进入详情
- **WHEN** 用户在非管理模式点击菜谱卡片
- **THEN** 应用 MUST 导航到 `/pages/recipe-detail/index?id=<菜谱ID>`

#### Scenario: 从周计划进入详情
- **WHEN** 用户点击带有 recipeId 的周计划封面或今日餐次
- **THEN** 应用 MUST 打开对应菜谱详情
- **WHEN** 餐次没有 recipeId
- **THEN** 点击 MUST NOT 发起详情导航

### Requirement: 个人中心资料和统计展示
个人中心 SHALL 展示固定用户资料卡和三个统计数字；当前版本不要求从后端获取真实用户或真实统计。

#### Scenario: 查看个人中心
- **WHEN** 用户进入“我的”页面
- **THEN** 页面 MUST 展示头像占位、昵称“小初”和简介“热爱美食的生活家”
- **AND** 页面 MUST 展示“我的菜谱 28”、“收藏菜谱 56”和“获赞 128”三个静态统计

### Requirement: 个人中心菜单反馈
个人中心 SHALL 提供我的菜谱、我赞过的、每周菜谱计划、分享设置、关于我们和退出登录操作；当前版本中未实现的项目必须给出可见反馈。

#### Scenario: 打开可用菜单项
- **WHEN** 用户点击“我的菜谱”
- **THEN** 应用 MUST 切换到菜谱库 Tab
- **WHEN** 用户点击“每周菜谱计划”
- **THEN** 应用 MUST 导航到每周菜谱页面

#### Scenario: 使用暂未实现菜单项
- **WHEN** 用户点击“我赞过的”、“分享设置”或“关于我们”
- **THEN** 应用 MUST 通过 Taro toast 显示对应名称作为反馈

#### Scenario: 点击退出登录
- **WHEN** 用户查看页面
- **THEN** 页面 MUST 显示“退出登录”按钮
- **AND** 当前版本未绑定点击处理时不能承诺清除会话或切换账号

### Requirement: 跨端页面基础展示
页面 SHALL 使用 Taro 容器和项目 UI 组件在 H5 与小程序中展示滚动内容、列表、弹窗、表单和底部操作区；垂直排列的 Taro Text 必须保持块级换行行为。

#### Scenario: 在 H5 浏览长页面
- **WHEN** 页面内容超过视口高度
- **THEN** 菜谱库、菜谱详情、每周菜谱和个人中心 MUST 使用 ScrollView 或页面滚动展示全部内容
- **AND** 底部固定操作区 MUST 避开 TabBar 覆盖主要内容
