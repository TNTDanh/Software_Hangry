import React from 'react'
import './Header.css'

const Header = () => {
  return (
    <div className='header'>
        <div className="header-contents">
            <h2>WHAT TO EAT TODAY !???</h2>
            <p><i>Enjoy a varied menu with dishes made from premium ingredients, awakening the taste buds and bringing a classy culinary experience — every meal is a new pleasure.</i></p>
            <a href="#explore-menu"><button className='buttonwl'>View Menu</button></a>
        </div>
    </div>
  )
}

export default Header