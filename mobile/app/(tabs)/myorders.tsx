import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import client from "../../src/api/client";
import { useAuthStore } from "../../lib/store/auth";
import { useUI } from "../../hooks/useUI";
import { Colors, BrandColors } from "../../constants/theme";

type OrderItem = {
  name: string;
  nameEn?: string;
  quantity: number;
  price: number;
  restaurantId?: string;
};

type SubOrder = {
  restaurantId?: string;
  items?: OrderItem[];
  deliveryFee?: number;
  deliveryType?: string;
  etaMinutes?: number;
};

type OrderApi = {
  _id: string;
  items: OrderItem[];
  amount: number;
  status: string;
  deliveryPhase?: "at_restaurant" | "delivering" | "delivered";
  droneId?: string;
  driverId?: string;
  date?: string;
  payment?: boolean;
  deliveryFee?: number;
  total?: number;
  subOrders?: SubOrder[];
  deliveryType?: string;
  statusTimeline?: { status?: string; at?: string }[];
};

type OrderEntry = {
  _id: string;
  items: OrderItem[];
  amount: number;
  status: string;
  deliveryPhase?: "at_restaurant" | "delivering" | "delivered";
  droneId?: string;
  driverId?: string;
  date?: string;
  payment?: boolean;
  restaurantId?: string;
  deliveryType?: string;
  restaurantName?: string;
  latestAt?: string;
  orderRef?: string;
};

export default function MyOrdersScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => (s as any).userId || null);
  const {
    t,
    formatMoney,
    translateStatus,
    theme,
    toggleLang,
    toggleTheme,
    lang,
  } = useUI();
  const palette = Colors[theme as keyof typeof Colors];

  const [orders, setOrders] = useState<OrderEntry[]>([]);
  const [restaurantNames, setRestaurantNames] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<FlatList<OrderEntry>>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [supportVisible, setSupportVisible] = useState(false);
  const [supportOrder, setSupportOrder] = useState<OrderEntry | null>(null);
  const [supportMsg, setSupportMsg] = useState("");

  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<OrderEntry | null>(null);
  const [ratingFood, setRatingFood] = useState("");
  const [ratingDriver, setRatingDriver] = useState("");
  const [comment, setComment] = useState("");
  const [reviewMap, setReviewMap] = useState<Record<string, number>>({});

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [orderRes, restRes, reviewRes] = await Promise.all([
        client.post("/api/order/userorders", {}),
        client.get("/api/restaurant/list", { params: { active: "all" } }),
        userId
          ? client.get("/api/review/list", { params: { userId } })
          : Promise.resolve({ data: { data: [] } }),
      ]);

      const restMap: Record<string, string> = {};
      (restRes.data?.data || []).forEach((r: any) => {
        if (r?._id)
          restMap[r._id] =
            lang === "vi"
              ? r.name || r.nameEn || r.slug || r._id
              : r.nameEn || r.name || r.slug || r._id;
      });
      setRestaurantNames(restMap);
      const reviews = Array.isArray(reviewRes.data?.data)
        ? reviewRes.data.data
        : [];
      const rMap: Record<string, number> = {};
      reviews.forEach((rv: any) => {
        const oid = rv?.orderId;
        const rid = rv?.restaurantId;
        if (!oid) return;
        const key = rid ? `${oid}_${rid}` : oid;
        const val =
          rv?.ratingAvg || rv?.rating || rv?.ratingFood || rv?.ratingDriver;
        // giữ review mới nhất (api trả desc)
        if (typeof val === "number" && typeof rMap[key] === "undefined") {
          rMap[key] = val;
        }
      });
      setReviewMap(rMap);

      const raw: OrderApi[] = Array.isArray(orderRes.data?.data)
        ? orderRes.data.data
        : [];
      const latestAt = (ord: OrderApi) => {
        const times = (ord.statusTimeline || []).map((s) =>
          new Date(s.at || ord.date || 0).getTime()
        );
        const fallback = ord.date ? new Date(ord.date).getTime() : 0;
        return new Date(Math.max(fallback, ...times)).toISOString();
      };

      const expanded: OrderEntry[] = raw.flatMap((ord) => {
        const subOrders: SubOrder[] = Array.isArray(ord?.subOrders)
          ? ord.subOrders
          : [];
        const ordLatest = latestAt(ord);

        if (subOrders.length > 1) {
          // Tách mỗi nhà hàng thành một dòng
          return subOrders.map((sub) => {
            const items = (sub.items || []).map((it: any) => ({
              name:
                lang === "vi"
                  ? it?.name || it?.nameEn || "Item"
                  : it?.nameEn || it?.name || "Item",
              quantity: Number(it?.quantity || 0),
              price: Number(it?.price || 0),
              restaurantId: it?.restaurantId,
            }));
            const subTotal = items.reduce(
              (s, it) => s + it.price * it.quantity,
              0
            );
            const deliveryFee = Number(sub.deliveryFee || 0);
            const restId = sub.restaurantId || items[0]?.restaurantId;
            const restNameFallback = restId ? restMap[restId] : undefined;
            return {
              _id: `${ord._id}-${sub.restaurantId || "sub"}`,
              orderRef: ord._id,
              items,
              amount: subTotal + deliveryFee,
              status: ord.status,
              deliveryPhase: ord.deliveryPhase,
              droneId: ord.droneId,
              driverId: ord.driverId,
              date: ord.date,
              payment: ord.payment,
              restaurantId: restId,
              restaurantName: restNameFallback,
              deliveryType: sub.deliveryType || ord.deliveryType,
              latestAt: ordLatest,
            };
          });
        }

        // Đơn một nhà hàng hoặc không có subOrders, giữ nguyên
        const items = (Array.isArray(ord.items) ? ord.items : []).map(
          (it: any) => ({
            name:
              lang === "vi"
                ? it?.name || it?.nameEn || "Item"
                : it?.nameEn || it?.name || "Item",
            quantity: Number(it?.quantity || 0),
            price: Number(it?.price || 0),
            restaurantId: it?.restaurantId,
          })
        );
        const subTotal = items.reduce(
          (s, it) => s + Number(it.price || 0) * Number(it.quantity || 0),
          0
        );
        const deliveryFee = Number(ord.deliveryFee || 0);
        const restId = subOrders?.[0]?.restaurantId || items[0]?.restaurantId;
        return [
          {
            _id: ord._id,
            orderRef: ord._id,
            items,
            amount: Number(ord.amount || ord.total || subTotal + deliveryFee),
            status: ord.status,
            deliveryPhase: ord.deliveryPhase,
            droneId: ord.droneId,
            driverId: ord.driverId,
            date: ord.date,
            payment: ord.payment,
            restaurantId: restId,
            restaurantName: restId ? restMap[restId] : undefined,
            deliveryType: subOrders?.[0]?.deliveryType || ord.deliveryType,
            latestAt: ordLatest,
          },
        ];
      });

      expanded.sort((a, b) => {
        const ta = a.latestAt ? new Date(a.latestAt).getTime() : 0;
        const tb = b.latestAt ? new Date(b.latestAt).getTime() : 0;
        return tb - ta;
      });

      setOrders(expanded);
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message || e?.message || "Failed to load orders"
      );
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

  useEffect(() => {
    if (token) return;
    setOrders([]);
  }, [token]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const scrollToLatest = useCallback(() => {
    if (!orders.length) return;
    const targetIndex = 0; // newest first after sort
    listRef.current?.scrollToIndex({
      index: targetIndex,
      animated: true,
      viewPosition: 0,
    });
    const id = orders[targetIndex]?._id;
    if (id) {
      setHighlightedId(id);
      setTimeout(() => setHighlightedId(null), 1200);
    }
  }, [orders]);

  const renderItem = ({ item }: { item: OrderEntry }) => {
    const items = Array.isArray(item.items) ? item.items : [];
    const summary = items
      .map((it) => `${it?.name ?? "Item"} x ${it?.quantity ?? 0}`)
      .join(", ");
    const restaurantLabel = item.restaurantId
      ? restaurantNames[item.restaurantId] || item.restaurantId
      : undefined;
    const deliveryLabel = item.deliveryType
      ? item.deliveryType === "drone"
        ? t("drone") || "Drone"
        : t("driver") || "Driver"
      : undefined;
    const paymentLabel = item.payment ? "Online" : "COD";
    const orderCode = item.orderRef || item._id;

    const statusFromPhase =
      item.deliveryPhase === "delivered"
        ? "Delivered"
        : item.deliveryPhase === "delivering"
        ? "Out For Delivery"
        : "Food Processing";
    const statusTextRaw = item.deliveryPhase
      ? statusFromPhase
      : item.status || "";
    const status = statusTextRaw.toLowerCase();
    let statusColor = "#f59e0b";
    if (status.includes("out for delivery")) statusColor = "#ef4444";
    else if (status.includes("delivered")) statusColor = "#16a34a";
    const isDelivered = status.includes("delivered");

    const statusText = translateStatus(statusTextRaw);
    const isHi = item._id === highlightedId;
    const ratingKey =
      (item.orderRef || item._id) && item.restaurantId
        ? `${item.orderRef || item._id}_${item.restaurantId}`
        : item.orderRef || item._id;
    const ratingVal = ratingKey ? reviewMap[ratingKey] : undefined;

    return (
      <View
        style={[
          s.card,
          { backgroundColor: palette.card, borderColor: palette.border },
          isHi && s.cardHighlight,
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View
            style={[
              s.codePill,
              { borderColor: palette.border, backgroundColor: palette.pill },
            ]}
          >
            <Text
              style={{ color: palette.text, fontWeight: "800", fontSize: 12 }}
            >
              {t("orderId") || "Order"}: #
              {(orderCode || "").toString().slice(-6)}
            </Text>
          </View>
          {deliveryLabel ? (
            <View
              style={[
                s.codePill,
                { borderColor: palette.border, backgroundColor: palette.pill },
              ]}
            >
              <Text
                style={{
                  color: palette.textSecondary,
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                {t("deliveryMethod") || "Delivery"}: {deliveryLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
          <Text
            style={{ fontFamily: "BeVietnamPro_700Bold", color: palette.text }}
          >
            {statusText}
          </Text>
        </View>

        <Text
          style={[s.summary, { color: palette.textSecondary }]}
          numberOfLines={2}
        >
          {summary || t("emptyOrders")}
        </Text>

        {restaurantLabel ? (
          <Text
            style={[s.restaurant, { color: palette.textSecondary }]}
            numberOfLines={1}
          >
            {restaurantLabel}
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
            {t("payment") || "Payment"}: {paymentLabel}
          </Text>
          {deliveryLabel ? (
            <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
              {t("deliveryMethod") || "Delivery"}: {deliveryLabel}
            </Text>
          ) : null}
        </View>

        <View style={s.row}>
          <Text style={[s.amount, { color: BrandColors.primaryStrong }]}>
            {formatMoney(Number(item.amount || 0))}
          </Text>
          <Text style={[s.itemsCount, { color: palette.textSecondary }]}>
            {t("itemsLabel")}: {items.length}
          </Text>
        </View>
        {ratingVal ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-end",
              marginTop: 6,
              gap: 4,
            }}
          >
            <Ionicons name="star" size={16} color={BrandColors.primary} />
            <Text style={{ color: palette.text, fontWeight: "700" }}>
              {ratingVal.toFixed(1)}
            </Text>
            <Text style={{ color: palette.textSecondary }}>
              ({t("review") || "Review"})
            </Text>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <TouchableOpacity
            style={[
              s.actionBtn,
              { borderColor: palette.border, backgroundColor: palette.pill },
            ]}
            onPress={() => {
              setSupportOrder(item);
              setSupportVisible(true);
            }}
          >
            <Text style={[s.actionText, { color: palette.text }]}>
              {t("support") || "Support"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              s.actionBtn,
              { borderColor: palette.border, backgroundColor: palette.pill },
            ]}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/profile",
                params: { orderId: orderCode },
              })
            }
          >
            <Text style={[s.actionText, { color: palette.text }]}>
              {t("Track") || "Theo dõi"}
            </Text>
          </TouchableOpacity>
          {isDelivered ? (
            <TouchableOpacity
              style={[
                s.actionBtn,
                { borderColor: palette.border, backgroundColor: palette.pill },
              ]}
              onPress={() => {
                setReviewOrder(item);
                setReviewVisible(true);
              }}
            >
              <Text style={[s.actionText, { color: palette.text }]}>
                {ratingVal
                  ? t("reviewAgain") || "Review again"
                  : t("review") || "Review"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  if (!token) {
    return (
      <View style={[s.center, { backgroundColor: palette.background }]}>
        <Text style={{ marginBottom: 10, color: palette.textSecondary }}>
          {t("signInToView")}
        </Text>
        <TouchableOpacity
          style={[s.primaryBtn, { backgroundColor: BrandColors.primary }]}
          onPress={() =>
            router.push({
              pathname: "/auth/login",
              params: { returnTo: "/(tabs)/myorders" },
            })
          }
        >
          <Text style={s.primaryBtnText}>{t("signIn")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
        <View style={{ padding: 16 }}>
          <View style={[s.toolbar, { marginBottom: 10 }]}>
            <Text style={[s.title, { color: palette.text }]}>
              {t("orders")}
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
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
                <Text
                  style={{
                    fontFamily: "BeVietnamPro_600SemiBold",
                    color: palette.text,
                  }}
                >
                  {lang.toUpperCase()}
                </Text>
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
                <Ionicons
                  name={theme === "dark" ? "moon" : "sunny"}
                  size={20}
                  color={BrandColors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.pill,
                  {
                    backgroundColor: palette.pill,
                    borderColor: palette.border,
                  },
                ]}
                onPress={scrollToLatest}
                accessibilityLabel="Go to recent order"
              >
                <Text style={[s.pillText, { color: palette.text }]}>
                  {t("goRecent")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <FlatList<OrderEntry>
          ref={listRef}
          data={orders}
          keyExtractor={(o) => o._id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            !loading ? (
              <View style={s.center}>
                <Text style={{ color: palette.textSecondary }}>
                  {t("emptyOrders")}
                </Text>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
        />
      </SafeAreaView>

      {/* Support Modal */}
      <Modal
        visible={supportVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSupportVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { backgroundColor: palette.card }]}>
            <Text style={[s.modalTitle, { color: palette.text }]}>
              {t("support") || "Support"}
            </Text>
            <Text style={{ color: palette.textSecondary, marginBottom: 2 }}>
              {t("orders")}: {supportOrder?.orderRef || supportOrder?._id || ""}
            </Text>
            <Text style={{ color: palette.textSecondary, marginBottom: 4 }}>
              {t("restaurant")}:{" "}
              {supportOrder?.restaurantName || supportOrder?.restaurantId || ""}
            </Text>
            <Text style={{ color: palette.textSecondary, marginBottom: 10 }}>
              {t("itemsLabel")}:{" "}
              {(supportOrder?.items || []).map((it) => it.name).join(", ")}
            </Text>
            <TextInput
              style={[
                s.modalInput,
                { borderColor: palette.border, color: palette.text },
              ]}
              placeholder={t("supportPlaceholder") || "Describe your issue..."}
              placeholderTextColor={palette.textSecondary}
              multiline
              value={supportMsg}
              onChangeText={setSupportMsg}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: BrandColors.primary }]}
                onPress={async () => {
                  if (!userId || !supportOrder) {
                    Alert.alert("Error", "Missing user/order");
                    return;
                  }
                  if (!supportMsg.trim()) {
                    Alert.alert(
                      t("missingInfo") || "Missing info",
                      t("supportPlaceholder") || "Please describe your issue"
                    );
                    return;
                  }
                  try {
                    await client.post("/api/support/create", {
                      userId,
                      orderId: supportOrder.orderRef || supportOrder._id,
                      subject: `Support for order ${supportOrder._id}`,
                      message: supportMsg || "N/A",
                    });
                    Alert.alert(
                      t("support") || "Support",
                      t("success") || "Submitted"
                    );
                    setSupportVisible(false);
                    setSupportMsg("");
                  } catch (err: any) {
                    Alert.alert(
                      "Error",
                      err?.response?.data?.message || err?.message || "Failed"
                    );
                  }
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>
                  {t("apply") || "Send"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: palette.pill }]}
                onPress={() => {
                  setSupportVisible(false);
                  setSupportMsg("");
                }}
              >
                <Text style={{ color: palette.text, fontWeight: "700" }}>
                  {t("cancel") || "Cancel"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal
        visible={reviewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReviewVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { backgroundColor: palette.card }]}>
            <Text style={[s.modalTitle, { color: palette.text }]}>
              {t("review") || "Review"}
            </Text>
            <Text style={{ color: palette.textSecondary, marginBottom: 2 }}>
              {t("orders")}: {reviewOrder?.orderRef || reviewOrder?._id || ""}
            </Text>
            <Text style={{ color: palette.textSecondary, marginBottom: 4 }}>
              {t("restaurant")}:{" "}
              {reviewOrder?.restaurantName || reviewOrder?.restaurantId || ""}
            </Text>
            <Text style={{ color: palette.textSecondary, marginBottom: 10 }}>
              {t("itemsLabel")}:{" "}
              {(reviewOrder?.items || []).map((it) => it.name).join(", ")}
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View
                style={[
                  s.ratingField,
                  {
                    borderColor: palette.border,
                    backgroundColor: palette.card,
                  },
                ]}
              >
                <TextInput
                  style={[s.ratingInput, { color: palette.text }]}
                  placeholder={`${t("ratingFood") || "Food"} (1-5)`}
                  placeholderTextColor={palette.textSecondary}
                  keyboardType="number-pad"
                  value={ratingFood}
                  onChangeText={setRatingFood}
                />
                <Ionicons name="star" size={16} color={BrandColors.primary} />
              </View>
              <View
                style={[
                  s.ratingField,
                  {
                    borderColor: palette.border,
                    backgroundColor: palette.card,
                  },
                ]}
              >
                <TextInput
                  style={[s.ratingInput, { color: palette.text }]}
                  placeholder={`${t("deliveryRating") || "Delivery"} (1-5)`}
                  placeholderTextColor={palette.textSecondary}
                  keyboardType="number-pad"
                  value={ratingDriver}
                  onChangeText={setRatingDriver}
                />
                <Ionicons name="star" size={16} color={BrandColors.primary} />
              </View>
            </View>
            <TextInput
              style={[
                s.modalInput,
                {
                  borderColor: palette.border,
                  color: palette.text,
                  height: 80,
                },
              ]}
              placeholder={t("comment") || "Comment"}
              placeholderTextColor={palette.textSecondary}
              multiline
              value={comment}
              onChangeText={setComment}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: BrandColors.primary }]}
                onPress={async () => {
                  const food = Number(ratingFood || 0);
                  const driver = Number(ratingDriver || 0);
                  const isValidFood = !ratingFood || (food >= 1 && food <= 5);
                  const isValidDriver =
                    !ratingDriver || (driver >= 1 && driver <= 5);
                  if (!isValidFood || !isValidDriver) {
                    Alert.alert(
                      t("missingInfo") || "Missing info",
                      (t("ratingRange") as any) || "Please enter 1-5"
                    );
                    return;
                  }
                  const clampedFood = ratingFood ? food : undefined;
                  const clampedDriver = ratingDriver ? driver : undefined;
                  if (!userId || !reviewOrder) {
                    Alert.alert("Error", "Missing user/order");
                    return;
                  }
                  if (!clampedFood && !clampedDriver) {
                    Alert.alert(
                      t("missingInfo") || "Missing info",
                      t("review") || "Please rate at least one field"
                    );
                    return;
                  }
                  try {
                    await client.post("/api/review/add", {
                      orderId: reviewOrder.orderRef || reviewOrder._id,
                      userId,
                      restaurantId: reviewOrder.restaurantId,
                      ratingFood: clampedFood,
                      ratingDriver: clampedDriver,
                      comment,
                    });
                    Alert.alert(
                      t("review") || "Review",
                      t("success") || "Submitted"
                    );
                    setReviewVisible(false);
                    setRatingFood("");
                    setRatingDriver("");
                    setComment("");
                  } catch (err: any) {
                    Alert.alert(
                      "Error",
                      err?.response?.data?.message || err?.message || "Failed"
                    );
                  }
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>
                  {t("apply") || "Submit"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: palette.pill }]}
                onPress={() => {
                  setReviewVisible(false);
                  setRatingFood("");
                  setRatingDriver("");
                  setComment("");
                }}
              >
                <Text style={{ color: palette.text, fontWeight: "700" }}>
                  {t("cancel") || "Cancel"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "900" },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  card: { borderRadius: 12, borderWidth: 1, padding: 12 },
  cardHighlight: { borderColor: "#111" },
  summary: { marginTop: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  amount: { fontWeight: "900", color: "#111" },
  itemsCount: { color: "#666", fontStyle: "italic" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  primaryBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
  pill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  pillText: { fontFamily: "BeVietnamPro_600SemiBold" },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  restaurant: { marginTop: 4, fontFamily: "BeVietnamPro_600SemiBold" },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  actionText: { fontWeight: "700" },
  codePill: {
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  modalBox: { borderRadius: 14, padding: 14 },
  modalTitle: { fontSize: 16, fontWeight: "900", marginBottom: 8 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  ratingField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  ratingInput: { flex: 1, padding: 0 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
});
