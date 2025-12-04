import React from "react";
import { View } from "react-native";
import FoodCardLarge from "./FoodCardLarge";

export default function FoodCardGrid({ data }: { data: any[] }) {
  return (
    <View style={{ rowGap: 12 }}>
      {Array.from({ length: Math.ceil((data?.length || 0) / 2) }).map((_, rowIdx) => {
        const left = data[rowIdx * 2];
        const right = data[rowIdx * 2 + 1];
        return (
          <View key={rowIdx} style={{ flexDirection: "row", columnGap: 12 }}>
            {left && <View style={{ flex: 1 }}><FoodCardLarge item={left} /></View>}
            {right ? <View style={{ flex: 1 }}><FoodCardLarge item={right} /></View> : <View style={{ flex: 1 }} />}
          </View>
        );
      })}
    </View>
  );
}