import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { useState, useCallback } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Heart, Bookmark, Share2, Clock, Flame, Signal, Pencil, Plus } from 'lucide-react'
import { Network } from '@/network'

interface Ingredient {
  name: string
  amount: string
}

interface RecipeDetail {
  id: string
  name: string
  cuisine: string
  time: string
  calories: string
  difficulty: string
  image: string
  likes: number
  ingredients: Ingredient[]
  steps: { step: string; description: string }[]
}

const RecipeDetailPage = () => {
  const router = useRouter()
  const recipeId = router.params.id || ''
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [favorited, setFavorited] = useState(false)
  const [addedToMy, setAddedToMy] = useState(false)

  useDidShow(() => {
    if (recipeId) {
      loadRecipe()
    }
  })

  const loadRecipe = useCallback(async () => {
    try {
      const res = await Network.request({ url: `/api/recipes/${recipeId}`, method: 'GET' })
      console.log('[菜谱详情] 加载菜谱:', res.data)
      const data = res.data?.data
      if (data) {
        const mapped: RecipeDetail = {
          id: data.id,
          name: data.name,
          cuisine: data.cuisine,
          time: data.time,
          calories: data.calories,
          difficulty: data.difficulty,
          image: data.image,
          likes: data.likes_count || 0,
          ingredients: data.ingredients || [],
          steps: data.steps || [],
        }
        setRecipe(mapped)
        setLikeCount(mapped.likes)
      }
    } catch (e) {
      console.log('[菜谱详情] 加载失败', e)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }, [recipeId])

  const handleLike = async () => {
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1)
    try {
      await Network.request({
        url: `/api/recipes/${recipeId}/like`,
        method: 'POST',
        data: { userId: 'default-user' },
      })
    } catch (e) {
      console.log('[菜谱详情] 点赞请求失败', e)
    }
  }

  const handleFavorite = () => {
    setFavorited(!favorited)
  }

  const handleShare = () => {
    Taro.showShareMenu({})
  }

  const handleEdit = () => {
    Taro.navigateTo({ url: `/pages/generate/index?mode=edit&id=${recipeId}` })
  }

  const handleAddToMy = async () => {
    setAddedToMy(!addedToMy)
    try {
      await Network.request({
        url: '/api/recipes/save',
        method: 'POST',
        data: { recipeId },
      })
    } catch (e) {
      console.log('[菜谱详情] 保存失败', e)
    }
  }

  if (!recipe) {
    return (
      <View className="h-full bg-background flex items-center justify-center">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  return (
    <ScrollView scrollY className="h-full bg-background">
      {/* 菜谱封面图 */}
      <Image src={recipe.image} className="w-full h-64" mode="aspectFill" />

      {/* 基本信息 */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            {recipe.cuisine}
          </Badge>
          <View className="flex items-center gap-1">
            <Clock size={12} color="#8B7355" />
            <Text className="text-xs text-muted-foreground">{recipe.time}</Text>
          </View>
          <View className="flex items-center gap-1">
            <Flame size={12} color="#D94B3D" />
            <Text className="text-xs text-muted-foreground">{recipe.calories}</Text>
          </View>
          <View className="flex items-center gap-1">
            <Signal size={12} color="#7A8B4B" />
            <Text className="text-xs text-muted-foreground">{recipe.difficulty}</Text>
          </View>
        </View>
        <Text className="block text-xl font-bold text-foreground">{recipe.name}</Text>
      </View>

      {/* 互动栏 */}
      <View className="px-4 pt-3 pb-2">
        <View className="flex items-center gap-4">
          <View className="flex items-center gap-1" onClick={handleLike}>
            <Heart size={20} color={liked ? '#D94B3D' : '#8B7355'} fill={liked ? '#D94B3D' : 'none'} />
            <Text className="text-sm text-muted-foreground">{likeCount}</Text>
          </View>
          <View className="flex items-center gap-1" onClick={handleFavorite}>
            <Bookmark size={20} color={favorited ? '#C87941' : '#8B7355'} fill={favorited ? '#C87941' : 'none'} />
            <Text className="text-sm text-muted-foreground">{favorited ? '已收藏' : '收藏'}</Text>
          </View>
          <View className="flex items-center gap-1" onClick={handleShare}>
            <Share2 size={20} color="#8B7355" />
            <Text className="text-sm text-muted-foreground">分享</Text>
          </View>
        </View>
      </View>

      <Separator className="my-2" />

      {/* 食材清单 */}
      <View className="px-4 pt-4 pb-2">
        <Text className="block text-base font-bold text-foreground mb-3">食材清单</Text>
        <View className="space-y-2">
          {recipe.ingredients.map((ing, idx) => (
            <View key={idx} className="flex items-center justify-between py-2 border-b border-outline-variant">
              <Text className="text-sm text-foreground">{ing.name}</Text>
              <Text className="text-sm text-muted-foreground">{ing.amount}</Text>
            </View>
          ))}
        </View>
      </View>

      <Separator className="my-2" />

      {/* 烹饪步骤 */}
      <View className="px-4 pt-4 pb-24">
        <Text className="block text-base font-bold text-foreground mb-3">烹饪步骤</Text>
        <View className="space-y-3">
          {recipe.steps.map((stepItem, idx) => (
            <View key={idx} className="flex gap-3">
              <View className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Text className="text-xs text-white font-medium">{stepItem.step || idx + 1}</Text>
              </View>
              <Text className="block text-sm text-foreground flex-1 pt-1">{stepItem.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 底部操作栏 */}
      <View
        className="fixed bottom-0 left-0 right-0 bg-background border-t border-outline-variant px-4 py-3 flex gap-3"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Button
          className="flex-1 bg-muted text-foreground"
          onClick={handleEdit}
        >
          <Pencil size={16} className="mr-1" />
          <Text className="text-sm">修改菜谱</Text>
        </Button>
        <Button
          className={`flex-1 ${addedToMy ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-white'}`}
          onClick={handleAddToMy}
        >
          <Plus size={16} className="mr-1" />
          <Text className="text-sm">{addedToMy ? '已加入' : '加入我的菜谱'}</Text>
        </Button>
      </View>
    </ScrollView>
  )
}

export default RecipeDetailPage
