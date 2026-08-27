export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '菜谱库' })
  : { navigationBarTitleText: '菜谱库' }
