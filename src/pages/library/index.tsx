import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo, useCallback } from 'react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

import { Search, X, Flame, Heart, Plus, Trash2 } from 'lucide-react'
import { Network } from '@/network'

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'vegetarian', label: '素食' },
  { key: 'light', label: '轻食' },
  { key: 'meat', label: '荤菜' },
  { key: 'snack', label: '小吃' },
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
    case '素食': return 'bg-secondary bg-opacity-90 text-white'
    case '轻食': return 'bg-primary bg-opacity-90 text-white'
    case '荤菜': return 'bg-destructive bg-opacity-90 text-white'
    case '小吃': return 'bg-warning bg-opacity-90 text-white'
    default: return 'bg-primary bg-opacity-90 text-white'
  }
}

const LibraryPage = () => {
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [recipes, setRecipes] = useState<LibraryRecipe[]>([])
  const [manageMode, setManageMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useDidShow(() => {
    loadRecipes()
  })

  const toggleManageMode = () => {
    setManageMode(prev => {
      const next = !prev
      if (!next) setSelectedIds([])
      return next
    })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return
    setDeleting(true)
    try {
      const res = await Network.request({
        url: '/api/recipes/batch-delete',
        method: 'POST',
        data: { ids: selectedIds },
      })
      console.log('[菜谱库] 批量删除结果:', res.data)
      if (res.data?.code === 200) {
        Taro.showToast({ title: `已删除${selectedIds.length}道菜谱`, icon: 'success' })
        setSelectedIds([])
        setManageMode(false)
        loadRecipes()
      } else {
        Taro.showToast({ title: res.data?.msg || '删除失败', icon: 'none' })
      }
    } catch (e) {
      console.log('[菜谱库] 批量删除失败', e)
      Taro.showToast({ title: '删除失败', icon: 'none' })
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

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
      list = list.filter(r => r.category === selectedCategory)
    }
    if (searchText.trim()) {
      list = list.filter(r => r.name.includes(searchText.trim()))
    }
    return list
  }, [recipes, selectedCategory, searchText])

  const allSelected = filteredRecipes.length > 0 && filteredRecipes.every(r => selectedIds.includes(r.id))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredRecipes.some(r => r.id === id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredRecipes.map(r => r.id)])))
    }
  }

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
        <View className="flex items-center gap-2">
          <View className="relative flex-1">
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
          <Button size="sm" variant={manageMode ? 'default' : 'outline'} onClick={toggleManageMode}>
            <Text className="text-xs">{manageMode ? '完成' : '管理'}</Text>
          </Button>
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
      <View className={`px-4 pt-4 ${manageMode ? 'pb-32' : 'pb-20'}`}>
        <View className="flex items-center justify-between mb-3">
          <Text className="block text-sm text-muted-foreground">共 {filteredRecipes.length} 道菜谱</Text>
        </View>
        <View className="grid grid-cols-2 gap-3">
          {filteredRecipes.map((recipe) => {
            const checked = selectedIds.includes(recipe.id)
            return (
              <View
                key={recipe.id}
                className="relative bg-surface-container rounded-xl overflow-hidden"
                onClick={() => {
                  if (manageMode) {
                    toggleSelect(recipe.id)
                  } else {
                    Taro.navigateTo({ url: `/pages/recipe-detail/index?id=${recipe.id}` })
                  }
                }}
              >
                {manageMode && (
                  <View className="absolute top-2 right-2 z-10" onClick={(e) => { e.stopPropagation(); toggleSelect(recipe.id) }}>
                    <Checkbox checked={checked} />
                  </View>
                )}
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
            )
          })}
        </View>
      </View>

      {/* 创建自定义菜谱按钮 */}
      {!manageMode && (
        <View
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg"
          onClick={() => Taro.navigateTo({ url: '/pages/generate/index' })}
        >
          <Plus size={24} color="#FFFFFF" />
        </View>
      )}

      {/* 批量管理底部操作栏 */}
      {manageMode && (
        <View
          style={{
            position: 'fixed',
            bottom: 50,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: 12,
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E5E0D8',
            zIndex: 100,
          }}
        >
          <Button variant="outline" onClick={toggleSelectAll}>
            <Text className="text-sm">{allSelected ? '取消全选' : '全选'}</Text>
          </Button>
          <Text className="block text-sm text-muted-foreground flex-1 text-center">已选 {selectedIds.length} 项</Text>
          <Button
            variant="destructive"
            disabled={selectedIds.length === 0 || deleting}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 size={16} color="#FFFFFF" className="mr-1" />
            <Text className="text-sm">{deleting ? '删除中...' : `删除(${selectedIds.length})`}</Text>
          </Button>
        </View>
      )}

      {/* 删除二次确认 */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Text className="block text-lg font-semibold text-foreground">确认删除</Text>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Text className="block text-sm text-muted-foreground">
                将永久删除选中的 {selectedIds.length} 道菜谱，删除后不可恢复，是否继续？
              </Text>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel>
              <Text className="text-sm">取消</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={handleBatchDelete}
            >
              <Text className="text-sm">确认删除</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollView>
  )
}

export default LibraryPage
