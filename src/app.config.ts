export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/generate/index',
    'pages/library/index',
    'pages/profile/index',
    'pages/weekly-plan/index',
    'pages/recipe-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFBF5',
    navigationBarTitleText: '每周菜谱',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#8B7355',
    selectedColor: '#C87941',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: './assets/tabbar/chef-hat.png',
        selectedIconPath: './assets/tabbar/chef-hat-active.png'
      },
      {
        pagePath: 'pages/generate/index',
        text: '智能生成',
        iconPath: './assets/tabbar/sparkles.png',
        selectedIconPath: './assets/tabbar/sparkles-active.png'
      },
      {
        pagePath: 'pages/library/index',
        text: '菜谱库',
        iconPath: './assets/tabbar/book-open.png',
        selectedIconPath: './assets/tabbar/book-open-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png'
      }
    ]
  }
})
