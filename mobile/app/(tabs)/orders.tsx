import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useCartStore } from "../../lib/store/cart";
import { useAuthStore } from "../../lib/store/auth";
import PaymentModal from "../../components/PaymentModal";
import { useUI } from "../../hooks/useUI";
import { Colors, BrandColors } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import client from "../../src/api/client";

type Address = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

type RestaurantMeta = { modes: string[] };

export default function OrdersScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const clearCart = useCartStore((s) => s.clearCart);
  const token = useAuthStore((s) => s.token);
  const { t, formatMoney, theme, toggleLang, toggleTheme, lang } = useUI();
  const palette = Colors[theme as keyof typeof Colors];

  const [addr, setAddr] = useState<Address>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });
  const PH = "#64748b";
  const onChange = (k: keyof Address) => (v: string) => setAddr((s) => ({ ...s, [k]: v }));

  const [deliveryMode, setDeliveryMode] = useState<"driver" | "drone">("driver");
  const [allowedModes, setAllowedModes] = useState<("driver" | "drone")[]>(["driver", "drone"]);
  const [restaurantMeta, setRestaurantMeta] = useState<Record<string, RestaurantMeta>>({});

  const [promoCode, setPromoCode] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);

  const subTotal = total();
  const delivery = useMemo(() => {
    if (!items.length) return 0;
    const mode = allowedModes.includes(deliveryMode) ? deliveryMode : allowedModes[0] || "driver";
    return mode === "drone" ? 40000 : 20000;
  }, [items.length, deliveryMode, allowedModes]);

  const grandTotal = useMemo(() => Math.max(subTotal + delivery - discount, 0), [subTotal, delivery, discount]);

  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    client
      .get("/api/restaurant/list")
      .then((res) => {
        const map: Record<string, RestaurantMeta> = {};
        (res.data?.data || []).forEach((r: any) => {
          const modes = Array.isArray(r?.deliveryModes) && r.deliveryModes.length ? r.deliveryModes : ["driver"];
          map[r?._id] = { modes };
        });
        setRestaurantMeta(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Tính tập giao chung giữa các nhà hàng trong giỏ
    const restIds = items.map((i) => i.restaurantId).filter(Boolean) as string[];
    if (!restIds.length) {
      setAllowedModes(["driver", "drone"]);
      return;
    }
    const firstModes =
      restaurantMeta[restIds[0]]?.modes ||
      items.find((i) => i.restaurantId === restIds[0])?.deliveryModes ||
      ["driver"];
    let intersection = new Set(firstModes as string[]);
    restIds.slice(1).forEach((id) => {
      const modes =
        restaurantMeta[id]?.modes || items.find((i) => i.restaurantId === id)?.deliveryModes || ["driver"];
      intersection = new Set([...intersection].filter((m) => modes.includes(m)));
    });
    let result = Array.from(intersection) as ("driver" | "drone")[];
    if (!result.length) {
      result = firstModes as ("driver" | "drone")[];
    }
    setAllowedModes(result);
    if (!result.includes(deliveryMode)) {
      setDeliveryMode(result[0] || "driver");
    }
  }, [items, restaurantMeta, deliveryMode]);

  const proceed = async () => {
    if (!items.length) {
      Alert.alert(t("emptyCart"), "");
      return;
    }
    if (!token) {
      Alert.alert(t("signInRequired"), t("signInToContinue"), [
        {
          text: t("signIn"),
          onPress: () =>
            router.push({
              pathname: "/auth/login",
              params: { returnTo: "/(tabs)/orders" },
            }),
        },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }

    if (!addr.firstName || !addr.lastName || !addr.email || !addr.street || !addr.city || !addr.country) {
      Alert.alert(t("missingInfo") || "Missing Info", t("fillRequired") || "Please fill in all required fields.");
      return;
    }

    setShowPayment(true);
  };

  const applyPromo = () => {
    const code = promoCode.trim();
    if (!code) return;
    client
      .post("/api/promo/apply", {
        code,
        subTotal,
        restaurantId: items[0]?.restaurantId,
        lang,
      })
      .then((res) => {
        if (res.data?.success) {
          const discountValue = Number(res.data.discount || 0);
          setDiscount(discountValue);
          Alert.alert(t("discount") || "Discount", `${formatMoney(discountValue)} - ${code.toUpperCase()}`);
        } else {
          setDiscount(0);
          Alert.alert(t("promoCode") || "Promo Code", res.data?.message || "Invalid code");
        }
      })
      .catch((err) => {
        setDiscount(0);
        Alert.alert(t("promoCode") || "Promo Code", err?.response?.data?.message || err.message || "Invalid code");
      });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={[s.title, { color: palette.text }]}>{t("paymentTab")}</Text>
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

          <Text style={[s.sectionTitle, { color: palette.text }]}>{t("addressTitle")}</Text>

          <View style={s.row}>
            <TextInput
              style={[s.input, s.col, { backgroundColor: palette.card, color: palette.text, borderColor: palette.border }]}
              placeholder={t("firstName") || "First Name"}
              placeholderTextColor={PH}
              value={addr.firstName}
              onChangeText={onChange("firstName")}
            />
            <TextInput
              style={[s.input, s.col, { backgroundColor: palette.card, color: palette.text, borderColor: palette.border }]}
              placeholder={t("lastName") || "Last Name"}
              placeholderTextColor={PH}
              value={addr.lastName}
              onChangeText={onChange("lastName")}
            />
          </View>

          <TextInput
            style={[s.input, { backgroundColor: palette.card, color: palette.text, borderColor: palette.border }]}
            placeholder={t("email") || "Email"}
            keyboardType="email-address"
            autoCapitalize="none"
            value={addr.email}
            onChangeText={onChange("email")}
            placeholderTextColor={PH}
          />

          <TextInput
            style={[s.input, { backgroundColor: palette.card, color: palette.text, borderColor: palette.border }]}
            placeholder={t("street") || "Street"}
            value={addr.street}
            onChangeText={onChange("street")}
            placeholderTextColor={PH}
          />

          <View style={s.row}>
            <TextInput
              style={[s.input, s.col, { backgroundColor: palette.card, color: palette.text, borderColor: palette.border }]}
              placeholder={t("city")}
              placeholderTextColor={PH}
              value={addr.city}
              onChangeText={onChange("city")}
            />
            <TextInput
              style={[s.input, s.col, { backgroundColor: palette.card, color: palette.text, borderColor: palette.border }]}
              placeholder={t("state") || "State"}
              placeholderTextColor={PH}
              value={addr.state}
              onChangeText={onChange("state")}
            />
          </View>

          <View style={s.row}>
            <TextInput
              style={[s.input, s.col, { backgroundColor: palette.card, color: palette.text, borderColor: palette.border }]}
              placeholder={t("zip") || "Zip code"}
              keyboardType="number-pad"
              value={addr.zip}
              onChangeText={onChange("zip")}
              placeholderTextColor={PH}
            />
            <TextInput
              style={[s.input, s.col, { backgroundColor: palette.card, color: palette.text, borderColor: palette.border }]}
              placeholder={t("country") || "Country"}
              value={addr.country}
              onChangeText={onChange("country")}
              placeholderTextColor={PH}
            />
          </View>

          <TextInput
            style={[s.input, { backgroundColor: palette.card, color: palette.text, borderColor: palette.border }]}
            placeholder={t("phone") || "Phone"}
            keyboardType="phone-pad"
            value={addr.phone}
            onChangeText={onChange("phone")}
            placeholderTextColor={PH}
          />

          <Text style={[s.sectionTitle, { color: palette.text, marginTop: 4 }]}>{t("deliveryMethod")}</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            {(["driver", "drone"] as const).map((mode) => {
              const available = allowedModes.includes(mode);
              const active = deliveryMode === mode && available;
              return (
                <TouchableOpacity
                  key={mode}
                  disabled={!available}
                  onPress={() => available && setDeliveryMode(mode)}
                  style={[
                    s.toggle,
                    {
                      backgroundColor: active ? BrandColors.primary : palette.pill,
                      borderColor: active ? BrandColors.primary : palette.border,
                      opacity: available ? 1 : 0.4,
                    },
                  ]}
                >
                  <Ionicons
                    name={mode === "drone" ? "airplane-outline" : "car-outline"}
                    size={16}
                    color={active ? "#fff" : palette.text}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ color: active ? "#fff" : palette.text, fontWeight: "700" }}>
                    {t(mode) || mode}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[s.sectionTitle, { color: palette.text, marginTop: 4 }]}>{t("promoCode")}</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
            <TextInput
              style={[
                s.input,
                s.col,
                s.promoInput,
                { backgroundColor: palette.card, color: palette.text, borderColor: palette.border },
              ]}
              placeholder="WELCOME10"
              placeholderTextColor={PH}
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              onPress={applyPromo}
              style={[s.applyBtn, { borderColor: palette.border, backgroundColor: palette.pill }]}
            >
              <Text style={{ color: palette.text, fontWeight: "700" }}>{t("apply") || "Apply"}</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.summary, { backgroundColor: palette.card, borderColor: palette.border }]}> 
            <Text style={[s.sumTitle, { color: palette.text }]}>{t("cart")}</Text>

            <View style={s.sumRow}>
              <Text style={[s.sumLabel, { color: palette.textSecondary }]}>{t("subtotal")}</Text>
              <Text style={[s.sumValue, { color: palette.text }]}>{formatMoney(subTotal)}</Text>
            </View>

            <View style={s.sumRow}>
              <Text style={[s.sumLabel, { color: palette.textSecondary }]}>{t("deliveryFee")}</Text>
              <Text style={[s.sumValue, { color: palette.text }]}>{formatMoney(delivery)}</Text>
            </View>

            {discount > 0 && (
              <View style={s.sumRow}>
                <Text style={[s.sumLabel, { color: palette.textSecondary }]}>{t("discount") || "Discount"}</Text>
                <Text style={[s.sumValue, { color: "#ef4444" }]}>- {formatMoney(discount)}</Text>
              </View>
            )}

            <View style={s.separator} />

            <View style={[s.sumRow, { marginTop: 6 }]}>
              <Text style={[s.totalLabel, { color: BrandColors.primaryStrong }]}>{t("total")}</Text>
              <Text style={[s.totalValue, { color: BrandColors.primaryStrong }]}>{formatMoney(grandTotal)}</Text>
            </View>

            <TouchableOpacity
              onPress={proceed}
              disabled={!items.length}
              style={[s.payBtn, { backgroundColor: BrandColors.primary }, !items.length && { opacity: 0.5 }]}
            >
              <Text style={s.payBtnText}>{t("checkout")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <PaymentModal
        visible={showPayment}
        onClose={() => setShowPayment(false)}
        draft={{
          address: addr,
          items: items.map((i) => ({
            name: i.name,
            nameEn: (i as any)?.nameEn,
            price: i.price,
            quantity: i.quantity,
            restaurantId: (i as any)?.restaurantId,
            deliveryModes: (i as any)?.deliveryModes,
          })),
          amount: grandTotal,
          deliveryType: deliveryMode,
        }}
        onSuccess={() => {
          clearCart();
          setPromoCode("");
          setDiscount(0);
          router.push("/(tabs)/myorders");
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "900" },
  sectionTitle: { fontSize: 18, fontWeight: "900", marginBottom: 8 },

  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },

  summary: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  sumTitle: { fontSize: 18, fontWeight: "900", marginBottom: 8 },
  sumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  sumLabel: { fontStyle: "italic" },
  sumValue: { fontWeight: "800", fontStyle: "italic" },
  separator: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 8 },

  totalLabel: { fontSize: 16, fontWeight: "900" },
  totalValue: { fontSize: 16, fontWeight: "900" },

  payBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
    height: 50,
    justifyContent: "center",
  },
  payBtnText: { color: "#fff", fontWeight: "900" },

  toggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  applyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  promoInput: {
    height: 50,
  },
});
