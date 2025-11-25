import React, { useEffect, useState } from 'react'
import './Orders.css'
import { toast } from 'react-toastify'
import axios from 'axios'
import { assets } from '../../assets/assets'
import useAuth, { buildAuthHeaders } from '../../auth/useAuth.jsx'
import useUI from '../../ui/useUI.jsx'

const PHASES = [
  { key: 'at_restaurant', label: 'Tai nha hang' },
  { key: 'delivering', label: 'Dang giao' },
  { key: 'delivered', label: 'Da giao' },
]

const Orders = ({ url }) => {
  const { token, role, restaurantIds } = useAuth()
  const { t, lang, formatMoney } = useUI()
  const [orders, setOrders] = useState([])
  const [openStatusId, setOpenStatusId] = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState('all')
  const [foodDict, setFoodDict] = useState({})
  const [drafts, setDrafts] = useState({})

  const fetchRestaurants = async () => {
    try {
      const headers = buildAuthHeaders(token)
      const res = await axios.get(url + '/api/restaurant/list', { headers })
      const data = res.data?.data || []
      const filtered = role === 'restaurantOwner'
        ? data.filter(r => restaurantIds.includes(r._id))
        : data
      setRestaurants(filtered)
      if (filtered.length && selectedRestaurant === 'all') setSelectedRestaurant(filtered[0]._id)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cannot fetch restaurants')
    }
  }

  const fetchAllOrders = async () => {
    try {
      const params = {}
      if (selectedRestaurant !== 'all') params.restaurantId = selectedRestaurant
      const headers = buildAuthHeaders(token)
      const response = await axios.get(url + '/api/order/list', { params, headers })
      if (response.data?.success) {
        const data = response.data.data || []
        const ts = (o) => {
          if (o?.createdAt) return new Date(o.createdAt).getTime()
          if (o?._id && typeof o._id === 'string' && o._id.length >= 8) {
            return parseInt(o._id.substring(0, 8), 16) * 1000
          }
          return 0
        }
        data.sort((a, b) => ts(b) - ts(a))
        setOrders(data)
        // init drafts for delivery info
        const draftMap = {}
        data.forEach((o) => {
          const id = o?._id
          if (!id) return
          draftMap[id] = {
            phase: o.deliveryPhase || 'at_restaurant',
            droneId: o.droneId || '',
            driverId: o.driverId || '',
          }
        })
        setDrafts(draftMap)
      } else {
        toast.error(response.data?.message || 'Error fetching orders')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Network error')
    }
  }

  const fetchFoods = async () => {
    try {
      const params = {}
      if (selectedRestaurant !== 'all') params.restaurantId = selectedRestaurant
      const headers = buildAuthHeaders(token)
      const res = await axios.get(url + '/api/food/list', { params, headers })
      const data = res.data?.data || []
      const map = {}
      data.forEach((f) => {
        if (f._id) {
          map[f._id] = { name: f.name, nameEn: f.nameEn }
        }
      })
      setFoodDict(map)
    } catch (err) {
      console.error("fetchFoods err", err)
    }
  }

  const phaseToStatus = (phase) =>
    phase === 'delivering' ? 'Out For Delivery' : phase === 'delivered' ? 'Delivered' : 'Food Processing'

  const onChangeDraft = (orderId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [orderId]: {
        phase: prev[orderId]?.phase || 'at_restaurant',
        droneId: prev[orderId]?.droneId || '',
        driverId: prev[orderId]?.driverId || '',
        [field]: value,
      },
    }))
  }

  const saveDelivery = async (orderId, overridePhase) => {
    try {
      const draft = drafts[orderId] || {}
      const nextPhase = overridePhase || draft.phase || 'at_restaurant'
      if (!draft.droneId && !draft.driverId) {
        toast.error(t("missingInfo") || "Vui long nhap Drone/Driver ID");
        return;
      }
      const headers = buildAuthHeaders(token)
      const response = await axios.patch(
        url + `/api/order/delivery/${orderId}`,
        {
          phase: nextPhase,
          droneId: draft.droneId,
          driverId: draft.driverId,
        },
        { headers },
      )
      if (response.data?.success) {
        toast.success('Cap nhat giao hang thanh cong')
        await fetchAllOrders()
      } else {
        toast.error(response.data?.message || 'Khong cap nhat duoc')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Network error')
    }
  }

  useEffect(() => {
    fetchRestaurants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchAllOrders()
    fetchFoods()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurant])

  return (
    <div className="order add">
      <div className="orders-head">
        <div>
          <p className="eyebrow">{t("orders")}</p>
          <h3 className="h3">{t("orderPage")?.toUpperCase()}</h3>
        </div>
        <div className="filter-row">
          <label className="muted">{t("restaurantFilter")}</label>
          <select
            className="select-filter"
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
          >
            {role !== 'restaurantOwner' && <option value="all">{t("allRestaurants")}</option>}
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="order-list">
        {orders.map((order, index) => {
          const items = Array.isArray(order?.items) ? order.items : []
          const addr = order?.address || {}
          const fullName = [addr.firstName, addr.lastName].filter(Boolean).join(' ') || 'Unknown'
          const street = addr.street ? `${addr.street},` : ''
          const cityLine = [addr.city, addr.state, addr.country, addr.zipcode].filter(Boolean).join(', ')
          const phone = addr.phone || 'N/A'
          const amount = Number(order?.amount ?? 0)
          const statusValue = order?.status || 'Food Processing'
          const deliveryPhase = order?.deliveryPhase || (statusValue?.toLowerCase().includes('delivered') ? 'delivered' : statusValue?.toLowerCase().includes('out for delivery') ? 'delivering' : 'at_restaurant')
          const deliveryType = order?.deliveryType || order?.subOrders?.[0]?.deliveryType || ''
          const statusClass =
            deliveryPhase === 'delivered'
              ? 'status-delivered'
              : deliveryPhase === 'delivering'
                ? 'status-out'
                : 'status-processing'

          const orderKey = order?._id || index
          const isOpen = openStatusId === orderKey

          const statusLabel =
            deliveryPhase === 'at_restaurant'
              ? (t("statusFoodProcessing") || 'Food Processing')
              : deliveryPhase === 'delivering'
                ? (t("statusOutForDelivery") || 'Out For Delivery')
                : (t("statusDelivered") || 'Delivered')
          const draft = drafts[orderKey] || {}

          const displayItemName = (item) => {
            const vi = item?.name
            const en = item?.nameEn
            const dict = foodDict[item?.foodId]
            const dictVi = dict?.name
            const dictEn = dict?.nameEn
            if (lang === "vi") return dictVi || vi || dictEn || en || "Item"
            return dictEn || en || dictVi || vi || "Item"
          }

          return (
            <div key={orderKey} className="order-card">
              <div className="order-card__header">
                <div className="pill-order-id">#{orderKey?.toString().slice(-6)}</div>
                <div className="order-card__status">
                  <button
                    type="button"
                    className={`status-badge ${statusClass}`}
                    onClick={() =>
                      setOpenStatusId((prev) => (prev === orderKey ? null : orderKey))
                    }
                    aria-expanded={isOpen}
                  >
                    <span className="dot" aria-hidden />
                    {statusLabel}
                    <span className="caret" aria-hidden>
                      {isOpen ? 'V' : 'V'}
                    </span>
                  </button>
                  <div className={`status-options ${isOpen ? 'open' : ''}`}>
                    {PHASES.map((opt) => {
                      let optClass = 'status-processing'
                      if (opt.key === 'delivering') optClass = 'status-out'
                      else if (opt.key === 'delivered') optClass = 'status-delivered'
                      const label =
                        opt.key === 'at_restaurant'
                          ? (t("statusFoodProcessing") || opt.label)
                          : opt.key === 'delivering'
                            ? (t("statusOutForDelivery") || opt.label)
                            : (t("statusDelivered") || opt.label)
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          className={`status-pill ${optClass} ${opt.key === deliveryPhase ? 'active' : ''}`}
                          onClick={() => saveDelivery(order?._id, opt.key)}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                  {deliveryType ? (
                    <div className="method-pill">
                      {deliveryType === 'drone'
                        ? (t("Delivery Method (DRONE)") || "Vận Chuyển (Drone)")
                        : (t("Delivery Method (DRIVER)") || "Vận Chuyển (Driver)")}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="order-card__grid">
                <div className="order-meta-left">
                  <img src={assets.parcel_icon} alt="" />
                  <div className="order-desc">
                    <p className="order-item-food">
                    {items.map((item, i) => {
                      const text = `${displayItemName(item)} x ${item?.quantity ?? 0}`
                      return i === items.length - 1 ? text : `${text}, `
                    })}
                    </p>
                    {fullName ? (
                      <p className="order-item-name">
                        <span className="label">{t("name")}:</span> {fullName}
                      </p>
                    ) : null}
                    {(street || cityLine) ? (
                    <div className="order-item-address">
                      <p className="label">{t("addressLabel")}:</p>
                      {street ? <p>{street}</p> : null}
                      {cityLine ? <p>{cityLine}</p> : null}
                    </div>
                    ) : null}
                    {phone ? (
                    <p className="order-item-phone">
                      <span className="label">{t("phone")}:</span> {phone}
                    </p>
                  ) : null}
                </div>
                </div>

                <div className="order-meta">
                  <p>{t("itemsLabel")}: {items.length}</p>
                  <p>{t("total")}: {formatMoney(amount)}</p>
                </div>
              </div>

              {deliveryPhase !== 'delivered' && (
                <div className="delivery-box">
                  {deliveryType !== 'driver' && (
                    <div className="delivery-row">
                      <label>{t("droneId") || "Drone ID"}</label>
                      <input
                        type="text"
                        value={draft.droneId || ''}
                        onChange={(e) => onChangeDraft(orderKey, 'droneId', e.target.value)}
                        placeholder="VD: DR-001"
                      />
                    </div>
                  )}
                  {deliveryType !== 'drone' && (
                    <div className="delivery-row">
                      <label>{t("driverId") || "Driver ID"}</label>
                      <input
                        type="text"
                        value={draft.driverId || ''}
                        onChange={(e) => onChangeDraft(orderKey, 'driverId', e.target.value)}
                        placeholder="VD: TX-123"
                      />
                    </div>
                  )}
                  <div className="delivery-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => fetchAllOrders()}
                    >
                      {t("reload") || "Tai lai"}
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => saveDelivery(orderKey)}
                    >
                      {t("saveDelivery") || "Luu giao hang"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Orders
