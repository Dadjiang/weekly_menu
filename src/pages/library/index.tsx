import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useMemo } from 'react'

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

const MOCK_LIBRARY: LibraryRecipe[] = [
  { id: '1', name: '宫保鸡丁', category: 'sichuan', cuisine: '川菜', calories: '386 kcal', likes: 256, image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe' },
  { id: '2', name: '番茄炒蛋', category: 'homestyle', cuisine: '家常菜', calories: '198 kcal', likes: 412, image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe' },
  { id: '3', name: '白灼虾', category: 'cantonese', cuisine: '粤菜', calories: '152 kcal', likes: 189, image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe' },
  { id: '4', name: '麻婆豆腐', category: 'sichuan', cuisine: '川菜', calories: '275 kcal', likes: 334, image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe' },
  { id: '5', name: '皮蛋瘦肉粥', category: 'breakfast', cuisine: '早餐', calories: '210 kcal', likes: 178, image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe' },
  { id: '6', name: '清炒时蔬', category: 'vegetarian', cuisine: '素食', calories: '85 kcal', likes: 96, image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe' },
  { id: '7', name: '红烧肉', category: 'homestyle', cuisine: '家常菜', calories: '520 kcal', likes: 487, image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe' },
  { id: '8', name: '烧烤拼盘', category: 'snack', cuisine: '夜宵', calories: '650 kcal', likes: 321, image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe' },
]

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
  const [recipes, setRecipes] = useState<LibraryRecipe[]>(MOCK_LIBRARY)

  const filteredRecipes = useMemo(() => {
    let list = recipes
    if (selectedCategory !== 'all') {
      list = list.filter(r => r.category === selectedCategory)
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
        setRecipes(data)
      }
    } catch (e) {
      console.log('[菜谱库] 搜索使用本地过滤', e)
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
            <View className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => handleSearch('')}>
              <X size={16} color="#8B7355" />
            </View>
          )}
        </View>
      </View>

      {/* 分类标签 */}
      <ScrollView scrollX className="flex gap-2 px-4 pb-4 whitespace-nowrap">
        {CATEGORIES.map((cat) => (
          <View
            key={cat.key}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium ${selectedCategory === cat.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            onClick={() => setSelectedCategory(cat.key)}
          >
            <Text>{cat.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 统计 */}
      <View className="px-4 pb-3 flex items-center justify-between">
        <Text className="text-xs text-muted-foreground">共 <Text className="font-semibold text-foreground">{filteredRecipes.length}</Text> 道菜谱</Text>
      </View>

      {/* 菜谱网格 */}
      <View className="grid grid-cols-2 gap-3 px-4 pb-24">
        {filteredRecipes.map((recipe) => (
          <View
            key={recipe.id}
            className="bg-card rounded-xl shadow-card overflow-hidden"
            onClick={() => Taro.navigateTo({ url: `/pages/recipe-detail/index?id=${recipe.id}` })}
          >
            <View className="relative">
              <Image src={recipe.image} className="w-full h-36" mode="aspectFill" />
              <Badge className={`absolute top-2 left-2 text-xs ${getCuisineColor(recipe.cuisine)}`}>
                <Text>{recipe.cuisine}</Text>
              </Badge>
            </View>
            <View className="p-3">
              <Text className="block text-sm font-semibold text-foreground truncate">{recipe.name}</Text>
              <View className="flex items-center justify-between mt-2">
                <View className="flex items-center gap-1 text-muted-foreground">
                  <Flame size={14} color="#E8A33D" />
                  <Text className="text-xs">{recipe.calories}</Text>
                </View>
                <View className="flex items-center gap-1 text-muted-foreground">
                  <Heart size={14} color="#8B7355" />
                  <Text className="text-xs">{recipe.likes}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* FAB 创建按钮 */}
      <View
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary shadow-float flex items-center justify-center"
        onClick={() => Taro.switchTab({ url: '/pages/generate/index' })}
      >
        <Plus size={24} color="#fff" />
      </View>
    </ScrollView>
  )
}

export default LibraryPage
