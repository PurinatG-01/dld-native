import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Search, X } from "lucide-react-native";
import { getColor } from "@/lib/color";
import { listItems, type InventoryItem } from "@/lib/services/inventory";

const SEARCH_DEBOUNCE_MS = 500;

type Selected = { id: string; name: string; unit_of_measure: string };

type Props = {
  value: Selected | null;
  onSelect: (item: Selected) => void;
  onClear: () => void;
};

export function ItemSearchField({ value, onSelect, onClear }: Props) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    if (value || query.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    listItems({ search: query, limit: 8 })
      .then((res) => {
        if (!cancelled) setResults(res.data);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, value]);

  const handlePick = useCallback(
    (item: InventoryItem) => {
      onSelect({
        id: item.id,
        name: item.name,
        unit_of_measure: item.unit_of_measure,
      });
      setInput("");
      setQuery("");
      setResults([]);
    },
    [onSelect]
  );

  if (value) {
    return (
      <View>
        <Text className="text-xs font-semibold text-muted-foreground mb-1.5">
          Item
        </Text>
        <View className="flex-row items-center border border-border rounded-lg bg-card px-3 py-3">
          <View className="flex-1">
            <Text
              className="text-sm font-medium text-card-foreground"
              numberOfLines={1}
            >
              {value.name}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              {value.unit_of_measure}
            </Text>
          </View>
          <Pressable
            onPress={onClear}
            className="w-7 h-7 rounded-full bg-muted items-center justify-center active:opacity-70"
          >
            <X size={14} color={getColor("muted-foreground")} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text className="text-xs font-semibold text-muted-foreground mb-1.5">
        Item
      </Text>
      <View className="flex-row items-center border border-border rounded-lg bg-background px-3">
        <Search size={16} color={getColor("muted-foreground")} />
        <TextInput
          className="flex-1 ml-2 text-sm text-foreground py-3"
          placeholder="Search items…"
          placeholderTextColor={getColor("placeholder")}
          value={input}
          onChangeText={setInput}
          autoFocus
        />
        {loading ? (
          <ActivityIndicator size="small" color={getColor("primary")} />
        ) : null}
      </View>

      {results.length > 0 ? (
        <View className="border border-border border-t-0 rounded-b-lg bg-card overflow-hidden">
          {results.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handlePick(item)}
              className="px-3 py-3 border-b border-border active:bg-muted/50"
            >
              <Text className="text-sm text-card-foreground" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                {item.category} · {item.unit_of_measure}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {query.length >= 2 && !loading && results.length === 0 ? (
        <Text className="text-xs text-muted-foreground mt-2 px-1">
          No items match “{query}”.
        </Text>
      ) : null}
    </View>
  );
}
