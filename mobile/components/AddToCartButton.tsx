import { TouchableOpacity, Text } from "react-native";
import { useCartStore } from "../lib/store/cart";

type AddButtonItem =
  | { id: string; name: string; price: number; image?: string | null }
  | { _id: string; name: string; price: number; image?: string | null };

export default function AddToCartButton({ item }: { item: AddButtonItem }) {
  const addItem = useCartStore((s) => s.addItem);

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
        backgroundColor: "#111",
        paddingVertical: 8,
        borderRadius: 10,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700" }}>Add to Cart</Text>
    </TouchableOpacity>
  );
}
