import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BrandColors } from "../constants/theme";

type Lang = "vi" | "en";
type ThemeMode = "light" | "dark";

type UIState = { theme: ThemeMode; lang: Lang };

type UIContextValue = UIState & {
  t: (key: string) => string;
  formatMoney: (value: number) => string;
  translateStatus: (status?: string) => string;
  translateCategory: (cat?: string) => string;
  toggleTheme: () => void;
  toggleLang: () => void;
  brand: typeof BrandColors;
};

const STORAGE_KEY = "ui_state";
const RATE_USD_VND = 24000;

const translations: Record<Lang, Record<string, string>> = {
  vi: {
    home: "Trang Chủ",
    cartTab: "Giỏ",
    paymentTab: "Thanh Toán",
    ordersTab: "Đơn Hàng",
    account: "Tài Khoản",
    heroHeadline: "Hôm Nay Ăn Gì !??",
    heroBody:
      "Thực đơn đa dạng với nguyên liệu cao cấp, đánh thức vị giác và mang lại trải nghiệm ẩm thực sang trọng — mỗi bữa ăn là một niềm vui mới.",
    all: "Tất cả",
    Home: "Trang Chủ",
    Cart: "Giỏ",
    Payment: "Thanh Toán",
    Orders: "Đơn Hàng",
    Account: "Tài Khoản",
    topDishes: "Hôm Nay Ăn Gì !??",
    add: "Thêm",
    addToCart: "Thêm vào giỏ",
    cart: "Giỏ hàng",
    orders: "Đơn hàng",
    payment: "Thanh toán",
    goRecent: "Đơn mới",
    emptyOrders: "Chưa có đơn",
    signIn: "Đăng nhập",
    signInToView: "Đăng nhập để xem đơn hàng",
    signInRequired: "Cần đăng nhập",
    signInToContinue: "Vui lòng đăng nhập để tiếp tục",
    orderMore: "Đặt thêm",
    clearCart: "Xóa giỏ",
    subtotal: "Tạm tính",
    deliveryFee: "Phí giao hàng",
    total: "Tổng",
    proceed: "Thanh toán",
    checkout: "Thanh toán",
    cartTitle: "Giỏ hàng",
    emptyCart: "Giỏ hàng trống",
    addressTitle: "Địa chỉ",
    city: "Thành phố",
    restaurant: "Nhà hàng",
    eta: "Thời gian giao",
    statusFoodProcessing: "Đang chế biến",
    statusOutForDelivery: "Đang giao",
    statusDelivered: "Đã giao",
    ratingFood: "Đồ ăn",
    ratingDriver: "Tài xế",
    ratingAvg: "Trung bình",
    remove: "Xóa",
    firstName: "Tên",
    lastName: "Họ",
    email: "Email",
    street: "Địa chỉ",
    state: "Tỉnh/Bang",
    zip: "Mã bưu điện",
    country: "Quốc gia",
    phone: "Số điện thoại",
    missingInfo: "Thiếu thông tin",
    fillRequired: "Vui lòng điền đủ thông tin bắt buộc.",
    categorySalad: "Salad",
    categoryRolls: "Cuốn",
    categoryDeserts: "Tráng Miệng",
    categorySandwich: "Bánh Mì",
    categoryCake: "Bánh Ngọt",
    categoryPureVeg: "Món Chay",
    categoryPasta: "Mì Ý",
    categoryNoodles: "Bún/Phở",
    deliveryMethod: "Phương thức giao",
    driver: "Tài xế",
    drone: "Drone",
    promoCode: "Mã khuyến mãi",
    apply: "Áp dụng",
    discount: "Giảm giá",
    support: "Hỗ trợ",
    review: "Đánh giá",
    deliveryRating: "Giao hàng",
    comment: "Bình luận",
    itemsLabel: "Món",
    supportPlaceholder: "Mô tả vấn đề...",
    success: "Thành công",
    ratingRange: "Vui lòng nhập số từ 1 đến 5",
    reviewAgain: "Đánh giá lại",
  },
  en: {
    home: "Home",
    cartTab: "Cart",
    paymentTab: "Payment",
    ordersTab: "Orders",
    account: "Account",
    heroHeadline: "What To Eat Today !??",
    heroBody:
      "Enjoy a varied menu with dishes made from premium ingredients, awakening the taste buds and bringing a classy culinary experience — every meal is a new pleasure.",
    all: "All",
    topDishes: "What To Eat Today !??",
    add: "Add",
    addToCart: "Add to Cart",
    cart: "Cart",
    orders: "Orders",
    payment: "Payment",
    goRecent: "Go to recent",
    emptyOrders: "You have no orders yet.",
    signIn: "Sign In",
    signInToView: "Sign in to view your orders.",
    signInRequired: "Sign in required",
    signInToContinue: "Please sign in to continue",
    orderMore: "Order more",
    clearCart: "Clear cart",
    subtotal: "Subtotal",
    deliveryFee: "Delivery Fee",
    total: "Total",
    proceed: "Proceed to pay",
    checkout: "Checkout",
    cartTitle: "Cart",
    emptyCart: "Cart is empty",
    addressTitle: "Address",
    city: "City",
    restaurant: "Restaurant",
    eta: "ETA",
    statusFoodProcessing: "Food Processing",
    statusOutForDelivery: "Out for Delivery",
    statusDelivered: "Delivered",
    ratingFood: "Food",
    ratingDriver: "Driver",
    ratingAvg: "Average",
    remove: "Remove",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    street: "Street",
    state: "State",
    zip: "Zip code",
    country: "Country",
    phone: "Phone",
    missingInfo: "Missing Info",
    fillRequired: "Please fill in all required fields.",
    categorySalad: "Salad",
    categoryRolls: "Rolls",
    categoryDeserts: "Desserts",
    categorySandwich: "Sandwich",
    categoryCake: "Cake",
    categoryPureVeg: "Pure Veg",
    categoryPasta: "Pasta",
    categoryNoodles: "Noodles",
    deliveryMethod: "Delivery Method",
    driver: "Driver",
    drone: "Drone",
    promoCode: "Promo Code",
    apply: "Apply",
    discount: "Discount",
    support: "Support",
    review: "Review",
    deliveryRating: "Delivery",
    comment: "Comment",
    itemsLabel: "Items",
    supportPlaceholder: "Describe your issue...",
    success: "Success",
    ratingRange: "Please enter a number from 1 to 5",
    reviewAgain: "Review again",
  },
};

const UIContext = createContext<UIContextValue | null>(null);

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<UIState>({ theme: "light", lang: "vi" });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        setState({
          theme: parsed.theme === "dark" ? "dark" : "light",
          lang: parsed.lang === "en" ? "en" : "vi",
        });
      } catch {
        // ignore bad cache
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const toggleTheme = () =>
    setState((prev) => ({ ...prev, theme: prev.theme === "dark" ? "light" : "dark" }));
  const toggleLang = () =>
    setState((prev) => ({ ...prev, lang: prev.lang === "vi" ? "en" : "vi" }));

  const t = (key: string): string => {
    const dict = translations[state.lang];
    return dict[key] ?? key;
  };

  const formatMoney = (value: number) => {
    const num = Number(value || 0);
    if (state.lang === "vi") {
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
    });
  };

  const translateStatus = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("out for delivery")) return t("statusOutForDelivery");
    if (s.includes("delivered")) return t("statusDelivered");
    return t("statusFoodProcessing");
  };

  const translateCategory = (cat?: string) => {
    const dict: Record<string, string> = {
      salad: "categorySalad",
      rolls: "categoryRolls",
      deserts: "categoryDeserts",
      sandwich: "categorySandwich",
      cake: "categoryCake",
      "pure veg": "categoryPureVeg",
      pasta: "categoryPasta",
      noodles: "categoryNoodles",
    };
    const key = dict[String(cat || "").toLowerCase()];
    return key ? t(key) : cat || "";
  };

  const value = useMemo<UIContextValue>(
    () => ({
      ...state,
      t,
      formatMoney,
      translateStatus,
      translateCategory,
      toggleTheme,
      toggleLang,
      brand: BrandColors,
    }),
    [state]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside UIProvider");
  return ctx;
};
