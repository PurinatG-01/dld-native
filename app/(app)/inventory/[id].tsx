import { useEffect, useState } from "react"
import { View, Text, ScrollView, TouchableOpacity } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import {
  ChevronLeft,
  Package,
  AlertTriangle,
  Thermometer,
  ShieldAlert,
} from "lucide-react-native"
import { CATEGORY_META } from "@/lib/category-meta"
import {
  getItemStock,
  type GetItemStockResult,
  type ItemStockRecord,
} from "@/lib/services/inventory"
import { Skeleton } from "@/components/ui/Skeleton"
import { formatDate, isExpiringSoon } from "@/lib/utils"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColor } from "@/lib/useColor"

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-muted", text: "text-muted-foreground" },
  in_stock: { bg: "bg-emerald-100", text: "text-emerald-700" },
  partially_used: { bg: "bg-amber-100", text: "text-amber-700" },
  flagged: { bg: "bg-orange-100", text: "text-orange-700" },
  transferred: { bg: "bg-blue-100", text: "text-blue-700" },
  consumed: { bg: "bg-muted", text: "text-muted-foreground" },
  disposed: { bg: "bg-destructive/10", text: "text-destructive" },
}

function MetaField({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <View className="w-1/2 mb-4">
      <Text className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-0.5">
        {label}
      </Text>
      <View className="flex-row items-center gap-1">
        {highlight && <AlertTriangle size={13} color={useColor("destructive")} />}
        <Text
          className={`font-medium ${
            highlight ? "text-destructive" : "text-card-foreground"
          }`}
        >
          {value}
        </Text>
      </View>
    </View>
  )
}

function StockRow({ stock }: { stock: ItemStockRecord }) {
  const expiringSoon = isExpiringSoon(stock.expiry_date)
  const expired = stock.expiry_date && new Date(stock.expiry_date) < new Date()
  const statusStyle = STATUS_STYLES[stock.status] ?? {
    bg: "bg-slate-100",
    text: "text-slate-500",
  }
  return (
    <View className="px-4 py-3 border-b border-border">
      <View className="flex-row items-start justify-between mb-1">
        <Text className="text-sm font-medium text-card-foreground flex-1">
          {stock.location_name ?? stock.location_id}
        </Text>
        <View className={`px-2 py-0.5 rounded-full ${statusStyle.bg} ml-2`}>
          <Text className={`text-[10px] font-medium ${statusStyle.text}`}>
            {stock.status}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-3 flex-wrap">
        <Text className="text-xs text-muted-foreground font-mono">
          {stock.lot_number ?? stock.serial_number ?? "—"}
        </Text>
        <Text
          className={`text-xs ${
            expired
              ? "text-destructive font-medium"
              : expiringSoon
                ? "text-orange-500 font-medium"
                : "text-muted-foreground"
          }`}
        >
          Exp: {formatDate(stock.expiry_date)}
          {expiringSoon && !expired ? " ⚠" : ""}
        </Text>
        <Text className="text-xs font-semibold text-card-foreground ml-auto">
          Qty: {stock.quantity_on_hand}
        </Text>
      </View>
    </View>
  )
}

function DetailSkeleton() {
  return (
    <View className="p-6 gap-6">
      <View className="bg-card rounded-xl border border-border p-6">
        <View className="flex-row items-start gap-4 mb-5">
          <Skeleton className="w-14 h-14 rounded-xl" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </View>
        </View>
        <View className="flex-row flex-wrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} className="w-1/2 mb-4 gap-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </View>
          ))}
        </View>
      </View>
      <View className="bg-card rounded-xl border border-border">
        <View className="px-6 py-4 border-b border-border">
          <Skeleton className="h-5 w-32" />
        </View>
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} className="px-4 py-3 border-b border-border gap-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </View>
        ))}
      </View>
    </View>
  )
}

export default function InventoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [data, setData] = useState<GetItemStockResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getItemStock(id)
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to load stock"),
      )
      .finally(() => setLoading(false))
  }, [id])

  const totalQty =
    data?.stocks.reduce((sum, s) => sum + s.quantity_on_hand, 0) ?? 0

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pb-2" style={{ paddingTop: Math.max(insets.top, 24) }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center gap-1"
          activeOpacity={0.7}
        >
          <ChevronLeft size={16} color={useColor("muted-foreground")} />
          <Text className="text-sm text-muted-foreground">
            Back to Inventory
          </Text>
        </TouchableOpacity>
      </View>

      {loading && <DetailSkeleton />}

      {error && (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-destructive">{error}</Text>
        </View>
      )}

      {!loading && !error && data && (
        <ScrollView contentContainerClassName="p-6 gap-6">
          {/* Item header card */}
          <View className="bg-card rounded-xl border border-border p-6">
            <View className="flex-row items-start gap-4 mb-5">
              {(() => {
                const catMeta = CATEGORY_META[data.item.category]
                if (catMeta) {
                  const Icon = catMeta.icon
                  return (
                    <View
                      className={`w-14 h-14 rounded-xl items-center justify-center ${catMeta.bg}`}
                    >
                      <Icon size={26} color={useColor(catMeta.iconColorToken)} />
                    </View>
                  )
                }
                return (
                  <View className="w-14 h-14 rounded-xl bg-primary/10 items-center justify-center">
                    <Package size={24} color={useColor("primary")} />
                  </View>
                )
              })()}

              <View className="flex-1">
                <Text className="text-xl font-bold text-card-foreground mb-1">
                  {data.item.name}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {data.item.is_controlled_drug && (
                    <View className="flex-row items-center gap-1 bg-destructive/10 px-2 py-0.5 rounded-full">
                      <ShieldAlert size={11} color={useColor("destructive")} />
                      <Text className="text-[10px] font-medium text-destructive">
                        Controlled
                      </Text>
                    </View>
                  )}
                  {data.item.requires_refrigeration && (
                    <View className="flex-row items-center gap-1 bg-blue-100 px-2 py-0.5 rounded-full">
                      <Thermometer size={11} color={useColor("category-pharma")} />
                      <Text className="text-[10px] font-medium text-blue-700">
                        Cold chain
                      </Text>
                    </View>
                  )}
                </View>
                {data.item.generic_name && (
                  <Text className="text-sm text-muted-foreground mt-1">
                    {data.item.generic_name}
                  </Text>
                )}
              </View>

              <View className="items-end">
                <Text className="text-3xl font-bold text-card-foreground">
                  {totalQty}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {data.item.unit_of_measure} total
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap">
              <MetaField label="Category" value={data.item.category} />
              <MetaField
                label="Subcategory"
                value={data.item.subcategory ?? "—"}
              />
              <MetaField
                label="Internal SKU"
                value={data.item.internal_sku ?? "—"}
              />
              <MetaField
                label="Barcode / GTIN"
                value={data.item.barcode_gtin ?? "—"}
              />
              <MetaField
                label="Reorder point"
                value={
                  data.item.reorder_point !== null
                    ? String(data.item.reorder_point)
                    : "—"
                }
                highlight={totalQty <= (data.item.reorder_point ?? Infinity)}
              />
              <MetaField
                label="Par level"
                value={
                  data.item.par_level !== null
                    ? String(data.item.par_level)
                    : "—"
                }
              />
              <MetaField
                label="Max level"
                value={
                  data.item.max_level !== null
                    ? String(data.item.max_level)
                    : "—"
                }
              />
              <MetaField
                label="Pack size"
                value={
                  data.item.pack_size !== null
                    ? String(data.item.pack_size)
                    : "—"
                }
              />
            </View>
          </View>

          {/* Stock batches */}
          <View className="bg-card rounded-xl border border-border">
            <View className="px-6 py-4 border-b border-border flex-row items-center gap-2">
              <Text className="font-semibold text-card-foreground">
                Stock batches
              </Text>
              <Text className="text-sm text-muted-foreground">
                ({data.stocks.length})
              </Text>
            </View>
            {data.stocks.length === 0 ? (
              <View className="px-6 py-12 items-center">
                <Text className="text-sm text-muted-foreground">
                  No stock found at this branch
                </Text>
              </View>
            ) : (
              data.stocks.map((stock) => (
                <StockRow key={stock.id} stock={stock} />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  )
}
