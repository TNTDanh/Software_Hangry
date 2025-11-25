import React, { useEffect, useState, useContext, useMemo } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import PaymentModal from "../../components/PaymentModal/PaymentModal";
import axios from "axios";

const PlaceOrder = () => {
  const {
    getTotalCartAmount,
    token,
    food_list,
    cartItems,
    lang,
    restaurants,
  } = useContext(StoreContext);
  const t = (vi, en) => (lang === "vi" ? vi : en);

  const savedEmail = (typeof window !== "undefined" && localStorage.getItem("userEmail")) || "";
  const savedPhone = (typeof window !== "undefined" && localStorage.getItem("userPhone")) || "";

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: savedEmail,
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: savedPhone,
  });

  const [showPayment, setShowPayment] = useState(false);
  const [draft, setDraft] = useState(null);
  const [deliveryType, setDeliveryType] = useState("driver");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [applying, setApplying] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");

  const navigate = useNavigate();

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const orderItems = useMemo(() => {
    const items = [];
    food_list.forEach((item) => {
      const qty = cartItems[item._id] || 0;
      if (qty > 0) items.push({ ...item, quantity: qty });
    });
    return items;
  }, [food_list, cartItems]);

  const firstRestaurantId = orderItems[0]?.restaurantId || null;
  const firstCityId = orderItems[0]?.cityId || null;

  const uniqueRestaurantIds = Array.from(
    new Set(orderItems.map((it) => it.restaurantId).filter(Boolean))
  );
  const restaurantModes = uniqueRestaurantIds.map((rid) => {
    const found = restaurants?.find((r) => r._id === rid);
    return found?.deliveryModes?.length ? found.deliveryModes : ["driver"];
  });

  // Allowed delivery methods = giao chung cho tất cả quán trong giỏ (giao cắt)
  const allowedDeliveryModes = restaurantModes.reduce((acc, modes) => {
    if (!acc) return modes;
    return acc.filter((m) => modes.includes(m));
  }, null) || ["driver"];

  const DELIVERY_FEES = {
    driver: 20000,
    drone: 30000,
  };

  const subtotal = useMemo(() => getTotalCartAmount(), [getTotalCartAmount, cartItems, food_list]);
  const delivery = subtotal === 0 ? 0 : DELIVERY_FEES[deliveryType] || 0;
  const total = Math.max(0, subtotal + delivery - promoDiscount);
  const formatPrice = (amount) => {
    const vnd = Number(amount) || 0;
    if (lang === "vi") return new Intl.NumberFormat("vi-VN").format(vnd) + " ₫";
    const usd = vnd / 24000;
    return `$${usd.toFixed(2)}`;
  };

  const applyPromo = async () => {
    if (!promoCode?.trim()) {
      setPromoMessage(t("Nhập mã khuyến mãi", "Enter a promo code"));
      return;
    }
    setApplying(true);
    try {
      const body = {
        code: promoCode.trim(),
        subTotal: subtotal,
        restaurantId: firstRestaurantId,
        cityId: firstCityId,
      };
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/promo/apply`,
        body
      );
      if (res.data?.success) {
        setPromoDiscount(res.data.discount || 0);
        setPromoMessage(t("Áp dụng thành công", "Applied") + ` ${promoCode.toUpperCase()}`);
      } else {
        setPromoDiscount(0);
        setPromoMessage(res.data?.message || t("Mã không hợp lệ", "Promo not valid"));
      }
    } catch (err) {
      setPromoDiscount(0);
      setPromoMessage(err?.response?.data?.message || t("Không áp dụng được mã", "Cannot apply code"));
    } finally {
      setApplying(false);
    }
  };

  // Ensure selected delivery type is allowed for this restaurant
  useEffect(() => {
    if (!allowedDeliveryModes.includes(deliveryType)) {
      setDeliveryType(allowedDeliveryModes[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueRestaurantIds.join(","), allowedDeliveryModes.join(",")]);

  const openPayment = (event) => {
    event.preventDefault();

    if (data?.phone) localStorage.setItem("userPhone", data.phone);

    const orderData = {
      address: data,
      items: orderItems,
      amount: total,
      subTotal: subtotal,
      deliveryFee: delivery,
      promoCode,
      promoDiscount,
      deliveryType,
    };

    setDraft(orderData);
    setShowPayment(true);
    document.body.classList.add("modal-open");
  };

  useEffect(() => {
    if (!token) {
      navigate("/cart");
    } else if (getTotalCartAmount() === 0) {
      navigate("/cart");
    }
  }, [token]);

  return (
    <>
      <form onSubmit={openPayment} className="place-order layout">
        <div className="place-order-left form-card">
          <h2 className="po-title">{t("Thông tin giao hàng", "Delivery Information")}</h2>

          <div className="field-grid two">
            <div className="field">
              <label htmlFor="firstName">{t("Họ", "First Name")}</label>
              <input
                id="firstName"
                required
                name="firstName"
                value={data.firstName}
                onChange={onChangeHandler}
                type="text"
                placeholder={t("Nguyễn", "John")}
              />
            </div>
            <div className="field">
              <label htmlFor="lastName">{t("Tên", "Last Name")}</label>
              <input
                id="lastName"
                required
                name="lastName"
                value={data.lastName}
                onChange={onChangeHandler}
                type="text"
                placeholder={t("Văn A", "Doe")}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              required
              name="email"
              value={data.email}
              onChange={onChangeHandler}
              type="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="field">
            <label htmlFor="street">{t("Địa chỉ", "Street")}</label>
            <input
              id="street"
              required
              name="street"
              value={data.street}
              onChange={onChangeHandler}
              type="text"
              placeholder={t("123 Lê Lợi", "123 Main St")}
            />
          </div>

          <div className="field-grid two">
            <div className="field">
              <label htmlFor="city">{t("Thành phố", "City")}</label>
              <input
                id="city"
                required
                name="city"
                value={data.city}
                onChange={onChangeHandler}
                type="text"
                placeholder={t("TP.HCM", "City")}
              />
            </div>
            <div className="field">
              <label htmlFor="state">{t("Quận/Huyện", "State")}</label>
              <input
                id="state"
                required
                name="state"
                value={data.state}
                onChange={onChangeHandler}
                type="text"
                placeholder={t("Quận 1", "State")}
              />
            </div>
          </div>

          <div className="field-grid two">
            <div className="field">
              <label htmlFor="zipcode">{t("Mã bưu chính", "Zip code")}</label>
              <input
                id="zipcode"
                required
                name="zipcode"
                value={data.zipcode}
                onChange={onChangeHandler}
                type="text"
                placeholder="00000"
              />
            </div>
            <div className="field">
              <label htmlFor="country">{t("Quốc gia", "Country")}</label>
              <input
                id="country"
                required
                name="country"
                value={data.country}
                onChange={onChangeHandler}
                type="text"
                placeholder={t("Việt Nam", "Country")}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="phone">{t("Số điện thoại", "Phone")}</label>
            <input
              id="phone"
              required
              name="phone"
              value={data.phone}
              onChange={onChangeHandler}
              type="text"
              placeholder="+84 123 456 789"
            />
          </div>
        </div>

        <div className="place-order-right form-card">
          <h2 className="po-title">{t("Tóm tắt đơn", "Order Summary")}</h2>

          <div className="summary-box fancy-border">
            <div className="row">
              <span>{t("Tạm tính", "Subtotal")}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="row">
              <span>{t("Phí giao", "Delivery Fee")}</span>
              <span>{formatPrice(delivery)}</span>
            </div>
            <div className="row">
              <span>{t("Giảm giá", "Discount")}</span>
              <span>- {formatPrice(promoDiscount)}</span>
            </div>
            <div className="row total">
              <b>{t("Tổng", "Total")}</b>
              <b>{formatPrice(total)}</b>
            </div>
          </div>

          <div className="field">
            <label>{t("Hình thức giao", "Delivery Method")}</label>
            <div className="pill-group">
              {allowedDeliveryModes.includes("driver") && (
                <button
                  type="button"
                  className={deliveryType === "driver" ? "pill active" : "pill"}
                  onClick={() => setDeliveryType("driver")}
                >
                  {t("Tài xế", "Driver")} ({formatPrice(DELIVERY_FEES.driver)})
                </button>
              )}
              {allowedDeliveryModes.includes("drone") && (
                <button
                  type="button"
                  className={deliveryType === "drone" ? "pill active" : "pill"}
                  onClick={() => setDeliveryType("drone")}
                >
                  {t("Drone", "Drone")} ({formatPrice(DELIVERY_FEES.drone)})
                </button>
              )}
            </div>
          </div>

          <div className="field promo-field">
            <label htmlFor="promo">{t("Mã khuyến mãi", "Promo code")}</label>
            <div className="promo-input-row">
              <input
                id="promo"
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="WELCOME10"
              />
              <button type="button" onClick={applyPromo} disabled={applying}>
                {applying ? t("Đang áp dụng...", "Applying...") : t("Áp dụng", "Apply")}
              </button>
            </div>
            {promoMessage && <p className="promo-hint">{promoMessage}</p>}
          </div>

          <button type="submit" className="primary-btn" title={t("Thanh toán", "Go to checkout")}>
            {t("Thanh toán", "Proceed to checkout")}
          </button>

          <div className="promo-card">
            <div className="promo-left">
              <span className="promo-emoji" aria-hidden>🍽️</span>
              <div>
                <p className="promo-title">
                  {t("Cảm ơn bạn đã chọn Hangry!", "Thanks for letting Hangry feed your hunger!")}
                </p>
              </div>
            </div>
            <div className="promo-right">
              <p className="promo-text">
                {t("Thưởng thức thôi, đồ ăn đang trên đường tới.", "Kick back and relax—deliciousness is on the way.")}
              </p>
            </div>
          </div>
        </div>
      </form>

      {showPayment && (
        <PaymentModal
          draft={draft}
          onClose={() => {
            setShowPayment(false);
            document.body.classList.remove("modal-open");
          }}
        />
      )}
    </>
  );
};

export default PlaceOrder;
