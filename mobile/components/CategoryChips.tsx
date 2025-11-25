import { FlatList, TouchableOpacity, Text, View, StyleSheet } from "react-native";
import type { Category } from "../constants/categories";
import { useUI } from "../hooks/useUI";
import { BrandColors } from "../constants/theme";

export default function CategoryChips({ categories, selected, onSelect }: { categories: Category[]; selected: string; onSelect: (key: string) => void; }) {
  const { theme, t } = useUI();
  const isDark = theme === "dark";

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
                active
                  ? { backgroundColor: BrandColors.primary, borderColor: BrandColors.primary }
                  : {
                      backgroundColor: isDark ? "#252834" : BrandColors.mutedPill,
                      borderColor: isDark ? "#252834" : BrandColors.borderLight,
                    },
              ]}
            >
              <Text
                style={[
                  s.chipText,
                  { color: active ? "#fff" : isDark ? "#f8fafc" : "#111" },
                ]}
              >
                {item.key === "All" ? t("all") : item.label}
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
    shadowColor: "rgba(0,0,0,0.12)",
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  chipText: {
    fontFamily: "BeVietnamPro_600SemiBold",
  },
});
