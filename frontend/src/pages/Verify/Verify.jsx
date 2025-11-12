import React, { useEffect, useContext } from 'react'
import './Verify.css'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { StoreContext } from '../../context/StoreContext'

const Verify = () => {
  const [params] = useSearchParams()
  const success = params.get('success')
  const orderId = params.get('orderId')
  const { url, setCartItems } = useContext(StoreContext)
  const navigate = useNavigate()

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const res = await axios.post(`${url}/api/order/verify`, { success, orderId })
        if (res.data?.success) {
          setCartItems?.({})
          navigate('/myorders')
        } else {
          navigate('/')
        }
      } catch {
        navigate('/')
      }
    }
    verifyPayment()
  }, [success, orderId, url, navigate, setCartItems])

  return (
    <div className="verify">
      <div className="spinner" />
    </div>
  )
}

export default Verify