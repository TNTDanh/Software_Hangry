import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function Users({ url }) {
  const [users, setUsers] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('')
  const [active, setActive] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (q) params.q = q
      if (role) params.role = role
      if (active) params.active = active
      const res = await axios.get(url + '/api/user/list', { params })
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

  const toggleActive = async (u) => {
    try {
      const res = await axios.post(url + '/api/user/update', { userId: u._id, active: !u.active })
      if (res.data?.success) { toast.success('Updated'); fetchUsers() } else toast.error(res.data?.message || 'Failed')
    } catch (e) { toast.error(e?.response?.data?.message || e.message || 'Network error') }
  }

  const cycleRole = async (u) => {
    const next = u.role === 'admin' ? 'user' : 'admin'
    try {
      const res = await axios.post(url + '/api/user/update', { userId: u._id, role: next })
      if (res.data?.success) { toast.success('Updated'); fetchUsers() } else toast.error(res.data?.message || 'Failed')
    } catch (e) { toast.error(e?.response?.data?.message || e.message || 'Network error') }
  }

  const remove = async (u) => {
    if (!window.confirm('Delete this user?')) return
    try {
      const res = await axios.post(url + '/api/user/remove', { userId: u._id })
      if (res.data?.success) { toast.success('Removed'); fetchUsers() } else toast.error(res.data?.message || 'Failed')
    } catch (e) { toast.error(e?.response?.data?.message || e.message || 'Network error') }
  }

  return (
    <div className="users-page">
      <ToastContainer />
      <h3>USERS</h3>

      <div className="toolbar">
        <input placeholder="Search name/email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select value={active} onChange={(e) => setActive(e.target.value)}>
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Suspended</option>
        </select>
        <button onClick={fetchUsers} disabled={loading} title="Search users" aria-label="Search users">
          {loading ? 'Loading...' : 'Search 🔍'}
        </button>
      </div>

      <div className="table">
        <div className="row head">
          <div>Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Status</div>
          <div>Created</div>
          <div>Actions</div>
        </div>
        {rows.map((u) => (
          <div key={u._id} className="row">
            <div>{u.name}</div>
            <div>{u.email}</div>
            <div>{u.role || 'user'}</div>
            <div>{u.active ? 'Active' : 'Suspended'}</div>
            <div>{u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</div>
            <div className="actions">
              <button onClick={() => toggleActive(u)}>{u.active ? 'Suspend' : 'Activate'}</button>
              <button onClick={() => cycleRole(u)}>{u.role === 'admin' ? 'Make User' : 'Make Admin'}</button>
              <button className="danger" onClick={() => remove(u)}>Delete</button>
            </div>
          </div>
        ))}
        {!rows.length && !loading && (
          <div className="empty">No Users Found 🔍</div>
        )}
      </div>
    </div>
  )
}
