import React, { useContext } from "react";
import "./FoodItem.css";
import { StoreContext } from "../../context/StoreContext";
import { LOCAL_MAP } from "../../assets/localImages";
import { assets } from "../../assets/assets";

function getImgSrc(image, baseUrl) {
  if (!image) return "/food_item_2.png";
  if (LOCAL_MAP[image]) return LOCAL_MAP[image];
  if (typeof image === "string" && image.startsWith("http")) return image;

  const apiBase =
    baseUrl ||
    import.meta.env.VITE_API_URL ||
    "https://hangry-backend.onrender.com";
  return `${apiBase}/images/${image}`;
}

function FoodItem({ id, name, price, description, image }) {
  const { cartItems, addToCart, removeFromCart, url } =
    useContext(StoreContext);
  const src = getImgSrc(image, url);
  const qty = cartItems?.[id] || 0;

  return (
    <div className="food-item">
      <div className="food-item-img-container">
        <img
          className="food-item-image"
          src={src}
          alt={name || ""}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = "/food_item_2.png";
          }}
        />
      </div>

      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p className="namewe" title={name || ""}>
            {name}
          </p>
          <img
            className="ratingstars"
            src={assets.rating_starts}
            alt=""
            aria-hidden="true"
          />
        </div>

        <p className="food-item-desc">{description}</p>

        {/* Hàng dưới: giá + nút add / counter */}
        <div className="food-item-bottom">
          <p className="food-item-price">${price}</p>

          {qty === 0 ? (
            <button
              className="inline-add-btn"
              onClick={() => addToCart(id)}
              aria-label="Add to cart"
              title="Add to cart"
              type="button"
            >
              ADD
            </button>
          ) : (
            <div className="inline-counter" aria-label="Quantity">
              <button
                type="button"
                className="ctr-btn"
                onClick={() => removeFromCart(id)}
                aria-label="Decrease"
                title="Decrease"
              >
                −
              </button>
              <span className="ctr-qty">{qty}</span>
              <button
                type="button"
                className="ctr-btn"
                onClick={() => addToCart(id)}
                aria-label="Increase"
                title="Increase"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FoodItem;
