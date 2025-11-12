import React, { useEffect, useState } from 'react'
import './Orders.css'
import { toast } from 'react-toastify'
import axios from 'axios'
import { assets } from '../../assets/assets'

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([])

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
      <h3>Order Page</h3>
      <div className="order-list">
        {orders.map((order, index) => {
          const items = Array.isArray(order?.items) ? order.items : []
          const addr = order?.address || {}
          const fullName = [addr.firstName, addr.lastName].filter(Boolean).join(' ') || 'Unknown'
          const street = addr.street ? `${addr.street},` : ''
          const cityLine = [addr.city, addr.state, addr.country, addr.zipcode].filter(Boolean).join(', ')
          const phone = addr.phone || 'N/A'
          const amount = Number(order?.amount ?? 0)
          const status = order?.status || 'Food Processing'

          return (
            <div key={order?._id || index} className="order-item">
              <img src={assets.parcel_icon} alt="" />
              <div>
                <p className="order-item-food">
                  {items.map((item, i) => {
                    const text = `${item?.name || 'Item'} x ${item?.quantity ?? 0}`
                    return i === items.length - 1 ? text : `${text}, `
                  })}
                </p>

                <p className="order-item-name">{fullName}</p>

                <div className="order-item-address">
                  <p>{street}</p>
                  <p>{cityLine}</p>
                </div>

                <p className="order-item-phone">{phone}</p>
              </div>

              <p>Items : {items.length}</p>
              <p>${amount}</p>

              <select
                onChange={(event) => statusHandler(event, order?._id)}
                value={status}
              >
                <option value="Food Processing">Food Processing</option>
                <option value="Out for delivery">Out for delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Orders
