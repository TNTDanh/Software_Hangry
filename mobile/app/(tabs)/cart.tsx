import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import client from "../../src/api/client";
import { useCartStore, type Item as CartItem } from "../../lib/store/cart";
import { useAuthStore } from "../../lib/store/auth";
import { resolveImageSource } from "../../src/until/image";

export default function CartScreen() {
  const router = useRouter();

  // Lấy selector riêng để tránh loop render
  const items = useCartStore((s) => s.items);
  const inc = useCartStore((s) => s.inc);
  const dec = useCartStore((s) => s.dec);
  const remove = useCartStore((s) => s.remove);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore((s) => s.total);

  const token = useAuthStore((s) => s.token);

  // Track images that failed to load per item id
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  const placeOrder = async () => {
    if (!token) {
      Alert.alert("Sign in required", "Please sign in to place your order.", [
        {
          text: "Sign in",
          onPress: () =>
            router.push({
              pathname: "/auth/login",
              params: { returnTo: "/(tabs)/cart" },
            }),
        },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }

    try {
      const payload = {
        items: items.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        amount: total(),
        address: {},
      };

      const res = await client.post("/api/order/place", payload);

      if (res.data?.success) {
        clearCart();
        router.push("/(tabs)/orders");
      } else {
        throw new Error(res.data?.message || "Unknown error");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || e.message);
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const src = resolveImageSource(item.image);
    const displaySrc =
      failed[item._id]
        ? require("../../assets/images/food_item_2.png")
        : (src as any);

    return (
      <View style={s.card}>
        {src ? (
          <Image
            source={displaySrc}
            style={s.img}
            resizeMode="cover"
            // If image fails, switch to banner fallback
            onError={() =>
              setFailed((prev) => ({ ...prev, [item._id]: true }))
            }
          />
        ) : (
          <View style={[s.img, { backgroundColor: "#f3f3f3" }]} />
        )}

        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={s.name} numberOfLines={1}>
            {item.name}
          </Text>

          <Text style={s.price}>${Number(item.price).toLocaleString()}</Text>

          <View style={s.row}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => {
                  if (item.quantity === 1) {
                    Alert.alert(
                      "Confirm Removal",
                      "Remove this item from the cart?",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Remove", onPress: () => remove(item._id) },
                      ]
                    );
                  } else {
                    dec(item._id);
                  }
                }}
                style={s.qtyBtn}
              >
                <Text style={s.qtyText}>-</Text>
              </TouchableOpacity>

              <Text style={s.qtyValue}>{item.quantity}</Text>

              <TouchableOpacity onPress={() => inc(item._id)} style={s.qtyBtn}>
                <Text style={s.qtyText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() =>
                Alert.alert("Remove Item", "Are you sure?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Remove", onPress: () => remove(item._id) },
                ])
              }
              style={s.removeBtn}
            >
              <Text style={s.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const subTotal = total();
  const delivery = items.length ? 2 : 0; // phí ship
  const grandTotal = subTotal + delivery;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={s.title}>My Cart</Text>

      <FlatList<CartItem>
        data={items}
        keyExtractor={(it) => it._id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ color: "#666", marginTop: 8 }}>
              Your cart is empty.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <View style={s.summary}>
        <View style={s.sumRow}>
          <Text style={s.sumLabel}>Subtotal</Text>
          <Text style={s.sumValue}>${subTotal.toLocaleString()}</Text>
        </View>

        <View style={s.sumRow}>
          <Text style={s.sumLabel}>Delivery</Text>
          <Text style={s.sumValue}>${delivery.toLocaleString()}</Text>
        </View>

        <View style={[s.sumRow, { marginTop: 6 }]}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValue}>${grandTotal.toLocaleString()}</Text>
        </View>

        <View style={{ rowGap: 10, marginTop: 12 }}>
          {/* Row 1: Continue + Clear */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push("/")}
              style={s.shopBtnText}
            >
              <Text style={s.secondaryBtnText}>Order More</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Confirm Clear Cart",
                  "Delete all items in your cart?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Clear", onPress: () => clearCart() },
                  ],
                  { cancelable: false }
                );
              }}
              disabled={!items.length}
              style={[s.clearBtnText, !items.length && { opacity: 0.5 }]}
            >
              <Text style={s.secondaryBtnText}>Clear Cart</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Place Order (full width) */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/orders")}
            disabled={!items.length}
            style={[s.primaryBtn, s.blockBtn, !items.length && { opacity: 0.5 }]}
          >
            <Text style={s.primaryBtnText}>PLACE ORDER</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "900", marginBottom: 8 },
  empty: { alignItems: "center", marginTop: 40 },

  card: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#eee",
  },
  img: { width: 86, height: 86, borderRadius: 12 },
  name: { fontWeight: "900", fontSize: 16 },
  price: { color: "#666", marginTop: 4, fontStyle: "italic" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  qtyBtn: {
    borderWidth: 1.2,
    borderColor: "#f75f00ff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 28,
  },
  qtyText: { fontWeight: "900" },
  qtyValue: { minWidth: 24, textAlign: "center" },

  removeBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  removeText: { color: "#ef4444", fontWeight: "700", fontStyle: "italic" },

  summary: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
    marginTop: 8,
  },
  sumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  sumLabel: { color: "#666", fontStyle: "italic" },
  sumValue: { fontWeight: "800", fontStyle: "italic" },
  totalLabel: { color: "#e90303ff", fontSize: 16, fontWeight: "900" },
  totalValue: { color: "#e90303ff", fontSize: 16, fontWeight: "900" },

  primaryBtn: {
    flex: 1,
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  shopBtnText: {
    flex: 1,
    backgroundColor: "#f4ddda79",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#111",
  },
  clearBtnText: {
    flex: 1,
    backgroundColor: "#3837372e",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#111",
  },
  secondaryBtnText: { fontStyle: "italic", color: "#111", fontWeight: "900" },
  blockBtn: { flex: undefined, width: "100%" },
});
