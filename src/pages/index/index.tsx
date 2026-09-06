import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { Sparkles, CalendarDays, BookOpen, User, Flame, ChevronRight } from 'lucide-react'
import { Network } from '@/network'

interface DayPlan {
  id: string
  day: string
  totalCalories: number
  meals: {
    type: string
    name: string
    calories: number
    recipeId: string
  }[]
}

const IndexPage = () => {
  const [todayPlan, setTodayPlan] = useState<DayPlan | null>(null)
  const [hasWeeklyPlan, setHasWeeklyPlan] = useState<boolean | null>(null)

  useDidShow(() => {
    loadTodayPlan()
  })

  const loadTodayPlan = useCallback(async () => {
    try {
      const res = await Network.request({ url: '/api/weekly-plans/today', method: 'GET' })
      console.log('[首页] 今日菜谱:', res.data)
      const data = res.data?.data
      if (data) {
        setTodayPlan(data)
        setHasWeeklyPlan(true)
      } else {
        setTodayPlan(null)
        setHasWeeklyPlan(false)
      }
    } catch (e) {
      console.log('[首页] 加载今日菜谱失败', e)
      setHasWeeklyPlan(false)
    }
  }, [])

  const navigateTo = (url: string) => {
    Taro.navigateTo({ url })
  }

  const switchTo = (url: string) => {
    Taro.switchTab({ url })
  }

  const today = new Date()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日 星期${weekDays[today.getDay()]}`
  const hour = today.getHours()
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'

  // 获取当前餐次
  const currentMeal = hour < 10 ? '早餐' : hour < 14 ? '午餐' : hour < 20 ? '晚餐' : '夜宵'
  const currentMealPlan = todayPlan?.meals?.find((m: any) => m.type === currentMeal) || todayPlan?.meals?.[0]

  return (
    <View className="min-h-screen bg-background">
      {/* 顶部问候区域 */}
      <View className="px-4 pt-6 pb-4">
        <Text className="block text-sm text-muted-foreground">{dateStr}</Text>
        <Text className="block text-2xl font-bold text-foreground mt-1">{greeting}，今天吃什么？</Text>
      </View>

      {/* 快速入口 */}
      <View className="px-4 pb-4">
        <View className="flex items-center justify-around">
          <View className="flex flex-col items-center gap-2" onClick={() => switchTo('/pages/generate/index')}>
            <View className="w-14 h-14 rounded-full flex items-center justify-center">
              <Sparkles size={24} color="#C87941" />
            </View>
            <Text className="text-xs font-medium text-foreground">智能生成</Text>
          </View>
          <View className="flex flex-col items-center gap-2" onClick={() => switchTo('/pages/weekly-plan/index')}>
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

      {/* 当日菜谱或空白提示 */}
      {hasWeeklyPlan === false ? (
        /* 空白页提示 */
        <View className="flex flex-col items-center justify-center px-8 py-20">
          <View className="w-20 h-20 rounded-full bg-secondary bg-opacity-12 flex items-center justify-center mb-6">
            <CalendarDays size={40} color="#8B7355" />
          </View>
          <Text className="block text-lg font-semibold text-foreground mb-2">还没有本周菜谱</Text>
          <Text className="block text-sm text-muted-foreground text-center mb-6">
            生成每周菜谱，让每天的饮食更健康
          </Text>
          <Button
            className="w-full max-w-xs"
            onClick={() => navigateTo('/pages/weekly-plan/index')}
          >
            <Text>生成本周菜谱</Text>
          </Button>
        </View>
      ) : todayPlan ? (
        /* 当日菜谱展示 */
        <View className="px-4 pt-2 pb-4">
          <View className="flex items-center justify-between mb-3">
            <Text className="block text-base font-bold text-foreground">今日菜谱</Text>
            <Badge variant="secondary" className="text-xs">{currentMeal}</Badge>
          </View>

          {currentMealPlan ? (
            <Card
              className="overflow-hidden"
              onClick={() => currentMealPlan.recipeId && navigateTo(`/pages/recipe-detail/index?id=${currentMealPlan.recipeId}`)}
            >
              <CardContent className="p-4">
                <View className="flex items-center gap-3">
                  <View className="flex-1">
                    <Text className="block text-lg font-semibold text-foreground mb-2">{currentMealPlan.name}</Text>
                    <View className="flex items-center gap-3">
                      <View className="flex items-center gap-1">
                        <Flame size={14} color="#D94B3D" />
                        <Text className="text-xs text-muted-foreground">{currentMealPlan.calories}千卡</Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#8B7355" />
                </View>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <Text className="block text-sm text-muted-foreground text-center">今日暂无菜谱安排</Text>
              </CardContent>
            </Card>
          )}

          {/* 今日三餐列表 */}
          {todayPlan.meals && todayPlan.meals.length > 0 && (
            <View className="mt-4">
              <Text className="block text-sm font-medium text-foreground mb-2">今日三餐</Text>
              {todayPlan.meals.map((meal: any, idx: number) => (
                <View
                  key={idx}
                  className="flex items-center justify-between py-3 border-b border-outline-variant"
                  onClick={() => meal.recipeId && navigateTo(`/pages/recipe-detail/index?id=${meal.recipeId}`)}
                >
                  <View className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">{meal.type}</Badge>
                    <Text className="block text-sm text-foreground">{meal.name}</Text>
                  </View>
                  <View className="flex items-center gap-1">
                    <Flame size={12} color="#D94B3D" />
                    <Text className="text-xs text-muted-foreground">{meal.calories}千卡</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}
    </View>
  )
}

export default IndexPage
