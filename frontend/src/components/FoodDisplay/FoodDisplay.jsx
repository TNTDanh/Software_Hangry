import React, { useContext, useMemo } from 'react'
import './FoodDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'

const FoodDisplay = ({ category }) => {
  const { food_list } = useContext(StoreContext)

  // Giữ logic cũ: All hoặc trùng category
  const items = useMemo(
    () => food_list.filter(i => category === 'All' || i.category === category),
    [food_list, category]
  )

  return (
    <section className="food-display section" id="food-display">
      <h2 className="food-display-title">Top Dishes You Might Like</h2>

      <div className="food-display-list">
        {items.map((item) => (
          <FoodItem
            key={item._id}
            id={item._id}
            name={item.name}
            description={item.description}
            price={item.price}
            image={item.image}
          />
        ))}
      </div>
    </section>
  )
}

export default FoodDisplay
