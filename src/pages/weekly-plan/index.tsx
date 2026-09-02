import { View, Text, ScrollView } from '@tarojs/components'

import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Card } from '@/components/ui/card'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles, SlidersHorizontal, ChevronUp, ChevronDown, CalendarDays, Coffee, Utensils, Moon } from 'lucide-react'
import { Network } from '@/network'

const SCENE_TAGS = ['早餐', '午餐', '晚餐', '夜宵']

const TASTE_TYPE_KEYS = ['flavor', 'taste']

interface DictionaryItem {
  id: string
  type: string
  label: string
  value: string
  sort_order: number
}

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
  const [cuisineOptions, setCuisineOptions] = useState<DictionaryItem[]>([])
  const [tasteOptions, setTasteOptions] = useState<DictionaryItem[]>([])
  const [selectedCuisine, setSelectedCuisine] = useState('')
  const [selectedTastes, setSelectedTastes] = useState<string[]>([])
  const [selectedScenes, setSelectedScenes] = useState<string[]>([])
  const [calorieMin, setCalorieMin] = useState(200)
  const [calorieMax] = useState(800)
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[]>([])
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadDictionaries()
  }, [])

  const loadDictionaries = async () => {
    try {
      const res = await Network.request({ url: '/api/dictionaries', method: 'GET' })
      console.log('[每周菜谱] 字典数据:', res.data)
      const data = res.data?.data
      if (data) {
        const cuisines: DictionaryItem[] = Array.isArray(data.cuisine) ? data.cuisine : []
        const tasteKey = TASTE_TYPE_KEYS.find(key => Array.isArray(data[key]))
        const tastes: DictionaryItem[] = tasteKey ? data[tasteKey] : []
        const normalize = (list: DictionaryItem[]) =>
          list.map(item => ({
            ...item,
            label: item.label || (item as any).name,
            value: item.value || (item as any).code,
          }))
        const cuisineList = normalize(cuisines)
        const tasteList = normalize(tastes)
        setCuisineOptions(cuisineList)
        setTasteOptions(tasteList)
        if (cuisineList.length > 0) setSelectedCuisine(cuisineList[0].value)
      }
    } catch (e) {
      console.log('[每周菜谱] 加载字典数据失败', e)
    }
  }

  const getSelectedLabel = (options: DictionaryItem[], value: string) => {
    return options.find(opt => opt.value === value)?.label || '请选择'
  }

  const toggleTaste = (value: string) => {
    setSelectedTastes(prev => prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value])
  }

  const toggleScene = (scene: string) => {
    setSelectedScenes(prev => prev.includes(scene) ? prev.filter(s => s !== scene) : [...prev, scene])
  }

  const handleGenerate = async () => {
    // 字典 value 为英文 code、label 为中文名；生成需使用中文菜系与口味
    const cuisineLabel = cuisineOptions.find(o => o.value === selectedCuisine)?.label || selectedCuisine
    const flavorLabels = selectedTastes
      .map(v => tasteOptions.find(o => o.value === v)?.label)
      .filter((l): l is string => !!l)
    setGenerating(true)
    try {
      const res = await Network.request({
        url: '/api/recipe-ai/weekly-plan',
        method: 'POST',
        data: {
          cuisine: cuisineLabel,
          flavors: flavorLabels,
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
              <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="请选择菜系">
                    {getSelectedLabel(cuisineOptions, selectedCuisine)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {cuisineOptions.map((option) => (
                    <SelectItem key={option.id} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </View>

            {/* 口味偏好 */}
            <View className="mb-4">
              <Text className="block text-xs font-medium text-muted-foreground mb-2">口味偏好（多选）</Text>
              <View className="flex flex-wrap gap-2">
                {tasteOptions.map((option) => {
                  const active = selectedTastes.includes(option.value)
                  return (
                    <View
                      key={option.id}
                      className={`px-3 py-1 rounded-full ${
                        active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                      }`}
                      onClick={() => toggleTaste(option.value)}
                    >
                      <Text className="text-xs">{option.label}</Text>
                    </View>
                  )
                })}
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
