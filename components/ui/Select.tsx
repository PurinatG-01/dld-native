import { useState, useCallback } from "react";
import { View, Text, Pressable, Modal, FlatList } from "react-native";
import { ChevronDown, Check, X } from "lucide-react-native";
import { useColor } from "@/lib/useColor";

export type SelectOption = { id: string; name: string };

type Props = {
  label: string;
  placeholder: string;
  value: string | null;
  options: SelectOption[];
  onChange: (id: string) => void;
  disabled?: boolean;
};

export function Select({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value) ?? null;

  const handlePick = useCallback(
    (id: string) => {
      onChange(id);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <View>
      <Text className="text-xs font-semibold text-muted-foreground mb-1.5">
        {label}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        className={`flex-row items-center border border-border rounded-lg bg-card px-3 py-3 active:opacity-70 ${
          disabled ? "opacity-40" : ""
        }`}
      >
        <Text
          className={`flex-1 text-sm ${
            selected ? "text-card-foreground" : "text-muted-foreground"
          }`}
          numberOfLines={1}
        >
          {selected ? selected.name : placeholder}
        </Text>
        <ChevronDown size={16} color={useColor("muted-foreground")} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="bg-card rounded-t-2xl max-h-[70%] pt-2 pb-8"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between px-5 py-3 border-b border-border">
              <Text className="text-base font-bold text-card-foreground">
                {label}
              </Text>
              <Pressable
                onPress={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-muted items-center justify-center active:opacity-70"
              >
                <X size={16} color={useColor("muted-foreground")} />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(o) => o.id}
              ListEmptyComponent={
                <Text className="text-sm text-muted-foreground text-center py-8">
                  No options available
                </Text>
              }
              renderItem={({ item }) => {
                const active = item.id === value;
                return (
                  <Pressable
                    onPress={() => handlePick(item.id)}
                    className="flex-row items-center px-5 py-4 border-b border-border active:bg-muted/50"
                  >
                    <Text
                      className={`flex-1 text-sm ${
                        active
                          ? "font-semibold text-primary"
                          : "text-card-foreground"
                      }`}
                    >
                      {item.name}
                    </Text>
                    {active ? (
                      <Check size={16} color={useColor("primary")} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
