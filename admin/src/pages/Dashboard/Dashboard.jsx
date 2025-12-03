import React, { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";
import axios from "axios";
import useAuth, { buildAuthHeaders } from "../../auth/useAuth.jsx";
import useUI from "../../ui/useUI.jsx";

const rangeOptions = [
  { key: "7d", days: 7 },
  { key: "30d", days: 30 },
  { key: "90d", days: 90 },
];

const Dashboard = ({ url }) => {
  const { token, role, restaurantIds } = useAuth();
  const { t, formatMoney } = useUI();
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("all");
  const [range, setRange] = useState("30d");
  const [metrics, setMetrics] = useState({ summary: {}, restaurants: [] });
  const [loading, setLoading] = useState(false);

  const restaurantMap = useMemo(() => {
    const map = {};
    restaurants.forEach((r) => {
      if (r?._id) map[r._id] = r;
    });
    return map;
  }, [restaurants]);

  const buildDates = () => {
    const opt = rangeOptions.find((o) => o.key === range);
    if (!opt) return {};
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - opt.days);
    return { from: from.toISOString(), to: to.toISOString() };
  };

  const fetchRestaurants = async () => {
    try {
      const headers = buildAuthHeaders(token);
      const res = await axios.get(url + "/api/restaurant/list", { headers });
      const data = res.data?.data || [];
      const filtered =
        role === "restaurantOwner"
          ? data.filter((r) => (restaurantIds || []).includes(r._id))
          : data;
      setRestaurants(filtered);
      if (filtered.length && selectedRestaurant === "all" && role === "restaurantOwner") {
        setSelectedRestaurant(filtered[0]._id);
      }
    } catch (err) {
      console.error("fetchRestaurants err", err);
    }
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const headers = buildAuthHeaders(token);
      const params = buildDates();
      if (selectedRestaurant !== "all") params.restaurantId = selectedRestaurant;
      const res = await axios.get(url + "/api/order/metrics/revenue", { params, headers });
      if (res.data?.success) {
        setMetrics(res.data.data || { summary: {}, restaurants: [] });
      } else {
        setMetrics({ summary: {}, restaurants: [] });
      }
    } catch (err) {
      console.error("fetchMetrics err", err);
      setMetrics({ summary: {}, restaurants: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurant, range]);

  const summary = metrics.summary || {};
  const perRestaurants = metrics.restaurants || [];
  const sortedRestaurants = perRestaurants.slice().sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
  const maxRevenue = sortedRestaurants.reduce((m, r) => Math.max(m, Number(r.revenue || 0)), 0);
  const timeseries = metrics.timeseries || [];

  // Build simple line chart points
  const chartWidth = 720;
  const chartHeight = 180;
  const padding = 12;
  const maxY = timeseries.reduce((m, p) => Math.max(m, Number(p.revenue || 0)), 0);
  const points = timeseries.map((p, idx) => {
    const x = timeseries.length > 1
      ? padding + (idx / (timeseries.length - 1)) * (chartWidth - padding * 2)
      : chartWidth / 2;
    const y = maxY > 0
      ? chartHeight - padding - (Number(p.revenue || 0) / maxY) * (chartHeight - padding * 2)
      : chartHeight - padding;
    return [x, y];
  });
  const polyline = points.map((p) => p.join(",")).join(" ");
  const area = points.length
    ? `${points[0][0]},${chartHeight - padding} ${polyline} ${points[points.length - 1][0]},${chartHeight - padding}`
    : "";

  return (
    <div className="dashboard">
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">{t("dashboard")}</p>
          <h3 className="h3">{t("revenue")?.toUpperCase()}</h3>
        </div>
        <div className="dashboard-filters">
          <div className="filter">
            <label className="muted">{t("restaurant")}</label>
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="select-filter"
            >
              {role !== "restaurantOwner" && <option value="all">{t("allRestaurants")}</option>}
              {restaurants.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter">
            <label className="muted">{t("dateRange")}</label>
            <div className="range-buttons">
              {rangeOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`btn-chip ${range === opt.key ? "active" : ""}`}
                  onClick={() => setRange(opt.key)}
                >
                  {t(opt.key === "7d" ? "last7d" : opt.key === "30d" ? "last30d" : "last90d")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <p className="muted">{t("totalRevenue")}</p>
          <h4>{formatMoney(summary.totalRevenue || 0)}</h4>
        </div>
        <div className="kpi-card">
          <p className="muted">{t("totalOrders")}</p>
          <h4>{summary.totalOrders || 0}</h4>
        </div>
        <div className="kpi-card">
          <p className="muted">{t("avgOrderValue")}</p>
          <h4>{formatMoney(summary.avgOrderValue || 0)}</h4>
        </div>
      </div>

      <div className="table-card">
        <div className="table-head">
          <h4>{t("perRestaurant")}</h4>
          {loading && <span className="muted small">Loading...</span>}
        </div>
        <div className="table">
          <div className="table-row table-row--head">
            <div>{t("restaurant")}</div>
            <div className="text-right">{t("revenue")}</div>
            <div className="text-right">{t("totalOrders")}</div>
          </div>
          {perRestaurants.length === 0 ? (
            <div className="table-row empty">{loading ? t("loading") : t("noData") || "No data"}</div>
          ) : (
            perRestaurants.map((row) => (
              <div className="table-row" key={row.restaurantId}>
                <div>{restaurantMap[row.restaurantId]?.name || row.restaurantId}</div>
                <div className="text-right">{formatMoney(row.revenue || 0)}</div>
                <div className="text-right">{row.orders || 0}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-head">
          <h4>{t("revenue")}</h4>
          <span className="muted small">{timeseries.length} {t("dateRange")}</span>
        </div>
        <div className="line-chart">
          {timeseries.length === 0 ? (
            <div className="bar-row empty">{loading ? t("loading") : t("noData") || "No data"}</div>
          ) : (
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="sparkline" role="img" aria-label="Revenue line">
              <defs>
                <linearGradient id="gradSpark" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {area && (
                <polygon
                  points={area}
                  className="sparkline-area"
                />
              )}
              {polyline && (
                <polyline
                  points={polyline}
                  className="sparkline-line"
                />
              )}
              {points.map(([x, y], idx) => (
                <circle key={idx} cx={x} cy={y} r="3" className="sparkline-dot" />
              ))}
              <text x={padding} y={padding + 10} className="sparkline-label">{t("revenue")}</text>
              <text x={chartWidth - padding} y={chartHeight - padding - 4} className="sparkline-label end">
                {formatMoney(maxY || 0)}
              </text>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
