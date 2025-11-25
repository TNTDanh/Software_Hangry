import { TouchableOpacity, Text } from "react-native";
import { useCartStore } from "../lib/store/cart";
import { useUI } from "../hooks/useUI";
import { BrandColors, FontFamilyBold } from "../constants/theme";

export default function AddToCartButton({ item }: { item: any }) {
  const addItem = useCartStore((s) => s.addItem);
  const { t } = useUI();

  const onAdd = () => {
    const id = (item as any).id ?? (item as any)._id;
    if (!id) return;

    addItem({
      id,
      name: item.name,
      price: Number(item.price),
      image: item.image ?? null,
      qty: 1,
    });
  };

  return (
    <TouchableOpacity
      onPress={onAdd}
      style={{
        backgroundColor: BrandColors.primary,
        paddingVertical: 10,
        borderRadius: 999,
        alignItems: "center",
        shadowColor: BrandColors.primary,
        shadowOpacity: 0.35,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 10,
        elevation: 5,
      }}
    >
      <Text style={{ color: "#fff", fontFamily: FontFamilyBold }}>{t("addToCart")}</Text>
    </TouchableOpacity>
  );
}
