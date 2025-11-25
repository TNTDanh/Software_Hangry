import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function QuantityStepper({
  value, onDec, onInc,
}: { value: number; onDec: () => void; onInc: () => void }) {
  return (
    <View style={s.row}>
      <TouchableOpacity onPress={onDec} style={s.btn}>
        <Ionicons name="remove" size={18} color="#111" />
      </TouchableOpacity>
      <Text style={s.value}>{value}</Text>
      <TouchableOpacity onPress={onInc} style={s.btn}>
        <Ionicons name="add" size={18} color="#111" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  btn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#f2f2f2",
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e5e7eb" },
  value: { minWidth: 24, textAlign: "center", fontWeight: "800" },
});
