import React from 'react'
import './ExploreMenu.css'
import { menu_list } from '../../assets/assets'

const ExploreMenu = ({
  category,
  setCategory,
  cities = [],
  restaurants = [],
  selectedCity,
  setSelectedCity,
  selectedRestaurant,
  setSelectedRestaurant,
  lang = "vi",
}) => {
  const onPick = (name) => {
    setCategory((prev) => (prev === name ? 'All' : name))
  }

  const t = (vi, en) => (lang === "vi" ? vi : en)
  const catLabel = (name) => {
    const map = {
      "Salad": "Salad",
      "Rolls": "Cuốn",
      "Deserts": "Tráng Miệng",
      "Sandwich": "Bánh Mì",
      "Cake": "Bánh Ngọt",
      "Pure Veg": "Món Chay",
      "Pasta": "Pasta",
      "Noodles": "Mì/Phở"
    };
    if (lang === "vi") return map[name] || name;
    return name;
  }

  const renderCityName = (c) => {
    if (c._id === "all") return t("Tất cả thành phố", "All cities");
    return lang === "vi" ? c.name : (c.nameEn || c.name);
  }
  const renderRestName = (r) => {
    if (r._id === "all") return t("Tất cả nhà hàng", "All restaurants");
    return lang === "vi" ? r.name : (r.nameEn || r.name);
  }

  return (
    <section className="explore-menu section" id="explore-menu">
      <h1 className="explore-title">{t("Khám phá hương vị", "Explore The Flavors")}</h1>
      <p className="explore-sub">{t("Chọn thành phố & nhà hàng để xem đúng menu.", "Pick a city & restaurant to see the right menu.")}</p>

      <div className="location-row">
        <div className="select-box">
          <label htmlFor="city-select">{t("Thành phố", "City")}</label>
          <select
            id="city-select"
            value={selectedCity || ''}
            onChange={(e) => {
              setSelectedCity?.(e.target.value || null)
              setSelectedRestaurant?.(null)
            }}
          >
            {cities.map((c) => (
              <option key={c._id} value={c._id}>{renderCityName(c)}</option>
            ))}
          </select>
        </div>

        <div className="select-box">
          <label htmlFor="rest-select">{t("Nhà hàng", "Restaurant")}</label>
          <select
            id="rest-select"
            value={selectedRestaurant || ''}
            onChange={(e) => setSelectedRestaurant?.(e.target.value || null)}
          >
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>{renderRestName(r)}</option>
            ))}
            {!restaurants.length && <option value="">{t("Chưa có nhà hàng", "No restaurant")}</option>}
          </select>
        </div>
      </div>

      <div className="explore-menu-list">
        {menu_list.map((item, idx) => {
          const active = category === item.menu_name
          return (
            <button
              key={idx}
              type="button"
              className={`explore-item ${active ? 'active' : ''}`}
              onClick={() => onPick(item.menu_name)}
              title={item.menu_name}
              aria-pressed={active}
            >
              <span className="thumb-wrap">
                <img
                  src={item.menu_image}
                  alt={item.menu_name}
                  className="thumb"
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span className="item_menu">{catLabel(item.menu_name)}</span>
            </button>
          )
        })}
      </div>

      <hr className="explore-divider" />
    </section>
  )
}

export default ExploreMenu
