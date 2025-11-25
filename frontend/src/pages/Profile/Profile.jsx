import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import "./Profile.css";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate, useSearchParams } from "react-router-dom";

// Mock coordinates cho 2 thành phố phổ biến
const HCMOQ5 = { latitude: 10.754, longitude: 106.663 }; // Q5
const HCMQ1 = { latitude: 10.776, longitude: 106.700 }; // Q1
const HANOI_HOANKIEM = { latitude: 21.027763, longitude: 105.83416 };
const HANOI_CUSTOMER = { latitude: 21.0175, longitude: 105.8129 };

const phaseClass = (phase) => {
  if (phase === "delivered") return "phase-delivered";
  if (phase === "delivering") return "phase-delivering";
  return "phase-at";
};

const phaseLabel = (phase, t) => {
  if (phase === "delivered") return t("Đã giao", "Delivered");
  if (phase === "delivering") return t("Đang giao", "Delivering");
  return t("Tại quán", "At restaurant");
};

const loadLeaflet = () =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.L) return resolve(window.L);
    const existing = document.querySelector('link[href*="leaflet"]');
    if (!existing) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Leaflet failed to load"));
    document.body.appendChild(script);
  });

const LiveMap = ({ route, altRoute, showDriver, showDrone, phase }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerRefs = useRef({ driver: null, drone: null, markers: [] });

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled) return;
        if (!mapInstance.current && mapRef.current) {
          mapInstance.current = L.map(mapRef.current, { zoomControl: false });
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
          }).addTo(mapInstance.current);
        }

        const map = mapInstance.current;
        if (!map) return;

        const { driver, drone, markers } = layerRefs.current;
        if (driver) driver.remove();
        if (drone) drone.remove();
        markers.forEach((m) => m.remove());
        layerRefs.current.markers = [];

        const driverPath = route.map((p) => [p.lat ?? p.latitude, p.lng ?? p.longitude]).filter(Boolean);
        const dronePath = altRoute.map((p) => [p.lat ?? p.latitude, p.lng ?? p.longitude]).filter(Boolean);

        if (showDriver && driverPath.length >= 2) {
          layerRefs.current.driver = L.polyline(driverPath, {
            color: "#2563eb",
            weight: 5,
            opacity: 0.9,
          }).addTo(map);
        }
        if (showDrone && dronePath.length >= 2) {
          layerRefs.current.drone = L.polyline(dronePath, {
            color: "#f97316",
            weight: 4,
            opacity: 0.85,
            dashArray: "12 8",
          }).addTo(map);
        }

        const pickPos = (pathArr, frac) => {
          if (!pathArr.length) return null;
          if (pathArr.length === 1) return pathArr[0];
          const idx = Math.min(pathArr.length - 1, Math.max(0, Math.round((pathArr.length - 1) * frac)));
          return pathArr[idx];
        };
        const progress =
          phase === "delivered" ? 1 : phase === "delivering" ? 0.66 : 0;

        const driverPos = pickPos(driverPath, progress);
        const dronePos = pickPos(dronePath, progress);

        const markerDefs = [];
        if (driverPath[0]) {
          markerDefs.push({ pos: driverPath[0], label: "Restaurant", color: "#22c55e", type: "restaurant", icon: "\u{1F37D}" });
        }
        if (driverPath[driverPath.length - 1]) {
          markerDefs.push({ pos: driverPath[driverPath.length - 1], label: "Customer", color: "#0ea5e9", type: "customer", icon: "\u{1F9CD}" });
        }
        if (showDriver && driverPos) {
          markerDefs.push({ pos: driverPos, label: "Driver", color: "#2563eb", type: "driver", icon: "\u{1F69A}" });
        }
        if (showDrone && dronePos) {
          markerDefs.push({ pos: dronePos, label: "Drone", color: "#f97316", type: "drone", icon: "\u{1F681}" });
        }

        markerDefs.forEach((m) => {
          const icon = L.divIcon({
            className: `route-marker marker-${m.type || "default"}`,
            html: `<div class="marker-dot" style="background:${m.color}"></div><span class="marker-icon">${m.icon || ""}</span><span class="route-label">${m.label}</span>`,
          });
          const inst = L.marker(m.pos, { icon }).addTo(map);
          layerRefs.current.markers.push(inst);
        });

        const boundsPoints = [];
        if (showDriver) boundsPoints.push(...driverPath);
        if (showDrone) boundsPoints.push(...dronePath);
        if (boundsPoints.length) {
          map.fitBounds(boundsPoints, { padding: [24, 24] });
        } else if (route[0]) {
          map.setView(driverPath[0], 13);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [route, altRoute, showDriver, showDrone]);

  return <div className="leaflet-map" ref={mapRef} aria-label="Live map" />;
};

const Profile = () => {
  const { token, url, lang, userName } = useContext(StoreContext);
  const t = (vi, en) => (lang === "vi" ? vi : en);
  const formatPrice = (amount) => {
    const vnd = Number(amount) || 0;
    if (lang === "vi") return new Intl.NumberFormat("vi-VN").format(vnd) + " ₫";
    return `$${(vnd / 24000).toFixed(2)}`;
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [driverLatLng, setDriverLatLng] = useState([]);
  const [droneLatLng, setDroneLatLng] = useState([]);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.post(`${url}/api/order/userorders`, {}, { headers: { token } });
      const arr = Array.isArray(res.data?.data) ? res.data.data : [];
      setOrders(arr);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  useEffect(() => {
    if (!orders.length) return;
    const paramId = searchParams.get("orderId");
    let selected = orders.find((o) => (o?._id || "").toString() === paramId);
    if (!selected) {
      selected =
        orders.find((o) => (o?.deliveryPhase || "").includes("deliver")) ||
        orders[0];
    }
    setActiveOrder(selected || null);
    if (selected?._id) {
      setSearchParams({ orderId: selected._id });
    }
  }, [orders, searchParams, setSearchParams]);
  const normalizeText = (str = "") => (
    str
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
  );

  const pickCityPreset = (order) => {
    const text = normalizeText(
      `${order?.address?.city || ""} ${order?.address?.state || ""} ${order?.address?.country || ""}`
    );
    const forceCity = normalizeText(searchParams.get("city") || "");

    const isHanoi =
      forceCity === "hn" ||
      text.includes("ha noi") ||
      text.includes("hanoi") ||
      text.includes("ha-noi");

    if (isHanoi) {
      return { restaurant: HANOI_HOANKIEM, customer: HANOI_CUSTOMER };
    }
    return { restaurant: HCMOQ5, customer: HCMQ1 };
  };
  const buildRoutes = (order) => {
    const { restaurant, customer } = pickCityPreset(order);
    const mid1 = {
      latitude: (restaurant.latitude + customer.latitude) / 2 + 0.01,
      longitude: (restaurant.longitude + customer.longitude) / 2 - 0.004,
    };
    const mid2 = {
      latitude: (restaurant.latitude + customer.latitude) / 2 - 0.006,
      longitude: (restaurant.longitude + customer.longitude) / 2 + 0.006,
    };
    const driverRoute = [restaurant, mid1, customer];
    const droneRoute = [restaurant, mid2, customer];
    return { driverRoute, droneRoute, restaurant, customer };
  };

  useEffect(() => {
    if (!activeOrder) return;
    const routeFromOrder = Array.isArray(activeOrder.route) ? activeOrder.route : [];
    if (routeFromOrder.length >= 2 && routeFromOrder[0].lat !== undefined) {
      const normalizedRoute = routeFromOrder.map((p) => ({ latitude: p.lat, longitude: p.lng }));
      setDriverLatLng(normalizedRoute);
      setDroneLatLng(normalizedRoute);
      return;
    }

    const { driverRoute, droneRoute } = buildRoutes(activeOrder);
    setDriverLatLng(driverRoute);
    setDroneLatLng(droneRoute);
  }, [activeOrder]);

  const phase = useMemo(() => {
    const raw = (activeOrder?.deliveryPhase || activeOrder?.phase || "").toLowerCase();
    if (raw.includes("delivered")) return "delivered";
    if (raw.includes("deliver")) return "delivering";
    const status = (activeOrder?.status || "").toLowerCase();
    if (status.includes("delivered")) return "delivered";
    if (status.includes("deliver")) return "delivering";
    return "at_restaurant";
  }, [activeOrder]);

  const showDriver = activeOrder?.deliveryType !== "drone";
  const showDrone = activeOrder?.deliveryType !== "driver";

  const steps = [
    { key: "at_restaurant", label: t("Tại quán", "At restaurant") },
    { key: "delivering", label: t("Đang giao", "Delivering") },
    { key: "delivered", label: t("Đã giao", "Delivered") },
  ];
  const activeIndex = steps.findIndex((s) => s.key === phase);

  const shortId = (activeOrder?._id || "").slice(-6);
  const deliveryMethod = (activeOrder?.deliveryType || "driver").toUpperCase();
  const statusText = (() => {
    const s = (activeOrder?.status || "").toLowerCase();
    if (s.includes("out for delivery")) return t("Đang giao", "Out For Delivery");
    if (s.includes("delivered")) return t("Đã giao", "Delivered");
    return t("Đang chế biến", "Food Processing");
  })();
  const statusClass = (() => {
    const s = (activeOrder?.status || "").toLowerCase();
    if (s.includes("out for delivery")) return "status-out";
    if (s.includes("delivered")) return "status-delivered";
    return "status-processing";
  })();

  const metrics = useMemo(() => {
    if (phase === "delivered") return { eta: t("Đã giao", "Delivered"), speed: "0 km/h", battery: "72%", wind: "4 km/h NE" };
    if (phase === "delivering") return { eta: t("8-12 phút", "8-12 min"), speed: "36 km/h", battery: "68%", wind: "5 km/h NE" };
    return { eta: t("12-18 phút", "12-18 min"), speed: "0 km/h", battery: "78%", wind: "6 km/h NE" };
  }, [phase, t]);

  if (!token) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h2>{t("Hồ sơ & Theo dõi", "Profile & Tracking")}</h2>
          <p>{t("Vui lòng đăng nhập để xem trạng thái đơn.", "Please sign in to track your orders.")}</p>
          <button className="btn" onClick={() => navigate("/cart")}>{t("Quay lại đặt món", "Back to ordering")}</button>
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h2>{t("Hồ sơ & Theo dõi", "Profile & Tracking")}</h2>
          <p>{t("Bạn chưa có đơn nào. Hãy đặt món để theo dõi!", "No orders yet. Place an order to start tracking.")}</p>
          <button className="btn" onClick={() => navigate("/cart")}>{t("Quay lại đặt món", "Back to ordering")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div>
          <p className="eyebrow">{t("Tài khoản", "Account")}</p>
          <h2>{t("Hồ sơ & Theo dõi", "Profile & Tracking")}</h2>
          <p className="muted">{t("Chọn đơn để xem lộ trình giao.", "Pick an order to see its live route.")}</p>
        </div>
        <div className="header-actions">
          <button className="ghost-btn" onClick={fetchOrders} disabled={loading}>
            {loading ? t("Đang tải...", "Refreshing...") : t("Làm mới", "Refresh")}
          </button>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <div className="selector-row">
            <label htmlFor="orderSelect">{t("Đơn hàng", "Order")}</label>
            <select
              id="orderSelect"
              value={activeOrder?._id || ""}
              onChange={(e) => {
                const selected = orders.find((o) => o?._id === e.target.value) || null;
                setActiveOrder(selected);
                if (selected?._id) setSearchParams({ orderId: selected._id });
              }}
            >
              {orders.map((o) => (
                <option key={o._id} value={o._id}>
                  #{(o?._id || "").slice(-6)} · {(o?.deliveryType || "driver").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="badge-row">
            <span className={`status-pill ${statusClass}`}>{statusText}</span>
            {activeOrder?.deliveryType && (
              <span className="method-chip">{t("Phương thức", "Method")}: {deliveryMethod}</span>
            )}
            {shortId && <span className="id-chip">#{shortId}</span>}
          </div>

          <div className="order-meta">
            <div>
              <p className="muted">{t("Tổng tiền", "Total")}</p>
              <strong>{activeOrder?.amount ? formatPrice(activeOrder.amount) : "--"}</strong>
            </div>
            {deliveryMethod !== "DRONE" && (
              <div>
                <p className="muted">{t("Tài xế", "Driver")}</p>
                <strong>{activeOrder?.driverId || t("Chưa gán", "Unassigned")}</strong>
              </div>
            )}
            {deliveryMethod === "DRONE" && (
              <div>
                <p className="muted">Drone</p>
                <strong>{activeOrder?.droneId || t("Chưa gán", "Unassigned")}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="profile-card tracker-card">
          <div className="tracker-head">
            <div>
              <p className="muted">{t("Ước tính", "ETA")}</p>
              <h3>{metrics.eta}</h3>
            </div>
            <div className="pill confidence">{t("Độ tin cậy", "Confidence")}: 82%</div>
          </div>
          <div className="timeline">
            {steps.map((s, idx) => (
              <div className="step" key={s.key}>
                <div className={`step-dot ${idx <= activeIndex ? phaseClass(phase) : "step-pending"}`} />
                <p className="step-label">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="metrics-grid">
            <div className="metric-card">
              <p className="muted">{t("Tốc độ", "Speed")}</p>
              <strong>{metrics.speed}</strong>
            </div>
            <div className="metric-card">
              <p className="muted">{t("Pin", "Battery")}</p>
              <strong>{metrics.battery}</strong>
            </div>
            <div className="metric-card">
              <p className="muted">{t("Gió", "Wind")}</p>
              <strong>{metrics.wind}</strong>
            </div>
          </div>
        </div>
      </div>

      <LiveMap
        route={driverLatLng}
        altRoute={droneLatLng}
        showDriver={showDriver}
        showDrone={showDrone}
        phase={phase}
      />
                  <div className="legend">
        <span className="legend-item legend-restaurant">
          <span className="dot restaurant" aria-hidden /> {t("Nh? h?ng", "Restaurant")}
        </span>
        <span className="legend-item legend-customer">
          <span className="dot customer" aria-hidden /> {t("Kh?ch h?ng", "Customer")}
        </span>
        <span className="legend-item legend-driver">
          <span className="dot driver" aria-hidden /> {t("T?i x?", "Driver")}
        </span>
        <span className="legend-item legend-drone">
          <span className="dot drone" aria-hidden /> {t("Drone", "Drone")}
        </span>
      </div>

      <div className="profile-card info-card">
        <h3>{t("Thông tin tài khoản", "Account info")}</h3>
        <div className="info-grid">
          <div>
            <p className="muted">{t("Tên", "Name")}</p>
            <strong>{userName || t("Người dùng", "User")}</strong>
          </div>
          <div>
            <p className="muted">{t("Đơn hiện có", "Orders")}</p>
            <strong>{orders.length}</strong>
          </div>
          <div>
            <p className="muted">ID</p>
            <strong>{shortId ? `#${shortId}` : "--"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
