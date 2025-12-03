import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import useAuth, { buildAuthHeaders } from "../auth/useAuth.jsx";
import useUI from "../ui/useUI.jsx";

const initialState = {
  name: "",
  nameEn: "",
  slug: "",
  cityId: "",
  address: "",
  addressEn: "",
  minOrder: "",
  image: "",
  active: true,
};

export default function AddRestaurant({ url }) {
  const { token } = useAuth();
  const { t } = useUI();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const fetchCities = async () => {
    try {
      const res = await axios.get(url + "/api/city/list");
      if (res.data?.success) {
        setCities(res.data.data || []);
      }
    } catch (e) {
      // silent; city list optional
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.slug || !form.cityId) {
      toast.error("Name, slug, cityId are required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        nameEn: form.nameEn || undefined,
        slug: form.slug,
        cityId: form.cityId,
        address: form.address || undefined,
        addressEn: form.addressEn || undefined,
        minOrder: form.minOrder ? Number(form.minOrder) : undefined,
        image: form.image || undefined,
        active: !!form.active,
      };
      const headers = buildAuthHeaders(token);
      const res = await axios.post(url + "/api/restaurant/add", payload, { headers });
      if (res.data?.success) {
        toast.success(t("createSuccess"));
        setForm(initialState);
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
      <h3>{t("addRestaurant")}</h3>
      <form className="form card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            {t("restaurantName")}
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </label>
          <label>
            {t("restaurantNameEn")}
            <input
              value={form.nameEn}
              onChange={(e) => updateField("nameEn", e.target.value)}
            />
          </label>
          <label>
            {t("slug")}
            <input
              value={form.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              required
            />
          </label>
          <label>
            {t("cityId")}
            <select
              value={form.cityId}
              onChange={(e) => updateField("cityId", e.target.value)}
            >
              <option value="">{t("cityId")}</option>
              {cities.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c._id})
                </option>
              ))}
            </select>
            {!cities.length && (
              <input
                placeholder={t("cityId")}
                value={form.cityId}
                onChange={(e) => updateField("cityId", e.target.value)}
                required
              />
            )}
          </label>
          <label>
            {t("address")}
            <input
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
          </label>
          <label>
            {t("addressEn")}
            <input
              value={form.addressEn}
              onChange={(e) => updateField("addressEn", e.target.value)}
            />
          </label>
          <label>
            {t("minOrder")}
            <input
              type="number"
              min="0"
              value={form.minOrder}
              onChange={(e) => updateField("minOrder", e.target.value)}
            />
          </label>
          <label>
            {t("imageUrl")}
            <input
              value={form.image}
              onChange={(e) => updateField("image", e.target.value)}
              placeholder="https://..."
            />
          </label>
          <label className="inline">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => updateField("active", e.target.checked)}
            />
            <span>{t("activeLabel")}</span>
          </label>
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
