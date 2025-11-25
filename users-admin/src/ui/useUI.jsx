import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "users_admin_ui";

const translations = {
  vi: {
    appName: "Quản Lý Người Dùng",
    menu: "Menu",
    users: "TÀI KHOẢN",
    searchPlaceholder: "Tìm tên/email",
    allRoles: "Tất cả vai trò",
    allStatus: "Tất cả trạng thái",
    active: "Đang Hoạt Động",
    suspended: "Tạm Khóa",
    roleUser: "Người dùng",
    roleAdmin: "Quản trị",
    roleOwner: "Chủ nhà hàng",
    changeRole: "Chọn hành động",
    search: "Tìm",
    name: "Tên",
    email: "Email",
    role: "Vai trò",
    status: "Trạng thái",
    created: "Ngày tạo",
    actions: "Thao tác",
    suspend: "Khóa",
    activate: "Mở",
    makeUser: "Đổi thành User",
    makeAdmin: "Đổi thành Admin",
    makeOwner: "Đổi thành Owner",
    setAdmin: "Thành Admin",
    setOwner: "Thành Owner",
    setUser: "Thành User",
    delete: "Xóa",
    noUsers: "Không có người dùng",
    loginTitle: "Đăng nhập Admin",
    loginButton: "Đăng nhập",
    logout: "Đăng Xuất",
    noPermission: "Không có quyền truy cập",
    pleaseLoginAdmin: "Vui lòng đăng nhập bằng tài khoản admin.",
    confirmSuspend: "Khóa tài khoản này?",
    confirmActivate: "Mở khóa tài khoản này?",
    confirmRoleChange: "Đổi vai trò tài khoản này?",
    confirmDelete: "Bạn chắc chắn muốn xóa tài khoản này?",
    confirmLogout: "Bạn muốn đăng xuất?",
  },
  en: {
    appName: "Users Admin",
    menu: "Menu",
    users: "ACCOUNT",
    searchPlaceholder: "Search name/email",
    allRoles: "All roles",
    allStatus: "All status",
    active: "Active",
    suspended: "Suspended",
    roleUser: "User",
    roleAdmin: "Admin",
    roleOwner: "Restaurant Owner",
    changeRole: "Select action",
    search: "Search",
    name: "Name",
    email: "Email",
    role: "Role",
    status: "Status",
    created: "Created",
    actions: "Actions",
    suspend: "Suspend",
    activate: "Activate",
    makeUser: "Make User",
    makeAdmin: "Make Admin",
    makeOwner: "Make Owner",
    setAdmin: "Set Admin",
    setOwner: "Set Owner",
    setUser: "Set User",
    delete: "Delete",
    noUsers: "No users found",
    loginTitle: "Admin Login",
    loginButton: "Login",
    logout: "Logout",
    noPermission: "No permission",
    pleaseLoginAdmin: "Please login with an admin account.",
    confirmSuspend: "Suspend this account?",
    confirmActivate: "Activate this account?",
    confirmRoleChange: "Change this account's role?",
    confirmDelete: "Are you sure you want to delete this account?",
    confirmLogout: "Logout?",
  },
};

const UIContext = createContext(null);

const loadUI = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { theme: "dark", lang: "vi" };
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme || "dark",
      lang: parsed.lang || "vi",
    };
  } catch {
    return { theme: "dark", lang: "vi" };
  }
};

export const UIProvider = ({ children }) => {
  const [{ theme, lang }, setUI] = useState(loadUI);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.classList.toggle("light", theme === "light");
  }, [theme]);

  const toggleTheme = () =>
    setUI((prev) => {
      const next = prev.theme === "dark" ? "light" : "dark";
      const data = { ...prev, theme: next };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    });

  const toggleLang = () =>
    setUI((prev) => {
      const next = prev.lang === "vi" ? "en" : "vi";
      const data = { ...prev, lang: next };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    });

  const t = (key) => translations[lang]?.[key] || key;

  const formatDate = (value) => {
    if (!value) return "-";
    const dt = new Date(value);
    return dt.toLocaleString(lang === "vi" ? "vi-VN" : "en-US");
  };

  const roleLabel = (val) => {
    if (val === "admin") return t("roleAdmin");
    if (val === "restaurantOwner") return t("roleOwner");
    return t("roleUser");
  };

  const value = useMemo(
    () => ({ theme, lang, toggleTheme, toggleLang, t, formatDate, roleLabel }),
    [theme, lang]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside UIProvider");
  return ctx;
};

export default useUI;
