import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useCartStore } from "../../lib/store/cart";
import { useAuthStore } from "../../lib/store/auth";
import client from "../../src/api/client";
import PaymentModal from "../../components/PaymentModal";

type Address = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export default function OrdersScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const clearCart = useCartStore((s) => s.clearCart);
  const token = useAuthStore((s) => s.token);

  const [addr, setAddr] = useState<Address>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });
  const PH = "#afb5bdff";
  const onChange = (k: keyof Address) => (v: string) =>
    setAddr((s) => ({ ...s, [k]: v }));

  const subTotal = total();
  const delivery = items.length ? 2 : 0;
  const grandTotal = useMemo(() => subTotal + delivery, [subTotal, delivery]);

  const [showPayment, setShowPayment] = useState(false);

  const proceed = async () => {
    if (!items.length) {
      Alert.alert("Empty Cart", "Your cart is empty.");
      return;
    }
    if (!token) {
      Alert.alert("Sign in required", "Please sign in to place your order.", [
        {
          text: "Sign in",
          onPress: () =>
            router.push({
              pathname: "/auth/login",
              params: { returnTo: "/(tabs)/orders" },
            }),
        },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }

    // Validate đơn giản vài trường quan trọng
    if (
      !addr.firstName ||
      !addr.lastName ||
      !addr.email ||
      !addr.street ||
      !addr.city ||
      !addr.country
    ) {
      Alert.alert("Missing Info", "Please fill in all required fields.");
      return;
    }

    // Open payment modal to choose method (card / COD)
    setShowPayment(true);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={s.title}>Delivery Information</Text>

        {/* Row: First/Last name */}
        <View style={s.row}>
          <TextInput
            style={[s.input, s.col]}
            placeholder="First Name"placeholderTextColor={PH}
            value={addr.firstName}
            onChangeText={onChange("firstName")}
          />
          <TextInput
            style={[s.input, s.col]}
            placeholder="Last Name"placeholderTextColor={PH}
            value={addr.lastName}
            onChangeText={onChange("lastName")}
          />
        </View>

        <TextInput
          style={s.input}
          placeholder="Email address"placeholderTextColor={PH}
          keyboardType="email-address"
          autoCapitalize="none"
          value={addr.email}
          onChangeText={onChange("email")}
        />

        <TextInput
          style={s.input}
          placeholder="Street"placeholderTextColor={PH}
          value={addr.street}
          onChangeText={onChange("street")}
        />

        {/* Row: City/State */}
        <View style={s.row}>
          <TextInput
            style={[s.input, s.col]}
            placeholder="City"placeholderTextColor={PH}
            value={addr.city}
            onChangeText={onChange("city")}
          />
          <TextInput
            style={[s.input, s.col]}
            placeholder="State"placeholderTextColor={PH}
            value={addr.state}
            onChangeText={onChange("state")}
          />
        </View>

        {/* Row: Zip/Country */}
        <View style={s.row}>
          <TextInput
            style={[s.input, s.col]}
            placeholder="Zip code"placeholderTextColor={PH}
            keyboardType="number-pad"
            value={addr.zip}
            onChangeText={onChange("zip")}
          />
          <TextInput
            style={[s.input, s.col]}
            placeholder="Country"placeholderTextColor={PH}
            value={addr.country}
            onChangeText={onChange("country")}
          />
        </View>

        <TextInput
          style={s.input}
          placeholder="Phone"placeholderTextColor={PH}
          keyboardType="phone-pad"
          value={addr.phone}
          onChangeText={onChange("phone")}
        />
        {/* Note */}
        <Text style={s.note}>
          ** CHECK THE INFORMATION CAREFULLY SO THAT THE **
        </Text>
        {/* Note */}
        <Text style={s.note}>
          ** ORDER IS DELIVERED AS SOON AS POSSIBLE !!! **
        </Text>

        {/* Summary card */}
        <View style={s.summary}>
          <Text style={s.sumTitle}>Cart Totals</Text>

          <View style={s.sumRow}>
            <Text style={s.sumLabel}>Subtotal</Text>
            <Text style={s.sumValue}>${subTotal.toLocaleString()}</Text>
          </View>

          <View style={s.sumRow}>
            <Text style={s.sumLabel}>Delivery Fee</Text>
            <Text style={s.sumValue}>${delivery.toLocaleString()}</Text>
          </View>

          <View style={s.separator} />

          <View style={[s.sumRow, { marginTop: 6 }]}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>${grandTotal.toLocaleString()}</Text>
          </View>

          <TouchableOpacity
            onPress={proceed}
            disabled={!items.length}
            style={[s.payBtn, !items.length && { opacity: 0.5 }]}
          >
            <Text style={s.payBtnText}>PROCEED TO PAYMENT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <PaymentModal
        visible={showPayment}
        onClose={() => setShowPayment(false)}
        draft={{
          address: addr,
          items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
          amount: grandTotal,
        }}
        onSuccess={() => {
          clearCart();
          router.push("/(tabs)/profile");
        }}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "900", marginBottom: 12 },

  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#a8a8a8ff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },

  summary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#a8a8a8ff",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  sumTitle: { fontSize: 18, fontWeight: "900", marginBottom: 8},
  sumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  sumLabel: { color: "#666", fontStyle: "italic" },
  sumValue: { fontWeight: "800", fontStyle: "italic"},
  separator: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 8 },

  totalLabel: { color: "#e90303ff", fontSize: 16, fontWeight: "900" },
  totalValue: { color: "#e90303ff", fontSize: 16, fontWeight: "900" },

  payBtn: {
    backgroundColor: "#ff6a3d",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  payBtnText: { color: "#fff", fontWeight: "900", fontStyle: "italic", },
  note: {
    textAlign: "justify",
    lineHeight: 16,
    marginTop: 12,
    marginBottom: 12,
    color: "#6b7280",
    fontStyle: "italic",
    fontSize: 12,
  },
});
