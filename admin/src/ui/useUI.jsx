import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "admin_ui";

const translations = {
  vi: {
    adminPortal: "Bảng điều khiển",
    menu: "Menu",
    addItem: "Thêm món",
    orders: "Đơn hàng",
    dashboard: "Bảng thống kê",
    revenue: "Doanh thu",
    totalRevenue: "Tổng doanh thu",
    totalOrders: "Tổng đơn",
    avgOrderValue: "Giá trị đơn TB",
    dateRange: "Khoảng thời gian",
    last7d: "7 ngày",
    last30d: "30 ngày",
    last90d: "90 ngày",
    customRange: "Tùy chỉnh",
    perRestaurant: "Theo nhà hàng",
    noData: "Không có dữ liệu",
    adminView: "Chế độ Admin",
    logout: "Đăng xuất",
    confirmLogout: "Bạn có chắc muốn đăng xuất?",
    loggedOut: "Đã đăng xuất",
    toggleTheme: "Chuyển chế độ sáng/tối",
    toggleLang: "Chuyển EN/VI",
    allFoods: "Danh sách món",
    image: "Hình",
    name: "Tên",
    category: "Danh mục",
    price: "Giá",
    action: "Thao tác",
    allRestaurants: "Tất cả nhà hàng",
    remove: "Xóa",
    loading: "Đang tải...",
    noPermission: "Tài khoản này không có quyền truy cập admin/owner",
    loginSuccess: "Đăng nhập thành công",
    loginFailed: "Đăng nhập thất bại",
    loginAgain: "Đăng nhập lại",
    orderPage: "Trang đơn hàng",
    itemsLabel: "Số món",
    phone: "Điện thoại",
    addressLabel: "Địa chỉ",
    statusUpdated: "Cập nhật trạng thái",
    restaurantFilter: "Nhà hàng",
    addPage: "Thêm món",
    uploadImage: "Tải hình",
    restaurant: "Nhà hàng",
    productNameVi: "Tên món (VI)",
    productNameEn: "Tên món (EN)",
    descriptionEn: "Mô tả (EN)",
    descriptionVi: "Mô tả (VI)",
    addButton: "Thêm",
    total: "Tổng",
    statusFoodProcessing: "Đang Chế Biến",
    statusOutForDelivery: "Đang Giao",
    statusDelivered: "Đã Giao",
    categorySalad: "Salad",
    categoryRolls: "Cuốn",
    categoryDeserts: "Tráng miệng",
    categorySandwich: "Bánh mì kẹp",
    categoryCake: "Bánh ngọt",
    categoryPureVeg: "Món chay",
    categoryPasta: "Mì Ý",
    categoryNoodles: "Mì/Phở",
  },
  en: {
    adminPortal: "Admin Portal",
    menu: "Menu",
    addItem: "Add Item",
    orders: "Orders",
    dashboard: "Dashboard",
    revenue: "Revenue",
    totalRevenue: "Total revenue",
    totalOrders: "Total orders",
    avgOrderValue: "Avg order value",
    dateRange: "Date range",
    last7d: "Last 7d",
    last30d: "Last 30d",
    last90d: "Last 90d",
    customRange: "Custom",
    perRestaurant: "By restaurant",
    noData: "No data",
    adminView: "Admin View",
    logout: "Logout",
    confirmLogout: "Are you sure you want to logout?",
    loggedOut: "Logged out",
    toggleTheme: "Toggle light/dark",
    toggleLang: "Toggle EN/VI",
    allFoods: "All foods",
    image: "Image",
    name: "Name",
    category: "Category",
    price: "Price",
    action: "Action",
    allRestaurants: "All restaurants",
    remove: "Remove",
    loading: "Loading...",
    noPermission: "This account cannot access admin/owner area",
    loginSuccess: "Login success",
    loginFailed: "Login failed",
    loginAgain: "Login again",
    orderPage: "Order page",
    itemsLabel: "Items",
    phone: "Phone",
    addressLabel: "Address",
    statusUpdated: "Status updated",
    restaurantFilter: "Restaurant",
    addPage: "Add item",
    uploadImage: "Upload image",
    restaurant: "Restaurant",
    productNameVi: "Product Name (VI)",
    productNameEn: "Product Name (EN)",
    descriptionEn: "Description (EN)",
    descriptionVi: "Description (VI)",
    addButton: "Add",
    total: "Total",
    statusFoodProcessing: "Food Processing",
    statusOutForDelivery: "Out For Delivery",
    statusDelivered: "Delivered",
    categorySalad: "Salad",
    categoryRolls: "Rolls",
    categoryDeserts: "Desserts",
    categorySandwich: "Sandwich",
    categoryCake: "Cake",
    categoryPureVeg: "Pure Veg",
    categoryPasta: "Pasta",
    categoryNoodles: "Noodles",
  },
};

const UIContext = createContext(null);

const RATE_USD_VND = 24000;

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

  const formatMoney = (value) => {
    const num = Number(value || 0);
    if (lang === "vi") {
      return num.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      });
    }
    const usd = num / RATE_USD_VND;
    return usd.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
  };

  const translateCategory = (cat) => {
    const key = String(cat || "").toLowerCase();
    const dict = {
      salad: "categorySalad",
      rolls: "categoryRolls",
      deserts: "categoryDeserts",
      sandwich: "categorySandwich",
      cake: "categoryCake",
      "pure veg": "categoryPureVeg",
      pasta: "categoryPasta",
      noodles: "categoryNoodles",
    };
    const tKey = dict[key];
    if (tKey) return t(tKey);
    return cat || "";
  };

  const value = useMemo(
    () => ({ theme, lang, toggleTheme, toggleLang, t, formatMoney, translateCategory }),
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
