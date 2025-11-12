import React, { useEffect, useState, useContext } from 'react'
import './PlaceOrder.css'
import { StoreContext } from '../../context/StoreContext'
import { useNavigate } from 'react-router-dom'
import PaymentModal from '../../components/PaymentModal/PaymentModal'

const PlaceOrder = () => {
  const { getTotalCartAmount, token, food_list, cartItems } = useContext(StoreContext)

  const savedEmail = (typeof window !== 'undefined' && localStorage.getItem('userEmail')) || ''
  const savedPhone = (typeof window !== 'undefined' && localStorage.getItem('userPhone')) || ''

  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: savedEmail,
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phone: savedPhone,
  })

  const [showPayment, setShowPayment] = useState(false)
  const [draft, setDraft] = useState(null)

  const navigate = useNavigate()

  const onChangeHandler = (event) => {
    const { name, value } = event.target
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const openPayment = (event) => {
    event.preventDefault()

    // lưu phone cho lần sau
    if (data?.phone) localStorage.setItem('userPhone', data.phone)

    const orderItems = []
    food_list.forEach((item) => {
      const qty = cartItems[item._id] || 0
      if (qty > 0) orderItems.push({ ...item, quantity: qty })
    })

    const orderData = {
      address: data,
      items: orderItems,
      amount: (getTotalCartAmount?.() || 0) + (orderItems.length ? 2 : 0),
    }

    setDraft(orderData)
    setShowPayment(true)
    document.body.classList.add('modal-open')
  }

  useEffect(() => {
    if (!token) {
      navigate('/cart')
    } else if (getTotalCartAmount() === 0) {
      navigate('/cart')
    }
  }, [token])

  const subtotal = getTotalCartAmount()
  const delivery = subtotal === 0 ? 0 : 2
  const total = subtotal === 0 ? 0 : subtotal + delivery

  return (
    <>
      <form onSubmit={openPayment} className="place-order layout">
        {/* Left: Delivery form */}
        <div className="place-order-left form-card">
          <h2 className="po-title">Delivery Information</h2>

          <div className="field-grid two">
            <div className="field">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                required
                name="firstName"
                value={data.firstName}
                onChange={onChangeHandler}
                type="text"
                placeholder="John"
              />
            </div>
            <div className="field">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                required
                name="lastName"
                value={data.lastName}
                onChange={onChangeHandler}
                type="text"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              required
              name="email"
              value={data.email}
              onChange={onChangeHandler}
              type="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="field">
            <label htmlFor="street">Street</label>
            <input
              id="street"
              required
              name="street"
              value={data.street}
              onChange={onChangeHandler}
              type="text"
              placeholder="123 Main St"
            />
          </div>

          <div className="field-grid two">
            <div className="field">
              <label htmlFor="city">City</label>
              <input
                id="city"
                required
                name="city"
                value={data.city}
                onChange={onChangeHandler}
                type="text"
                placeholder="City"
              />
            </div>
            <div className="field">
              <label htmlFor="state">State</label>
              <input
                id="state"
                required
                name="state"
                value={data.state}
                onChange={onChangeHandler}
                type="text"
                placeholder="State"
              />
            </div>
          </div>

          <div className="field-grid two">
            <div className="field">
              <label htmlFor="zipcode">Zip code</label>
              <input
                id="zipcode"
                required
                name="zipcode"
                value={data.zipcode}
                onChange={onChangeHandler}
                type="text"
                placeholder="00000"
              />
            </div>
            <div className="field">
              <label htmlFor="country">Country</label>
              <input
                id="country"
                required
                name="country"
                value={data.country}
                onChange={onChangeHandler}
                type="text"
                placeholder="Country"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              required
              name="phone"
              value={data.phone}
              onChange={onChangeHandler}
              type="text"
              placeholder="+84 123 456 789"
            />
          </div>
        </div>

        {/* Right: Order summary + button + promo */}
        <div className="place-order-right form-card">
          <h2 className="po-title">Order Summary</h2>

          <div className="summary-box fancy-border">
            <div className="row">
              <span>Subtotal</span>
              <span>${subtotal}</span>
            </div>
            <div className="row">
              <span>Delivery Fee</span>
              <span>${delivery}</span>
            </div>
            <div className="row total">
              <b>Total</b>
              <b>${total}</b>
            </div>
          </div>

          <button type="submit" className="primary-btn" title="Go to checkout">
            PROCEED TO CHECKOUT
          </button>

          <div className="promo-card">
            <div className="promo-left">
              <span className="promo-emoji" aria-hidden>😋</span>
              <div>
                <p className="promo-title">Thanks for letting Hangry App feed your hunger!</p>
              </div>
            </div>
            <div className="promo-right">
              <p className="promo-text">
                Kick back and relax — deliciousness is on the way 🚗💨
              </p>
            </div>
          </div>
        </div>
      </form>

      {showPayment && (
        <PaymentModal
          draft={draft}
          onClose={() => {
            setShowPayment(false)
            document.body.classList.remove('modal-open')
          }}
        />
      )}
    </>
  )
}

export default PlaceOrder
