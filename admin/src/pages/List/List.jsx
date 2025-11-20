import React, { useEffect, useState } from "react";
import "./List.css";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";

const FALLBACK_WEB = "/header_img.png"; // copy ảnh vào admin/public/header_img.png nếu muốn dùng
const FALLBACK_LOCAL = assets.logo; // fallback dự phòng nếu bạn chưa có header_img.png

const List = ({ url }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE =
    url || import.meta.env.VITE_API_URL || "http://localhost:5000";

  const fetchList = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/food/list`);
      if (response.data?.success) {
        setList(response.data.data || []);
      } else {
        toast.error(response.data?.message || "Error fetching list");
      }
    } catch (err) {
      console.error("fetchList err", err);
      toast.error(
        err?.response?.data?.message || err.message || "Cannot fetch foods"
      );
    } finally {
      setLoading(false);
    }
  };

  const removeFood = async (foodId) => {
    try {
      const response = await axios.post(`${API_BASE}/api/food/remove`, {
        id: foodId,
      });
      if (response.data?.success) {
        toast.success(response.data.message || "Removed");
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
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="list add flex-col">
      <div className="list-head">
        <p className="title">ALL FOODS</p>
        {loading && <span className="muted">Loading…</span>}
      </div>

      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Action</b>
        </div>

        {list.map((item) => {
          const raw = item?.image;
          const isHttp = typeof raw === "string" && /^https?:\/\//i.test(raw);
          const imgSrc = isHttp ? raw : `${API_BASE}/images/${raw || ""}`;

          return (
            <div key={item._id} className="list-table-format row">
              <img
                src={imgSrc}
                alt={item?.name || ""}
                onError={(e) => {
                  // đổi sang fallback web; nếu không có thì dùng logo local
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_WEB;
                  setTimeout(() => {
                    if (e.currentTarget.naturalWidth === 0) {
                      e.currentTarget.src = FALLBACK_LOCAL;
                    }
                  }, 0);
                }}
              />
              <p>{item?.name || "—"}</p>
              <p>{item?.category || "—"}</p>
              <p>${item?.price ?? 0}</p>
              <p
                onClick={() => {
                  if (window.confirm("Remove This Item !?? 🚨")) {
                    removeFood(item._id);
                  }
                }}
                className="action-remove"
                role="button"
                title="Remove"
                aria-label="Remove"
              >
                Remove 🗑️
              </p>
            </div>
          );
        })}

        {!loading && list.length === 0 && (
          <div className="empty">
            <p>No items found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default List;
