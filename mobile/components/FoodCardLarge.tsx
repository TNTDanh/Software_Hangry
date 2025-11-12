import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { resolveImageSource } from "../src/until/image";
import { useCartStore } from "../lib/store/cart";

export default function FoodCardLarge({ item }: { item: any }) {
  const addItem = useCartStore((s) => s.addItem);
  const [failed, setFailed] = useState(false);

  const imgSrc = resolveImageSource(item.image);

  return (
    <View style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, overflow: "hidden", backgroundColor: "#fff", minHeight: 260 }}>
      {imgSrc ? (
        <Image
          source={failed ? require("../assets/images/food_item_2.png") : imgSrc}
          style={{ width: "100%", height: 140 }}
          resizeMode="cover"
          // @ts-ignore (RN Web)
          onError={() => setFailed(true)}
          // @ts-ignore
          referrerPolicy="no-referrer"
        />
      ) : (
        <View style={{ width: "100%", height: 140, backgroundColor: "#f3f3f3" }} />
      )}

      <View style={{ padding: 12, gap: 6, minHeight: 98 }}>
        <Text numberOfLines={1} style={{ fontWeight: "800", lineHeight: 20, minHeight: 20 }}>{item?.name || "Unnamed"}</Text>
        <Text numberOfLines={2} style={{ color: "#666", lineHeight: 16, minHeight: 36, fontStyle: "italic" }}>{item?.description || ""}</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <Text style={{ fontWeight: "900" }}>${Number(item?.price || 0).toLocaleString()}</Text>
          <TouchableOpacity
            onPress={() => addItem({ id: item._id, name: item.name, price: item.price, image: item.image, qty: 1 })}
            style={{ backgroundColor: "#111", paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8 }}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
