import { memo, useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { Package, Search, ChevronUp, ChevronDown } from "lucide-react-native"
import { CATEGORY_META } from "@/lib/category-meta"
import { useColor } from "@/lib/useColor"
import {
  listItems,
  type InventoryItem,
  type SortBy,
  type SortDir,
} from "@/lib/services/inventory"
import { Skeleton } from "@/components/ui/Skeleton"

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 500

const SORT_COLUMNS: { key: SortBy; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "unit_of_measure", label: "Unit" },
]

function CategoryIcon({ category }: { category: string }) {
  const meta = CATEGORY_META[category]
  if (!meta) return <View className="w-9 h-9 rounded-xl bg-muted" />
  const Icon = meta.icon
  return (
    <View
      className={`w-9 h-9 rounded-xl items-center justify-center ${meta.bg}`}
    >
      <Icon size={18} color={useColor(meta.iconColorToken)} />
    </View>
  )
}

function SkeletonRow() {
  return (
    <View className="flex-row items-center px-4 py-3 border-b border-border gap-3">
      <Skeleton className="w-9 h-9 rounded-xl" />
      <View className="flex-1 gap-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </View>
      <Skeleton className="h-4 w-10" />
    </View>
  )
}

function SortIndicator({
  col,
  sortBy,
  sortDir,
}: {
  col: SortBy
  sortBy: SortBy
  sortDir: SortDir
}) {
  if (col !== sortBy)
    return <ChevronUp size={10} color={useColor("inactive")} className="ml-0.5" />
  return sortDir === "asc" ? (
    <ChevronUp size={10} color={useColor("primary")} className="ml-0.5" />
  ) : (
    <ChevronDown size={10} color={useColor("primary")} className="ml-0.5" />
  )
}

type InventoryRowProps = {
  id: string
  name: string
  category: string
  unit_of_measure: string
  total_quantity: number
  reorder_point: number | null
  onPress: (id: string) => void
}

const InventoryRow = memo(function InventoryRow({
  id,
  name,
  category,
  unit_of_measure,
  total_quantity,
  reorder_point,
  onPress,
}: InventoryRowProps) {
  const low = reorder_point !== null && total_quantity <= reorder_point
  const handlePress = useCallback(() => onPress(id), [id, onPress])
  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center px-4 py-3 border-b border-border bg-card active:bg-muted/50"
    >
      <CategoryIcon category={category} />
      <View className="flex-1 ml-3">
        <Text
          className="text-sm font-medium text-card-foreground"
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          {category} · {unit_of_measure}
        </Text>
      </View>
      <View className="items-end">
        <Text
          className={`text-sm font-semibold ${
            low ? "text-destructive" : "text-card-foreground"
          }`}
        >
          {total_quantity}
        </Text>
        {reorder_point !== null && (
          <Text className="text-[10px] text-muted-foreground">
            reorder: {reorder_point}
          </Text>
        )}
      </View>
    </Pressable>
  )
})

export default function InventoryScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchInput, setSearchInput] = useState("")
  const [query, setQuery] = useState("") // debounced search
  const [category, setCategory] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce searchInput → query
  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchPage = useCallback(
    async (
      p: number,
      q: string,
      cat: string,
      sb: SortBy,
      sd: SortDir,
      append: boolean,
    ) => {
      setError(null)
      try {
        const result = await listItems({
          page: p,
          limit: PAGE_SIZE,
          search: q || undefined,
          category: cat || undefined,
          sort_by: sb,
          sort_dir: sd,
        })
        if (append) {
          setItems((prev) => [...prev, ...result.data])
        } else {
          setItems(result.data)
        }
        setPage(result.meta.page)
        setHasMore(result.meta.page < result.meta.total_pages)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load inventory")
      }
    },
    [],
  )

  const handleRowPress = useCallback(
    (id: string) => router.push(`/(app)/inventory/${id}` as any),
    [router],
  )

  // Reset and reload page 1 whenever filters change
  useEffect(() => {
    setLoading(true)
    setItems([])
    setHasMore(true)
    fetchPage(1, query, category, sortBy, sortDir, false).finally(() =>
      setLoading(false),
    )
  }, [query, category, sortBy, sortDir, fetchPage])

  function handleLoadMore() {
    if (loadingMore || loading || !hasMore || !!refreshing) return
    setLoadingMore(true)
    fetchPage(page + 1, query, category, sortBy, sortDir, true).finally(() =>
      setLoadingMore(false),
    )
  }

  function handleRefresh() {
    setRefreshing(true)
    setItems([])
    setHasMore(true)
    fetchPage(1, query, category, sortBy, sortDir, false).finally(() =>
      setRefreshing(false),
    )
  }

  function handleSort(col: SortBy) {
    if (col === sortBy) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortDir("asc")
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View
        className="p-6 pb-3"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="flex-row items-center gap-3 mb-6">
          <Package size={20} color={useColor("primary")} />
          <Text className="text-2xl font-bold text-foreground tracking-tight">
            Inventory
          </Text>
        </View>

        {/* Search — auto-triggers with debounce, no button needed */}
        <View className="flex-row items-center border border-border rounded-lg bg-background px-3 mb-3">
          <Search size={16} color={useColor("muted-foreground")} />
          <TextInput
            className="flex-1 ml-2 text-sm text-foreground py-3"
            placeholder="Search items…"
            placeholderTextColor={useColor("placeholder")}
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
          />
        </View>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pb-1"
          className="mb-3"
        >
          {["", ...Object.keys(CATEGORY_META)].map((cat) => {
            const active = category === cat
            return (
              <Pressable
                key={cat || "__all__"}
                onPress={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full border active:opacity-70 ${
                  active ? "bg-primary border-primary" : "bg-card border-border"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    active ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {cat || "All"}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {/* Sort buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 mb-2"
        >
          {SORT_COLUMNS.map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => handleSort(key)}
              className="flex-row items-center px-3 py-1.5 rounded-full border border-border bg-card active:opacity-70"
            >
              <Text className="text-xs font-semibold text-muted-foreground">
                {label}
              </Text>
              <SortIndicator col={key} sortBy={sortBy} sortDir={sortDir} />
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {error && (
        <View className="px-6 py-4">
          <Text className="text-sm text-destructive text-center">{error}</Text>
        </View>
      )}

      {!error && loading && skeletonBuilder()}

      {!error && !loading && (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 65 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={useColor("primary")}
              colors={[useColor("primary")]}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={useColor("primary")} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="py-16 items-center">
              {refreshing ? (
                <></>
              ) : (
                <Text className="text-sm text-muted-foreground">
                  No items found
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <InventoryRow
              id={item.id}
              name={item.name}
              category={item.category}
              unit_of_measure={item.unit_of_measure}
              total_quantity={item.total_quantity}
              reorder_point={item.reorder_point}
              onPress={handleRowPress}
            />
          )}
        />
      )}
    </View>
  )
}

function skeletonBuilder(): import("react").ReactNode {
  return (
    <View>
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  )
}
