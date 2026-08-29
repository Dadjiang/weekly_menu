import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo, useCallback } from 'react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

import { Search, X, Flame, Heart, Plus } from 'lucide-react'
import { Network } from '@/network'

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'breakfast', label: '早餐' },
  { key: 'lunch', label: '午餐' },
  { key: 'dinner', label: '晚餐' },
  { key: 'snack', label: '夜宵' },
  { key: 'sichuan', label: '川菜' },
  { key: 'cantonese', label: '粤菜' },
  { key: 'homestyle', label: '家常菜' },
  { key: 'vegetarian', label: '素食' },
]

interface LibraryRecipe {
  id: string
  name: string
  category: string
  cuisine: string
  calories: string
  likes: number
  image: string
}

const getCuisineColor = (cuisine: string) => {
  switch (cuisine) {
    case '川菜': return 'bg-destructive bg-opacity-90 text-white'
    case '粤菜': return 'bg-primary bg-opacity-90 text-white'
    case '家常菜': return 'bg-secondary bg-opacity-90 text-white'
    case '素食': return 'bg-secondary bg-opacity-90 text-white'
    case '早餐': return 'bg-primary bg-opacity-90 text-white'
    case '夜宵': return 'bg-warning bg-opacity-90 text-white'
    default: return 'bg-primary bg-opacity-90 text-white'
  }
}

const LibraryPage = () => {
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [recipes, setRecipes] = useState<LibraryRecipe[]>([])

  useDidShow(() => {
    loadRecipes()
  })

  const loadRecipes = useCallback(async () => {
    try {
      const res = await Network.request({ url: '/api/recipes', method: 'GET' })
      console.log('[菜谱库] 加载菜谱:', res.data)
      const data = res.data?.data
      if (data && Array.isArray(data)) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          category: r.category || 'homestyle',
          cuisine: r.cuisine,
          calories: r.calories,
          likes: r.likes_count || 0,
          image: r.image,
        }))
        setRecipes(mapped)
      }
    } catch (e) {
      console.log('[菜谱库] 加载菜谱失败', e)
    }
  }, [])

  const filteredRecipes = useMemo(() => {
    let list = recipes
    if (selectedCategory !== 'all') {
      list = list.filter(r => r.category === selectedCategory || r.cuisine === CATEGORIES.find(c => c.key === selectedCategory)?.label)
    }
    if (searchText.trim()) {
      list = list.filter(r => r.name.includes(searchText.trim()))
    }
    return list
  }, [recipes, selectedCategory, searchText])

  const handleSearch = async (text: string) => {
    setSearchText(text)
    try {
      const res = await Network.request({ url: `/api/recipes?search=${encodeURIComponent(text)}`, method: 'GET' })
      console.log('[菜谱库] 搜索结果:', res.data)
      const data = res.data?.data
      if (data && Array.isArray(data)) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          category: r.category || 'homestyle',
          cuisine: r.cuisine,
          calories: r.calories,
          likes: r.likes_count || 0,
          image: r.image,
        }))
        setRecipes(mapped)
      }
    } catch (e) {
      console.log('[菜谱库] 搜索失败', e)
    }
  }

  return (
    <ScrollView scrollY className="h-full bg-background">
      {/* 搜索栏 */}
      <View className="px-4 pt-4 pb-3">
        <View className="relative">
          <Search size={18} color="#8B7355" className="absolute left-4 top-1/2 -translate-y-1/2" />
          <View className="bg-muted rounded-xl">
            <Input
              className="w-full bg-transparent pl-11 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground placeholder:opacity-50"
              placeholder="搜索菜谱名称..."
              value={searchText}
              onInput={(e) => handleSearch(e.detail.value)}
            />
          </View>
          {searchText && (
            <View className="absolute right-4 top-1/2 -translate-y-1/2" onClick={() => handleSearch('')}>
              <X size={18} color="#8B7355" />
            </View>
          )}
        </View>
      </View>

      {/* 分类标签栏 */}
      <ScrollView scrollX className="w-full border-b border-outline-variant">
        <View className="flex gap-2 px-4 pb-3">
          {CATEGORIES.map((cat) => (
            <View
              key={cat.key}
              className={`flex-shrink-0 px-4 py-2 rounded-full ${
                selectedCategory === cat.key
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              <Text className="text-sm font-medium">{cat.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 菜谱网格列表 */}
      <View className="px-4 pt-4 pb-20">
        <View className="flex items-center justify-between mb-3">
          <Text className="block text-sm text-muted-foreground">共 {filteredRecipes.length} 道菜谱</Text>
        </View>
        <View className="grid grid-cols-2 gap-3">
          {filteredRecipes.map((recipe) => (
            <View
              key={recipe.id}
              className="bg-surface-container rounded-xl overflow-hidden"
              onClick={() => Taro.navigateTo({ url: `/pages/recipe-detail/index?id=${recipe.id}` })}
            >
              <Image
                src={recipe.image}
                className="w-full h-32"
                mode="aspectFill"
                onError={() => {}}
              />
              <View className="p-3">
                <Text className="block text-sm font-medium text-foreground truncate">{recipe.name}</Text>
                <View className="flex items-center justify-between mt-2">
                  <Badge className={`text-xs ${getCuisineColor(recipe.cuisine)}`}>
                    {recipe.cuisine}
                  </Badge>
                  <View className="flex items-center gap-1">
                    <Flame size={10} color="#8B7355" />
                    <Text className="text-xs text-muted-foreground">{recipe.calories}</Text>
                  </View>
                </View>
                <View className="flex items-center gap-1 mt-2">
                  <Heart size={10} color="#D94B3D" />
                  <Text className="text-xs text-muted-foreground">{recipe.likes}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 创建自定义菜谱按钮 */}
      <View
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg"
        onClick={() => Taro.navigateTo({ url: '/pages/generate/index' })}
      >
        <Plus size={24} color="#FFFFFF" />
      </View>
    </ScrollView>
  )
}

export default LibraryPage
