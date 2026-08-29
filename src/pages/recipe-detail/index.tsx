import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Heart, Bookmark, Share2, Clock, Flame, Signal, Pencil, Plus } from 'lucide-react-taro'
import { Network } from '@/network'

interface Ingredient {
  name: string
  amount: string
  initial: string
  color: string
  bgColor: string
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
  steps: { step: number; description: string }[]
}

const MOCK_DETAIL: RecipeDetail = {
  id: '1',
  name: '番茄炒蛋',
  cuisine: '家常菜',
  time: '15分钟',
  calories: '280kcal',
  difficulty: '简单',
  image: 'https://placehold.co/400x300/C87941/FFFFFF?text=Recipe',
  likes: 128,
  ingredients: [
    { name: '鸡蛋', amount: '3个', initial: '蛋', color: '#C87941', bgColor: 'bg-primary bg-opacity-10' },
    { name: '西红柿', amount: '2个', initial: '柿', color: '#D94B3D', bgColor: 'bg-destructive bg-opacity-10' },
    { name: '葱花', amount: '适量', initial: '葱', color: '#7A8B4B', bgColor: 'bg-secondary bg-opacity-10' },
    { name: '盐', amount: '适量', initial: '盐', color: '#8B7355', bgColor: 'bg-muted' },
    { name: '糖', amount: '少许', initial: '糖', color: '#8B7355', bgColor: 'bg-muted' },
    { name: '油', amount: '适量', initial: '油', color: '#E8A33D', bgColor: 'bg-warning bg-opacity-10' },
  ],
  steps: [
    { step: 1, description: '鸡蛋打散加少许盐搅匀' },
    { step: 2, description: '西红柿切块备用' },
    { step: 3, description: '热锅凉油倒入蛋液炒至凝固盛出' },
    { step: 4, description: '锅中加油放入西红柿翻炒出汁' },
    { step: 5, description: '加入炒好的鸡蛋翻炒均匀调味出锅' },
  ],
}

const RecipeDetailPage = () => {
  const router = useRouter()
  const recipeId = router.params.id || '1'
  const [recipe] = useState<RecipeDetail>(MOCK_DETAIL)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(MOCK_DETAIL.likes)
  const [favorited, setFavorited] = useState(false)
  const [addedToMy, setAddedToMy] = useState(false)

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
      console.log('[菜谱详情] 保存请求失败', e)
    }
  }

  return (
    <ScrollView scrollY className="h-full bg-background">
      {/* 封面图 */}
      <View className="w-full h-64 overflow-hidden">
        <Image src={recipe.image} className="w-full h-full" mode="aspectFill" />
      </View>

      {/* 基本信息 */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex items-start justify-between mb-3">
          <Text className="text-xl font-bold text-foreground flex-1">{recipe.name}</Text>
          <Badge className="bg-primary bg-opacity-15 text-primary text-xs">
            <Text>{recipe.cuisine}</Text>
          </Badge>
        </View>
        <View className="flex items-center gap-4">
          <View className="flex items-center gap-2">
            <Clock size={16} color="#8B7355" />
            <Text className="text-sm text-muted-foreground">{recipe.time}</Text>
          </View>
          <View className="flex items-center gap-2">
            <Flame size={16} color="#8B7355" />
            <Text className="text-sm text-muted-foreground">{recipe.calories}</Text>
          </View>
          <View className="flex items-center gap-2">
            <Signal size={16} color="#8B7355" />
            <Text className="text-sm text-muted-foreground">{recipe.difficulty}</Text>
          </View>
        </View>
      </View>

      {/* 互动栏 */}
      <View className="flex items-center gap-6 px-4 py-3 border-t border-outline-variant border-opacity-10">
        <View className="flex items-center gap-2 min-w-12 min-h-12 justify-center" onClick={handleLike}>
          <Heart size={20} color={liked ? '#D94B3D' : '#8B7355'} />
          <Text className={`text-sm ${liked ? 'text-destructive' : 'text-muted-foreground'}`}>{likeCount}</Text>
        </View>
        <View className="flex items-center gap-2 min-w-12 min-h-12 justify-center" onClick={handleFavorite}>
          <Bookmark size={20} color={favorited ? '#C87941' : '#8B7355'} />
          <Text className={`text-sm ${favorited ? 'text-primary' : 'text-muted-foreground'}`}>{favorited ? '已收藏' : '收藏'}</Text>
        </View>
        <View className="flex items-center gap-2 min-w-12 min-h-12 justify-center" onClick={handleShare}>
          <Share2 size={20} color="#8B7355" />
          <Text className="text-sm text-muted-foreground">分享</Text>
        </View>
      </View>

      {/* 食材清单 */}
      <View className="px-4 pt-5 pb-2">
        <Text className="block text-base font-semibold text-foreground mb-3">食材清单</Text>
        <Card className="bg-card rounded-xl shadow-card overflow-hidden">
          {recipe.ingredients.map((item, idx) => (
            <View key={idx}>
              {idx > 0 && <View className="mx-4"><Separator className="bg-outline-variant bg-opacity-10" /></View>}
              <View className="flex items-center justify-between px-4 py-3">
                <View className="flex items-center gap-3">
                  <View className={`w-8 h-8 ${item.bgColor} rounded-full flex items-center justify-center`}>
                    <Text className="text-xs font-bold" style={{ color: item.color }}>{item.initial}</Text>
                  </View>
                  <Text className="text-sm text-foreground">{item.name}</Text>
                </View>
                <Text className="text-sm text-muted-foreground">{item.amount}</Text>
              </View>
            </View>
          ))}
        </Card>
      </View>

      {/* 烹饪步骤 */}
      <View className="px-4 pt-5 pb-24">
        <Text className="block text-base font-semibold text-foreground mb-3">烹饪步骤</Text>
        <View className="space-y-4">
          {recipe.steps.map((stepItem, idx) => (
            <View key={idx} className="flex gap-3">
              <View className="flex-shrink-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                <Text>{stepItem.step || idx + 1}</Text>
              </View>
              <View className="flex-1 pt-1">
                <Text className="block text-sm text-foreground leading-relaxed">{stepItem.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 底部操作栏 */}
      <View style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'row', gap: '12px', padding: '12px', backgroundColor: '#FFFFFF', borderTop: '1px solid rgba(43,29,22,0.08)', zIndex: 100 }}>
        <Button
          variant="secondary"
          className="flex-1 bg-muted text-muted-foreground py-4 rounded-xl text-base font-semibold"
          onClick={handleEdit}
        >
          <Pencil size={18} color="#8B7355" />
          <Text className="ml-2">修改菜谱</Text>
        </Button>
        <Button
          className={`flex-1 py-4 rounded-xl text-base font-semibold ${addedToMy ? 'bg-secondary text-white' : 'bg-primary text-primary-foreground'}`}
          onClick={handleAddToMy}
        >
          <Plus size={18} color="#fff" />
          <Text className="ml-2">{addedToMy ? '已加入' : '加入我的菜谱'}</Text>
        </Button>
      </View>
    </ScrollView>
  )
}

export default RecipeDetailPage
