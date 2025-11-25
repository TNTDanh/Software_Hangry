import React, { useContext, useMemo } from 'react'
import './FoodDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'

const FoodDisplay = ({ category }) => {
  const { food_list, restaurants, lang } = useContext(StoreContext)

  const t = (vi, en) => (lang === "vi" ? vi : en)

  const items = useMemo(
    () => food_list.filter(i => category === 'All' || i.category === category),
    [food_list, category]
  )

  const getRestaurant = (id) => restaurants.find(r => r._id === id)

  return (
    <section className="food-display section" id="food-display">
      <h2 className="food-display-title">{t("Gợi ý món dành cho bạn", "Top Dishes You Might Like")}</h2>

      {items.length === 0 && (
        <p className="no-items">{t("Chưa có món nào trong danh sách này.", "No items available.")}</p>
      )}

      <div className="food-display-list">
        {items.map((item) => {
          const restaurant = getRestaurant(item.restaurantId);
          const desc =
            lang === "vi" && item.descriptionVi
              ? item.descriptionVi
              : item.description;
          const title = lang === "vi" && item.name ? item.name : item.nameEn || item.name;
          return (
            <div className="food-card" key={item._id}>
              <FoodItem
                id={item._id}
                name={title}
                description={desc}
                price={item.price}
                image={item.image}
                restaurantName={restaurant?.name}
                restaurantNameEn={restaurant?.nameEn}
                restaurantAddress={restaurant?.address}
                restaurantAddressEn={restaurant?.addressEn}
                eta="25-35'"
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default FoodDisplay
