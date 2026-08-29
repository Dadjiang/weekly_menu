import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { Sparkles, CalendarDays, BookOpen, User, Clock, Flame, Heart, ChevronRight } from 'lucide-react'
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

const today = new Date()
const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 · 星期${weekDays[today.getDay()]}`

const IndexPage = () => {
  const [todayRecipe, setTodayRecipe] = useState<Recipe | null>(null)
  const [hotRecipes, setHotRecipes] = useState<Recipe[]>([])
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([])

  useDidShow(() => {
    loadRecipes()
  })

  const loadRecipes = useCallback(async () => {
    try {
      const res = await Network.request({ url: '/api/recipes/popular', method: 'GET' })
      console.log('[首页] 热门菜谱:', res.data)
      const data = res.data?.data
      if (data && Array.isArray(data)) {
        const recipes = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          cuisine: r.cuisine,
          time: r.time,
          calories: r.calories,
          image: r.image,
          likes: r.likes_count || 0,
          description: r.description,
        }))
        if (recipes.length > 0) {
          setTodayRecipe(recipes[0])
          setHotRecipes(recipes.slice(1, 6))
          setRecentRecipes(recipes.slice(0, 4))
        }
      }
    } catch (e) {
      console.log('[首页] 加载菜谱失败', e)
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
            <View className="w-14 h-14 rounded-full flex items-center justify-center">
              <Sparkles size={24} color="#C87941" />
            </View>
            <Text className="text-xs font-medium text-foreground">智能生成</Text>
          </View>
          <View className="flex flex-col items-center gap-2" onClick={() => navigateTo('/pages/weekly-plan/index')}>
            <View className="w-14 h-14 rounded-full flex items-center justify-center">
              <CalendarDays size={24} color="#7A8B4B" />
            </View>
            <Text className="text-xs font-medium text-foreground">每周菜谱</Text>
          </View>
          <View className="flex flex-col items-center gap-2" onClick={() => switchTo('/pages/library/index')}>
            <View className="w-14 h-14 rounded-full flex items-center justify-center">
              <BookOpen size={24} color="#D94B3D" />
            </View>
            <Text className="text-xs font-medium text-foreground">菜谱库</Text>
          </View>
          <View className="flex flex-col items-center gap-2" onClick={() => switchTo('/pages/profile/index')}>
            <View className="w-14 h-14 rounded-full flex items-center justify-center">
              <User size={24} color="#E8A33D" />
            </View>
            <Text className="text-xs font-medium text-foreground">我的</Text>
          </View>
        </View>
      </View>

      {/* 今日推荐卡片 */}
      {todayRecipe && (
        <View className="px-4 pt-4 pb-2">
          <Text className="block text-base font-bold text-foreground mb-3">今日推荐</Text>
          <Card
            className="overflow-hidden"
            onClick={() => navigateTo(`/pages/recipe-detail/index?id=${todayRecipe.id}`)}
          >
            <Image
              src={todayRecipe.image}
              className="w-full h-44"
              mode="aspectFill"
            />
            <CardContent className="p-4">
              <View className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {todayRecipe.cuisine}
                </Badge>
                <View className="flex items-center gap-1">
                  <Clock size={12} color="#8B7355" />
                  <Text className="text-xs text-muted-foreground">{todayRecipe.time}</Text>
                </View>
                <View className="flex items-center gap-1">
                  <Flame size={12} color="#D94B3D" />
                  <Text className="text-xs text-muted-foreground">{todayRecipe.calories}</Text>
                </View>
              </View>
              <Text className="block text-lg font-semibold text-foreground">{todayRecipe.name}</Text>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 热门菜谱列表 */}
      {hotRecipes.length > 0 && (
        <View className="pt-4 pb-2">
          <View className="flex items-center justify-between px-4 mb-3">
            <Text className="block text-base font-bold text-foreground">热门菜谱</Text>
            <View className="flex items-center gap-1" onClick={() => switchTo('/pages/library/index')}>
              <Text className="text-xs text-muted-foreground">更多</Text>
              <ChevronRight size={14} color="#8B7355" />
            </View>
          </View>
          <ScrollView scrollX className="w-full">
            <View className="flex gap-3 px-4 pb-2">
              {hotRecipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="flex-shrink-0 w-36 overflow-hidden"
                  onClick={() => navigateTo(`/pages/recipe-detail/index?id=${recipe.id}`)}
                >
                  <Image
                    src={recipe.image}
                    className="w-full h-24"
                    mode="aspectFill"
                  />
                  <CardContent className="p-2">
                    <Text className="block text-sm font-medium text-foreground truncate">{recipe.name}</Text>
                    <View className="flex items-center gap-1 mt-1">
                      <Heart size={10} color="#D94B3D" />
                      <Text className="text-xs text-muted-foreground">{recipe.likes}</Text>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* 最近浏览 */}
      {recentRecipes.length > 0 && (
        <View className="pt-4 pb-6">
          <View className="flex items-center justify-between px-4 mb-3">
            <Text className="block text-base font-bold text-foreground">最近浏览</Text>
            <Text className="text-xs text-muted-foreground" onClick={() => setRecentRecipes([])}>清空</Text>
          </View>
          <View className="px-4">
            {recentRecipes.map((item) => (
              <View
                key={item.id}
                className="flex items-center gap-3 py-3 border-b border-outline-variant"
                onClick={() => navigateTo(`/pages/recipe-detail/index?id=${item.id}`)}
              >
                <Image
                  src={item.image}
                  className="w-16 h-16 rounded-lg"
                  mode="aspectFill"
                />
                <View className="flex-1">
                  <Text className="block text-sm font-medium text-foreground">{item.name}</Text>
                  <Text className="block text-xs text-muted-foreground mt-1">{item.cuisine}</Text>
                </View>
                <ChevronRight size={16} color="#8B7355" />
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  )
}

export default IndexPage
