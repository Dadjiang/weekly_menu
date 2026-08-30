import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles, Plus, X, Clock, Flame, Eye, Bookmark } from 'lucide-react'
import { Network } from '@/network'

const COMMON_INGREDIENTS = ['鸡蛋', '西红柿', '猪肉', '豆腐', '青菜', '土豆', '鸡肉', '虾仁', '蘑菇', '玉米']

interface DictionaryItem {
  id: string
  type: string
  label: string
  value: string
  sort_order: number
}

// 后端返回 { cuisine: [...], flavor: [...] }，将口味类型归一化
const TASTE_TYPE_KEYS = ['flavor', 'taste']

interface GeneratedRecipe {
  id: string
  name: string
  tag: string
  tagType: 'success' | 'accent' | 'secondary'
  time: string
  calories: string
  difficulty: string
  ingredients: { name: string; amount: string }[]
  steps: { step: string; description: string }[]
  image: string
}

const GeneratePage = () => {
  const [ingredients, setIngredients] = useState<string[]>(['鸡蛋', '西红柿', '豆腐'])
  const [inputValue, setInputValue] = useState('')
  const [cuisineOptions, setCuisineOptions] = useState<DictionaryItem[]>([])
  const [tasteOptions, setTasteOptions] = useState<DictionaryItem[]>([])
  const [selectedCuisine, setSelectedCuisine] = useState('')
  const [selectedTaste, setSelectedTaste] = useState('')
  const [calorieMax, setCalorieMax] = useState(500)
  const [results, setResults] = useState<GeneratedRecipe[]>([])
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadDictionaries()
  }, [])

  const loadDictionaries = async () => {
    try {
      const res = await Network.request({ url: '/api/dictionaries', method: 'GET' })
      console.log('[智能生成] 字典数据:', res.data)
      const data = res.data?.data
      if (data) {
        // 分组结构 { cuisine: [...], flavor: [...] }
        const cuisines: DictionaryItem[] = Array.isArray(data.cuisine) ? data.cuisine : []
        const tasteKey = TASTE_TYPE_KEYS.find(key => Array.isArray(data[key]))
        const tastes: DictionaryItem[] = tasteKey ? data[tasteKey] : []
        // 选项兼容 label/value 与 name/code 两种字段
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
        if (cuisineList.length > 0) {
          setSelectedCuisine(cuisineList[0].value)
        }
        if (tasteList.length > 0) {
          setSelectedTaste(tasteList[0].value)
        }
      }
    } catch (e) {
      console.log('[智能生成] 加载字典数据失败', e)
    }
  }

  const addIngredient = () => {
    const val = inputValue.trim()
    if (val && !ingredients.includes(val)) {
      setIngredients([...ingredients, val])
      setInputValue('')
    }
  }

  const removeIngredient = (item: string) => {
    setIngredients(ingredients.filter(i => i !== item))
  }

  const addQuickIngredient = (item: string) => {
    if (!ingredients.includes(item)) {
      setIngredients([...ingredients, item])
    }
  }

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      Taro.showToast({ title: '请至少添加一种食材', icon: 'none' })
      return
    }
    if (!selectedCuisine || !selectedTaste) {
      Taro.showToast({ title: '请选择菜系和口味', icon: 'none' })
      return
    }
    setGenerating(true)
    try {
      const res = await Network.request({
        url: '/api/recipe-ai/generate',
        method: 'POST',
        data: {
          ingredients,
          cuisine: selectedCuisine,
          taste: selectedTaste,
          calorieMax,
        },
      })
      console.log('[智能生成] 结果:', res.data)
      const data = res.data?.data
      if (data?.recipes && Array.isArray(data.recipes)) {
        setResults(data.recipes)
      } else if (data && Array.isArray(data)) {
        setResults(data)
      }
    } catch (e) {
      console.log('[智能生成] 生成失败', e)
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
    } finally {
      setGenerating(false)
    }
  }

  const getTagColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-success bg-opacity-15 text-success'
      case 'accent': return 'bg-destructive bg-opacity-15 text-destructive'
      default: return 'bg-secondary bg-opacity-15 text-secondary'
    }
  }

  const getSelectedLabel = (options: DictionaryItem[], value: string) => {
    return options.find(opt => opt.value === value)?.label || '请选择'
  }

  return (
    <ScrollView scrollY className="h-full bg-background">
      {/* 食材输入区 */}
      <View className="px-4 pt-5 pb-4">
        <Text className="block text-base font-bold text-foreground mb-3">食材清单</Text>
        <View className="flex gap-2 mb-3">
          <View className="flex-1 bg-muted rounded-xl">
            <Input
              className="w-full bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground placeholder:opacity-50"
              placeholder="输入食材名称..."
              value={inputValue}
              onInput={(e) => setInputValue(e.detail.value)}
              onConfirm={addIngredient}
            />
          </View>
          <Button size="sm" onClick={addIngredient}>
            <Plus size={16} color="#FFFFFF" />
          </Button>
        </View>

        {/* 已添加食材标签 */}
        {ingredients.length > 0 && (
          <View className="flex flex-wrap gap-2 mb-4">
            {ingredients.map((item) => (
              <View key={item} className="flex items-center gap-1 bg-primary-container rounded-full pl-3 pr-1 py-1">
                <Text className="text-xs text-primary">{item}</Text>
                <View
                  className="flex items-center justify-center w-5 h-5"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeIngredient(item)
                  }}
                >
                  <X size={12} color="#C87941" />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 常用食材快捷区 */}
        <Text className="block text-xs text-muted-foreground mb-2">常用食材</Text>
        <View className="flex flex-wrap gap-2">
          {COMMON_INGREDIENTS.map((item) => (
            <View
              key={item}
              className={`px-3 py-1 rounded-full ${
                ingredients.includes(item)
                  ? 'bg-primary-container'
                  : 'bg-muted'
              }`}
              onClick={() => addQuickIngredient(item)}
            >
              <Text className={`text-xs ${ingredients.includes(item) ? 'text-primary' : 'text-muted-foreground'}`}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 生成条件设置 */}
      <View className="px-4 pt-4 pb-4 border-t border-outline-variant">
        <Text className="block text-base font-bold text-foreground mb-3">生成条件</Text>

        {/* 菜系选择 */}
        <Text className="block text-xs text-muted-foreground mb-2">菜系</Text>
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

        {/* 口味偏好 */}
        <View className="mt-4" />
        <Text className="block text-xs text-muted-foreground mb-2">口味偏好</Text>
        <Select value={selectedTaste} onValueChange={setSelectedTaste}>
          <SelectTrigger className="w-full h-10">
            <SelectValue placeholder="请选择口味">
              {getSelectedLabel(tasteOptions, selectedTaste)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {tasteOptions.map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 卡路里范围 */}
        <View className="mt-4" />
        <Text className="block text-xs text-muted-foreground mb-2">
          卡路里上限：<Text className="text-primary font-medium">{calorieMax}千卡</Text>
        </Text>
        <Slider
          value={[calorieMax]}
          min={100}
          max={800}
          step={50}
          onValueChange={(v) => setCalorieMax(v[0])}
        />
      </View>

      {/* 生成按钮 */}
      <View className="px-4 pt-4 pb-6">
        <Button
          className="w-full bg-primary text-white py-3 rounded-xl"
          onClick={handleGenerate}
          disabled={generating}
        >
          <Sparkles size={18} color="#FFFFFF" className="mr-2" />
          <Text className="text-sm font-medium">{generating ? '生成中...' : '智能生成菜谱'}</Text>
        </Button>
      </View>

      {/* 生成结果展示 */}
      {results.length > 0 && (
        <View className="px-4 pt-4 pb-20 border-t border-outline-variant">
          <Text className="block text-base font-bold text-foreground mb-3">生成结果</Text>
          <View className="space-y-3">
            {results.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden">
                <Image src={recipe.image}  className="w-full h-40" mode="aspectFill" />
                <CardContent className="p-4">
                  <View className="flex items-center gap-2 mb-2">
                    <Badge className={`text-xs ${getTagColor(recipe.tagType)}`}>
                      {recipe.tag}
                    </Badge>
                    <View className="flex items-center gap-1">
                      <Clock size={12} color="#8B7355" />
                      <Text className="text-xs text-muted-foreground">{recipe.time}</Text>
                    </View>
                    <View className="flex items-center gap-1">
                      <Flame size={12} color="#D94B3D" />
                      <Text className="text-xs text-muted-foreground">{recipe.calories}</Text>
                    </View>
                  </View>
                  <Text className="block text-lg font-semibold text-foreground mb-2">{recipe.name}</Text>
                  <Text className="block text-xs text-muted-foreground mb-1">
                    食材：{recipe.ingredients.map((ing) => `${ing.name}${ing.amount}`).join('、')}
                  </Text>
                  <Text className="block text-xs text-muted-foreground">
                    步骤：{recipe.steps.map((s) => `${s.step}.${s.description}`).join('；')}
                  </Text>
                  <View className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => Taro.navigateTo({ url: `/pages/recipe-detail/index?id=${recipe.id}` })}
                    >
                      <Eye size={14} className="mr-1" />
                      <Text className="text-xs">查看详情</Text>
                    </Button>
                    <Button size="sm" variant="outline">
                      <Bookmark size={14} className="mr-1" />
                      <Text className="text-xs">收藏</Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  )
}

export default GeneratePage
