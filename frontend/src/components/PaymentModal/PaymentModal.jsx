import React, { useContext, useMemo, useState } from 'react'
import './PaymentModal.css'
import axios from 'axios'
import { StoreContext } from '../../context/StoreContext'
import { useNavigate } from 'react-router-dom'

const PaymentModal = ({ onClose, draft }) => {
  const { cartItems, food_list, getTotalCartAmount, url, token, setCartItems } = useContext(StoreContext)
  const navigate = useNavigate()
  const [method, setMethod] = useState('card')
  const [loading, setLoading] = useState(false)

  const [cardModalVisible, setCardModalVisible] = useState(false)
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardProcessing, setCardProcessing] = useState(false)
  const [cardError, setCardError] = useState('')
  const [cardOrderCreated, setCardOrderCreated] = useState(false)

  const data = useMemo(() => {
    if (draft?.items && draft?.amount) return draft
    const items = []
    food_list.forEach((item) => {
      const qty = cartItems[item._id] || 0
      if (qty > 0) items.push({ ...item, quantity: qty })
    })
    return {
      address: {},
      items,
      amount: (getTotalCartAmount?.() || 0) + (items.length ? 2 : 0),
    }
  }, [draft, food_list, cartItems, getTotalCartAmount])

  const subtotal = Number(data.amount) - (data.items?.length ? 2 : 0)
  const delivery = data.items?.length ? 2 : 0
  const total = Number(data.amount || 0)

  const resetCardForm = () => {
    setCardName('')
    setCardNumber('')
    setCardExpiry('')
    setCardCvv('')
    setCardProcessing(false)
    setCardError('')
    setCardOrderCreated(false)
  }

  const handleClose = () => {
    setCardModalVisible(false)
    resetCardForm()
    onClose?.()
  }

  const handleMethodChange = (next) => {
    setMethod(next)
    if (next === 'cod') {
      setCardModalVisible(false)
      resetCardForm()
    }
  }

  const handleExpiryChange = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
    setCardExpiry(formatted)
    if (cardError) setCardError('')
  }

  const finishOrder = (message) => {
    setCartItems?.({})
    alert(message)
    navigate('/myorders')
    handleClose()
  }

  const handleMockCardPayment = () => {
    const normalizedCard = cardNumber.replace(/\s+/g, '')
    const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/
    if (
      !cardOrderCreated ||
      !cardName.trim() ||
      normalizedCard.length < 12 ||
      !expiryPattern.test(cardExpiry.trim()) ||
      cardCvv.trim().length < 3
    ) {
      setCardError('Please enter complete and valid card information.')
      return
    }

    setCardProcessing(true)
    setTimeout(() => {
      setCardProcessing(false)
      setCardModalVisible(false)
      resetCardForm()
      finishOrder('Payment Successful (Card)')
    }, 900)
  }

  const place = async () => {
    if (!data.items?.length) {
      alert('Cart is empty...')
      handleClose()
      return
    }

    const payload = {
      address: data.address || {},
      items: data.items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
      amount: data.amount,
      paymentMethod: method,
    }

    if (method === 'card') {
      setLoading(true)
      try {
        await axios.post(`${url}/api/order/place`, payload, { headers: { token } })
        setCardOrderCreated(true)
        setCardModalVisible(true)
      } catch (err) {
        alert(err?.response?.data?.message || err.message || 'Unable to create order.')
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    try {
      let placed = false
      try {
        const r = await axios.post(`${url}/api/order/place-cod`, payload, { headers: { token } })
        placed = !!r.data
      } catch (err) {
        if (err?.response?.status === 404) {
          try {
            await axios.post(`${url}/api/order/place`, payload, { headers: { token } })
          } catch {}
          placed = true
        } else {
          placed = true
        }
      }

      if (placed) {
        finishOrder('Order Successful (COD)')
      } else {
        alert('COD Order failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="payment-modal" role="dialog" aria-modal="true">
      <div className="payment-box">
        <div className="payment-header">
          <h3>Payment</h3>
          <button className="close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="payment-content">
          <div className="summary card">
            <p className="section-title">Order Summary</p>
            <ul className="items">
              {data.items?.map((it, idx) => (
                <li key={idx}>
                  <span>{it.name}</span>
                  <span>x{it.quantity}</span>
                  <span>${it.price}</span>
                </li>
              ))}
              {!data.items?.length && <li className="muted">No items</li>}
            </ul>

            <div className="totals">
              <div className="row">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div className="row">
                <span>Delivery</span>
                <span>${delivery.toLocaleString()}</span>
              </div>
              <div className="row total">
                <b>Total</b>
                <b>${total.toLocaleString()}</b>
              </div>
            </div>
          </div>

          <div className="methods card">
            <p className="section-title">Payment Method</p>

            <label className="pm-option">
              <input
                type="radio"
                name="pm"
                value="card"
                checked={method === 'card'}
                onChange={() => handleMethodChange('card')}
              />
              <span>Credit/Debit Card (Stripe)</span>
            </label>

            <label className="pm-option">
              <input
                type="radio"
                name="pm"
                value="cod"
                checked={method === 'cod'}
                onChange={() => handleMethodChange('cod')}
              />
              <span>Cash on Delivery (COD)</span>
            </label>

            <button className="pay-btn" onClick={place} disabled={loading || !data.items?.length} title="Confirm and place order">
              {loading ? 'PROCESSING…' : 'CONFIRM PAYMENT'}
            </button>

            <button className="back-btn" type="button" onClick={handleClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      {cardModalVisible && (
        <div className="card-modal-overlay" role="dialog" aria-modal="true">
          <div className="card-modal">
            <div className="card-modal-header">
              <h4>Enter Card Information</h4>
              <button type="button" onClick={() => { setCardModalVisible(false); resetCardForm() }} aria-label="Close card form">
                ×
              </button>
            </div>

            <div className="card-modal-body">
              <label className="card-field">
                <span>Name on Card</span>
                <input
                  type="text"
                  value={cardName}
                  placeholder="John Doe"
                  autoComplete="off"
                  onChange={(e) => {
                    setCardName(e.target.value)
                    if (cardError) setCardError('')
                  }}
                />
              </label>

              <label className="card-field">
                <span>Card Number</span>
                <input
                  type="text"
                  value={cardNumber}
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  autoComplete="off"
                  onChange={(e) => {
                    setCardNumber(e.target.value)
                    if (cardError) setCardError('')
                  }}
                />
              </label>

              <div className="card-field-row compact">
                <label className="card-field">
                  <span>Expiry (MM/YY)</span>
                  <input
                    type="text"
                    value={cardExpiry}
                    inputMode="numeric"
                    placeholder="12/34"
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    autoComplete="off"
                  />
                </label>
                <label className="card-field cvv-field">
                  <span>CVV</span>
                  <input
                    type="password"
                    className="cvv-input"
                    value={cardCvv}
                    inputMode="numeric"
                    placeholder="123"
                    autoComplete="off"
                    onChange={(e) => {
                      setCardCvv(e.target.value)
                      if (cardError) setCardError('')
                    }}
                  />
                </label>
              </div>

              {cardError && <p className="card-error">{cardError}</p>}

              <button className="card-pay-btn" onClick={handleMockCardPayment} disabled={cardProcessing}>
                {cardProcessing ? 'PROCESSING…' : 'PAY NOW'}
              </button>

              <button
                className="card-cancel-btn"
                type="button"
                onClick={() => {
                  setCardModalVisible(false)
                  resetCardForm()
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentModal
