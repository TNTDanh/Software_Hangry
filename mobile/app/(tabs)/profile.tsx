import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  ImageBackground,
  Linking,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useAuthStore } from "../../lib/store/auth";
import { useUI } from "../../hooks/useUI";
import { Colors, BrandColors } from "../../constants/theme";
import client from "../../src/api/client";

type DroneStatus =
  | "idle"
  | "en_route_pickup"
  | "delivering"
  | "returning"
  | "charging"
  | "maintenance";
type DriverStatus = "pending" | "en_route" | "delivered";

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const paramOrderId = params?.orderId as string | undefined;
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const role = useAuthStore((s) => s.role);
  const clearToken = useAuthStore((s) => s.clearToken);
  const { t, theme, toggleLang, toggleTheme, lang } = useUI();
  const palette = Colors[theme as keyof typeof Colors];
  const isAdmin = role === "admin" || role === "superadmin";

  const [phase, setPhase] = useState<"at_restaurant" | "delivering" | "delivered">(
    "at_restaurant",
  );
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [ordersCache, setOrdersCache] = useState<any[]>([]);
  const [showOrderList, setShowOrderList] = useState(false);
  const [deliveryMeta, setDeliveryMeta] = useState<{ droneId?: string; driverId?: string }>({});
  const [deliveryType, setDeliveryType] = useState<"drone" | "driver" | undefined>(undefined);
  const [routePoints, setRoutePoints] = useState<{ latitude: number; longitude: number }[]>([
    { latitude: 10.7589, longitude: 106.6636 },
    { latitude: 10.7706, longitude: 106.6907 },
    { latitude: 10.7766, longitude: 106.7009 },
  ]);
  const [mapRegion, setMapRegion] = useState({
    latitude: 10.7706,
    longitude: 106.6907,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  });
  const [refreshing, setRefreshing] = useState(false);

  const phaseIndex = phase === "at_restaurant" ? 0 : phase === "delivering" ? 1 : 2;
  const droneCoord = routePoints[phaseIndex];
  const restaurantCoord = routePoints[0];
  const customerCoord = routePoints[routePoints.length - 1];

  const tracking = useMemo(() => {
    const etaMinutes = phase === "at_restaurant" ? 18 : phase === "delivering" ? 8 : 0;
    const droneStatus: DroneStatus =
      phase === "at_restaurant"
        ? "en_route_pickup"
        : phase === "delivered"
          ? "idle"
          : "delivering";
    const driverStatus: DriverStatus =
      phase === "at_restaurant" ? "pending" : phase === "delivering" ? "en_route" : "delivered";
    return {
      etaMinutes,
      etaWindow: phase === "delivered" ? "Delivered" : "12:42 - 12:47",
      confidence: 0.82,
      droneStatus,
      driverStatus,
      droneMetrics: { speed: phase === "at_restaurant" ? 0 : 36, battery: 72, wind: "5 km/h NE" },
    leg: phase === "at_restaurant" ? "At restaurant" : phase === "delivered" ? "Delivered" : "On the way",
    };
  }, [phase]);

  const applyOrder = useCallback((ord: any) => {
    if (!ord) return;
    setActiveOrderId(ord._id || null);
    if (ord?.droneId || ord?.driverId) {
      setDeliveryMeta({ droneId: ord.droneId, driverId: ord.driverId });
    } else {
      setDeliveryMeta({});
    }
    if (ord?.deliveryType) {
      setDeliveryType(ord.deliveryType);
    } else {
      setDeliveryType(undefined);
    }
    if (ord?.address) {
      const normalize = (val: any) =>
        (val ? String(val) : "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
      const addrStr = normalize(JSON.stringify(ord.address));
      const isHanoi = addrStr.includes("ha noi") || addrStr.includes("hanoi");
      const hnPoints = [
        { latitude: 21.0278, longitude: 105.8342 }, // Hoan Kiem
        { latitude: 21.033, longitude: 105.85 }, // mid
        { latitude: 21.036, longitude: 105.87 }, // customer mock
      ];
      const hcmPoints = [
        { latitude: 10.7589, longitude: 106.6636 },
        { latitude: 10.7706, longitude: 106.6907 },
        { latitude: 10.7766, longitude: 106.7009 },
      ];
      setRoutePoints(isHanoi ? hnPoints : hcmPoints);
    }
    if (ord?.deliveryPhase) {
      const allowed = ["at_restaurant", "delivering", "delivered"];
      if (allowed.includes(ord.deliveryPhase)) {
        setPhase(ord.deliveryPhase as any);
      }
    }
  }, []);

  const fetchLatest = useCallback(async () => {
    if (!token) return;
    try {
      const res = await client.post("/api/order/userorders", { userId });
      const orders = res.data?.data || [];
      setOrdersCache(orders);
      const match =
        (paramOrderId && orders.find((o: any) => o._id === paramOrderId || o.orderRef === paramOrderId)) ||
        orders.find((o: any) => o.deliveryPhase !== "delivered") ||
        orders[0];
      if (match) applyOrder(match);
    } catch (err) {
      // silent fallback to mock
    }
  }, [applyOrder, paramOrderId, token, userId]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  useFocusEffect(
    useCallback(() => {
      fetchLatest();
    }, [fetchLatest])
  );

  useEffect(() => {
    if (!routePoints.length) return;
    const lats = routePoints.map((p) => p.latitude);
    const lngs = routePoints.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = Math.max((maxLat - minLat) * 1.6, 0.02);
    const lngDelta = Math.max((maxLng - minLng) * 1.6, 0.02);
    setMapRegion({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    });
  }, [routePoints]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLatest();
    setRefreshing(false);
  }, [fetchLatest]);

  const driverStepIndex =
    tracking.driverStatus === "pending"
      ? 0
      : tracking.driverStatus === "en_route"
        ? 1
        : 2;

  const droneStatusLabel: Record<DroneStatus, string> = {
    idle: "Idle",
    en_route_pickup: "At restaurant",
    delivering: "Delivering",
    returning: "Returning",
    charging: "Charging",
    maintenance: "Maintenance",
  };
  const droneStatusColor: Record<DroneStatus, string> = {
    idle: "#6B7280",
    en_route_pickup: "#f59e0b", // yellow (processing)
    delivering: "#ef4444", // red (out for delivery)
    returning: "#3B82F6",
    charging: "#F59E0B",
    maintenance: "#6c806bff",
  };

  const updatePhaseRemote = async (next: "at_restaurant" | "delivering" | "arriving" | "delivered") => {
    setPhase(next as any);
    if (!isAdmin || !activeOrderId) return;
    const payloadPhase = next === "arriving" ? "delivering" : next;
    try {
      await client.patch(`/api/order/delivery/${activeOrderId}`, { phase: payloadPhase });
    } catch (e) {
      // silent; keep local state
    }
  };

  const onSignOut = () => {
    Alert.alert(t("Log Out"), t("Do you want to log out ?"), [
      { text: "Cancel", style: "cancel" },
      { text: "OK", onPress: () => clearToken() },
    ]);
  };

  // Reset view state when signed out
  useEffect(() => {
    if (token) return;
    setPhase("at_restaurant");
    setActiveOrderId(null);
    setOrdersCache([]);
    setDeliveryMeta({});
    setDeliveryType(undefined);
    setRoutePoints([
      { latitude: 10.7589, longitude: 106.6636 },
      { latitude: 10.7706, longitude: 106.6907 },
      { latitude: 10.7766, longitude: 106.7009 },
    ]);
  }, [token]);

  return (
    <SafeAreaView style={[s.wrap, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={[s.headerCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Image source={require("../../assets/images/eat.png")} style={s.avatar} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[s.title, { color: palette.text }]}>Account</Text>
            <Text style={[s.subtitle, { color: palette.textSecondary }]}>
              {token ? "Welcome back!" : "Sign in to view your profile and orders"}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 8 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={toggleLang}
                style={[s.pillAction, { borderColor: palette.border, backgroundColor: palette.pill }]}
              >
                <Text style={{ fontFamily: "BeVietnamPro_600SemiBold", color: palette.text }}>
                  {lang.toUpperCase()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleTheme}
                style={[s.iconAction, { borderColor: palette.border, backgroundColor: palette.pill }]}
              >
                <Ionicons
                  name={theme === "dark" ? "moon" : "sunny"}
                  size={18}
                  color={BrandColors.primary}
                />
              </TouchableOpacity>
            </View>
            {!token ? (
              <TouchableOpacity
                style={[s.btn, { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: BrandColors.primary }]}
                onPress={() =>
                  router.push({ pathname: "/auth/login", params: { returnTo: "/(tabs)/profile" } })
                }
              >
                <Text style={s.btnText}>{t("Sign In")}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  s.btnOutline,
                  { borderColor: BrandColors.primary, backgroundColor: palette.pill },
                ]}
                onPress={onSignOut}
              >
                <Text style={[s.btnTextOutline, { color: BrandColors.primary }]}>
                  {t("Sign out") || "Sign Out"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {token && ordersCache.length > 0 && (
          <View
            style={[
              s.card,
              { backgroundColor: palette.card, shadowOpacity: theme === "dark" ? 0 : 0.08, gap: 10 },
            ]}
          >
            <Text style={[s.cardTitle, { color: palette.text }]}>Select Order To Track</Text>
            <TouchableOpacity
              style={[
                s.selectBox,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.pill,
                },
              ]}
              onPress={() => setShowOrderList((v) => !v)}
            >
              <View>
                <Text style={[s.selectLabel, { color: palette.textSecondary }]}>Order</Text>
                <Text style={[s.selectValue, { color: palette.text }]}>
                  #{(activeOrderId || "").toString().slice(-6) || "N/A"}
                </Text>
              </View>
              <Ionicons
                name={showOrderList ? "chevron-up" : "chevron-down"}
                size={18}
                color={palette.textSecondary}
              />
            </TouchableOpacity>
            {showOrderList && (
              <View style={[s.dropdown, { borderColor: palette.border, backgroundColor: palette.card }]}>
                {ordersCache.map((ord) => {
                  const code = (ord?._id || "").toString().slice(-6);
                  const method = ord?.deliveryType === "drone" ? "Drone" : ord?.deliveryType === "driver" ? "Driver" : "N/A";
                  return (
                    <TouchableOpacity
                      key={ord._id}
                      style={[s.dropdownItem, { borderColor: palette.border }]}
                      onPress={() => {
                        applyOrder(ord);
                        setShowOrderList(false);
                      }}
                    >
                      <Text style={{ color: palette.text, fontWeight: "800" }}>#{code}</Text>
                      <Text style={{ color: palette.textSecondary, fontSize: 12 }}>Method: {method}</Text>
                      <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
                        Phase: {ord.deliveryPhase || "-"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {token && (
          <>
            <View style={[s.card, { backgroundColor: palette.card, shadowOpacity: theme === "dark" ? 0 : 0.08 }]}>
              <View style={s.trackerHeader}>
                <View style={s.trackerTopRow}>
                  <Text style={[s.cardTitle, { color: palette.text }]}>Delivery Tracker</Text>
                  <View
                    style={[
                      s.badge,
                      { backgroundColor: droneStatusColor[tracking.droneStatus] },
                    ]}
                  >
                    <Text style={s.badgeText}>{droneStatusLabel[tracking.droneStatus]}</Text>
                  </View>
                </View>
                <Text style={[s.cardBody, { color: palette.textSecondary }]}>
                  Live route & ETA
                </Text>
                <Text style={[s.cardBody, { color: palette.textSecondary }]}>
                  (mock data) — plug socket/map SDK later
                </Text>
              </View>

              <View style={{ gap: 10, marginTop: 12 }}>
                <View style={[s.etaBox, { backgroundColor: palette.pill }]}>
                  <Text style={[s.mutedLabel, { color: palette.textSecondary }]}>{t("ETA") || "ETA"}</Text>
                  <Text style={[s.etaValue, { color: palette.text }]}>
                    {tracking.etaMinutes} minutes
                  </Text>
                  <Text style={[s.cardBody, { color: palette.textSecondary }]}>
                    Window: {tracking.etaWindow}
                  </Text>
                  <Text style={[s.cardBody, { color: palette.textSecondary }]}>
                    Confidence: {(tracking.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={[s.metricsBox, { borderColor: palette.border }]}>
                  <View style={s.metricRow}>
                    <Ionicons name="speedometer" size={16} color={BrandColors.primary} />
                    <Text style={[s.metricLabel, { color: palette.textSecondary }]}>
                      Drone speed
                    </Text>
                    <Text style={[s.metricValue, { color: palette.text }]}>{tracking.droneMetrics.speed} km/h</Text>
                  </View>
                  <View style={s.metricRow}>
                    <Ionicons name="battery-half" size={16} color="#22c55e" />
                    <Text style={[s.metricLabel, { color: palette.textSecondary }]}>
                      Battery
                    </Text>
                    <Text style={[s.metricValue, { color: palette.text }]}>
                      {tracking.droneMetrics.battery}%
                    </Text>
                  </View>
                  <View style={s.metricRow}>
                    <Ionicons name="navigate" size={16} color="#60a5fa" />
                    <Text style={[s.metricLabel, { color: palette.textSecondary }]}>
                      Wind
                    </Text>
                    <Text style={[s.metricValue, { color: palette.text }]}>{tracking.droneMetrics.wind}</Text>
                  </View>
                </View>
              </View>

              <Text style={[s.cardBody, { color: palette.textSecondary, marginTop: 6 }]}>
                Current leg: {tracking.leg}
              </Text>
              {(deliveryMeta.droneId || deliveryMeta.driverId) && (
                <Text style={[s.cardBody, { color: palette.textSecondary }]}>
                  {deliveryMeta.droneId ? `Drone: ${deliveryMeta.droneId}` : ""}{" "}
                  {deliveryMeta.driverId ? `Driver: ${deliveryMeta.driverId}` : ""}
                </Text>
              )}
            </View>

            <View style={[s.card, { backgroundColor: palette.card, shadowOpacity: theme === "dark" ? 0 : 0.08 }]}>
              <View style={[s.mapShell, { borderColor: palette.border }]}>
                <MapView
                  style={s.mapPreview}
                  region={mapRegion}
                >
                  <Polyline
                    coordinates={routePoints}
                    strokeColor="#f97316"
                    strokeWidth={4}
                    lineDashPattern={[8, 6]}
                  />
                  <Marker coordinate={restaurantCoord} title={t("pickup") || "Nha hang"}>
                    <View style={[s.pin, { backgroundColor: "#22c55e" }]}>
                      <Text style={s.pinText}>Restaurant</Text>
                    </View>
                  </Marker>
                  <Marker coordinate={customerCoord} title={t("dropoff") || "Khach"}>
                    <View style={[s.pin, { backgroundColor: "#3b82f6" }]}>
                      <Text style={s.pinText}>Customer</Text>
                    </View>
                  </Marker>
                  {deliveryType !== "driver" && (
                    <Marker coordinate={droneCoord} title="Drone">
                      <View style={[s.dronePin]}>
                        <Ionicons name="airplane" size={18} color="#fff" />
                        <Text style={s.pinText}>Drone</Text>
                      </View>
                    </Marker>
                  )}
                  {deliveryType !== "drone" && (
                    <Marker coordinate={droneCoord} title={t("driver") || "Driver"}>
                      <View style={[s.dronePin, { backgroundColor: "#6366f1" }]}>
                        <Ionicons name="bicycle" size={18} color="#fff" />
                        <Text style={s.pinText}>{t("driver") || "Driver"}</Text>
                      </View>
                    </Marker>
                  )}
                </MapView>
                <View style={s.legendGrid}>
                  <View style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: "#f97316" }]} />
                    <Text style={[s.legendText, { color: palette.text }]}>Route</Text>
                  </View>
                  <View style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: "#22c55e" }]} />
                    <Text style={[s.legendText, { color: palette.text }]}>Restaurant</Text>
                  </View>
                  <View style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: "#3b82f6" }]} />
                    <Text style={[s.legendText, { color: palette.text }]}>Customer</Text>
                  </View>
                  {deliveryType !== "drone" && (
                    <View style={s.legendItem}>
                      <View style={[s.legendDot, { backgroundColor: "#6366f1" }]} />
                      <Text style={[s.legendText, { color: palette.text }]}>Driver</Text>
                    </View>
                  )}
                  {deliveryType !== "driver" && (
                    <View style={s.legendItem}>
                      <View style={[s.legendDot, { backgroundColor: "#f97316" }]} />
                      <Text style={[s.legendText, { color: palette.text }]}>Drone</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={s.timeline}>
                {["At restaurant", "Delivering", "Delivered"].map((step, idx) => (
                  <View key={step} style={s.step}>
                    <View
                      style={[
                        s.stepDot,
                        {
                          backgroundColor:
                            idx <= driverStepIndex
                              ? idx === 0
                                ? "#f59e0b"
                                : idx === 1
                                  ? "#ef4444"
                                  : "#16a34a"
                              : palette.border,
                          opacity: 1,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        s.stepLabel,
                        {
                          color: idx <= driverStepIndex ? palette.text : palette.textSecondary,
                          fontWeight: idx <= driverStepIndex ? "800" : "600",
                        },
                      ]}
                    >
                      {step}
                    </Text>
                  </View>
                ))}
              </View>

              {isAdmin && (
                <View style={[s.adminBox, { borderColor: palette.border }]}>
                  <Text style={[s.cardBody, { color: palette.text }]}>
                    Adjust status (admin)
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    {[
                      { key: "at_restaurant", label: "Food Processing", color: "#f59e0b" }, // yellow
                      { key: "delivering", label: "Out For Delivery", color: "#ef4444" }, // red
                      { key: "delivered", label: "Delivered", color: "#16a34a" }, // green
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          s.badge,
                          {
                            backgroundColor:
                              item.key === phase ? item.color : palette.pill,
                            borderColor: palette.border,
                          },
                        ]}
                        onPress={() => updatePhaseRemote(item.key as typeof phase)}
                      >
                        <Text
                          style={[
                            s.badgeText,
                            { color: item.key === phase ? "#fff" : palette.text },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        <ImageBackground
          source={require("../../assets/images/header_img.png")}
          style={s.noteBanner}
          imageStyle={{ borderRadius: 16 }}
        >
          <View style={[s.bannerOverlay, { backgroundColor: "rgba(0,0,0,0.45)" }]} />
          <View style={{ padding: 16, gap: 10 }}>
            <View>
              <Text style={[s.cardTitle, { color: "#fff" }]}>Note</Text>
              <Text
                style={[
                  s.cardBody,
                  { color: "#f3f4f6", textAlign: "justify", lineHeight: 18 },
                ]}
              >
                Thank you for supporting our partner restaurants!
              </Text>
            </View>
            <View style={s.ctaRow}>
              <TouchableOpacity
                style={[s.btn, { backgroundColor: BrandColors.primary, paddingHorizontal: 22 }]}
                onPress={() => router.push("/")}
              >
                <Text style={s.btnText}>{t("orderMore")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.btn,
                  { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 22 },
                ]}
                onPress={() => router.push("/cart")}
              >
                <Text style={[s.btnText, { color: palette.text }]}>{t("cart")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        <View
          style={[
            s.card,
            { backgroundColor: palette.card, shadowOpacity: theme === "dark" ? 0 : 0.08 },
          ]}
        >
          <Text style={[s.cardTitle, { color: palette.text }]}>Contact</Text>
          <View style={s.infoRow}>
            {[
              { label: "Company", value: "DPxFoodFast Co., Ltd." },
              { label: "Address", value: "273 An Duong Vuong, Cho Quan Ward" },
              { label: "Hotline", value: "+84-862-853-345" },
              { label: "Email", value: "contact@danhpuoc.com" },
              { label: "Website", value: "danhphuocxfoodfast.vn" },
              { label: "Open", value: "7AM - 10PM, Mon - Fri" },
            ].map((item) => (
              <View key={item.label} style={s.infoItemRow}>
                <Text style={[s.infoLabel, { color: palette.textSecondary }]}>{item.label}</Text>
                <Text style={[s.infoValue, { color: palette.text }]}>{item.value}</Text>
              </View>
            ))}
          </View>
          <Text style={[s.muted, { color: palette.textSecondary, marginTop: 10 }]}>
            {t("This app is for my learning portfolio.") || "This app is for my learning portfolio"}
          </Text>
          <Text style={[s.muted, { color: palette.textSecondary, marginTop: 10 }]}>
            {t("THIS IS NOT A REAL APP...") || "THIS IS NOT A REAL APP..."}
          </Text>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 4, justifyContent: "flex-start" }}>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: BrandColors.primary }]}
              onPress={() => Linking.openURL("tel:0862853345")}
            >
              <Text style={s.btnText}>Hotline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.btn,
                { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border },
              ]}
              onPress={() => Linking.openURL("mailto:thainguyenthanhdanhmh@gmail.com")}
            >
              <Text style={[s.btnText, { color: palette.text }]}>Send Mail</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: "#425ff0", borderWidth: 1, borderColor: palette.border }]}
              onPress={() => Linking.openURL("https://www.facebook.com/tnt.danh.2004")}
            >
              <Text style={[s.btnText, { color: "#f9f9f9" }]}>Facebook</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  avatar: { width: 56, height: 56, borderRadius: 12 },
  title: { fontSize: 22, fontWeight: "900" },
  subtitle: { marginTop: 2 },
  card: { borderRadius: 16, padding: 16, marginTop: 12, shadowColor: "#000" },
  cardTitle: { fontSize: 16, fontWeight: "900", marginBottom: 6 },
  cardBody: { lineHeight: 20 },
  banner: { height: 140, borderRadius: 16, overflow: "hidden", marginTop: 12 },
  noteBanner: { height: 180, borderRadius: 16, overflow: "hidden", marginTop: 12 },
  bannerOverlay: { ...StyleSheet.absoluteFillObject },
  bannerTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  bannerText: { color: "#eee", marginTop: 2 },
  muted: { fontStyle: "italic", marginTop: 4 },
  btn: { backgroundColor: "#111", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "800", textAlign: "center" },
  btnOutline: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
  btnTextOutline: { fontWeight: "800" },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  pillAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  trackerHeader: { flexDirection: "column", gap: 6, width: "100%" },
  trackerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  badge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 0, minWidth: 120, alignItems: "center", alignSelf: "flex-start" },
  badgeText: { color: "#fff", fontWeight: "800" },
  etaRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  etaBox: { flex: 1, borderRadius: 14, padding: 14 },
  metricsBox: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, gap: 10, backgroundColor: "rgba(255,255,255,0.02)" },
  metricRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  metricLabel: { fontSize: 12 },
  metricValue: { fontWeight: "800" },
  mutedLabel: { fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase" },
  etaValue: { fontSize: 28, fontWeight: "900", marginVertical: 6 },
  mapShell: { marginTop: 14, borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  mapPreview: { height: 220 },
  pin: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#22c55e",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dronePin: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#f97316",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  pinText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10 },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    rowGap: 8,
    padding: 10,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontWeight: "700", fontSize: 12 },
  timeline: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  step: { alignItems: "center", flex: 1 },
  stepDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 6 },
  stepLabel: { fontSize: 12, textAlign: "center" },
  adminBox: { marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 },
  selectValue: { fontSize: 16, fontWeight: "900" },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoRow: { flexDirection: "column", gap: 8, marginTop: 10 },
  infoItemRow: { width: "100%", paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#e5e7eb11" },
  infoGrid: { flexDirection: "column", gap: 8, marginTop: 10 },
  infoItem: { width: "100%", paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#e5e7eb11" },
  infoLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.3 },
  infoValue: { fontSize: 14, fontWeight: "800", marginTop: 2 },
  ctaRow: { flexDirection: "row", gap: 10, marginTop: 14, justifyContent: "flex-start" },
});
