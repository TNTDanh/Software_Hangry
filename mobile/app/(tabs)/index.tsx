import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import client, { FoodDto } from "../../src/api/client";
import CategoryChips from "../../components/CategoryChips";
import FoodCardGrid from "../../components/FoodCardGrid";
import { CATEGORIES } from "../../constants/categories";
import HeaderHero from "../../components/HeaderHero";
import { useUI } from "../../hooks/useUI";
import { Colors, BrandColors } from "../../constants/theme";

export default function HomeScreen() {
  const [foods, setFoods] = useState<FoodDto[]>([]);
  const [filtered, setFiltered] = useState<FoodDto[]>([]);
  const [cat, setCat] = useState<string>("All");
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<string>("all"); // value = localized name
  const [city, setCity] = useState<string>("all"); // value = cityId
  const [dropdown, setDropdown] = useState<null | "city" | "restaurant">(null);
  const [cityOptions, setCityOptions] = useState<{ label: string; value: string }[]>([{ label: "All", value: "all" }]);
  const [restaurantOptions, setRestaurantOptions] = useState<{ label: string; value: string }[]>([
    { label: "All", value: "all" },
  ]);
  const [cityMeta, setCityMeta] = useState<Record<string, { vi: string; en: string }>>({});
  const [restaurantMeta, setRestaurantMeta] = useState<
    { id: string; cityId?: string; vi: string; en: string; address?: string; addressEn?: string }[]
  >([]);
  const { t, translateCategory, theme, toggleLang, toggleTheme, lang } = useUI();
  const palette = Colors[theme as keyof typeof Colors];

  const restaurantMetaMap = useMemo(() => {
    const map: Record<string, (typeof restaurantMeta)[number]> = {};
    restaurantMeta.forEach((r) => {
      map[r.id] = r;
    });
    return map;
  }, [restaurantMeta]);

  const applyFilter = (list: FoodDto[], catKey: string, restKey: string, cityKey: string) => {
    let result = list;
    if (catKey !== "All") {
      result = result.filter((f) => (f?.category || "").toLowerCase() === catKey.toLowerCase());
    }
    if (restKey !== "all") {
      const meta = restaurantMetaMap[restKey];
      result = result.filter((f) => {
        const id = ((f as any)?.restaurantId || "").toString().trim();
        const rVi = (f?.restaurantName || "").trim().toLowerCase();
        const rEn = (f as any)?.restaurantNameEn ? String((f as any).restaurantNameEn).trim().toLowerCase() : "";
        if (meta) {
          const vi = meta.vi.toLowerCase();
          const en = meta.en.toLowerCase();
          return (id && id === restKey) || rVi === vi || rEn === en;
        }
        const key = restKey.toLowerCase();
        return (id && id === restKey) || rVi === key || rEn === key;
      });
    }
    if (cityKey !== "all") {
      result = result.filter((f) => {
        const id = ((f as any)?.cityId || "").toString().trim();
        return id === cityKey;
      });
    }
    return result;
  };

  const fetchFoods = async () => {
    setLoading(true);
    try {
      setError(null);
      const res = await client.get("/api/food/list");
      const list: FoodDto[] = res.data?.data ?? [];
      setFoods(list);
      setFiltered(applyFilter(list, cat, restaurant, city));
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Không tải được danh sách món.";
      setError(msg);
      Alert.alert("Lỗi", msg);
      setFoods([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchFoods();
      return () => {};
    }, [])
  );

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [cityRes, restRes] = await Promise.all([
          client.get("/api/city/list"),
          client.get("/api/restaurant/list", { params: { active: true } }),
        ]);
        const cities = cityRes.data?.data || [];
        const rests = restRes.data?.data || [];

        const cMeta: Record<string, { vi: string; en: string }> = {};
        cities.forEach((c: any) => {
          const nameVi = (c?.name || c?.code || c?._id || "").trim();
          const nameEn = (c?.nameEn || nameVi).trim();
          if (nameVi && c?._id) {
            cMeta[c._id] = { vi: nameVi, en: nameEn };
          }
        });
        setCityMeta(cMeta);
        setCityOptions([
          { label: t("all"), value: "all" },
          ...Object.keys(cMeta).map((id) => ({
            value: id,
            label: lang === "vi" ? cMeta[id].vi : cMeta[id].en,
          })),
        ]);

        const rList: { id: string; cityId?: string; vi: string; en: string; address?: string; addressEn?: string }[] = [];
        rests.forEach((r: any) => {
          const nameVi = (r?.name || r?.slug || r?._id || "").trim();
          const nameEn = (r?.nameEn || nameVi).trim();
          if (nameVi && r?._id) {
            rList.push({ id: r._id, cityId: r?.cityId, vi: nameVi, en: nameEn, address: r?.address, addressEn: r?.addressEn });
          }
        });
        setRestaurantMeta(rList);
      } catch (err: any) {
        // Nếu lỗi meta, bỏ qua để app vẫn chạy
      }
    };
    fetchMeta();
  }, [lang, t]);

  useEffect(() => {
    let opts: { label: string; value: string }[] = [{ label: t("all"), value: "all" }];
    const cId = city;
    if (city === "all") {
      opts = [
        { label: t("all"), value: "all" },
        ...restaurantMeta
          .slice(0, 4)
          .map((r) => ({ value: r.id, label: lang === "vi" ? r.vi : r.en })),
      ];
    } else {
      const names = restaurantMeta
        .filter((r) => r.cityId === cId)
        .map((r) => ({ value: r.id, label: lang === "vi" ? r.vi : r.en }));
      opts = [{ label: t("all"), value: "all" }, ...names];
    }
    setRestaurantOptions(opts);
  }, [city, restaurantMeta, lang, t]);

  const onSelectCategory = (key: string) => {
    setCat(key);
    setFiltered(applyFilter(foods, key, restaurant, city));
    setPage(1);
  };

  const onSelectRestaurant = (val: string) => {
    setRestaurant(val);
    setFiltered(applyFilter(foods, cat, val, city));
    setPage(1);
  };

  const onSelectCity = (val: string) => {
    setCity(val);
    setRestaurant("all");
    setFiltered(applyFilter(foods, cat, "all", val));
    setPage(1);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFoods();
    setRefreshing(false);
  };

  const displayFoods = useMemo(() => {
    return filtered.map((f) => {
      const meta = restaurantMetaMap[(f as any)?.restaurantId || ""];
      if (meta) {
        return {
          ...f,
          restaurantName: meta.vi,
          restaurantNameEn: meta.en,
          address: meta.address,
          addressEn: meta.addressEn,
        };
      }
      return f;
    });
  }, [filtered, restaurantMetaMap]);

  const PAGE_SIZE = 6;
  const totalPages = Math.max(1, Math.ceil(displayFoods.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const paginatedFoods = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return displayFoods.slice(start, start + PAGE_SIZE);
  }, [displayFoods, page]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.background }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        stickyHeaderIndices={[0]}
      >
        {/* Sticky header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, backgroundColor: palette.background }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontFamily: "BeVietnamPro_700Bold", fontSize: 20, color: palette.text }}>{t("home")}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <TouchableOpacity
                onPress={toggleLang}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: palette.border,
                  backgroundColor: palette.pill,
                }}
              >
                <Text style={{ fontFamily: "BeVietnamPro_600SemiBold", color: palette.text }}>{lang.toUpperCase()}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleTheme}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  borderWidth: 1,
                  borderColor: palette.border,
                  backgroundColor: palette.pill,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={theme === "dark" ? "moon" : "sunny"} size={20} color={BrandColors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ gap: 10, marginTop: 12 }}>
            <SelectBox
              label={t("city")}
              selectedLabel={city === "all" ? t("all") : cityOptions.find((o) => o.value === city)?.label || ""}
              open={dropdown === "city"}
              onToggle={() => setDropdown(dropdown === "city" ? null : "city")}
              options={cityOptions}
              onSelect={(opt) => {
                onSelectCity(opt);
                setDropdown(null);
              }}
              t={t}
              palette={palette}
            />
            <SelectBox
              label={t("restaurant")}
              selectedLabel={
                restaurant === "all" ? t("all") : restaurantOptions.find((o) => o.value === restaurant)?.label || ""
              }
              open={dropdown === "restaurant"}
              onToggle={() => setDropdown(dropdown === "restaurant" ? null : "restaurant")}
              options={restaurantOptions}
              onSelect={(opt) => {
                onSelectRestaurant(opt);
                setDropdown(null);
              }}
              t={t}
              palette={palette}
            />
            <CategoryChips
              categories={CATEGORIES.map((c) => ({ ...c, label: c.key === "All" ? t("all") : translateCategory(c.key) }))}
              selected={cat}
              onSelect={onSelectCategory}
            />
          </View>
          <View style={{ height: 1, backgroundColor: palette.border, marginTop: 10 }} />
        </View>

        <View style={{ paddingHorizontal: 12 }}>
          <HeaderHero />
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 18 }} />
        ) : filtered.length ? (
          <View style={{ marginTop: 14, paddingHorizontal: 16 }}>
            <FoodCardGrid data={paginatedFoods} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <TouchableOpacity
                disabled={page <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: palette.border,
                  backgroundColor: palette.card,
                  opacity: page <= 1 ? 0.5 : 1,
                }}
              >
                <Text style={{ color: palette.text }}>{t("previous") || "Previous"}</Text>
              </TouchableOpacity>
              <Text style={{ color: palette.textSecondary }}>
                {page} / {totalPages}
              </Text>
              <TouchableOpacity
                disabled={page >= totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: palette.border,
                  backgroundColor: palette.card,
                  opacity: page >= totalPages ? 0.5 : 1,
                }}
              >
                <Text style={{ color: palette.text }}>{t("next") || "Next"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 18, alignItems: "center" }}>
            <Text style={{ color: palette.textSecondary }}>{error || t("emptyOrders")}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SelectBox({
  label,
  selectedLabel,
  open,
  onToggle,
  options,
  onSelect,
  palette,
  t,
}: {
  label: string;
  selectedLabel: string;
  open: boolean;
  onToggle: () => void;
  options: { label: string; value: string }[];
  onSelect: (v: string) => void;
  palette: (typeof Colors)["light" | "dark"];
  t: (key: string) => string;
}) {
  return (
    <View>
      <TouchableOpacity
        onPress={onToggle}
        style={{
          borderWidth: 1,
          borderColor: palette.border,
          borderRadius: 10,
          paddingVertical: 10,
          paddingHorizontal: 12,
          backgroundColor: palette.card,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ fontFamily: "BeVietnamPro_700Bold", color: palette.text, marginBottom: 4 }}>{label}</Text>
          <Text style={{ color: palette.textSecondary }}>{selectedLabel}</Text>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={palette.text} />
      </TouchableOpacity>
      {open && (
        <View style={{ borderWidth: 1, borderColor: palette.border, borderRadius: 10, backgroundColor: palette.card, maxHeight: 220, marginTop: 6, overflow: "hidden" }}>
          <ScrollView>
            {options.map((opt) => {
              const active = opt.value === "all" ? selectedLabel === t("all") : opt.label === selectedLabel;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => onSelect(opt.value)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    backgroundColor: active ? BrandColors.primary : "transparent",
                  }}
                >
                  <Text style={{ color: active ? "#fff" : palette.text, fontFamily: "BeVietnamPro_600SemiBold" }}>
                    {opt.value === "all" ? t("all") : opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
