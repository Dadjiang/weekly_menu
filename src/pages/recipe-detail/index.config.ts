export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '菜谱详情' })
  : { navigationBarTitleText: '菜谱详情' }
