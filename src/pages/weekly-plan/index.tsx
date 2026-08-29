import { View, Text, ScrollView } from '@tarojs/components'

import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Card } from '@/components/ui/card'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Sparkles, SlidersHorizontal, ChevronUp, ChevronDown, CalendarDays, Coffee, Utensils, Moon } from 'lucide-react'
import { Network } from '@/network'

const CUISINE_TAGS = ['全部', '川菜', '粤菜', '湘菜', '家常菜', '西餐', '日料']
const FLAVOR_TAGS = ['辣', '清淡', '酸甜', '咸鲜', '麻辣']
const SCENE_TAGS = ['早餐', '午餐', '晚餐', '夜宵']

interface MealItem {
  name: string
  meal: string
  calories: string
  icon: typeof Coffee
  iconColor: string
  iconBg: string
}

interface DayPlan {
  day: string
  totalCalories: string
  meals: MealItem[]
}

const WeeklyPlanPage = () => {
  const [filterOpen, setFilterOpen] = useState(true)
  const [selectedCuisine, setSelectedCuisine] = useState('全部')
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([])
  const [selectedScenes, setSelectedScenes] = useState<string[]>([])
  const [calorieMin, setCalorieMin] = useState(200)
  const [calorieMax] = useState(800)
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[]>([])
  const [generating, setGenerating] = useState(false)

  const toggleFlavor = (flavor: string) => {
    setSelectedFlavors(prev => prev.includes(flavor) ? prev.filter(f => f !== flavor) : [...prev, flavor])
  }

  const toggleScene = (scene: string) => {
    setSelectedScenes(prev => prev.includes(scene) ? prev.filter(s => s !== scene) : [...prev, scene])
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await Network.request({
        url: '/api/recipe-ai/weekly-plan',
        method: 'POST',
        data: {
          cuisine: selectedCuisine,
          flavors: selectedFlavors,
          scenes: selectedScenes,
          calorieMin,
          calorieMax,
        },
      })
      console.log('[每周菜谱] 生成结果:', res.data)
      const data = res.data?.data
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const mealIcons: Record<string, { icon: typeof Coffee; iconColor: string; iconBg: string }> = {
          breakfast: { icon: Coffee, iconColor: '#E8A33D', iconBg: 'bg-warning bg-opacity-15' },
          lunch: { icon: Utensils, iconColor: '#D94B3D', iconBg: 'bg-destructive bg-opacity-15' },
          dinner: { icon: Moon, iconColor: '#7A8B4B', iconBg: 'bg-secondary bg-opacity-15' },
        }
        const mealNames: Record<string, string> = {
          breakfast: '早餐',
          lunch: '午餐',
          dinner: '晚餐',
        }
        const plan: DayPlan[] = Object.entries(data).map(([day, meals]) => {
          const dayMeals = meals as any
          const mealItems: MealItem[] = Object.entries(dayMeals)
            .filter(([meal]) => mealIcons[meal])
            .map(([meal, info]) => {
              const mealInfo = info as any
              return {
                name: mealInfo.name,
                meal: mealNames[meal] || meal,
                calories: mealInfo.calories,
                ...mealIcons[meal],
              }
            })
          const totalCal = mealItems.reduce((sum, m) => {
            const cal = parseInt(m.calories) || 0
            return sum + cal
          }, 0)
          return { day, totalCalories: `${totalCal} kcal`, meals: mealItems }
        })
        setWeeklyPlan(plan)
      }
    } catch (e) {
      console.log('[每周菜谱] 生成失败', e)
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <ScrollView scrollY className="h-full bg-background">
      {/* 筛选面板 */}
      <View className="mx-4 mt-4 bg-card rounded-xl shadow-card">
        <View className="flex items-center justify-between px-4 py-3" onClick={() => setFilterOpen(!filterOpen)}>
          <View className="flex items-center gap-2">
            <SlidersHorizontal size={18} color="#C87941" />
            <Text className="text-sm font-semibold text-foreground">筛选条件</Text>
          </View>
          {filterOpen ? <ChevronUp size={18} color="#8B7355" /> : <ChevronDown size={18} color="#8B7355" />}
        </View>

        {filterOpen && (
          <View className="px-4 pb-4">
            {/* 菜系 */}
            <View className="mb-4">
              <Text className="block text-xs font-medium text-muted-foreground mb-2">菜系选择</Text>
              <View className="flex flex-wrap gap-2">
                {CUISINE_TAGS.map((cuisine) => (
                  <View
                    key={cuisine}
                    className={`px-3 py-1 rounded-full ${
                      selectedCuisine === cuisine
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    onClick={() => setSelectedCuisine(cuisine)}
                  >
                    <Text className="text-xs">{cuisine}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 口味偏好 */}
            <View className="mb-4">
              <Text className="block text-xs font-medium text-muted-foreground mb-2">口味偏好（多选）</Text>
              <View className="flex flex-wrap gap-2">
                {FLAVOR_TAGS.map((flavor) => (
                  <View
                    key={flavor}
                    className={`px-3 py-1 rounded-full ${
                      selectedFlavors.includes(flavor)
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    onClick={() => toggleFlavor(flavor)}
                  >
                    <Text className="text-xs">{flavor}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 用餐场景 */}
            <View className="mb-4">
              <Text className="block text-xs font-medium text-muted-foreground mb-2">用餐场景（多选）</Text>
              <View className="flex flex-wrap gap-2">
                {SCENE_TAGS.map((scene) => (
                  <View
                    key={scene}
                    className={`px-3 py-1 rounded-full ${
                      selectedScenes.includes(scene)
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    onClick={() => toggleScene(scene)}
                  >
                    <Text className="text-xs">{scene}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 卡路里范围 */}
            <View className="mb-2">
              <Text className="block text-xs font-medium text-muted-foreground mb-2">
                卡路里范围：<Text className="text-primary">{calorieMin}-{calorieMax} kcal</Text>
              </Text>
              <Slider
                value={[calorieMin]}
                min={100}
                max={800}
                step={50}
                onValueChange={(v) => setCalorieMin(v[0])}
              />
            </View>
          </View>
        )}
      </View>

      {/* 生成按钮 */}
      <View className="px-4 pt-4 pb-2">
        <Button
          className="w-full bg-primary text-white py-3 rounded-xl"
          onClick={handleGenerate}
          disabled={generating}
        >
          <Sparkles size={18} color="#FFFFFF" className="mr-2" />
          <Text className="text-sm font-medium">{generating ? '生成中...' : '生成本周菜谱'}</Text>
        </Button>
      </View>

      {/* 菜谱展示区 */}
      {weeklyPlan.length > 0 && (
        <View className="px-4 pt-4 pb-20">
          <Text className="block text-base font-bold text-foreground mb-3">本周菜谱</Text>
          <View className="space-y-3">
            {weeklyPlan.map((dayPlan) => (
              <Card key={dayPlan.day} className="p-4">
                <View className="flex items-center justify-between mb-3">
                  <View className="flex items-center gap-2">
                    <CalendarDays size={18} color="#C87941" />
                    <Text className="text-sm font-semibold text-foreground">{dayPlan.day}</Text>
                  </View>
                  <Text className="text-xs text-muted-foreground">{dayPlan.totalCalories}</Text>
                </View>
                <View className="space-y-2">
                  {dayPlan.meals.map((meal, idx) => (
                    <View key={idx} className="flex items-center gap-3">
                      <View className={`w-8 h-8 rounded-lg ${meal.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <meal.icon size={16} color={meal.iconColor} />
                      </View>
                      <View className="flex-1">
                        <Text className="block text-xs text-muted-foreground">{meal.meal}</Text>
                        <Text className="block text-sm text-foreground">{meal.name}</Text>
                      </View>
                      <Text className="text-xs text-muted-foreground">{meal.calories}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  )
}

export default WeeklyPlanPage
