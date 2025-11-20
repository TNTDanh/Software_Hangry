import React, { useEffect, useState } from 'react'
import './Orders.css'
import { toast } from 'react-toastify'
import axios from 'axios'
import { assets } from '../../assets/assets'

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([])
  const [openStatusId, setOpenStatusId] = useState(null)

  const fetchAllOrders = async () => {
    try {
      const response = await axios.get(url + '/api/order/list')
      if (response.data?.success) {
        const data = response.data.data || []
        const ts = (o) => {
          if (o?.createdAt) return new Date(o.createdAt).getTime()
          if (o?._id && typeof o._id === 'string' && o._id.length >= 8) {
            return parseInt(o._id.substring(0, 8), 16) * 1000 // timestamp từ ObjectId
          }
          return 0
        }
        data.sort((a, b) => ts(b) - ts(a)) // mới nhất lên trên
        setOrders(data)
      } else {
        toast.error(response.data?.message || 'Error fetching orders')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Network error')
    }
  }

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(url + '/api/order/status', {
        orderId,
        status: event.target.value,
      })
      if (response.data?.success) {
        await fetchAllOrders()
        toast.success('Status updated')
      } else {
        toast.error(response.data?.message || 'Failed to update status')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Network error')
    }
  }

  useEffect(() => {
    fetchAllOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="order add">
      <h3 className="h3">ORDER PAGE</h3>
      <div className="order-list">
        {orders.map((order, index) => {
          const items = Array.isArray(order?.items) ? order.items : []
          const addr = order?.address || {}
          const fullName = [addr.firstName, addr.lastName].filter(Boolean).join(' ') || 'Unknown'
          const street = addr.street ? `${addr.street},` : ''
          const cityLine = [addr.city, addr.state, addr.country, addr.zipcode].filter(Boolean).join(', ')
          const phone = addr.phone || 'N/A'
          const amount = Number(order?.amount ?? 0)
          const statusText = order?.status || 'Food Processing'
          const status = statusText.toLowerCase()
          let statusClass = 'status-processing'
          if (status.includes('out for delivery')) statusClass = 'status-out'
          else if (status.includes('delivered')) statusClass = 'status-delivered'

          const orderKey = order?._id || index
          const isOpen = openStatusId === orderKey

          return (
            <div key={orderKey} className="order-item">
              <img src={assets.parcel_icon} alt="" />
              <div>
                <p className="order-item-food">
                  {items.map((item, i) => {
                    const text = `${item?.name || 'Item'} x ${item?.quantity ?? 0}`
                    return i === items.length - 1 ? text : `${text}, `
                  })}
                </p>

                {fullName ? (
                  <p className="order-item-name">
                    <span className="label">Name:</span> {fullName}
                  </p>
                ) : null}

                {(street || cityLine) ? (
                  <div className="order-item-address">
                    <p className="label">Address:</p>
                    {street ? <p>{street}</p> : null}
                    {cityLine ? <p>{cityLine}</p> : null}
                  </div>
                ) : null}

                {phone ? (
                  <p className="order-item-phone">
                    <span className="label">Phone:</span> {phone}
                  </p>
                ) : null}
              </div>

              <p>Items : {items.length}</p>
              <p>${amount}</p>

              <div className="order-status-cell">
                <button
                  type="button"
                  className={`status-badge ${statusClass}`}
                  onClick={() =>
                    setOpenStatusId((prev) => (prev === orderKey ? null : orderKey))
                  }
                  aria-expanded={isOpen}
                >
                  <span className="dot" aria-hidden />
                  {statusText}
                  <span className="caret" aria-hidden>
                    {isOpen ? '▴' : '▾'}
                  </span>
                </button>
                <div className={`status-options ${isOpen ? 'open' : ''}`}>
                  {['Food Processing', 'Out For Delivery', 'Delivered'].map((opt) => {
                    let optClass = 'status-processing'
                    const lower = opt.toLowerCase()
                    if (lower.includes('out for delivery')) optClass = 'status-out'
                    else if (lower.includes('delivered')) optClass = 'status-delivered'
                    return (
                      <button
                        key={opt}
                        type="button"
                        className={`status-pill ${optClass} ${opt === statusText ? 'active' : ''}`}
                        onClick={() => statusHandler({ target: { value: opt } }, order?._id)}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Orders
