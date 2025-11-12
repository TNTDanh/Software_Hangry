import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Users from './pages/Users'

export default function App() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  return (
    <div className="admin-wrap">
      <Navbar />
      <div className="content with-top-border">
        <Sidebar />
        <div className="page card">
          <Routes>
            <Route path="/users" element={<Users url={apiUrl} />} />
            <Route path="/" element={<Navigate to="/users" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
