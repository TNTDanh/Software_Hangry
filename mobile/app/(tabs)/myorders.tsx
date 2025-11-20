import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import client from "../../src/api/client";
import { useAuthStore } from "../../lib/store/auth";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  _id: string;
  items: OrderItem[];
  amount: number;
  status: string;
  date?: string;
  payment?: boolean;
};

export default function MyOrdersScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<FlatList<Order>>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await client.post("/api/order/userorders", {});
      const arr: Order[] = Array.isArray(res.data?.data) ? res.data.data : [];
      setOrders(arr);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || e.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchOrders();
  }, [token, fetchOrders]);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      fetchOrders();
    }, [token, fetchOrders])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const scrollToLatest = useCallback(() => {
    if (!orders.length) return;
    const lastIndex = orders.length - 1;
    listRef.current?.scrollToIndex({ index: lastIndex, animated: true, viewPosition: 1 });
    const id = orders[lastIndex]?._id;
    if (id) {
      setHighlightedId(id);
      setTimeout(() => setHighlightedId(null), 1200);
    }
  }, [orders]);

  const renderItem = ({ item }: { item: Order }) => {
    const items = Array.isArray(item.items) ? item.items : [];
    const summary = items
      .map((it) => `${it?.name ?? "Item"} x ${it?.quantity ?? 0}`)
      .join(", ");

    const status = (item.status || "").toLowerCase();
    let statusColor = "#f59e0b"; // Food Processing -> yellow
    if (status.includes("out for delivery")) statusColor = "#ef4444"; // red
    else if (status.includes("delivered")) statusColor = "#16a34a"; // green
    else if (status.includes("processing")) statusColor = "#f59e0b"; // yellow

    const isHi = item._id === highlightedId;
    return (
      <View style={[s.card, isHi && s.cardHighlight]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
          <Text style={{ fontWeight: "800" }}>{item.status || "Food Processing"}</Text>
        </View>

        <Text style={s.summary} numberOfLines={2}>
          {summary || "No items"}
        </Text>

        <View style={s.row}>
          <Text style={s.amount}>${Number(item.amount || 0).toLocaleString()}</Text>
          <Text style={s.itemsCount}>Items: {items.length}</Text>
        </View>
      </View>
    );
  };

  if (!token) {
    return (
      <View style={s.center}>
        <Text style={{ marginBottom: 10, color: "#555" }}>
          Sign in to view your orders.
        </Text>
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() =>
            router.push({ pathname: "/auth/login", params: { returnTo: "/(tabs)/myorders" } })
          }
        >
          <Text style={s.primaryBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={s.toolbar}>
        <Text style={s.title}>Orders</Text>
        <TouchableOpacity style={s.pill} onPress={scrollToLatest} accessibilityLabel="Go to recent order">
          <Text style={s.pillText}>Go to recent</Text>
        </TouchableOpacity>
      </View>

      <FlatList<Order>
        ref={listRef}
        data={orders}
        keyExtractor={(o) => o._id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={!loading ? (
          <View style={s.center}>
            <Text style={{ color: "#666" }}>You have no orders yet.</Text>
          </View>
        ) : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "900" },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 12,
  },
  cardHighlight: { borderColor: "#111" },
  summary: { color: "#444", marginTop: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  amount: { fontWeight: "900", color: "#111" },
  itemsCount: { color: "#666", fontStyle: "italic" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  primaryBtn: { backgroundColor: "#111", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
  pill: { backgroundColor: "#f4f4f5", borderWidth: 1, borderColor: "#d4d4d8", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999 },
  pillText: { fontWeight: "800" },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
});
