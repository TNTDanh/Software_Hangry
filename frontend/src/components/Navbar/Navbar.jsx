import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'

const Navbar = ({ setShowLogin }) => {
  const { getTotalCartAmount, token, setToken, cartItems } = useContext(StoreContext)
  const [mode, setMode] = useState('dark')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [elevated, setElevated] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Dot giỏ ổn định: theo quantity hoặc amount
  const hasItems = useMemo(() => {
    const qty = cartItems
      ? Object.values(cartItems).reduce((acc, v) => acc + (Number(v) > 0 ? Number(v) : 0), 0)
      : 0
    const hasAmount = Number(getTotalCartAmount?.()) > 0
    return qty > 0 || hasAmount
  }, [cartItems, getTotalCartAmount])

  useEffect(() => {
    const stored = localStorage.getItem('mode')
    const next = stored === 'light' ? 'light' : 'dark'
    setMode(next)
    if (next === 'light') document.body.classList.add('lightcolors')
    else document.body.classList.remove('lightcolors')
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset
      setElevated(y > 8)
      setShowScrollTop(y > 300)
    }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleMode = () => {
    const next = mode === 'light' ? 'dark' : 'light'
    setMode(next)
    localStorage.setItem('mode', next)
    if (next === 'light') document.body.classList.add('lightcolors')
    else document.body.classList.remove('lightcolors')
  }

  const logout = () => {
    if (!window.confirm('Are you sure you want to Log Out?')) return
    localStorage.removeItem('token')
    setToken('')
    navigate('/')
  }

  const isActive = (path) => location.pathname === path
  const closeMobile = () => setMobileOpen(false)

  const handleOrdersClick = (e) => {
    if (!token) {
      e.preventDefault()
      setShowLogin?.(true)
    }
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <>
      <header className={`site-navbar ${elevated ? 'elevated' : 'at-top'}`}>
        <div className="nav-inner">
          {/* Left: Logo */}
          <div className="nav-left">
            <Link to="/" className="brand" onClick={closeMobile}>
              <img src={assets.logo} alt="Hangry" className="brand-logo" />
            </Link>
          </div>

          {/* Center */}
          <nav className={`nav-center ${mobileOpen ? 'open' : ''}`} aria-label="Primary">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={closeMobile}>
              HOME
            </Link>
            <Link to="/#explore-menu" className="nav-link" onClick={closeMobile}>
              MENU
            </Link>
            <Link to="/#app-download" className="nav-link" onClick={closeMobile}>
              MOBILE - APP
            </Link>
            <Link to="/#footer" className="nav-link" onClick={closeMobile}>
              CONTACT - US
            </Link>
            <Link
              to="/myorders"
              className="nav-link"
              onClick={(e) => { handleOrdersClick(e); closeMobile() }}
              title={token ? 'My Orders' : 'Đăng nhập để xem đơn hàng'}
            >
              MY - ORDERS
            </Link>
          </nav>

          {/* Right: Cart (trước) + Mode + Auth + Hamburger */}
          <div className="nav-right">
            <Link
              to="/cart"
              className="cart-link"
              aria-label="Cart"
              onClick={() => setMobileOpen(false)}
            >
              <img className="basketlogo" src={assets.basket_icon} alt="" />
              <div className={hasItems ? 'dot' : 'dot hide'} />
            </Link>

            <button
              className="mode-btn"
              onClick={toggleMode}
              title={mode === 'light' ? 'Switch to Dark' : 'Switch to Light'}
              aria-label="Toggle theme"
            >
              {mode === 'light' ? '☀️' : '🌙'}
            </button>

            {!token ? (
              <button className="sign-btn" onClick={() => setShowLogin(true)}>
                SIGN IN
              </button>
            ) : (
              <div className="profile-wrap">
                <button className="profile-btn" aria-haspopup="menu" aria-expanded="false">
                  <img src={assets.profile_icon} alt="" />
                </button>
                <ul className="profile-menu" role="menu">
                  <li role="menuitem" onClick={logout}>
                    <img src={assets.logout_icon} alt="" />
                    <p>Logout</p>
                  </li>
                </ul>
              </div>
            )}

            <button
              className="hamburger"
              aria-label="Open menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* spacer để nội dung không bị che khi navbar fixed */}
      <div className="navbar-offset" />

      {showScrollTop && (
        <button className="scroll-top" onClick={scrollToTop} title="Lên đầu trang" aria-label="Scroll to top">
          ↑
        </button>
      )}
    </>
  )
}

export default Navbar
