import React, { useContext, useEffect, useRef, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/assets";
import { useNavigate } from "react-router-dom";

const MyOrders = () => {
  const { url, token, lang } = useContext(StoreContext);
  const t = (vi, en) => (lang === "vi" ? vi : en);
  const [data, setData] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const latestRef = useRef(null);
  const [supportModal, setSupportModal] = useState({ open: false, order: null, subject: "", message: "" });
  const [reviewModal, setReviewModal] = useState({ open: false, order: null, ratingFood: 5, ratingDriver: 5, comment: "" });
  const navigate = useNavigate();

  const formatPrice = (amount) => {
    const vnd = Number(amount) || 0;
    if (lang === "vi") return new Intl.NumberFormat("vi-VN").format(vnd) + " ₫";
    const usd = vnd / 24000;
    return `$${usd.toFixed(2)}`;
  };

  const translateStatus = (statusRaw) => {
    const s = (statusRaw || "").toLowerCase();
    if (s.includes("delivered")) return t("Đã giao", "Delivered");
    if (s.includes("out for delivery")) return t("Đang giao", "Out for delivery");
    return t("Đang xử lý", "Food Processing");
  };

  const getIdTimestamp = (oid) => {
    if (!oid || typeof oid !== "string" || oid.length < 8) return 0;
    const hexTime = oid.slice(0, 8);
    return parseInt(hexTime, 16) * 1000;
  };

  const getOrderTimestamp = (order) => {
    const byDate = new Date(order?.date || 0).getTime() || 0;
    const byTimeline = Array.isArray(order?.statusTimeline) && order.statusTimeline.length
      ? new Date(order.statusTimeline[order.statusTimeline.length - 1]?.at || 0).getTime()
      : 0;
    const byId = getIdTimestamp(order?._id);
    return Math.max(byDate, byTimeline, byId);
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await axios.post(
        `${url}/api/order/userorders`,
        {},
        { headers: { token } }
      );
      const arr = Array.isArray(res.data?.data) ? res.data.data : [];

      // fetch reviews to gắn rating vào đơn (nếu có)
      let reviewsMap = {};
      try {
        const revRes = await axios.get(`${url}/api/review/list`);
        const revs = Array.isArray(revRes.data?.data) ? revRes.data.data : [];
        // chọn review mới nhất theo createdAt cho mỗi orderId
        reviewsMap = revs.reduce((acc, r) => {
          if (!r.orderId) return acc;
          const key = r.orderId;
          const prev = acc[key];
          const prevTime = prev?._createdAt || 0;
          const curTime = new Date(r.createdAt || 0).getTime() || 0;
          if (!prev || curTime >= prevTime) {
            acc[key] = {
              ratingFood: r.ratingFood || r.rating, // fallback rating cũ
              ratingDriver: r.ratingDriver,
              ratingAvg: r.ratingAvg || r.rating,
              _createdAt: curTime,
            };
          }
          return acc;
        }, {});
      } catch (e) {
        // ignore review fetch errors in UI
      }

      const withRating = arr.map((o) => ({
        ...o,
        ...(reviewsMap[o._id] || {}),
      }));

      const sorted = [...withRating].sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
      setData(sorted);
    } catch {
      setData([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  const highlightLatest = () => {
    const el = latestRef.current;
    if (!el) return;
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 900);
  };

  const submitReview = async () => {
    const order = reviewModal.order;
    if (!order) return;
    const ratingFood = Number(reviewModal.ratingFood);
    const ratingDriver = Number(reviewModal.ratingDriver);
    if ([ratingFood, ratingDriver].some((r) => Number.isNaN(r) || r < 1 || r > 5)) {
      alert(t("Điểm phải từ 1-5", "Rating must be 1-5"));
      return;
    }
    const comment = reviewModal.comment || "";
    setSubmitting(true);
    try {
      await axios.post(
        `${url}/api/review/add`,
        {
          orderId: order._id,
          userId: order.userId,
          restaurantId: order.items?.[0]?.restaurantId,
          rating: ratingFood,
          ratingDriver,
          comment,
        },
        { headers: { token } }
      );
      alert(t("Đã gửi đánh giá", "Review submitted"));
      setData((prev) =>
        prev.map((o) =>
          (o._id || "") === (order._id || "") ? { ...o, ratingFood, ratingDriver } : o
        )
      );
      setReviewModal({ open: false, order: null, ratingFood: 5, ratingDriver: 5, comment: "" });
    } catch (err) {
      alert(err?.response?.data?.message || t("Không gửi được đánh giá", "Cannot submit review"));
    } finally {
      setSubmitting(false);
    }
  };

  const submitSupport = async () => {
    const order = supportModal.order;
    if (!order) return;
    const { subject, message } = supportModal;
    if (!subject?.trim() || !message?.trim()) {
      alert(t("Vui lòng nhập nội dung", "Please enter a message"));
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(
        `${url}/api/support/create`,
        {
          userId: order.userId,
          orderId: order._id,
          subject,
          message,
        },
        { headers: { token } }
      );
      alert(t("Đã tạo phiếu hỗ trợ", "Support ticket created"));
      setSupportModal({ open: false, order: null, subject: "", message: "" });
    } catch (err) {
      alert(err?.response?.data?.message || t("Không tạo được phiếu hỗ trợ", "Cannot create support ticket"));
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count) => (
    <div className="stars-inline" aria-hidden>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= count ? "star tiny active" : "star tiny"}>★</span>
      ))}
    </div>
  );

  const getPhase = (order) => {
    const raw = (order?.deliveryPhase || order?.phase || "").toLowerCase();
    if (raw.includes("delivered")) return "delivered";
    if (raw.includes("deliver")) return "delivering";
    const status = (order?.status || "").toLowerCase();
    if (status.includes("delivered")) return "delivered";
    if (status.includes("deliver")) return "delivering";
    return "at_restaurant";
  };

  const phaseLabel = (phase) => {
    if (phase === "delivered") return t("Đã giao", "Delivered");
    if (phase === "delivering") return t("Đang giao", "Delivering");
    return t("Tại quán", "At restaurant");
  };

  const phaseClass = (phase) => {
    if (phase === "delivered") return "phase-delivered";
    if (phase === "delivering") return "phase-delivering";
    return "phase-at";
  };

  const deliveryLabel = (order) => {
    const mode = (order?.deliveryType || "").toLowerCase();
    return mode === "drone" ? t("Drone", "Drone") : t("Tài xế", "Driver");
  };

  const shortId = (order) => {
    const id = order?.orderRef || order?._id || "";
    if (!id) return "";
    return `#${id.slice(-6)}`;
  };

  return (
    <div className="my-orders">
      <div className="myorders-toolbar">
        <p className="myorders-hint">
          {t("Đơn gần nhất ở đầu danh sách.", "Latest order is at the top of the list.")}
        </p>
        <div className="toolbar-actions">
          <button
            className="ghost-btn"
            onClick={fetchOrders}
            disabled={loadingOrders}
            title={t("Làm mới", "Refresh")}
          >
            {loadingOrders ? t("Đang tải...", "Refreshing...") : t("Làm mới", "Refresh")}
          </button>
          <button
            className="jump-pill"
            onClick={highlightLatest}
            title={t("Tới đơn gần nhất", "Scroll to recent orders")}
            aria-label={t("Tới đơn gần nhất", "Scroll to recent orders")}
          >
            {t("Đơn mới", "Recent Order")}
          </button>
        </div>
      </div>

      <h2 className="myordersp">{t("Đơn hàng của tôi", "My Orders")}</h2>

      <div className="container">
        {data.map((order, index) => {
          const isFirst = index === 0;
          const items = Array.isArray(order?.items) ? order.items : [];
          const status = (order?.status || "Food Processing").toLowerCase();
          let statusClass = "status-processing";
          if (status.includes("out for delivery")) statusClass = "status-out";
          else if (status.includes("delivered")) statusClass = "status-delivered";

          const hasReview = status.includes("delivered");
          const ratingFood = order?.ratingFood;
          const ratingDriver = order?.ratingDriver;
          const hasRating = ratingFood || ratingDriver;
          const avgRating = hasRating
            ? Math.round(((Number(ratingFood || 0) + Number(ratingDriver || 0)) / 2) * 10) / 10
            : null;
          const phase = getPhase(order);
          const methodLabel = deliveryLabel(order);

          return (
            <div
              key={order?._id || index}
              className="my-orders-order"
              ref={isFirst ? latestRef : null}
            >
              <img src={assets.parcel_icon} alt="" />
              <p>
                {items.map((item, i) => {
                  const displayName =
                    lang === "vi"
                      ? (item?.name || t("Món", "Item"))
                      : (item?.nameEn || item?.name || t("Món", "Item"));
                  const piece = `${displayName} x ${item?.quantity ?? 0}`;
                  return i === items.length - 1 ? piece : piece + ", ";
                })}
                <span className="order-meta-line">
                  {shortId(order)} · {deliveryLabel(order)} · {translateStatus(order?.status)}
                </span>
              </p>
              <p>{formatPrice(order?.amount ?? 0)}</p>
              <p>
                {t("Món", "Items")}: {items.length}
              </p>
              <p className="status-cell">
                <span className={`status-badge ${statusClass}`}>
                  <span className="dot" aria-hidden />
                  {translateStatus(order?.status)}
                </span>
                {/* method hidden here to avoid duplicate row */}
              </p>
              {hasRating && (
                <div className="order-ratings">
                  <div className="rating-row">
                    <span>{t("Món", "Food")}:</span>
                    {renderStars(Number(ratingFood || 0))}
                  </div>
                  <div className="rating-row">
                    <span>{t("Tài xế", "Driver")}:</span>
                    {renderStars(Number(ratingDriver || 0))}
                  </div>
                  <div className="rating-row">
                    <span>{t("Trung bình", "Average")}:</span>
                    {renderStars(Math.round(Number(avgRating || 0)))}
                  </div>
                  <div className="rating-row score">
                    <span>{t("Điểm", "Score")}:</span>
                    <small className="avg-text">{avgRating || 0}/5</small>
                  </div>
                </div>
              )}

              <div className={`order-actions ${hasReview ? "triple" : "dual"}`}>
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => navigate(`/profile?orderId=${order?.orderRef || order?._id || ""}`)}
                  disabled={submitting}
                >
                  {t("Theo dõi", "Track")}
                </button>
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setSupportModal({ open: true, order, subject: `Order ${order._id}`, message: "" })}
                  disabled={submitting}
                >
                  {t("Hỗ Trợ", "Support")}
                </button>
                {hasReview && (
                  <button
                    type="button"
                    className="action-btn secondary"
                    onClick={() => setReviewModal({ open: true, order, ratingFood: 5, ratingDriver: 5, comment: "" })}
                    disabled={submitting}
                  >
                    {t("Đánh Giá", "Review")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {supportModal.open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>{t("Hỗ trợ đơn hàng", "Support request")}</h3>
            <label className="modal-label">
              {t("Tiêu đề", "Subject")}
              <input
                type="text"
                value={supportModal.subject}
                onChange={(e) => setSupportModal((m) => ({ ...m, subject: e.target.value }))}
              />
            </label>
            <label className="modal-label">
              {t("Nội dung", "Message")}
              <textarea
                rows="4"
                value={supportModal.message}
                onChange={(e) => setSupportModal((m) => ({ ...m, message: e.target.value }))}
              />
            </label>
            <div className="modal-actions">
              <button className="action-btn" onClick={() => setSupportModal({ open: false, order: null, subject: "", message: "" })}>
                {t("Huỷ", "Cancel")}
              </button>
              <button className="action-btn secondary" onClick={submitSupport} disabled={submitting}>
                {t("Gửi", "Send")}
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewModal.open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>{t("Đánh giá đơn hàng", "Rate your order")}</h3>
            <div className="rating-group">
              <p>{t("Chất lượng món", "Food quality")}</p>
              <div className="stars">
                {[1,2,3,4,5].map((star) => (
                  <button
                    key={`food-${star}`}
                    type="button"
                    className={star <= reviewModal.ratingFood ? "star active" : "star"}
                    onClick={() => setReviewModal((m) => ({ ...m, ratingFood: star }))}
                    aria-label={`${star} ${t("sao món", "stars for food")}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="rating-group">
              <p>{t("Tài xế/vận chuyển", "Driver / delivery")}</p>
              <div className="stars">
                {[1,2,3,4,5].map((star) => (
                  <button
                    key={`driver-${star}`}
                    type="button"
                    className={star <= reviewModal.ratingDriver ? "star active" : "star"}
                    onClick={() => setReviewModal((m) => ({ ...m, ratingDriver: star }))}
                    aria-label={`${star} ${t("sao tài xế", "stars for driver")}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <label className="modal-label">
              {t("Bình luận", "Comment")}
              <textarea
                rows="4"
                value={reviewModal.comment}
                onChange={(e) => setReviewModal((m) => ({ ...m, comment: e.target.value }))}
              />
            </label>
            <div className="modal-actions">
              <button className="action-btn" onClick={() => setReviewModal({ open: false, order: null, ratingFood: 5, ratingDriver: 5, comment: "" })}>
                {t("Huỷ", "Cancel")}
              </button>
              <button className="action-btn secondary" onClick={submitReview} disabled={submitting}>
                {t("Gửi", "Submit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
