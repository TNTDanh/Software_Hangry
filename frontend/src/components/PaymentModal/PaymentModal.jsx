import React, { useContext, useMemo, useState } from "react";
import "./PaymentModal.css";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const PaymentModal = ({ onClose, draft }) => {
  const { cartItems, food_list, getTotalCartAmount, url, token, setCartItems, lang } =
    useContext(StoreContext);
  const t = (vi, en) => (lang === "vi" ? vi : en);
  const navigate = useNavigate();
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);

  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardProcessing, setCardProcessing] = useState(false);
  const [cardError, setCardError] = useState("");
  const [cardOrderCreated, setCardOrderCreated] = useState(false);

  const data = useMemo(() => {
    if (draft?.items && draft?.amount !== undefined) return draft;
    const items = [];
    food_list.forEach((item) => {
      const qty = cartItems[item._id] || 0;
      if (qty > 0) items.push({ ...item, quantity: qty });
    });
    const sub = getTotalCartAmount?.() || 0;
    const deliveryFee = items.length ? 20000 : 0;
    return {
      address: {},
      items,
      amount: sub + deliveryFee,
      subTotal: sub,
      deliveryFee,
      promoDiscount: 0,
      deliveryType: "driver",
    };
  }, [draft, food_list, cartItems, getTotalCartAmount]);

  const subtotal = Number(data.subTotal ?? data.amount ?? 0);
  const delivery = Number(data.deliveryFee || 0);
  const discount = Number(data.promoDiscount || 0);
  const total = Number(data.total ?? data.amount ?? subtotal + delivery - discount);
  const formatPrice = (amount) => {
    const vnd = Number(amount) || 0;
    if (lang === "vi") return new Intl.NumberFormat("vi-VN").format(vnd) + " ₫";
    const usd = vnd / 24000;
    return `$${usd.toFixed(2)}`;
  };

  const resetCardForm = () => {
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setCardProcessing(false);
    setCardError("");
    setCardOrderCreated(false);
  };

  const handleClose = () => {
    setCardModalVisible(false);
    resetCardForm();
    onClose?.();
  };

  const handleMethodChange = (next) => {
    setMethod(next);
    if (next === "cod") {
      setCardModalVisible(false);
      resetCardForm();
    }
  };

  const handleExpiryChange = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    setCardExpiry(formatted);
    if (cardError) setCardError("");
  };

  const finishOrder = (message) => {
    setCartItems?.({});
    alert(message);
    navigate("/myorders");
    handleClose();
  };

  const handleMockCardPayment = () => {
    const normalizedCard = cardNumber.replace(/\s+/g, "");
    const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (
      !cardOrderCreated ||
      !cardName.trim() ||
      normalizedCard.length < 12 ||
      !expiryPattern.test(cardExpiry.trim()) ||
      cardCvv.trim().length < 3
    ) {
      setCardError(t("Vui lòng nhập đủ thông tin thẻ.", "Please enter complete and valid card information."));
      return;
    }

    setCardProcessing(true);
    setTimeout(() => {
      setCardProcessing(false);
      setCardModalVisible(false);
      resetCardForm();
      finishOrder(t("Thanh toán thẻ thành công", "Payment Successful (Card)"));
    }, 900);
  };

  const place = async () => {
    if (!data.items?.length) {
      alert(t("Giỏ hàng trống...", "Cart is empty..."));
      handleClose();
      return;
    }

    const payload = {
      address: data.address || {},
      items: data.items.map((i) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        restaurantId: i.restaurantId,
      })),
      amount: total,
      subTotal: subtotal,
      deliveryFee: delivery,
      promoCode: data.promoCode,
      promoDiscount: discount,
      deliveryType: data.deliveryType || "driver",
      total,
      paymentMethod: method,
    };

    if (method === "card") {
      setLoading(true);
      try {
        await axios.post(`${url}/api/order/place`, payload, { headers: { token } });
        setCardOrderCreated(true);
        setCardModalVisible(true);
      } catch (err) {
        alert(err?.response?.data?.message || err.message || t("Không thể tạo đơn.", "Unable to create order."));
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${url}/api/order/place-cod`, payload, { headers: { token } });
      finishOrder(t("Đặt COD thành công", "Order Successful (COD)"));
    } catch (err) {
      alert(err?.response?.data?.message || t("Đặt COD thất bại", "COD Order failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-modal" role="dialog" aria-modal="true">
      <div className="payment-box">
        <div className="payment-header">
          <h3>{t("Thanh toán", "Payment")}</h3>
          <button className="close" onClick={handleClose} aria-label={t("Đóng", "Close")}>
            ×
          </button>
        </div>

        <div className="payment-content">
          <div className="summary card">
            <p className="section-title">{t("Tóm tắt đơn", "Order Summary")}</p>
            <ul className="items">
              {data.items?.map((it, idx) => {
                const title = lang === "vi" ? (it.name || it.nameVi) : (it.nameEn || it.name);
                return (
                  <li key={idx}>
                    <span>{title}</span>
                    <span>x{it.quantity}</span>
                    <span>{formatPrice(it.price)}</span>
                  </li>
                );
              })}
              {!data.items?.length && <li className="muted">{t("Không có món", "No items")}</li>}
            </ul>

            <div className="totals">
              <div className="row">
                <span>{t("Tạm tính", "Subtotal")}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="row">
                <span>{t("Phí giao", "Delivery")}</span>
                <span>{formatPrice(delivery)}</span>
              </div>
              <div className="row">
                <span>{t("Giảm giá", "Discount")}</span>
                <span>-{formatPrice(discount)}</span>
              </div>
              <div className="row total">
                <b>{t("Tổng", "Total")}</b>
                <b>{formatPrice(total)}</b>
              </div>
            </div>
          </div>

          <div className="methods card">
            <p className="section-title">{t("Phương thức thanh toán", "Payment Method")}</p>

            <label className="pm-option">
              <input
                type="radio"
                name="pm"
                value="card"
                checked={method === "card"}
                onChange={() => handleMethodChange("card")}
              />
              <span>{t("Thẻ (Stripe)", "Credit/Debit Card (Stripe)")}</span>
            </label>

            <label className="pm-option">
              <input
                type="radio"
                name="pm"
                value="cod"
                checked={method === "cod"}
                onChange={() => handleMethodChange("cod")}
              />
              <span>{t("Thanh toán khi nhận (COD)", "Cash on Delivery (COD)")}</span>
            </label>

            <button
              className="pay-btn"
              onClick={place}
              disabled={loading || !data.items?.length}
              title={t("Xác nhận đặt hàng", "Confirm and place order")}
            >
              {loading ? t("Đang xử lý...", "Processing...") : t("Xác nhận thanh toán", "Confirm Payment")}
            </button>

            <button className="back-btn" type="button" onClick={handleClose}>
              {t("Hủy", "Cancel")}
            </button>
          </div>
        </div>
      </div>

      {cardModalVisible && (
        <div className="card-modal-overlay" role="dialog" aria-modal="true">
          <div className="card-modal">
            <div className="card-modal-header">
              <h4>{t("Nhập thông tin thẻ", "Enter Card Information")}</h4>
              <button
                type="button"
                onClick={() => {
                  setCardModalVisible(false);
                  resetCardForm();
                }}
                aria-label={t("Đóng form thẻ", "Close card form")}
              >
                ×
              </button>
            </div>

            <div className="card-modal-body">
              <label className="card-field">
                <span>{t("Tên trên thẻ", "Name on Card")}</span>
                <input
                  type="text"
                  value={cardName}
                  placeholder="John Doe"
                  autoComplete="off"
                  onChange={(e) => {
                    setCardName(e.target.value);
                    if (cardError) setCardError("");
                  }}
                />
              </label>

              <label className="card-field">
                <span>{t("Số thẻ", "Card Number")}</span>
                <input
                  type="text"
                  value={cardNumber}
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  autoComplete="off"
                  onChange={(e) => {
                    setCardNumber(e.target.value);
                    if (cardError) setCardError("");
                  }}
                />
              </label>

              <div className="card-field-row compact">
                <label className="card-field">
                  <span>{t("Hết hạn (MM/YY)", "Expiry (MM/YY)")}</span>
                  <input
                    type="text"
                    value={cardExpiry}
                    inputMode="numeric"
                    placeholder="12/34"
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    autoComplete="off"
                  />
                </label>
                <label className="card-field cvv-field">
                  <span>CVV</span>
                  <input
                    type="password"
                    className="cvv-input"
                    value={cardCvv}
                    inputMode="numeric"
                    placeholder="123"
                    autoComplete="off"
                    onChange={(e) => {
                      setCardCvv(e.target.value);
                      if (cardError) setCardError("");
                    }}
                  />
                </label>
              </div>

              {cardError && <p className="card-error">{cardError}</p>}

              <button className="card-pay-btn" onClick={handleMockCardPayment} disabled={cardProcessing}>
                {cardProcessing ? t("Đang xử lý...", "Processing...") : t("Thanh toán", "Pay now")}
              </button>

              <button
                className="card-cancel-btn"
                type="button"
                onClick={() => {
                  setCardModalVisible(false);
                  resetCardForm();
                }}
              >
                {t("Hủy", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentModal;
