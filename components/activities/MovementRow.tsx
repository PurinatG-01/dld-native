import { memo, useCallback, useEffect, useState } from "react"
import { View, Text, Pressable } from "react-native"
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated"
import { MessageCircleWarning, ChevronDown } from "lucide-react-native"
import { getColor } from "@/lib/color"
import { ACTION_META, formatMovementDate } from "./constants"
import type { MovementRowProps, StockMovementLine } from "./types"

function LineRow({ line }: { line: StockMovementLine }) {
  return (
    <View className="flex-row items-start px-4 py-2.5 border-t border-border">
      <View className="flex-1 pr-3">
        <Text className="text-sm text-card-foreground" numberOfLines={1}>
          {line.item_name ?? "Unknown item"}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          {line.lot_number ? `Lot ${line.lot_number}` : "No lot"}
          {line.location_name ? ` · ${line.location_name}` : ""}
        </Text>
      </View>
      <Text className="text-sm font-semibold text-card-foreground">
        {line.quantity}
        {line.unit_of_measure ? (
          <Text className="text-xs font-normal text-muted-foreground">
            {" "}
            {line.unit_of_measure}
          </Text>
        ) : null}
      </Text>
    </View>
  )
}

export const MovementRow = memo(function MovementRow({
  movement,
}: MovementRowProps) {
  const [expanded, setExpanded] = useState(false)
  const rotation = useSharedValue(0)

  const meta = ACTION_META[movement.action_type]
  const Icon = meta?.icon ?? MessageCircleWarning

  useEffect(() => {
    rotation.value = withTiming(expanded ? 1 : 0, { duration: 180 })
  }, [expanded])

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }))

  const toggle = useCallback(() => setExpanded((e) => !e), [])

  return (
    <View className="border-b border-border bg-card">
      <Pressable
        onPress={toggle}
        className="flex-row items-center px-4 py-3 bg-card active:bg-muted/50"
      >
        <View
          className={`w-9 h-9 rounded-xl items-center justify-center ${
            meta?.bg ?? "bg-muted"
          }`}
        >
          <Icon
            size={18}
            color={getColor(meta?.iconColorToken ?? "muted-foreground")}
          />
        </View>
        <View className="flex-1 ml-3">
          <Text
            className="text-sm font-medium text-card-foreground"
            numberOfLines={1}
          >
            {meta?.label ?? movement.action_type}
          </Text>
          <Text
            className="text-xs text-muted-foreground mt-0.5"
            numberOfLines={1}
          >
            {formatMovementDate(movement.created_at)}
            {movement.actor_name ? ` · ${movement.actor_name}` : ""}
          </Text>
        </View>
        <Text className="text-xs text-muted-foreground mr-2">
          {movement.item_count} {movement.item_count === 1 ? "item" : "items"}
        </Text>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={18} color={getColor("muted-foreground")} />
        </Animated.View>
      </Pressable>

      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(120)}
          className="bg-background"
        >
          {movement.items.length > 0 ? (
            movement.items.map((line) => <LineRow key={line.id} line={line} />)
          ) : (
            <Text className="px-4 py-3 text-xs text-muted-foreground border-t border-border">
              No item lines
            </Text>
          )}
          {movement.note ? (
            <Text className="px-4 py-2.5 text-xs text-muted-foreground border-t border-border italic">
              {movement.note}
            </Text>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  )
})
