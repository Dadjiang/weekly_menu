export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '每周菜谱' })
  : { navigationBarTitleText: '每周菜谱' }
