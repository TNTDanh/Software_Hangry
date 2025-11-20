import React from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import { Routes,Route } from 'react-router-dom'
import Add from './pages/Add/Add'
import List from './pages/List/List'
import Orders from './pages/Orders/Orders'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {

  // const url = "http://localhost:4000"
  const url = "https://hangry-backend.onrender.com"

  return (
    <div className="admin-app">
      <ToastContainer/>
      <Navbar/>
      <div className="app-content">
        <Sidebar/>
        <div className="app-main">
          <Routes>
            <Route path="/add" element={<Add url={url}/>}/>
            <Route path="/list" element={<List url={url}/>}/>
            <Route path="/orders" element={<Orders url={url}/>}/>
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App
