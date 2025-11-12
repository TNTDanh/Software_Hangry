export type Category = {
  key: string;   // giá trị dùng để filter (so sánh với item.category từ BE)
  label: string; // hiển thị
};

// 8 loại phổ biến như web (đồng bộ các key với dữ liệu của bạn)
// Lưu ý: backend của bạn đang dùng "Deserts" (không phải "Desserts") → giữ nguyên "Deserts".
export const CATEGORIES: Category[] = [
  { key: "All",      label: "All" },
  { key: "Salad",    label: "Salad" },
  { key: "Rolls",    label: "Rolls" },
  { key: "Deserts",  label: "Deserts" },
  { key: "Sandwich", label: "Sandwich" },
  { key: "Cake",     label: "Cake" },
  { key: "Pure Veg", label: "Pure Veg" },
  { key: "Pasta",    label: "Pasta" },
  { key: "Noodles",  label: "Noodles" },
];
