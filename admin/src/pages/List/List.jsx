import React, { useEffect, useState } from "react";
import "./List.css";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import useAuth, { buildAuthHeaders } from "../../auth/useAuth.jsx";
import useUI from "../../ui/useUI.jsx";

const FALLBACK_WEB = "/header_img.png";
const FALLBACK_LOCAL = assets.logo;

const List = ({ url }) => {
  const { token, role, restaurantIds } = useAuth();
  const { t, lang, formatMoney, translateCategory } = useUI();
  const [list, setList] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("all");
  const [loading, setLoading] = useState(false);

  const API_BASE =
    url || import.meta.env.VITE_API_URL || "http://localhost:5000";

  const fetchRestaurants = async () => {
    try {
      const headers = buildAuthHeaders(token);
      const res = await axios.get(`${API_BASE}/api/restaurant/list`, { headers });
      const data = res.data?.data || [];
      const filtered = role === "restaurantOwner"
        ? data.filter((r) => restaurantIds.includes(r._id))
        : data;
      setRestaurants(filtered);
      if (filtered.length && selectedRestaurant === "all") {
        setSelectedRestaurant(filtered[0]._id);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cannot fetch restaurants");
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedRestaurant !== "all") params.restaurantId = selectedRestaurant;
      const headers = buildAuthHeaders(token);
      const response = await axios.get(`${API_BASE}/api/food/list`, {
        params,
        headers,
      });
      if (response.data?.success) {
        setList(response.data.data || []);
      } else {
        toast.error(response.data?.message || t("loading"));
      }
    } catch (err) {
      console.error("fetchList err", err);
      toast.error(
        err?.response?.data?.message || err.message || t("loading")
      );
    } finally {
      setLoading(false);
    }
  };

  const removeFood = async (foodId) => {
    try {
      const headers = buildAuthHeaders(token);
      const response = await axios.post(
        `${API_BASE}/api/food/remove`,
        { id: foodId },
        { headers }
      );
      if (response.data?.success) {
        toast.success(response.data.message || t("remove"));
        fetchList();
      } else {
        toast.error(response.data?.message || "Error");
      }
    } catch (err) {
      console.error("removeFood err", err);
      toast.error(
        err?.response?.data?.message || err.message || "Remove failed"
      );
    }
  };

  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurant]);

  return (
    <div className="list add flex-col">
      <div className="list-head">
        <div>
          <p className="eyebrow">{role === "restaurantOwner" ? "Owner" : "Admin"}</p>
          <p className="title">{t("allFoods")?.toUpperCase()}</p>
        </div>
        <div className="filter-row">
          <select
            className="select-filter"
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
          >
            {role !== "restaurantOwner" && (
              <option value="all">{t("allRestaurants")}</option>
            )}
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
          {loading && <span className="muted">{t("loading")}</span>}
        </div>
      </div>

      <div className="list-table">
        <div className="list-table-format title">
          <b>{t("image")}</b>
          <b>{t("name")}</b>
          <b>{t("category")}</b>
          <b>{t("price")}</b>
          <b>{t("action")}</b>
        </div>

        {list.map((item) => {
          const raw = item?.image;
          const isHttp = typeof raw === "string" && /^https?:\/\//i.test(raw);
          const imgSrc = isHttp ? raw : `${API_BASE}/images/${raw || ""}`;
          const name = lang === "vi"
            ? (item?.name || item?.nameEn || "Item")
            : (item?.nameEn || item?.name || "Item");
          const price = Number(item?.price ?? 0);

          return (
            <div key={item._id} className="list-table-format row">
              <img
                src={imgSrc}
                alt={name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_WEB;
                  setTimeout(() => {
                    if (e.currentTarget.naturalWidth === 0) {
                      e.currentTarget.src = FALLBACK_LOCAL;
                    }
                  }, 0);
                }}
              />
              <p>{name}</p>
              <p>{translateCategory(item?.category)}</p>
              <p>{formatMoney(price)}</p>
              <button
                onClick={() => {
                  if (window.confirm(t("remove") + "?")) {
                    removeFood(item._id);
                  }
                }}
                className="action-remove"
                type="button"
                title={t("remove")}
                aria-label={t("remove")}
              >
                {t("remove")}
              </button>
            </div>
          );
        })}

        {!loading && list.length === 0 && (
          <div className="empty">
            <p>{t("loading")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default List;
