import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast, ToastContainer } from 'react-toastify'
import useAuth, { buildAuthHeaders } from '../auth/useAuth.jsx'
import useUI from '../ui/useUI.jsx'
import 'react-toastify/dist/ReactToastify.css'

export default function Users({ url }) {
  const [users, setUsers] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('')
  const [active, setActive] = useState('')
  const { token } = useAuth()
  const { t, formatDate, roleLabel } = useUI()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (q) params.q = q
      if (role) params.role = role
      if (active) params.active = active
      const headers = buildAuthHeaders(token)
      const res = await axios.get(url + '/api/user/list', { params, headers })
      if (res.data?.success) {
        setUsers(Array.isArray(res.data.data) ? res.data.data : [])
      } else {
        toast.error(res.data?.message || 'Failed to fetch users')
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const rows = useMemo(() => users, [users])

  const roleOptions = [
    { value: 'admin', label: t("roleAdmin") },
    { value: 'restaurantOwner', label: t("roleOwner") },
    { value: 'user', label: t("roleUser") },
  ]

  const toggleActive = async (u) => {
    const confirmText = u.active ? t("confirmSuspend") : t("confirmActivate");
    if (!window.confirm(confirmText)) return;
    try {
      const headers = buildAuthHeaders(token)
      const res = await axios.post(url + '/api/user/update', { userId: u._id, active: !u.active }, { headers })
      if (res.data?.success) { toast.success('Updated'); fetchUsers() } else toast.error(res.data?.message || 'Failed')
    } catch (e) { toast.error(e?.response?.data?.message || e.message || 'Network error') }
  }

  const cycleRole = async (u) => {
    const next = u.role === 'admin' ? 'user' : 'admin'
    if (!window.confirm(t("confirmRoleChange"))) return;
    try {
      const headers = buildAuthHeaders(token)
      const res = await axios.post(url + '/api/user/update', { userId: u._id, role: next }, { headers })
      if (res.data?.success) { toast.success('Updated'); fetchUsers() } else toast.error(res.data?.message || 'Failed')
    } catch (e) { toast.error(e?.response?.data?.message || e.message || 'Network error') }
  }

  const updateRole = async (u, nextRole) => {
    if (!window.confirm(t("confirmRoleChange"))) return;
    try {
      const headers = buildAuthHeaders(token)
      const res = await axios.post(url + '/api/user/update', { userId: u._id, role: nextRole }, { headers })
      if (res.data?.success) { toast.success('Updated'); fetchUsers() } else toast.error(res.data?.message || 'Failed')
    } catch (e) { toast.error(e?.response?.data?.message || e.message || 'Network error') }
  }

  const remove = async (u) => {
    if (!window.confirm(t("confirmDelete"))) return
    try {
      const headers = buildAuthHeaders(token)
      const res = await axios.post(url + '/api/user/remove', { userId: u._id }, { headers })
      if (res.data?.success) { toast.success('Removed'); fetchUsers() } else toast.error(res.data?.message || 'Failed')
    } catch (e) { toast.error(e?.response?.data?.message || e.message || 'Network error') }
  }

  return (
    <div className="users-page">
      <ToastContainer />
      <h3>{t("users")}</h3>

      <div className="toolbar">
        <input placeholder={t("searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">{t("allRoles")}</option>
          <option value="user">{t("roleUser")}</option>
          <option value="admin">{t("roleAdmin")}</option>
          <option value="restaurantOwner">{t("roleOwner")}</option>
        </select>
        <select value={active} onChange={(e) => setActive(e.target.value)}>
          <option value="">{t("allStatus")}</option>
          <option value="true">{t("active")}</option>
          <option value="false">{t("suspended")}</option>
        </select>
        <button onClick={fetchUsers} disabled={loading} title="Search users" aria-label="Search users">
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>

      <div className="table">
          <div className="row head">
            <div>{t("name")}</div>
            <div>{t("email")}</div>
            <div>{t("role")}</div>
            <div>{t("status")}</div>
            <div>{t("created")}</div>
            <div>{t("actions")}</div>
          </div>
          {rows.map((u) => (
          <div key={u._id} className="row">
            <div>{u.name}</div>
            <div>{u.email}</div>
            <div><span className="badge">{roleLabel(u.role)}</span></div>
            <div><span className={`badge ${u.active ? 'success' : 'warn'}`}>{u.active ? t("active") : t("suspended")}</span></div>
            <div>{formatDate(u.createdAt)}</div>
            <div className="actions">
              <div className="role-select">
                <select
                  value={u.role || 'user'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'suspended' || val === 'active') {
                      toggleActive(u);
                    } else {
                      updateRole(u, val);
                    }
                  }}
                  aria-label={t("changeRole")}
                >
                  <option value="admin">{t("roleAdmin")}</option>
                  <option value="restaurantOwner">{t("roleOwner")}</option>
                  <option value="user">{t("roleUser")}</option>
                  <option value={u.active ? "suspended" : "active"}>
                    {u.active ? t("suspend") : t("activate")}
                  </option>
                </select>
              </div>
              <button className="danger" onClick={() => remove(u)}>{t("delete")}</button>
            </div>
          </div>
        ))}
        {!rows.length && !loading && (
          <div className="empty">{t("noUsers")}</div>
        )}
      </div>
    </div>
  )
}
