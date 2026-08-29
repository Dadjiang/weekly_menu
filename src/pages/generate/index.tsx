import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Sparkles, Plus, X, Clock, Flame, Signal, Eye, Bookmark, ChefHat } from 'lucide-react-taro'
import { Network } from '@/network'

const COMMON_INGREDIENTS = ['鸡蛋', '西红柿', '猪肉', '豆腐', '青菜', '土豆', '鸡肉', '虾仁', '蘑菇', '玉米']
const CUISINE_OPTIONS = ['家常菜', '川菜', '粤菜', '湘菜', '西餐', '日料']
const TASTE_OPTIONS = ['清淡', '微辣', '辣', '酸甜', '咸鲜']

interface GeneratedRecipe {
  id: string
  name: string
  tag: string
  tagType: 'success' | 'accent' | 'secondary'
  time: string
  calories: string
  difficulty: string
  ingredients: string
  steps: string
  image: string
}

const MOCK_RESULTS: GeneratedRecipe[] = [
  { id: '1', name: '西红柿炒鸡蛋', tag: '推荐', tagType: 'success', time: '15分钟', calories: '280千卡', difficulty: '简单', ingredients: '鸡蛋3个、西红柿2个、葱花适量、盐少许、糖1小勺', steps: '鸡蛋打散炒至凝固盛出，西红柿切块炒出汁，加入鸡蛋翻炒均匀调味即可。', image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe' },
  { id: '2', name: '麻婆豆腐', tag: '微辣', tagType: 'accent', time: '25分钟', calories: '350千卡', difficulty: '中等', ingredients: '豆腐1块、猪肉末100g、豆瓣酱1勺、花椒粉适量', steps: '豆腐切块焯水，炒香肉末加豆瓣酱，放入豆腐加水焖煮，勾芡撒花椒粉出锅。', image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe' },
  { id: '3', name: '家常豆腐煲', tag: '清淡', tagType: 'secondary', time: '30分钟', calories: '220千卡', difficulty: '简单', ingredients: '豆腐1块、西红柿1个、青菜3棵、蒜3瓣', steps: '砂锅热油爆香蒜片，放入西红柿炒软，加豆腐和调味料，小火焖煮10分钟。', image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe' },
]

const GeneratePage = () => {
  const [ingredients, setIngredients] = useState<string[]>(['鸡蛋', '西红柿', '豆腐'])
  const [inputValue, setInputValue] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState('家常菜')
  const [selectedTaste, setSelectedTaste] = useState('清淡')
  const [calorieMax, setCalorieMax] = useState(500)
  const [results, setResults] = useState<GeneratedRecipe[]>(MOCK_RESULTS)
  const [generating, setGenerating] = useState(false)

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
      console.log('[智能生成] 使用Mock数据', e)
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

  return (
    <ScrollView scrollY className="h-full bg-background">
      {/* 标题区 */}
      <View className="px-4 pt-4 pb-2">
        <Text className="block text-xl font-bold text-foreground">智能生成菜谱</Text>
        <Text className="block text-sm text-muted-foreground mt-1">选择食材和偏好，AI 为你定制专属菜谱</Text>
      </View>

      {/* 食材输入区 */}
      <View className="mx-4 mt-4">
        <Card className="bg-card rounded-xl shadow-card">
          <CardContent className="p-4">
            <View className="flex items-center gap-2 mb-3">
              <Text className="text-sm font-semibold text-foreground">我的食材</Text>
            </View>
            <View className="flex gap-2">
              <View className="flex-1 bg-muted rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent text-foreground text-base placeholder:text-muted-foreground placeholder:opacity-50"
                  placeholder="输入食材名称"
                  value={inputValue}
                  onInput={(e) => setInputValue(e.detail.value)}
                  onConfirm={addIngredient}
                />
              </View>
              <Button onClick={addIngredient} className="bg-primary text-primary-foreground rounded-xl px-4">
                <Plus size={16} color="#fff" />
                <Text className="ml-1 text-sm">添加</Text>
              </Button>
            </View>
            {ingredients.length > 0 && (
              <View className="flex flex-wrap gap-2 mt-3">
                {ingredients.map((item) => (
                  <View key={item} className="inline-flex items-center gap-1 bg-primary-container text-primary px-3 py-2 rounded-full text-sm font-medium">
                    <Text>{item}</Text>
                    <View onClick={() => removeIngredient(item)} className="w-4 h-4 flex items-center justify-center">
                      <X size={12} color="#C87941" />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 常用食材 */}
      <View className="mx-4 mt-4">
        <Card className="bg-card rounded-xl shadow-card">
          <CardContent className="p-4">
            <Text className="block text-sm font-semibold text-foreground mb-3">常用食材</Text>
            <View className="flex flex-wrap gap-2">
              {COMMON_INGREDIENTS.map((item) => (
                <View
                  key={item}
                  className={`px-3 py-2 rounded-full text-sm ${ingredients.includes(item) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                  onClick={() => addQuickIngredient(item)}
                >
                  <Text>{item}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 生成条件 */}
      <View className="mx-4 mt-4">
        <Card className="bg-card rounded-xl shadow-card">
          <CardContent className="p-4">
            <Text className="block text-sm font-semibold text-foreground mb-4">生成条件</Text>

            <View className="mb-4">
              <Text className="block text-xs font-medium text-muted-foreground mb-2">菜系偏好</Text>
              <View className="flex flex-wrap gap-2">
                {CUISINE_OPTIONS.map((item) => (
                  <View
                    key={item}
                    className={`px-3 py-2 rounded-full text-sm font-medium ${selectedCuisine === item ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    onClick={() => setSelectedCuisine(item)}
                  >
                    <Text>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="mb-4">
              <Text className="block text-xs font-medium text-muted-foreground mb-2">口味偏好</Text>
              <View className="flex flex-wrap gap-2">
                {TASTE_OPTIONS.map((item) => (
                  <View
                    key={item}
                    className={`px-3 py-2 rounded-full text-sm font-medium ${selectedTaste === item ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    onClick={() => setSelectedTaste(item)}
                  >
                    <Text>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View>
              <View className="flex items-center justify-between mb-2">
                <Text className="text-xs font-medium text-muted-foreground">卡路里上限</Text>
                <Text className="text-xs font-semibold text-primary">{calorieMax} 千卡</Text>
              </View>
              <View className="flex items-center gap-3">
                <Text className="text-xs text-muted-foreground">100</Text>
                <View className="flex-1">
                  <Slider
                    min={100}
                    max={800}
                    step={50}
                    value={[calorieMax]}
                   
                    onValueChange={(v) => setCalorieMax(v[0])}
                  />
                </View>
                <Text className="text-xs text-muted-foreground">800</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 生成按钮 */}
      <View className="mx-4 mt-5">
        <Button
          className="w-full bg-primary text-primary-foreground py-4 rounded-xl text-base font-semibold"
          onClick={handleGenerate}
          disabled={generating}
        >
          <Sparkles size={20} color="#fff" />
          <Text className="ml-2">{generating ? '生成中...' : '智能生成菜谱'}</Text>
        </Button>
      </View>

      {/* 生成结果 */}
      {results.length > 0 && (
        <View className="mx-4 mt-6 mb-4">
          <View className="flex items-center justify-between mb-3">
            <View className="flex items-center gap-2">
              <ChefHat size={20} color="#C87941" />
              <Text className="text-base font-bold text-foreground">生成结果</Text>
            </View>
            <Text className="text-xs text-muted-foreground">共 {results.length} 道菜谱</Text>
          </View>

          {results.map((recipe) => (
            <Card key={recipe.id} className="bg-card rounded-xl shadow-card mb-3">
              <CardContent className="p-4">
                <View className="flex items-start gap-3">
                  <Image src={recipe.image} className="w-20 h-20 rounded-xl flex-shrink-0" mode="aspectFill" />
                  <View className="flex-1 min-w-0">
                    <View className="flex items-center justify-between">
                      <Text className="text-base font-semibold text-foreground truncate">{recipe.name}</Text>
                      <Badge className={`text-xs ${getTagColor(recipe.tagType)}`}>
                        <Text>{recipe.tag}</Text>
                      </Badge>
                    </View>
                    <View className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <View className="flex items-center gap-1">
                        <Clock size={14} color="#8B7355" />
                        <Text>{recipe.time}</Text>
                      </View>
                      <View className="flex items-center gap-1">
                        <Flame size={14} color="#8B7355" />
                        <Text>{recipe.calories}</Text>
                      </View>
                      <View className="flex items-center gap-1">
                        <Signal size={14} color="#8B7355" />
                        <Text>{recipe.difficulty}</Text>
                      </View>
                    </View>
                    <Text className="block text-xs text-muted-foreground mt-2">食材：{recipe.ingredients}</Text>
                    <Text className="block text-xs text-muted-foreground mt-1">步骤：{recipe.steps}</Text>
                  </View>
                </View>
                <View className="flex items-center gap-2 mt-3 pt-3 border-t border-outline-variant border-opacity-10">
                  <Button variant="secondary" className="flex-1 bg-primary bg-opacity-10 text-primary py-2 rounded-xl text-sm" onClick={() => Taro.navigateTo({ url: `/pages/recipe-detail/index?id=${recipe.id}` })}>
                    <Eye size={16} color="#C87941" />
                    <Text className="ml-1">查看详情</Text>
                  </Button>
                  <Button variant="secondary" className="flex-1 bg-muted text-muted-foreground py-2 rounded-xl text-sm">
                    <Bookmark size={16} color="#8B7355" />
                    <Text className="ml-1">收藏</Text>
                  </Button>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

export default GeneratePage
