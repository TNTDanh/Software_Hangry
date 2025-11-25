import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import useAuth from '../auth/useAuth.jsx'
import useUI from '../ui/useUI.jsx'

export default function Login({ url }) {
  const { login } = useAuth()
  const { t } = useUI()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post(`${url}/api/user/login`, { email, password })
      if (res.data?.success && res.data?.token) {
        const role = res.data.role || 'user'
        if (role !== 'admin') {
          toast.error('This account is not admin')
        } else {
          login({ token: res.data.token, role })
          toast.success('Login success')
        }
      } else {
        toast.error(res.data?.message || 'Login failed')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="card login-form" onSubmit={onSubmit}>
        <h2>{t("loginTitle")}</h2>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : t("loginButton")}
        </button>
      </form>
    </div>
  )
}
