import { View, Text, ScrollView } from '@tarojs/components'

import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Sparkles, SlidersHorizontal, ChevronUp, ChevronDown, CalendarDays, Coffee, Utensils, Moon, Plus, X, Pencil, Trash2, Save, Flame } from 'lucide-react'
import { Network } from '@/network'

const SCENE_TAGS = ['早餐', '午餐', '晚餐', '夜宵']

const TASTE_TYPE_KEYS = ['flavor', 'taste']

const MEAL_META: Record<string, { label: string; icon: typeof Coffee; iconColor: string; iconBg: string }> = {
  breakfast: { label: '早餐', icon: Coffee, iconColor: '#E8A33D', iconBg: 'bg-warning bg-opacity-15' },
  lunch: { label: '午餐', icon: Utensils, iconColor: '#D94B3D', iconBg: 'bg-destructive bg-opacity-15' },
  dinner: { label: '晚餐', icon: Moon, iconColor: '#7A8B4B', iconBg: 'bg-secondary bg-opacity-15' },
}

interface DictionaryItem {
  id: string
  type: string
  label: string
  value: string
  sort_order: number
}

interface MealItem {
  key: string
  name: string
  meal: string
  calories: string
  recipeId?: string
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
  const [ingredients, setIngredients] = useState<string[]>([])
  const [ingredientInput, setIngredientInput] = useState('')
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null)
  const [planDirty, setPlanDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingMeal, setEditingMeal] = useState<{ day: number; meal: number } | null>(null)
  const [editName, setEditName] = useState('')
  const [editCalories, setEditCalories] = useState('')

  useEffect(() => {
    loadDictionaries()
    loadLatestPlan()
  }, [])

  const loadLatestPlan = async () => {
    try {
      const res = await Network.request({ url: '/api/weekly-plans/latest', method: 'GET' })
      const data = res.data?.data
      if (data && Array.isArray(data.plan_data) && data.plan_data.length > 0) {
        const plan: DayPlan[] = data.plan_data.map((day: any) => ({
          day: day.day,
          totalCalories: day.totalCalories || '',
          meals: (day.meals || []).map((m: any) => {
            const meta = MEAL_META[m.key || m.meal] || MEAL_META.breakfast
            return {
              key: m.key || m.meal,
              name: m.name,
              meal: meta.label,
              calories: m.calories,
              recipeId: m.recipeId,
              icon: meta.icon,
              iconColor: meta.iconColor,
              iconBg: meta.iconBg,
            }
          }),
        }))
        setWeeklyPlan(plan)
        setSavedPlanId(data.id)
        setPlanDirty(false)
      }
    } catch (e) {
      console.log('[每周菜谱] 加载已保存计划失败', e)
    }
  }

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

  const addIngredient = () => {
    if (ingredientInput.trim() && !ingredients.includes(ingredientInput.trim())) {
      setIngredients(prev => [...prev, ingredientInput.trim()])
      setIngredientInput('')
    }
  }

  const removeIngredient = (ingredient: string) => {
    setIngredients(prev => prev.filter(i => i !== ingredient))
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
          ingredients: ingredients.length > 0 ? ingredients : undefined,
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
        const plan: DayPlan[] = Object.entries(data).map(([day, meals]) => {
          const dayMeals = meals as any
          const mealItems: MealItem[] = Object.entries(dayMeals)
            .filter(([meal]) => MEAL_META[meal])
            .map(([meal, info]) => {
              const mealInfo = info as any
              const meta = MEAL_META[meal]
              return {
                key: meal,
                name: mealInfo.name,
                meal: meta.label,
                calories: mealInfo.calories,
                icon: meta.icon,
                iconColor: meta.iconColor,
                iconBg: meta.iconBg,
              }
            })
          const totalCal = mealItems.reduce((sum, m) => {
            const cal = parseInt(m.calories) || 0
            return sum + cal
          }, 0)
          return { day, totalCalories: `${totalCal} kcal`, meals: mealItems }
        })
        setWeeklyPlan(plan)
        setSavedPlanId(null)
        setPlanDirty(true)
      }
    } catch (e) {
      console.log('[每周菜谱] 生成失败', e)
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
    } finally {
      setGenerating(false)
    }
  }

  const calcTotal = (meals: MealItem[]) =>
    `${meals.reduce((sum, m) => sum + (parseInt(m.calories) || 0), 0)} kcal`

  const markDirty = () => setPlanDirty(true)

  const startEdit = (dayIdx: number, mealIdx: number) => {
    const meal = weeklyPlan[dayIdx].meals[mealIdx]
    setEditingMeal({ day: dayIdx, meal: mealIdx })
    setEditName(meal.name)
    setEditCalories(meal.calories)
  }

  const cancelEdit = () => setEditingMeal(null)

  const confirmEdit = () => {
    if (!editingMeal) return
    if (!editName.trim()) {
      Taro.showToast({ title: '菜名不能为空', icon: 'none' })
      return
    }
    setWeeklyPlan(prev => prev.map((day, di) => {
      if (di !== editingMeal.day) return day
      const meals = day.meals.map((m, mi) =>
        mi === editingMeal.meal
          ? { ...m, name: editName.trim(), calories: editCalories.trim() || m.calories }
          : m
      )
      return { ...day, meals, totalCalories: calcTotal(meals) }
    }))
    setEditingMeal(null)
    markDirty()
  }

  const deleteMeal = (dayIdx: number, mealIdx: number) => {
    Taro.showModal({
      title: '删除菜品',
      content: '确定删除这道菜吗？',
      success: (res) => {
        if (!res.confirm) return
        setWeeklyPlan(prev => prev
          .map((day, di) => {
            if (di !== dayIdx) return day
            const meals = day.meals.filter((_, mi) => mi !== mealIdx)
            return { ...day, meals, totalCalories: calcTotal(meals) }
          })
          .filter(day => day.meals.length > 0))
        markDirty()
      },
    })
  }

  const deleteDay = (dayIdx: number) => {
    Taro.showModal({
      title: '删除当天',
      content: `确定删除「${weeklyPlan[dayIdx].day}」的全部菜谱吗？`,
      success: (res) => {
        if (!res.confirm) return
        setWeeklyPlan(prev => prev.filter((_, di) => di !== dayIdx))
        markDirty()
      },
    })
  }

  const handleSavePlan = async () => {
    if (weeklyPlan.length === 0) {
      Taro.showToast({ title: '请先生成菜谱', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      const planData = weeklyPlan.map(day => ({
        day: day.day,
        totalCalories: day.totalCalories,
        meals: day.meals.map(m => ({
          key: m.key,
          meal: m.meal,
          type: m.meal,
          name: m.name,
          calories: m.calories,
          recipeId: m.recipeId,
        })),
      }))
      const filters = {
        cuisine: cuisineOptions.find(o => o.value === selectedCuisine)?.label || selectedCuisine,
        flavors: selectedTastes.map(v => tasteOptions.find(o => o.value === v)?.label).filter(Boolean),
        scenes: selectedScenes,
        ingredients,
        calorieMin,
        calorieMax,
      }
      const res = await Network.request({
        url: '/api/weekly-plans',
        method: 'POST',
        data: { planData, filters },
      })
      const saved = res.data?.data
      if (saved?.id) {
        // 回写后端创建的 recipeId，避免重复入库
        const savedPlan = saved.plan_data
        if (Array.isArray(savedPlan)) {
          setWeeklyPlan(prev => prev.map((day, di) => {
            const savedDay = savedPlan[di]
            if (!savedDay) return day
            return {
              ...day,
              meals: day.meals.map((m, mi) => ({
                ...m,
                recipeId: savedDay.meals?.[mi]?.recipeId || m.recipeId,
              })),
            }
          }))
        }
        setSavedPlanId(saved.id)
        setPlanDirty(false)
        Taro.showToast({ title: '已入库保存', icon: 'success' })
      } else {
        Taro.showToast({ title: res.data?.msg || '保存失败', icon: 'none' })
      }
    } catch (e) {
      console.log('[每周菜谱] 保存失败', e)
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const handleClearPlan = () => {
    Taro.showModal({
      title: '清空菜谱',
      content: '确定清空当前整周菜谱吗？',
      success: async (res) => {
        if (!res.confirm) return
        if (savedPlanId) {
          try {
            await Network.request({ url: `/api/weekly-plans/${savedPlanId}`, method: 'DELETE' })
          } catch (e) {
            console.log('[每周菜谱] 删除已保存计划失败', e)
          }
        }
        setWeeklyPlan([])
        setSavedPlanId(null)
        setPlanDirty(false)
      },
    })
  }

  const cuisineLabel = cuisineOptions.find(o => o.value === selectedCuisine)?.label || '家常菜'

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
            {/* 食材输入 */}
            <View className="mb-4">
              <Text className="block text-xs font-medium text-muted-foreground mb-2">食材（可选，提供食材将优先使用）</Text>
              <View className="flex gap-2">
                <View className="flex-1">
                  <Input
                    className="w-full h-10 bg-muted rounded-lg px-3 text-sm"
                    placeholder="输入食材名称"
                    value={ingredientInput}
                    onInput={(e) => setIngredientInput(e.detail.value)}
                    onConfirm={addIngredient}
                  />
                </View>
                <Button size="sm" onClick={addIngredient}>
                  <Plus size={16} />
                </Button>
              </View>
              {ingredients.length > 0 && (
                <View className="flex flex-wrap gap-2 mt-2">
                  {ingredients.map((ingredient) => (
                    <View key={ingredient} className="flex items-center gap-1 px-2 py-1 bg-primary-container rounded-full">
                      <Text className="text-xs text-primary">{ingredient}</Text>
                      <X size={12} color="#C87941" onClick={() => removeIngredient(ingredient)} />
                    </View>
                  ))}
                </View>
              )}
            </View>

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
        <View className="px-4 pt-2 pb-20">
          <View className="flex items-center justify-between mb-3">
            <Text className="text-base font-bold text-foreground">本周菜谱</Text>
            <View className="flex items-center gap-2">
              <View
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted"
                onClick={handleClearPlan}
              >
                <Trash2 size={13} color="#8B7355" />
                <Text className="text-xs text-muted-foreground">清空</Text>
              </View>
              <View
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary"
                onClick={handleSavePlan}
              >
                <Save size={13} color="#FFFFFF" />
                <Text className="text-xs text-white">{saving ? '保存中...' : (!planDirty && savedPlanId) ? '已入库' : '入库保存'}</Text>
              </View>
            </View>
          </View>
          {planDirty && (
            <Text className="block text-xs text-muted-foreground mb-3">菜谱有未保存的修改，点击「入库保存」后菜品将写入菜谱库并同步首页今日菜谱。</Text>
          )}

          {weeklyPlan.map((dayPlan, dayIdx) => (
            <View key={`${dayPlan.day}-${dayIdx}`} className="mb-5">
              <View className="flex items-center justify-between mb-2">
                <View className="flex items-center gap-2">
                  <CalendarDays size={16} color="#C87941" />
                  <Text className="text-sm font-semibold text-foreground">{dayPlan.day}</Text>
                </View>
                <View className="flex items-center gap-3">
                  <Text className="text-xs text-muted-foreground">{dayPlan.totalCalories}</Text>
                  <Trash2 size={14} color="#B08968" onClick={() => deleteDay(dayIdx)} />
                </View>
              </View>
              <View className="grid grid-cols-2 gap-3">
                {dayPlan.meals.map((meal, mealIdx) => (
                  <View
                    key={`${dayIdx}-${mealIdx}`}
                    className="relative bg-surface-container rounded-xl overflow-hidden"
                  >
                    {/* 封面占位（无图，用餐次图标） */}
                    <View
                      className={`w-full h-24 flex items-center justify-center ${meal.iconBg}`}
                      onClick={() => meal.recipeId && Taro.navigateTo({ url: `/pages/recipe-detail/index?id=${meal.recipeId}` })}
                    >
                      <meal.icon size={36} color={meal.iconColor} />
                    </View>
                    <View className="p-3">
                      <Text className="block text-xs text-muted-foreground">{meal.meal}</Text>
                      <Text className="block text-sm font-medium text-foreground truncate mt-1">{meal.name}</Text>
                      <View className="flex items-center justify-between mt-2">
                        <Badge className="text-xs bg-primary bg-opacity-90 text-white">
                          {cuisineLabel}
                        </Badge>
                        <View className="flex items-center gap-1">
                          <Flame size={10} color="#8B7355" />
                          <Text className="text-xs text-muted-foreground">{meal.calories}</Text>
                        </View>
                      </View>
                    </View>
                    {/* 编辑 / 删除 */}
                    <View className="absolute top-2 right-2 flex items-center gap-1">
                      <View
                        className="w-6 h-6 rounded-full bg-background bg-opacity-80 flex items-center justify-center"
                        onClick={() => startEdit(dayIdx, mealIdx)}
                      >
                        <Pencil size={12} color="#8B7355" />
                      </View>
                      <View
                        className="w-6 h-6 rounded-full bg-background bg-opacity-80 flex items-center justify-center"
                        onClick={() => deleteMeal(dayIdx, mealIdx)}
                      >
                        <Trash2 size={12} color="#D94B3D" />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 编辑菜品弹窗 */}
      <Dialog open={!!editingMeal} onOpenChange={(open) => { if (!open) cancelEdit() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Text className="block text-base font-semibold text-foreground">编辑菜品</Text>
            </DialogTitle>
          </DialogHeader>
          <View className="py-2">
            <Text className="block text-xs font-medium text-muted-foreground mb-1">菜名</Text>
            <View className="bg-muted rounded-lg mb-3">
              <Input
                className="w-full bg-transparent px-3 py-2 text-sm"
                value={editName}
                onInput={(e) => setEditName(e.detail.value)}
                placeholder="请输入菜名"
              />
            </View>
            <Text className="block text-xs font-medium text-muted-foreground mb-1">卡路里</Text>
            <View className="bg-muted rounded-lg">
              <Input
                className="w-full bg-transparent px-3 py-2 text-sm"
                value={editCalories}
                onInput={(e) => setEditCalories(e.detail.value)}
                placeholder="如 300千卡"
              />
            </View>
          </View>
          <DialogFooter>
            <Button variant="outline" onClick={cancelEdit}>
              <Text className="text-sm">取消</Text>
            </Button>
            <Button onClick={confirmEdit}>
              <Text className="text-sm">保存</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollView>
  )
}

export default WeeklyPlanPage
