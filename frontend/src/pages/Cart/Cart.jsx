import React, { useContext, useState } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import LoginPopup from "../../components/LoginPopup/LoginPopup";

const Cart = () => {
  const {
    cartItems,
    food_list,
    removeFromCart,
    addToCart,
    getTotalCartAmount,
    url,
    token,
    lang,
  } = useContext(StoreContext);
  const t = (vi, en) => (lang === "vi" ? vi : en);

  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);

  const removeAllOfItem = (id) => {
    const qty = cartItems[id] || 0;
    if (qty <= 0) return;
    for (let i = 0; i < qty; i++) removeFromCart(id);
  };

  const subtotal = Number(getTotalCartAmount?.()) || 0;
  const formatPrice = (amount) => {
    const vnd = Number(amount) || 0;
    if (lang === "vi") return new Intl.NumberFormat("vi-VN").format(vnd) + " ₫";
    const usd = vnd / 24000;
    return `$${usd.toFixed(2)}`;
  };

  return (
    <div className="cart">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>{t("Món", "Items")}</p>
          <p>{t("Tên", "Title")}</p>
          <p>{t("Giá", "Price")}</p>
          <p>{t("Số lượng", "Quantity")}</p>
          <p>{t("Thành tiền", "Total")}</p>
          <p>{t("Xóa", "Remove")}</p>
        </div>
        <br />
        <hr />
        {food_list.map((item) => {
          if (cartItems[item._id] > 0) {
            const imgSrc = item?.image ? url + "/images/" + item.image : "/header_img.png";
            const name = lang === "vi" && item.name ? item.name : item.nameEn || item.name;
            return (
              <div key={item._id}>
                <div className="cart-items-title cart-items-item">
                  <img
                    src={imgSrc}
                    alt={name || ""}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "/header_img.png";
                    }}
                  />
                  <p>{name}</p>
                  <p>{formatPrice(item.price)}</p>

                  <p>
                    <button
                      className="qty-btn"
                      onClick={() => removeFromCart(item._id)}
                      aria-label={t("Giảm số lượng", "Decrease quantity")}
                    >
                      −
                    </button>
                    <span className="qty-value" style={{ margin: "0 8px" }}>
                      {cartItems[item._id]}
                    </span>
                    <button
                      className="qty-btn"
                      onClick={() => addToCart(item._id)}
                      aria-label={t("Tăng số lượng", "Increase quantity")}
                    >
                      +
                    </button>
                  </p>

                  <p>{formatPrice(item.price * cartItems[item._id])}</p>

                  <p
                    onClick={() => {
                      if (window.confirm(t("Xóa món này khỏi giỏ?", "Remove this item from your cart?"))) {
                        removeAllOfItem(item._id);
                      }
                    }}
                    className="cross"
                    role="button"
                    aria-label={t("Xóa món", "Remove item")}
                    title={t("Xóa món", "Remove item")}
                  >
                    {t("Xóa", "Remove")}
                  </p>
                </div>
                <hr />
              </div>
            );
          }
          return null;
        })}
      </div>

      <div className="cart-bottom">
        <div className="cart-total">
          <h2>{t("Tổng đơn", "Cart Totals")}</h2>
          <div>
            <div className="cart-total-details">
              <p>{t("Tạm tính", "Subtotal")}</p>
              <p>{formatPrice(subtotal)}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>{t("Phí giao", "Delivery Fee")}</p>
              <p>{formatPrice(subtotal === 0 ? 0 : 20000)}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>{t("Tổng", "Total")}</b>
              <b>{formatPrice(subtotal === 0 ? 0 : subtotal + 20000)}</b>
            </div>
          </div>

          <div className="cart-actions">
            <button
              onClick={() => {
                if (subtotal === 0) {
                  alert(t("Giỏ hàng trống, hãy thêm món trước khi thanh toán.", "Your cart is empty. Please add some items before checking out."));
                  return;
                }
                if (!token) {
                  setShowLogin(true);
                  return;
                }
                navigate("/order");
              }}
              title={t("Thanh toán", "Order Payment")}
            >
              {t("Thanh toán", "Proceed to checkout")}
            </button>
            <button
              onClick={() => navigate("/#explore-menu")}
              title={t("Mua thêm", "Order More")}
            >
              {t("Mua thêm", "Order More")}
            </button>
          </div>
        </div>

        <div className="cart-promocode">
          <div>
            <p className="promocodep">
              🍽️ {t("Cảm ơn bạn đã chọn Hangry!", "Thanks for letting Hangry feed you!")}
            </p>
            <div className="cart-promocode-input">
              <p>{t("Thưởng thức thôi, đồ ăn đang trên đường tới.", "Kick back and relax—deliciousness is on the way.")}</p>
            </div>
          </div>
        </div>
      </div>

      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
    </div>
  );
};

export default Cart;
