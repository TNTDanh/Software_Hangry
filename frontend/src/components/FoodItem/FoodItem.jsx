import React, { useContext } from "react";
import "./FoodItem.css";
import { StoreContext } from "../../context/StoreContext";
import { LOCAL_MAP } from "../../assets/localImages";
import { assets } from "../../assets/assets";

// Format price with VND or USD fallback
const formatPrice = (amount, lang) => {
  const vnd = Number(amount) || 0;
  if (lang === "vi") return new Intl.NumberFormat("vi-VN").format(vnd) + " \u20ab";
  const usd = vnd / 24000;
  return `$${usd.toFixed(2)}`;
};

function getImgSrc(image, baseUrl) {
  if (!image) return "/food_item_2.png";
  if (LOCAL_MAP[image]) return LOCAL_MAP[image];
  if (typeof image === "string" && image.startsWith("http")) return image;
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const apiBase = baseUrl || API_URL;
  return `${apiBase}/images/${image}`;
}

function FoodItem({
  id,
  name,
  price,
  description,
  image,
  restaurantName,
  restaurantAddress,
  eta,
  restaurantNameEn,
  restaurantAddressEn,
}) {
  const { cartItems, addToCart, removeFromCart, url, lang } = useContext(StoreContext);
  const t = (vi, en) => (lang === "vi" ? vi : en);
  const src = getImgSrc(image, url);
  const qty = cartItems?.[id] || 0;

  const displayRestaurant = lang === "vi" ? restaurantName : restaurantNameEn || restaurantName;
  const displayAddress = lang === "vi" ? restaurantAddress : restaurantAddressEn || restaurantAddress;

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
          <img className="ratingstars" src={assets.rating_starts} alt="" aria-hidden="true" />
        </div>

        <p className="food-item-desc">{description}</p>

        <div className="food-meta-inline">
          {restaurantName ? (
            <div className="meta-item" title={displayRestaurant}>
              {t("Nh\u00e0 h\u00e0ng", "Restaurant")}: {displayRestaurant}
            </div>
          ) : null}
          {restaurantAddress ? (
            <div className="meta-item" title={displayAddress}>
              {t("\u0110\u1ecba ch\u1ec9", "Address")}: {displayAddress}
            </div>
          ) : null}
          {eta ? (
            <div className="meta-item">
              {t("D\u1ef1 ki\u1ebfn giao", "ETA")}: {eta}
            </div>
          ) : null}
        </div>

        <div className="food-item-bottom">
          <p className="food-item-price">{formatPrice(price, lang)}</p>

          {qty === 0 ? (
            <button
              className="inline-add-btn"
              onClick={() => addToCart(id)}
              aria-label={t("Th\u00eam v\u00e0o gi\u1ecf", "Add to cart")}
              title={t("Th\u00eam v\u00e0o gi\u1ecf", "Add to cart")}
              type="button"
            >
              {t("Th\u00eam", "Add")}
            </button>
          ) : (
            <div className="inline-counter" aria-label={t("S\u1ed1 l\u01b0\u1ee3ng", "Quantity")}>
              <button
                type="button"
                className="ctr-btn"
                onClick={() => removeFromCart(id)}
                aria-label={t("Gi\u1ea3m", "Decrease")}
                title={t("Gi\u1ea3m", "Decrease")}
              >
                &minus;
              </button>
              <span className="ctr-qty">{qty}</span>
              <button
                type="button"
                className="ctr-btn"
                onClick={() => addToCart(id)}
                aria-label={t("T\u0103ng", "Increase")}
                title={t("T\u0103ng", "Increase")}
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
