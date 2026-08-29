import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { BookOpen, Heart, CalendarDays, Share2, Info, ChevronRight, Pencil } from 'lucide-react'

const ProfilePage = () => {
  const menuItems = [
    { icon: BookOpen, color: '#C87941', label: '我的菜谱', onClick: () => Taro.switchTab({ url: '/pages/library/index' }) },
    { icon: Heart, color: '#D94B3D', label: '我赞过的', onClick: () => Taro.showToast({ title: '我赞过的', icon: 'none' }) },
    { icon: CalendarDays, color: '#7A8B4B', label: '每周菜谱计划', onClick: () => Taro.navigateTo({ url: '/pages/weekly-plan/index' }) },
    { icon: Share2, color: '#C87941', label: '分享设置', onClick: () => Taro.showToast({ title: '分享设置', icon: 'none' }) },
    { icon: Info, color: '#8B7355', label: '关于我们', onClick: () => Taro.showToast({ title: '关于我们', icon: 'none' }) },
  ]

  return (
    <ScrollView scrollY className="h-full bg-background">
      {/* 用户信息卡片 */}
      <View className="mx-4 mt-4">
        <Card className="bg-card rounded-xl shadow-card">
          <CardContent className="p-5">
            <View className="flex items-center gap-4">
              <View className="w-16 h-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Text className="text-2xl font-bold text-primary-foreground">初</Text>
              </View>
              <View className="flex-1 min-w-0">
                <Text className="block text-lg font-bold text-foreground">小初</Text>
                <Text className="block text-sm text-muted-foreground mt-1">热爱美食的生活家</Text>
              </View>
              <View className="w-10 h-10 flex items-center justify-center rounded-full">
                <Pencil size={16} color="#8B7355" />
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 数据统计 */}
      <View className="mx-4 mt-4">
        <Card className="bg-card rounded-xl shadow-card">
          <CardContent className="p-4">
            <View className="flex items-center justify-around">
              <View className="flex flex-col items-center gap-1">
                <Text className="text-xl font-bold text-primary">28</Text>
                <Text className="text-xs text-muted-foreground">我的菜谱</Text>
              </View>
              <View className="w-px h-8 bg-outline-variant bg-opacity-30" />
              <View className="flex flex-col items-center gap-1">
                <Text className="text-xl font-bold text-primary">56</Text>
                <Text className="text-xs text-muted-foreground">收藏菜谱</Text>
              </View>
              <View className="w-px h-8 bg-outline-variant bg-opacity-30" />
              <View className="flex flex-col items-center gap-1">
                <Text className="text-xl font-bold text-primary">128</Text>
                <Text className="text-xs text-muted-foreground">获赞</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 功能菜单 */}
      <View className="mx-4 mt-4">
        <Card className="bg-card rounded-xl shadow-card overflow-hidden">
          {menuItems.map((item, index) => (
            <View key={item.label}>
              {index > 0 && <View className="mx-4"><Separator className="bg-outline-variant bg-opacity-10" /></View>}
              <View className="flex items-center px-4 py-4" onClick={item.onClick}>
                <View className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                  <item.icon size={18} color={item.color} />
                </View>
                <Text className="flex-1 text-sm font-medium text-foreground ml-3">{item.label}</Text>
                <ChevronRight size={16} color="#8B7355" />
              </View>
            </View>
          ))}
        </Card>
      </View>

      {/* 退出登录 */}
      <View className="mx-4 mt-6 mb-6">
        <Button variant="secondary" className="w-full bg-muted text-muted-foreground py-4 rounded-xl text-base font-semibold">
          <Text>退出登录</Text>
        </Button>
      </View>
    </ScrollView>
  )
}

export default ProfilePage
