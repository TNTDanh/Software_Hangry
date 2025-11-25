import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import Login from "./pages/Login/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useAuth from "./auth/useAuth.jsx";
import useUI from "./ui/useUI.jsx";

const App = () => {
  const url = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const { token, role, logout } = useAuth();
  const { t } = useUI();

  if (!token) {
    return (
      <>
        <ToastContainer />
        <Login url={url} />
      </>
    );
  }

  const allowedRoles = ["admin", "restaurantOwner"];
  if (!allowedRoles.includes(role)) {
    return (
      <>
        <ToastContainer />
        <div className="unauthorized">
          <div className="unauth-card">
            <p className="unauth-title">{t("noPermission")}</p>
            <p className="unauth-sub">Vui lòng đăng nhập bằng tài khoản admin hoặc chủ nhà hàng.</p>
            <button onClick={logout}>{t("loginAgain")}</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="admin-app">
      <ToastContainer />
      <Navbar />
      <div className="app-content">
        <Sidebar role={role} />
        <div className="app-main">
          <Routes>
            <Route path="/add" element={<Add url={url} />} />
            <Route path="/list" element={<List url={url} />} />
            <Route path="/orders" element={<Orders url={url} />} />
            <Route path="*" element={<Navigate to="/list" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;
