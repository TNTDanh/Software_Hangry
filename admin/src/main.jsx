import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import {BrowserRouter} from 'react-router-dom'
import { AuthProvider } from './auth/useAuth.jsx'
import { UIProvider } from './ui/useUI.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <UIProvider>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </UIProvider>
)
