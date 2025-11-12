import React from 'react'
import './ExploreMenu.css'
import { menu_list } from '../../assets/assets'

const ExploreMenu = ({ category, setCategory }) => {
  const onPick = (name) => {
    setCategory((prev) => (prev === name ? 'All' : name))
  }

  return (
    <section className="explore-menu section" id="explore-menu">
      <h1 className="explore-title">Explore The Flavors</h1>
      <p className="explore-sub">
        From classics to new favorites — There’s something for everyone.
      </p>

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
              <span className="item_menu">{item.menu_name}</span>
            </button>
          )
        })}
      </div>

      <hr className="explore-divider" />
    </section>
  )
}

export default ExploreMenu
