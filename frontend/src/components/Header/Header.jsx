import React, { useContext } from 'react'
import './Header.css'
import { StoreContext } from '../../context/StoreContext'

const Header = () => {
  const { lang } = useContext(StoreContext)
  const t = (vi, en) => (lang === 'vi' ? vi : en)

  return (
    <div className='header'>
      <div className="header-contents">
        <h2>{t("HÔM NAY ĂN GÌ?", "WHAT TO EAT TODAY?")}</h2>
        <p>
          <i>
            {t(
              "Thưởng thức thực đơn đa dạng với nguyên liệu cao cấp, đánh thức vị giác và mang đến trải nghiệm ẩm thực tinh tế — mỗi bữa ăn là một niềm vui mới.",
              "Enjoy a varied menu with premium ingredients, awakening your taste buds and bringing a classy culinary experience — every meal is a new pleasure."
            )}
          </i>
        </p>
        <a href="#explore-menu"><button className='buttonwl'>{t("Xem menu", "View Menu")}</button></a>
      </div>
    </div>
  )
}

export default Header
