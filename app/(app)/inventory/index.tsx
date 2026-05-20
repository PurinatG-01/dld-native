import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react-native";
import { CATEGORY_META } from "@/lib/category-meta";
import {
  listItems,
  type InventoryItem,
  type ListItemsMeta,
  type SortBy,
  type SortDir,
} from "@/lib/services/inventory";
import { Skeleton } from "@/components/ui/Skeleton";

const PAGE_SIZE = 20;

const SORT_COLUMNS: { key: SortBy; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "unit_of_measure", label: "Unit" },
];

const PRIMARY = "#4f46e5";
const MUTED = "#64748b";

function CategoryIcon({ category }: { category: string }) {
  const meta = CATEGORY_META[category];
  if (!meta) return <View className="w-9 h-9 rounded-xl bg-muted" />;
  const Icon = meta.icon;
  return (
    <View
      className={`w-9 h-9 rounded-xl items-center justify-center ${meta.bg}`}
    >
      <Icon size={18} color={meta.iconColor} />
    </View>
  );
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
  );
}

export default function InventoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [meta, setMeta] = useState<ListItemsMeta | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number, q: string, cat: string, sb: SortBy, sd: SortDir) => {
      setLoading(true);
      setError(null);
      try {
        const result = await listItems({
          page: p,
          limit: PAGE_SIZE,
          search: q || undefined,
          category: cat || undefined,
          sort_by: sb,
          sort_dir: sd,
        });
        setItems(result.data);
        setMeta(result.meta);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load inventory");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(page, query, category, sortBy, sortDir);
  }, [page, query, category, sortBy, sortDir, load]);

  function handleSearch() {
    setPage(1);
    setQuery(searchInput);
  }

  function handleSort(col: SortBy) {
    if (col === sortBy) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
    setPage(1);
  }

  function SortIndicator({ col }: { col: SortBy }) {
    if (col !== sortBy)
      return <ChevronUp size={10} color="#cbd5e1" style={{ marginLeft: 2 }} />;
    return sortDir === "asc" ? (
      <ChevronUp size={10} color={PRIMARY} style={{ marginLeft: 2 }} />
    ) : (
      <ChevronDown size={10} color={PRIMARY} style={{ marginLeft: 2 }} />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="p-6 pb-3" style={{ paddingTop: Math.max(insets.top, 24) }}>
        <View className="flex-row items-center gap-3 mb-6">
          <Package size={20} color={PRIMARY} />
          <Text className="text-2xl font-bold text-foreground tracking-tight">
            Inventory
          </Text>
        </View>

        {/* Search */}
        <View className="flex-row gap-2 mb-3">
          <View className="flex-1 flex-row items-center border border-border rounded-lg bg-background px-3">
            <Search size={16} color={MUTED} />
            <TextInput
              className="flex-1 ml-2 text-sm text-foreground py-3"
              placeholder="Search items…"
              placeholderTextColor="#94a3b8"
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            onPress={handleSearch}
            className="bg-primary px-4 rounded-lg items-center justify-center"
            activeOpacity={0.8}
          >
            <Text className="text-primary-foreground font-semibold text-sm">
              Search
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pb-1"
          className="mb-3"
        >
          {["", ...Object.keys(CATEGORY_META)].map((cat) => {
            const active = category === cat;
            return (
              <TouchableOpacity
                key={cat || "__all__"}
                onPress={() => {
                  setCategory(cat);
                  setPage(1);
                }}
                activeOpacity={0.7}
                className={`px-3 py-1.5 rounded-full border ${
                  active ? "bg-primary border-primary" : "bg-card border-border"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    active
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {cat || "All"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 mb-2"
        >
          {SORT_COLUMNS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => handleSort(key)}
              activeOpacity={0.7}
              className="flex-row items-center px-3 py-1.5 rounded-full border border-border bg-card"
            >
              <Text className="text-xs font-semibold text-muted-foreground">
                {label}
              </Text>
              <SortIndicator col={key} />
            </TouchableOpacity>
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
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 65 }}
          ListFooterComponent={
            meta && meta.total_pages > 1 ? (
              <View className="flex-row items-center justify-between px-6 py-3 mt-2 border-t border-border bg-card">
                <Text className="text-xs text-muted-foreground">
                  {meta.total} items · page {meta.page} of {meta.total_pages}
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`w-9 h-9 rounded-lg border border-border items-center justify-center ${page === 1 ? "opacity-40" : ""}`}
                  >
                    <ChevronLeft size={16} color={MUTED} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                    disabled={page === meta.total_pages}
                    className={`w-9 h-9 rounded-lg border border-border items-center justify-center ${page === meta.total_pages ? "opacity-40" : ""}`}
                  >
                    <ChevronRight size={16} color={MUTED} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Text className="text-sm text-muted-foreground">
                No items found
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const low =
              item.reorder_point !== null &&
              item.total_quantity <= item.reorder_point;
            return (
              <Pressable
                onPress={() =>
                  router.push(`/(app)/inventory/${item.id}` as any)
                }
                className="flex-row items-center px-4 py-3 border-b border-border active:bg-muted/50"
              >
                <CategoryIcon category={item.category} />
                <View className="flex-1 ml-3">
                  <Text
                    className="text-sm font-medium text-card-foreground"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {item.category} · {item.unit_of_measure}
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className={`text-sm font-semibold ${
                      low ? "text-destructive" : "text-card-foreground"
                    }`}
                  >
                    {item.total_quantity}
                  </Text>
                  {item.reorder_point !== null && (
                    <Text className="text-[10px] text-muted-foreground">
                      reorder: {item.reorder_point}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}

    </View>
  );
}
