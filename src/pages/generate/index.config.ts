export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '智能生成' })
  : { navigationBarTitleText: '智能生成' }
