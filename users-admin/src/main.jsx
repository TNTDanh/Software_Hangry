import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import './styles.css'
import { AuthProvider } from './auth/useAuth.jsx'
import { UIProvider } from './ui/useUI.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UIProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </UIProvider>
  </React.StrictMode>
)
