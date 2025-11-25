import React, { useState, useContext } from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import AppDownload from '../../components/AppDownload/AppDownload'
import { StoreContext } from '../../context/StoreContext'

const Home = () => {

    const [category,setCategory] = useState("All");
    const {
      cities,
      restaurants,
      selectedCity,
      setSelectedCity,
      selectedRestaurant,
      setSelectedRestaurant,
      lang,
      setLang,
    } = useContext(StoreContext);

  return (
    <div>
        <Header/>
        <ExploreMenu
          category={category}
          setCategory={setCategory}
          cities={cities}
          restaurants={restaurants}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
          selectedRestaurant={selectedRestaurant}
          setSelectedRestaurant={setSelectedRestaurant}
          lang={lang}
          setLang={setLang}
        />
        <FoodDisplay category={category}/>
        <AppDownload/>
    </div>
  )
}

export default Home
