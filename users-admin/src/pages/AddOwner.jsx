import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import useAuth, { buildAuthHeaders } from "../auth/useAuth.jsx";
import useUI from "../ui/useUI.jsx";

export default function AddOwner({ url }) {
  const { token } = useAuth();
  const { t } = useUI();
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    restaurantIds: [],
    active: true,
  });
  const [loading, setLoading] = useState(false);

  const fetchRestaurants = async () => {
    try {
      const headers = buildAuthHeaders(token);
      const res = await axios.get(url + "/api/restaurant/list", { headers });
      if (res.data?.success) {
        setRestaurants(res.data.data || []);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Cannot load restaurants");
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const toggleRestaurant = (id) => {
    setForm((prev) => {
      const has = prev.restaurantIds.includes(id);
      return {
        ...prev,
        restaurantIds: has
          ? prev.restaurantIds.filter((r) => r !== id)
          : [...prev.restaurantIds, id],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Email và mật khẩu bắt buộc");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Mật khẩu tối thiểu 8 ký tự");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        restaurantIds: form.restaurantIds,
        role: "restaurantOwner",
        active: !!form.active,
      };
      const headers = buildAuthHeaders(token);
      const res = await axios.post(url + "/api/user/admin-create", payload, { headers });
      if (res.data?.success) {
        toast.success(t("createSuccess"));
        setForm({ name: "", email: "", password: "", restaurantIds: [], active: true });
      } else {
        toast.error(res.data?.message || t("createFail"));
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || t("createFail"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="users-page">
      <h3>{t("addOwner") || "Add Restaurant Owner"}</h3>
      <form className="form card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            {t("name")}
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Owner name"
            />
          </label>
          <label>
            {t("email")}
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </label>
          <label>
            {t("password")}
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
            />
          </label>
          <label className="inline">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
            />
            <span>{t("activeLabel")}</span>
          </label>
        </div>
        <div className="form-section">
          <p className="muted">{t("selectRestaurants") || "Chọn nhà hàng"}</p>
          <div className="tag-grid">
            {restaurants.map((r) => {
              const checked = form.restaurantIds.includes(r._id);
              return (
                <label key={r._id} className={`tag ${checked ? "active" : ""}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRestaurant(r._id)}
                  />
                  <span>{r.name}</span>
                </label>
              );
            })}
            {!restaurants.length && <span className="muted small">{t("noRestaurants") || "Chưa có nhà hàng"}</span>}
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? "..." : t("submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
