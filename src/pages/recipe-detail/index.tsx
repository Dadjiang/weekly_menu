import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { useState, useCallback } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Heart, Bookmark, Share2, Clock, Flame, Signal, Pencil, Plus, X, Save } from 'lucide-react'
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

type EditableTextField = 'name' | 'cuisine' | 'time' | 'calories' | 'difficulty'

const RecipeDetailPage = () => {
  const router = useRouter()
  const recipeId = router.params.id || ''
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [favorited, setFavorited] = useState(false)
  const [addedToMy, setAddedToMy] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<RecipeDetail | null>(null)
  const [saving, setSaving] = useState(false)

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
          ingredients: (data.ingredients || []).map((ing: Ingredient) => ({ ...ing })),
          steps: (data.steps || []).map((s: { step?: string | number; description: string }, i: number) => ({
            step: s.step != null ? String(s.step) : String(i + 1),
            description: s.description,
          })),
        }
        setRecipe(mapped)
        setLikeCount(mapped.likes)
      }
    } catch (e) {
      console.log('[菜谱详情] 加载失败', e)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }, [recipeId])

  useDidShow(() => {
    if (recipeId) {
      loadRecipe()
    }
  })

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

  // 卡片式编辑：在当前页弹窗内编辑，不再跳转智能生成页
  const handleEdit = () => {
    if (!recipe) return
    setEditForm({
      ...recipe,
      ingredients: recipe.ingredients.map(ing => ({ ...ing })),
      steps: recipe.steps.map(s => ({ ...s })),
    })
    setEditOpen(true)
  }

  const updateField = (field: EditableTextField, value: string) => {
    setEditForm(prev => (prev ? { ...prev, [field]: value } : prev))
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    setEditForm(prev => {
      if (!prev) return prev
      const ingredients = prev.ingredients.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
      return { ...prev, ingredients }
    })
  }

  const removeIngredient = (index: number) => {
    setEditForm(prev => {
      if (!prev) return prev
      return { ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }
    })
  }

  const addIngredient = () => {
    setEditForm(prev => {
      if (!prev) return prev
      return { ...prev, ingredients: [...prev.ingredients, { name: '', amount: '' }] }
    })
  }

  const updateStep = (index: number, value: string) => {
    setEditForm(prev => {
      if (!prev) return prev
      const steps = prev.steps.map((s, i) => (i === index ? { ...s, description: value } : s))
      return { ...prev, steps }
    })
  }

  const removeStep = (index: number) => {
    setEditForm(prev => {
      if (!prev) return prev
      return { ...prev, steps: prev.steps.filter((_, i) => i !== index) }
    })
  }

  const addStep = () => {
    setEditForm(prev => {
      if (!prev) return prev
      return { ...prev, steps: [...prev.steps, { step: String(prev.steps.length + 1), description: '' }] }
    })
  }

  const handleSaveEdit = async () => {
    if (!editForm) return
    if (!editForm.name.trim()) {
      Taro.showToast({ title: '请输入菜谱名称', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      const res = await Network.request({
        url: `/api/recipes/${recipeId}`,
        method: 'PUT',
        data: {
          name: editForm.name.trim(),
          cuisine: editForm.cuisine,
          time: editForm.time,
          calories: editForm.calories,
          difficulty: editForm.difficulty,
          ingredients: editForm.ingredients.filter(ing => ing.name.trim()),
          steps: editForm.steps
            .filter(s => s.description.trim())
            .map((s, i) => ({ step: i + 1, description: s.description.trim() })),
        },
      })
      console.log('[菜谱详情] 保存菜谱:', res.data)
      if (res.data?.code === 200) {
        Taro.showToast({ title: '保存成功', icon: 'success' })
        setEditOpen(false)
        loadRecipe()
      } else {
        Taro.showToast({ title: res.data?.msg || '保存失败', icon: 'none' })
      }
    } catch (e) {
      console.log('[菜谱详情] 保存失败', e)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
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
      <Image src={recipe.image}  className="w-full h-64" mode="aspectFill"
        onError={() => {}}
      />

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

      {/* 卡片式编辑弹窗 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="p-0 gap-0 max-h-[85vh] overflow-hidden">
          <ScrollView scrollY style={{ maxHeight: '70vh' }} className="px-4 pt-5 pb-2">
            <DialogHeader className="text-left">
              <DialogTitle className="text-left">编辑菜谱</DialogTitle>
            </DialogHeader>

            {/* 基本信息卡片 */}
            <Card className="mt-3">
              <CardContent className="p-4 space-y-3">
                <View>
                  <Label className="block text-xs text-muted-foreground mb-1">菜谱名称</Label>
                  <Input
                    value={editForm?.name || ''}
                    onInput={(e) => updateField('name', e.detail.value)}
                    placeholder="请输入菜谱名称"
                  />
                </View>
                <View className="flex gap-3">
                  <View className="flex-1">
                    <Label className="block text-xs text-muted-foreground mb-1">菜系</Label>
                    <Input
                      value={editForm?.cuisine || ''}
                      onInput={(e) => updateField('cuisine', e.detail.value)}
                      placeholder="如：川菜"
                    />
                  </View>
                  <View className="flex-1">
                    <Label className="block text-xs text-muted-foreground mb-1">难度</Label>
                    <Input
                      value={editForm?.difficulty || ''}
                      onInput={(e) => updateField('difficulty', e.detail.value)}
                      placeholder="如：简单"
                    />
                  </View>
                </View>
                <View className="flex gap-3">
                  <View className="flex-1">
                    <Label className="block text-xs text-muted-foreground mb-1">烹饪时间</Label>
                    <Input
                      value={editForm?.time || ''}
                      onInput={(e) => updateField('time', e.detail.value)}
                      placeholder="如：20分钟"
                    />
                  </View>
                  <View className="flex-1">
                    <Label className="block text-xs text-muted-foreground mb-1">卡路里</Label>
                    <Input
                      value={editForm?.calories || ''}
                      onInput={(e) => updateField('calories', e.detail.value)}
                      placeholder="如：300千卡"
                    />
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 食材清单卡片 */}
            <Card className="mt-3">
              <CardContent className="p-4">
                <View className="flex items-center justify-between mb-3">
                  <Text className="block text-sm font-bold text-foreground">食材清单</Text>
                  <Button size="sm" variant="outline" onClick={addIngredient}>
                    <Plus size={14} className="mr-1" />
                    <Text className="text-xs">添加食材</Text>
                  </Button>
                </View>
                <View className="space-y-2">
                  {(editForm?.ingredients || []).map((ing, idx) => (
                    <View key={idx} className="flex items-center gap-2">
                      <View className="flex-1">
                        <Input
                          value={ing.name}
                          onInput={(e) => updateIngredient(idx, 'name', e.detail.value)}
                          placeholder="食材名称"
                        />
                      </View>
                      <View className="w-24">
                        <Input
                          value={ing.amount}
                          onInput={(e) => updateIngredient(idx, 'amount', e.detail.value)}
                          placeholder="用量"
                        />
                      </View>
                      <View className="p-2" onClick={() => removeIngredient(idx)}>
                        <X size={16} color="#D94B3D" />
                      </View>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>

            {/* 烹饪步骤卡片 */}
            <Card className="mt-3">
              <CardContent className="p-4">
                <View className="flex items-center justify-between mb-3">
                  <Text className="block text-sm font-bold text-foreground">烹饪步骤</Text>
                  <Button size="sm" variant="outline" onClick={addStep}>
                    <Plus size={14} className="mr-1" />
                    <Text className="text-xs">添加步骤</Text>
                  </Button>
                </View>
                <View className="space-y-3">
                  {(editForm?.steps || []).map((stepItem, idx) => (
                    <View key={idx} className="flex gap-2">
                      <View className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <Text className="text-xs text-white font-medium">{idx + 1}</Text>
                      </View>
                      <View className="flex-1">
                        <Textarea
                          className="h-24"
                          value={stepItem.description}
                          onInput={(e) => updateStep(idx, e.detail.value)}
                          placeholder="请输入步骤描述..."
                          maxlength={500}
                        />
                      </View>
                      <View className="p-2" onClick={() => removeStep(idx)}>
                        <X size={16} color="#D94B3D" />
                      </View>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          </ScrollView>

          {/* 弹窗底部操作按钮 */}
          <View className="flex gap-3 p-4 border-t border-outline-variant">
            <Button className="flex-1" variant="outline" onClick={() => setEditOpen(false)}>
              <Text className="text-sm">取消</Text>
            </Button>
            <Button className="flex-1" onClick={handleSaveEdit} disabled={saving}>
              <Save size={14} className="mr-1" />
              <Text className="text-sm">{saving ? '保存中...' : '保存修改'}</Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>
    </ScrollView>
  )
}

export default RecipeDetailPage
