import React from "react";
import { NavLink } from "react-router-dom";
import useUI from "../ui/useUI.jsx";

export default function Sidebar() {
  const { t } = useUI();
  const cls = ({ isActive }) => `item pill${isActive ? " active" : ""}`;
  return (
    <aside className="sidebar card">
      <div className="menu-title">{t("menu")}</div>
      <nav className="menu">
        <NavLink to="/users" className={cls}>
          <span className="ico" aria-hidden>
            👥
          </span>
          <span>{t("users")}</span>
        </NavLink>
        <NavLink to="/restaurants/add" className={cls}>
          <span className="ico" aria-hidden>
            🏪
          </span>
          <span>{t("addRestaurant")}</span>
        </NavLink>
        <NavLink to="/owners/add" className={cls}>
          <span className="ico" aria-hidden>
            👤
          </span>
          <span>{t("addOwner") || "Add Owner"}</span>
        </NavLink>
      </nav>
    </aside>
  );
}
