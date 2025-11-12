import { FlatList, TouchableOpacity, Text, View, StyleSheet } from "react-native";
import type { Category } from "../constants/categories";

export default function CategoryChips({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[];
  selected: string;                // key hiện đang chọn
  onSelect: (key: string) => void; // gọi khi bấm chip
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(c) => c.key}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
        renderItem={({ item }) => {
          const active = item.key === selected;
          return (
            <TouchableOpacity
              onPress={() => onSelect(item.key)}
              style={[
                s.chip,
                active ? s.chipActive : s.chipInactive,
              ]}
            >
              <Text style={[s.chipText, active ? s.chipTextActive : s.chipTextInactive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
  },
  chipInactive: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
  },
  chipActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  chipText: {
    fontWeight: "700",
  },
  chipTextInactive: {
    color: "#111",
  },
  chipTextActive: {
    color: "#fff",
  },
});
