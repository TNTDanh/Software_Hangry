import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore, type Item as CartItem } from "../../lib/store/cart";
import { useAuthStore } from "../../lib/store/auth";
import { resolveImageSource } from "../../src/until/image";
import { useUI } from "../../hooks/useUI";
import { Colors, BrandColors } from "../../constants/theme";

export default function CartScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const inc = useCartStore((s) => s.inc);
  const dec = useCartStore((s) => s.dec);
  const remove = useCartStore((s) => s.remove);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore((s) => s.total);
  const token = useAuthStore((s) => s.token);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const { t, formatMoney, theme, toggleLang, toggleTheme, lang } = useUI();
  const palette = Colors[theme as keyof typeof Colors];

  const placeOrder = async () => {
    if (!token) {
      Alert.alert(t("signInRequired"), t("signInToContinue"), [
        {
          text: t("signIn"),
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

    if (!items.length) {
      Alert.alert(t("emptyCart"), "");
      return;
    }

    // Giữ giỏ; thanh toán sẽ xử lý thành công rồi mới clear
    router.push("/(tabs)/orders");
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const src = resolveImageSource(item.image);
    const displaySrc = failed[item._id]
      ? require("../../assets/images/food_item_2.png")
      : (src as any);

    return (
      <View style={[s.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        {src ? (
          <Image
            source={displaySrc}
            style={s.img}
            resizeMode="cover"
            onError={() => setFailed((prev) => ({ ...prev, [item._id]: true }))}
          />
        ) : (
          <View style={[s.img, { backgroundColor: palette.pill }]} />
        )}

        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={[s.name, { color: palette.text }]} numberOfLines={1}>
            {item.name}
          </Text>

          <Text style={[s.price, { color: BrandColors.primary }]}>{formatMoney(Number(item.price))}</Text>

          <View style={s.row}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => {
                  if (item.quantity === 1) {
                    Alert.alert(t("clearCart"), t("clearCart"), [
                      { text: "Cancel", style: "cancel" },
                      { text: t("remove"), onPress: () => remove(item._id) },
                    ]);
                  } else {
                    dec(item._id);
                  }
                }}
                style={[s.qtyBtn, { borderColor: palette.border }]}
              >
                <Text style={[s.qtyText, { color: palette.text }]}>-</Text>
              </TouchableOpacity>

              <Text style={[s.qtyValue, { color: palette.text }]}>{item.quantity}</Text>

              <TouchableOpacity onPress={() => inc(item._id)} style={[s.qtyBtn, { borderColor: palette.border }]}>
                <Text style={[s.qtyText, { color: palette.text }]}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() =>
                Alert.alert(t("clearCart"), t("clearCart"), [
                  { text: "Cancel", style: "cancel" },
                  { text: t("remove"), onPress: () => remove(item._id) },
                ])
              }
              style={s.removeBtn}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const subTotal = total();
  const delivery = items.length ? 20000 : 0;
  const grandTotal = subTotal + delivery;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={[s.title, { color: palette.text }]}>{t("cartTitle")}</Text>
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
      </View>

      <FlatList<CartItem>
        data={items}
        keyExtractor={(it) => it._id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ color: palette.textSecondary, marginTop: 8 }}>
              {t("emptyCart")}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <View style={[s.summary, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={s.sumRow}>
          <Text style={[s.sumLabel, { color: palette.textSecondary }]}>{t("subtotal")}</Text>
          <Text style={[s.sumValue, { color: palette.text }]}>{formatMoney(subTotal)}</Text>
        </View>

        <View style={s.sumRow}>
          <Text style={[s.sumLabel, { color: palette.textSecondary }]}>{t("deliveryFee")}</Text>
          <Text style={[s.sumValue, { color: palette.text }]}>{formatMoney(delivery)}</Text>
        </View>

        <View style={[s.sumRow, { marginTop: 6 }]}>
          <Text style={[s.totalLabel, { color: BrandColors.primaryStrong }]}>{t("total")}</Text>
          <Text style={[s.totalValue, { color: BrandColors.primaryStrong }]}>{formatMoney(grandTotal)}</Text>
        </View>

        <View style={{ rowGap: 10, marginTop: 12 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push("/")}
              style={[
                s.shopBtnText,
                { backgroundColor: palette.pill, borderColor: palette.border },
              ]}
            >
              <Text style={[s.secondaryBtnText, { color: palette.text }]}>{t("orderMore")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(t("clearCart"), t("clearCart"), [
                  { text: "Cancel", style: "cancel" },
                  { text: t("clearCart"), onPress: () => clearCart() },
                ]);
              }}
              disabled={!items.length}
              style={[
                s.clearBtnText,
                { backgroundColor: palette.pill, borderColor: palette.border },
                !items.length && { opacity: 0.5 },
              ]}
            >
              <Text style={[s.secondaryBtnText, { color: palette.text }]}>{t("clearCart")}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={placeOrder}
            disabled={!items.length}
            style={[s.primaryBtn, s.blockBtn, !items.length && { opacity: 0.5 }]}
          >
            <Text style={s.primaryBtnText}>{t("checkout")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "900", marginBottom: 8 },
  empty: { alignItems: "center", marginTop: 40 },

  card: {
    flexDirection: "row",
    padding: 10,
    borderRadius: 16,
    marginVertical: 6,
    borderWidth: 1,
  },
  img: { width: 86, height: 86, borderRadius: 12 },
  name: { fontWeight: "900", fontSize: 16 },
  price: { marginTop: 4, fontStyle: "italic" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  qtyBtn: {
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 28,
  },
  qtyText: { fontWeight: "900" },
  qtyValue: { minWidth: 24, textAlign: "center" },

  removeBtn: { paddingHorizontal: 8, paddingVertical: 6 },

  summary: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  sumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  sumLabel: { fontStyle: "italic" },
  sumValue: { fontWeight: "800", fontStyle: "italic" },
  totalLabel: { fontSize: 16, fontWeight: "900" },
  totalValue: { fontSize: 16, fontWeight: "900" },

  primaryBtn: {
    flex: 1,
    backgroundColor: BrandColors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  shopBtnText: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  clearBtnText: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  secondaryBtnText: { fontStyle: "italic", fontWeight: "900" },
  blockBtn: { flex: undefined, width: "100%" },
});
