import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { History, ChevronUp, ChevronDown } from "lucide-react-native"
import { getColor } from "@/lib/color"
import {
  listMovements,
  type StockMovement,
  type ActionType,
  type MovementSortBy,
  type SortDir,
} from "@/lib/services/movements"
import { ACTION_META, ACTION_TYPES } from "@/components/activities/constants"
import { MovementRow } from "@/components/activities/MovementRow"
import { Skeleton } from "@/components/ui/Skeleton"

const PAGE_SIZE = 10

const SORT_COLUMNS: { key: MovementSortBy; label: string }[] = [
  { key: "created_at", label: "Date" },
  { key: "action_type", label: "Type" },
]

function SkeletonRow() {
  return (
    <View className="flex-row items-center px-4 py-3 border-b border-border gap-3">
      <Skeleton className="w-9 h-9 rounded-xl" />
      <View className="flex-1 gap-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-40" />
      </View>
      <Skeleton className="h-4 w-12" />
    </View>
  )
}

function SortIndicator({
  col,
  sortBy,
  sortDir,
}: {
  col: MovementSortBy
  sortBy: MovementSortBy
  sortDir: SortDir
}) {
  if (col !== sortBy)
    return (
      <ChevronUp size={10} color={getColor("inactive")} className="ml-0.5" />
    )
  return sortDir === "asc" ? (
    <ChevronUp size={10} color={getColor("primary")} className="ml-0.5" />
  ) : (
    <ChevronDown size={10} color={getColor("primary")} className="ml-0.5" />
  )
}

export default function ActivitiesScreen() {
  const insets = useSafeAreaInsets()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [actionType, setActionType] = useState<ActionType | "">("")
  const [sortBy, setSortBy] = useState<MovementSortBy>("created_at")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPage = useCallback(
    async (
      p: number,
      type: ActionType | "",
      sb: MovementSortBy,
      sd: SortDir,
      append: boolean,
    ) => {
      setError(null)
      try {
        const result = await listMovements({
          page: p,
          limit: PAGE_SIZE,
          action_type: type || undefined,
          sort_by: sb,
          sort_dir: sd,
        })
        if (append) {
          setMovements((prev) => [...prev, ...result.data])
        } else {
          setMovements(result.data)
        }
        setPage(result.meta.page)
        setHasMore(result.meta.page < result.meta.total_pages)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load activities")
      }
    },
    [],
  )

  // Reset and reload page 1 whenever filters change
  useEffect(() => {
    setLoading(true)
    setMovements([])
    setHasMore(true)
    fetchPage(1, actionType, sortBy, sortDir, false).finally(() =>
      setLoading(false),
    )
  }, [actionType, sortBy, sortDir, fetchPage])

  function handleLoadMore() {
    if (loadingMore || loading || !hasMore || !!refreshing) return
    setLoadingMore(true)
    fetchPage(page + 1, actionType, sortBy, sortDir, true).finally(() =>
      setLoadingMore(false),
    )
  }

  function handleRefresh() {
    setRefreshing(true)
    setMovements([])
    setHasMore(true)
    fetchPage(1, actionType, sortBy, sortDir, false).finally(() =>
      setRefreshing(false),
    )
  }

  function handleSort(col: MovementSortBy) {
    if (col === sortBy) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortDir(col === "created_at" ? "desc" : "asc")
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View
        className="p-6 pb-3"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="flex-row items-center gap-3 mb-6">
          <History size={20} color={getColor("primary")} />
          <Text className="text-2xl font-bold text-foreground tracking-tight">
            Activities
          </Text>
        </View>

        {/* Action-type filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pb-1"
          className="mb-3"
        >
          {(["", ...ACTION_TYPES] as (ActionType | "")[]).map((type) => {
            const active = actionType === type
            const label = type ? ACTION_META[type].label : "All"
            return (
              <Pressable
                key={type || "__all__"}
                onPress={() => setActionType(type)}
                className={`px-3 py-1.5 rounded-full border active:opacity-70 ${
                  active ? "bg-primary border-primary" : "bg-card border-border"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    active ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
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

      {!error && loading && (
        <View>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      )}

      {!error && !loading && (
        <FlatList
          data={movements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 65 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={getColor("primary")}
              colors={[getColor("primary")]}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={getColor("primary")} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="py-16 items-center">
              {refreshing ? (
                <></>
              ) : (
                <Text className="text-sm text-muted-foreground">
                  No activities found
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => <MovementRow movement={item} />}
        />
      )}
    </View>
  )
}
