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
  } = useContext(StoreContext);

  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);

  const removeAllOfItem = (id) => {
    const qty = cartItems[id] || 0;
    if (qty <= 0) return;
    for (let i = 0; i < qty; i++) removeFromCart(id);
  };

  const subtotal = Number(getTotalCartAmount?.()) || 0;

  return (
    <div className="cart">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Cancel</p>
        </div>
        <br />
        <hr />
        {food_list.map((item) => {
          if (cartItems[item._id] > 0) {
            const imgSrc = item?.image
              ? url + "/images/" + item.image
              : "/header_img.png";

            return (
              <div key={item._id}>
                <div className="cart-items-title cart-items-item">
                  <img
                    src={imgSrc}
                    alt={item.name || ""}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "/header_img.png";
                    }}
                  />
                  <p>{item.name}</p>
                  <p>${item.price}</p>

                  <p>
                    <button
                      className="qty-btn"
                      onClick={() => removeFromCart(item._id)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="qty-value" style={{ margin: "0 8px" }}>
                      {cartItems[item._id]}
                    </span>
                    <button
                      className="qty-btn"
                      onClick={() => addToCart(item._id)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </p>

                  <p>${item.price * cartItems[item._id]}</p>

                  <p
                    onClick={() => {
                      if (window.confirm("Remove this item from your cart?")) {
                        removeAllOfItem(item._id);
                      }
                    }}
                    className="cross"
                    role="button"
                    aria-label="Remove item"
                    title="Remove item"
                  >
                    Remove 🗑️
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
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>${subtotal}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>${subtotal === 0 ? 0 : 2}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>${subtotal === 0 ? 0 : subtotal + 2}</b>
            </div>
          </div>

          <div className="cart-actions">
            <button
              onClick={() => {
                if (!token) {
                  setShowLogin(true);
                  return;
                }
                navigate("/order");
              }}
              title="Order Payment"
            >
              PROCEED TO CHECKOUT
            </button>
            <button
              onClick={() => navigate("/#explore-menu")}
              title="Order More"
            >
              ORDER MORE
            </button>
          </div>
        </div>

        <div className="cart-promocode">
          <div>
            <p className="promocodep">
              😋 Thanks for letting Hangry App feed your hunger!
            </p>
            <div className="cart-promocode-input">
              <p>Kick back and relax — deliciousness is on the way 🚗💨</p>
            </div>
          </div>
        </div>
      </div>

      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
    </div>
  );
};

export default Cart;
