import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import client from "../../src/api/client";
import CategoryChips from "../../components/CategoryChips";
import FoodCardGrid from "../../components/FoodCardGrid";
import { CATEGORIES } from "../../constants/categories";
import HeaderHero from "../../components/HeaderHero";

export default function HomeScreen() {
  const [foods, setFoods] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [cat, setCat] = useState<string>("All");  // dùng string, không null
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const res = await client.get("/api/food/list");
      const list = res.data?.data ?? [];
      setFoods(list);
      // áp dụng filter hiện tại
      setFiltered(cat === "All" ? list : list.filter((f: any) => (f?.category || "").toLowerCase() === cat.toLowerCase()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFoods(); }, []);

  const onSelectCategory = (key: string) => {
    setCat(key);
    if (key === "All") setFiltered(foods);
    else setFiltered(foods.filter((f) => (f?.category || "").toLowerCase() === key.toLowerCase()));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFoods();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ marginBottom: 16 }}><HeaderHero /></View>
      <Text style={{ textAlign: "center",fontSize: 22, fontWeight: "900" }}>Top Dishes You Might Like</Text>

      <CategoryChips
        categories={CATEGORIES}
        selected={cat}
        onSelect={onSelectCategory}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 12 }} />
      ) : (
        <View style={{ marginTop: 12 }}>
          <FoodCardGrid data={filtered} />
        </View>
      )}
    </ScrollView>
  );
}
