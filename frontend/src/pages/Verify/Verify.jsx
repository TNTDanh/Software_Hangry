import React, { useEffect, useContext, useState } from 'react'
import './Verify.css'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { StoreContext } from '../../context/StoreContext'

const Verify = () => {
  const [params] = useSearchParams()
  const success = params.get('success')
  const orderId = params.get('orderId')
  const { url, setCartItems, lang } = useContext(StoreContext)
  const t = (vi, en) => (lang === 'vi' ? vi : en)
  const navigate = useNavigate()
  const [message, setMessage] = useState(t('Đang xác thực thanh toán...', 'Verifying payment...'))

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const res = await axios.post(`${url}/api/order/verify`, { success, orderId })
        if (res.data?.success) {
          setCartItems?.({})
          setMessage(t('Thanh toán thành công, chuyển đến đơn hàng...', 'Payment successful, redirecting...'))
          navigate('/myorders')
        } else {
          setMessage(t('Thanh toán không thành công, quay về trang chủ.', 'Payment failed, going home.'))
          navigate('/')
        }
      } catch {
        setMessage(t('Lỗi khi xác thực, quay về trang chủ.', 'Error verifying, going home.'))
        navigate('/')
      }
    }
    verifyPayment()
  }, [success, orderId, url, navigate, setCartItems, lang])

  return (
    <div className="verify">
      <div className="spinner" />
      <p className="verify-text">{message}</p>
    </div>
  )
}

export default Verify
