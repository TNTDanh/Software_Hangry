export type Category = {
  key: string;   // value used to filter (compare with item.category from backend)
  label: string; // display label (translated in UI if needed)
};

// Backend currently returns "Deserts" (not "Desserts"), keep keys aligned.
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
