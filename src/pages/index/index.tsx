import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, CalendarDays, BookOpen, User, Clock, Flame, Heart, ChevronRight } from 'lucide-react-taro'
import { Network } from '@/network'

interface Recipe {
  id: string
  name: string
  cuisine: string
  time: string
  calories: string
  image: string
  likes: number
  description?: string
}

const MOCK_RECIPES: Recipe[] = [
  { id: '1', name: '红烧排骨', cuisine: '川菜', time: '45分钟', calories: '520千卡', image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe', likes: 100 },
  { id: '2', name: '糖醋里脊', cuisine: '鲁菜', time: '30分钟', calories: '386千卡', image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe', likes: 100 },
  { id: '3', name: '清蒸鲈鱼', cuisine: '粤菜', time: '25分钟', calories: '198千卡', image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe', likes: 100 },
  { id: '4', name: '麻婆豆腐', cuisine: '川菜', time: '20分钟', calories: '275千卡', image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe', likes: 100 },
  { id: '5', name: '番茄炒蛋', cuisine: '家常菜', time: '15分钟', calories: '198千卡', image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe', likes: 100 },
  { id: '6', name: '可乐鸡翅', cuisine: '家常菜', time: '35分钟', calories: '420千卡', image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe', likes: 100 },
]

const MOCK_RECENT = [
  { id: '7', name: '宫保鸡丁', cuisine: '川菜', time: '20分钟前', image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe', likes: 100 },
  { id: '8', name: '蒜蓉西兰花', cuisine: '素菜', time: '1小时前', image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe', likes: 100 },
  { id: '9', name: '酸辣土豆丝', cuisine: '家常菜', time: '3小时前', image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe', likes: 100 },
  { id: '10', name: '蛋炒饭', cuisine: '家常菜', time: '昨天', image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe', likes: 100 },
]

const today = new Date()
const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 · 星期${weekDays[today.getDay()]}`

const IndexPage = () => {
  const [todayRecipe] = useState<Recipe>(MOCK_RECIPES[0])
  const [hotRecipes] = useState<Recipe[]>(MOCK_RECIPES.slice(1))

  useDidShow(() => {
    loadRecipes()
  })

  const loadRecipes = useCallback(async () => {
    try {
      const res = await Network.request({ url: '/api/recipes/popular', method: 'GET' })
      console.log('[首页] 热门菜谱:', res.data)
    } catch (e) {
      console.log('[首页] 加载热门菜谱失败，使用Mock数据', e)
    }
  }, [])

  const navigateTo = (url: string) => {
    Taro.navigateTo({ url })
  }

  const switchTo = (url: string) => {
    Taro.switchTab({ url })
  }

  return (
    <ScrollView scrollY className="h-full bg-background">
      {/* 问候区域 */}
      <View className="px-4 pt-5 pb-2">
        <Text className="block text-xs text-muted-foreground">{dateStr}</Text>
        <Text className="block text-xl font-bold text-foreground mt-1">今天吃什么？</Text>
      </View>

      {/* 快速入口区 */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex justify-around items-center">
          <View className="flex flex-col items-center gap-2" onClick={() => switchTo('/pages/generate/index')}>
            <View className="w-14 h-14 rounded-full bg-primary bg-opacity-12 flex items-center justify-center">
              <Sparkles size={24} color="#C87941" />
            </View>
            <Text className="text-xs font-medium text-foreground">智能生成</Text>
          </View>
          <View className="flex flex-col items-center gap-2" onClick={() => navigateTo('/pages/weekly-plan/index')}>
            <View className="w-14 h-14 rounded-full bg-secondary bg-opacity-12 flex items-center justify-center">
              <CalendarDays size={24} color="#7A8B4B" />
            </View>
            <Text className="text-xs font-medium text-foreground">每周菜谱</Text>
          </View>
          <View className="flex flex-col items-center gap-2" onClick={() => switchTo('/pages/library/index')}>
            <View className="w-14 h-14 rounded-full bg-destructive bg-opacity-10 flex items-center justify-center">
              <BookOpen size={24} color="#D94B3D" />
            </View>
            <Text className="text-xs font-medium text-foreground">菜谱库</Text>
          </View>
          <View className="flex flex-col items-center gap-2" onClick={() => switchTo('/pages/profile/index')}>
            <View className="w-14 h-14 rounded-full bg-warning bg-opacity-12 flex items-center justify-center">
              <User size={24} color="#E8A33D" />
            </View>
            <Text className="text-xs font-medium text-foreground">我的</Text>
          </View>
        </View>
      </View>

      {/* 今日推荐 */}
      <View className="px-4 pt-6 pb-2">
        <View className="flex items-center justify-between mb-3">
          <Text className="text-base font-semibold text-foreground">今日推荐</Text>
          <Button variant="ghost" size="sm" className="text-xs text-primary font-medium">
            <Text>换一批</Text>
          </Button>
        </View>
        <View className="relative rounded-2xl overflow-hidden shadow-card" onClick={() => navigateTo(`/pages/recipe-detail/index?id=${todayRecipe.id}`)}>
          <Image src={todayRecipe.image} className="w-full h-48" mode="aspectFill" />
          <View className="absolute inset-0 bg-gradient-to-t from-black from-opacity-60 via-black via-opacity-10 to-transparent" />
          <View className="absolute bottom-0 left-0 right-0 p-4">
            <View className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary bg-opacity-90 text-primary-foreground text-xs">
                <Text>{todayRecipe.cuisine}</Text>
              </Badge>
              <View className="flex items-center gap-1">
                <Clock size={12} color="rgba(255,255,255,0.8)" />
                <Text className="text-xs text-white text-opacity-80">{todayRecipe.time}</Text>
              </View>
              <View className="flex items-center gap-1">
                <Flame size={12} color="rgba(255,255,255,0.8)" />
                <Text className="text-xs text-white text-opacity-80">{todayRecipe.calories}</Text>
              </View>
            </View>
            <Text className="block text-lg font-bold text-white">{todayRecipe.name}</Text>
            <Text className="block text-xs text-white text-opacity-70 mt-1">{todayRecipe.description}</Text>
          </View>
        </View>
      </View>

      {/* 热门菜谱 */}
      <View className="pt-6 pb-2">
        <View className="flex items-center justify-between px-4 mb-3">
          <Text className="text-base font-semibold text-foreground">热门菜谱</Text>
          <View onClick={() => switchTo('/pages/library/index')}>
            <Text className="text-xs text-primary font-medium">查看更多</Text>
          </View>
        </View>
        <ScrollView scrollX className="flex gap-3 px-4 pb-2 whitespace-nowrap">
          {hotRecipes.map((recipe) => (
            <View
              key={recipe.id}
              className="flex-shrink-0 w-36 inline-block"
              onClick={() => navigateTo(`/pages/recipe-detail/index?id=${recipe.id}`)}
            >
              <Card className="rounded-xl overflow-hidden shadow-card bg-card">
                <Image src={recipe.image} className="w-36 h-24" mode="aspectFill" />
                <CardContent className="p-3">
                  <Text className="block text-sm font-semibold text-foreground truncate">{recipe.name}</Text>
                  <View className="flex items-center justify-between mt-2">
                    <Badge variant="secondary" className="text-xs">
                      <Text>{recipe.cuisine}</Text>
                    </Badge>
                    <View className="flex items-center gap-1 text-muted-foreground">
                      <Heart size={12} color="#D94B3D" />
                      <Text className="text-xs">{recipe.likes}</Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 最近浏览 */}
      <View className="px-4 pt-6 pb-8">
        <View className="flex items-center justify-between mb-3">
          <Text className="text-base font-semibold text-foreground">最近浏览</Text>
          <Button variant="ghost" size="sm" className="text-xs text-primary font-medium">
            <Text>清空</Text>
          </Button>
        </View>
        {MOCK_RECENT.map((item) => (
          <View
            key={item.id}
            className="flex items-center gap-3 py-3 border-b border-outline-variant border-opacity-10"
            onClick={() => navigateTo(`/pages/recipe-detail/index?id=${item.id}`)}
          >
            <Image src={item.image} className="w-14 h-14 rounded-lg flex-shrink-0" mode="aspectFill" />
            <View className="flex-1 min-w-0">
              <Text className="block text-sm font-medium text-foreground truncate">{item.name}</Text>
              <Text className="block text-xs text-muted-foreground mt-1">{item.cuisine} · {item.time}浏览</Text>
            </View>
            <ChevronRight size={16} color="#8B7355" />
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

export default IndexPage
