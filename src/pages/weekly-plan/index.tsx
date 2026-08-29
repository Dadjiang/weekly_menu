import { View, Text, ScrollView } from '@tarojs/components'

import { useState } from 'react'
import { Card } from '@/components/ui/card'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Sparkles, SlidersHorizontal, ChevronUp, ChevronDown, CalendarDays, Coffee, Utensils, Moon } from 'lucide-react-taro'
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

const MOCK_WEEKLY: DayPlan[] = [
  {
    day: '周一', totalCalories: '1050 kcal',
    meals: [
      { name: '小米粥 · 煎蛋 · 凉拌黄瓜', meal: '早餐', calories: '350 kcal', icon: Coffee, iconColor: '#E8A33D', iconBg: 'bg-warning bg-opacity-15' },
      { name: '宫保鸡丁 · 清炒西兰花 · 米饭', meal: '午餐', calories: '450 kcal', icon: Utensils, iconColor: '#D94B3D', iconBg: 'bg-destructive bg-opacity-15' },
      { name: '番茄蛋花汤 · 麻婆豆腐 · 杂粮饭', meal: '晚餐', calories: '250 kcal', icon: Moon, iconColor: '#7A8B4B', iconBg: 'bg-secondary bg-opacity-15' },
    ],
  },
  {
    day: '周二', totalCalories: '1100 kcal',
    meals: [
      { name: '牛奶燕麦 · 全麦面包 · 水果', meal: '早餐', calories: '380 kcal', icon: Coffee, iconColor: '#E8A33D', iconBg: 'bg-warning bg-opacity-15' },
      { name: '红烧排骨 · 蒜蓉菠菜 · 米饭', meal: '午餐', calories: '520 kcal', icon: Utensils, iconColor: '#D94B3D', iconBg: 'bg-destructive bg-opacity-15' },
      { name: '清蒸鲈鱼 · 凉拌木耳 · 小米饭', meal: '晚餐', calories: '200 kcal', icon: Moon, iconColor: '#7A8B4B', iconBg: 'bg-secondary bg-opacity-15' },
    ],
  },
  {
    day: '周三', totalCalories: '1020 kcal',
    meals: [
      { name: '豆浆 · 肉包子 · 水煮蛋', meal: '早餐', calories: '400 kcal', icon: Coffee, iconColor: '#E8A33D', iconBg: 'bg-warning bg-opacity-15' },
      { name: '糖醋里脊 · 白灼生菜 · 米饭', meal: '午餐', calories: '480 kcal', icon: Utensils, iconColor: '#D94B3D', iconBg: 'bg-destructive bg-opacity-15' },
      { name: '酸辣土豆丝 · 紫菜蛋汤 · 馒头', meal: '晚餐', calories: '140 kcal', icon: Moon, iconColor: '#7A8B4B', iconBg: 'bg-secondary bg-opacity-15' },
    ],
  },
]

const WeeklyPlanPage = () => {
  
  const [filterOpen, setFilterOpen] = useState(true)
  const [selectedCuisine, setSelectedCuisine] = useState('全部')
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([])
  const [selectedScenes, setSelectedScenes] = useState<string[]>([])
  const [calorieMin, setCalorieMin] = useState(200)
  const [calorieMax] = useState(800)
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[]>(MOCK_WEEKLY)
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
        // 将后端返回的对象格式转换为前端期望的数组格式
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
      console.log('[每周菜谱] 使用Mock数据', e)
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
                {CUISINE_TAGS.map((tag) => (
                  <View
                    key={tag}
                    className={`px-3 py-2 rounded-full text-xs font-medium ${selectedCuisine === tag ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    onClick={() => setSelectedCuisine(tag)}
                  >
                    <Text>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 卡路里 */}
            <View className="mb-4">
              <View className="flex items-center justify-between mb-2">
                <Text className="text-xs font-medium text-muted-foreground">卡路里范围</Text>
                <Text className="text-xs font-semibold text-primary">{calorieMin} - {calorieMax} kcal</Text>
              </View>
              <View className="flex items-center gap-3">
                <Text className="text-xs text-muted-foreground">200</Text>
                <View className="flex-1">
                  <Slider min={200} max={800} step={50} value={[calorieMin]} onValueChange={(v) => setCalorieMin(v[0])} />
                </View>
                <Text className="text-xs text-muted-foreground">800</Text>
              </View>
            </View>

            {/* 口味 */}
            <View className="mb-4">
              <Text className="block text-xs font-medium text-muted-foreground mb-2">口味偏好</Text>
              <View className="flex flex-wrap gap-2">
                {FLAVOR_TAGS.map((tag) => (
                  <View
                    key={tag}
                    className={`px-3 py-2 rounded-full text-xs font-medium ${selectedFlavors.includes(tag) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    onClick={() => toggleFlavor(tag)}
                  >
                    <Text>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 场景 */}
            <View>
              <Text className="block text-xs font-medium text-muted-foreground mb-2">用餐场景</Text>
              <View className="flex flex-wrap gap-2">
                {SCENE_TAGS.map((tag) => (
                  <View
                    key={tag}
                    className={`px-3 py-2 rounded-full text-xs font-medium ${selectedScenes.includes(tag) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    onClick={() => toggleScene(tag)}
                  >
                    <Text>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* 生成按钮 */}
      <View className="mx-4 mt-4">
        <Button
          className="w-full bg-primary text-primary-foreground py-4 rounded-xl text-base font-semibold"
          onClick={handleGenerate}
          disabled={generating}
        >
          <Sparkles size={20} color="#fff" />
          <Text className="ml-2">{generating ? '生成中...' : '生成本周菜谱'}</Text>
        </Button>
      </View>

      {/* 7天菜谱 */}
      <View className="mx-4 mt-6 mb-6 space-y-4">
        {weeklyPlan.map((dayPlan) => (
          <Card key={dayPlan.day} className="bg-card rounded-xl shadow-card overflow-hidden">
            <View className="flex items-center justify-between px-4 py-3 bg-primary bg-opacity-8">
              <View className="flex items-center gap-2">
                <CalendarDays size={16} color="#C87941" />
                <Text className="text-sm font-semibold text-foreground">{dayPlan.day}</Text>
              </View>
              <Text className="text-xs text-muted-foreground">共 {dayPlan.totalCalories}</Text>
            </View>
            <View className="p-4">
              {dayPlan.meals.map((meal, idx) => (
                <View key={idx} className="flex items-center gap-3 py-2">
                  <View className={`w-9 h-9 rounded-lg ${meal.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <meal.icon size={18} color={meal.iconColor} />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="block text-sm font-medium text-foreground truncate">{meal.name}</Text>
                    <Text className="block text-xs text-muted-foreground mt-1">{meal.meal}</Text>
                  </View>
                  <Text className="text-xs font-semibold text-primary flex-shrink-0">{meal.calories}</Text>
                </View>
              ))}
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  )
}

export default WeeklyPlanPage
