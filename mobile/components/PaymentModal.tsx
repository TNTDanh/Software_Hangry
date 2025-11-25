import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import client from "../src/api/client";
import { useCartStore } from "../lib/store/cart";

type DraftItem = {
  name: string;
  nameEn?: string;
  price: number;
  quantity: number;
  restaurantId?: string;
  deliveryModes?: string[];
};

type Draft = {
  address: any;
  items: DraftItem[];
  amount: number;
  deliveryType?: string;
};

export default function PaymentModal({
  visible,
  onClose,
  draft,
  onSuccess,
}: {
  visible: boolean;
  onClose?: () => void;
  draft?: Draft;
  onSuccess?: () => void; // called after successful payment
}) {
  const itemsInStore = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const [method, setMethod] = useState<"card" | "cod">("card");
  const [loading, setLoading] = useState(false);
  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [cardOrderCreated, setCardOrderCreated] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardProcessing, setCardProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const resetCardForm = () => {
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setCardError(null);
    setCardOrderCreated(false);
  };

  const data = useMemo<Draft>(() => {
    if (draft?.items && draft?.amount) return draft;
    const items: DraftItem[] = itemsInStore.map((i) => ({
      name: i.name,
      nameEn: (i as any)?.nameEn,
      price: i.price,
      quantity: i.quantity,
      restaurantId: (i as any)?.restaurantId,
      deliveryModes: (i as any)?.deliveryModes,
    }));
    const subtotal = items.reduce(
      (sum, it) => sum + Number(it.price || 0) * it.quantity,
      0
    );
    const delivery = items.length ? 2 : 0;
    return {
      address: {},
      items,
      amount: subtotal + delivery,
    };
  }, [draft, itemsInStore]);

  const subtotal = Number(data.amount) - (data.items?.length ? 2 : 0);
  const delivery = data.items?.length ? 2 : 0;
  const total = Number(data.amount || 0);

  useEffect(() => {
    if (!visible) {
      setCardModalVisible(false);
      setCardProcessing(false);
      resetCardForm();
    }
  }, [visible]);

  const openCardModal = () => {
    if (!data.items?.length) return;
    setCardModalVisible(true);
  };

  const handleMethodChange = (next: "card" | "cod") => {
    setMethod(next);
    if (next === "cod") {
      setCardModalVisible(false);
      resetCardForm();
    }
  };

  const buildPayload = () => ({
    address: data.address || {},
    items: data.items.map((i) => ({
      name: i.name,
      nameEn: i.nameEn,
      price: i.price,
      quantity: i.quantity,
      restaurantId: i.restaurantId,
      deliveryModes: i.deliveryModes,
    })),
    amount: data.amount,
    deliveryType: data.deliveryType || "driver",
  });

  const handleExpiryChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 4);
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setCardExpiry(formatted);
    if (cardError) setCardError(null);
  };

  const handleMockCardPayment = () => {
    const normalizedCard = cardNumber.replace(/\s+/g, "");
    if (!cardOrderCreated) {
      setCardError("Please confirm your order before payment !!!");
      return;
    }
    const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (
      !cardName.trim() ||
      normalizedCard.length < 12 ||
      !expiryPattern.test(cardExpiry.trim()) ||
      cardCvv.trim().length < 3
    ) {
      setCardError("Please enter complete and valid card information !!!");
      return;
    }

    setCardProcessing(true);
    setCardError(null);
    setTimeout(() => {
      setCardProcessing(false);
      setCardModalVisible(false);
      onClose?.();
      clearCart();
      onSuccess?.();
      Alert.alert("Payment Successful !!!", "Order has been processed by card.");
      resetCardForm();
    }, 900);
  };

  const closeCardModal = () => {
    setCardModalVisible(false);
    setCardError(null);
    resetCardForm();
  };

  const place = async () => {
    if (!data.items?.length) {
      Alert.alert("Empty Cart", "Your cart is empty.");
      onClose?.();
      return;
    }

    const payload = buildPayload();

    if (method === "card") {
      setLoading(true);
      try {
        await client.post("/api/order/place", payload);
        setCardOrderCreated(true);
        openCardModal();
      } catch (err: any) {
        const message = err?.response?.data?.message || err.message || "Unable to create order.";
        Alert.alert("Payment", message);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      // COD - try /place-cod; if 404 fallback /place to keep demo parity
      let placed = false;
      try {
        const r = await client.post("/api/order/place-cod", payload);
        placed = !!r.data?.success;
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          try {
            await client.post("/api/order/place", payload);
          } catch {}
          placed = true;
        } else {
          // For demo, still consider placed to let flow continue
          placed = true;
        }
      }

      onClose?.();
      if (placed) {
        clearCart();
        onSuccess?.();
        Alert.alert("Order Successful !!!", "Your COD order was placed.");
      } else {
        Alert.alert("Order Failed", "Could not place COD order.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={s.overlay}>
          <View style={s.box}>
            <View style={s.header}>
              <Text style={s.title}>Payment</Text>
              <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
                <Text style={s.close}>x</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 12 }}>
              {/* Summary */}
              <View style={s.card}>
                <Text style={s.section}>Order Summary</Text>
                {data.items?.length ? (
                  data.items.map((it, idx) => (
                    <View key={idx} style={s.row}>
                      <Text style={s.itemName}>{it.name}</Text>
                      <Text style={s.itemQty}>x{it.quantity}</Text>
                      <Text style={s.itemPrice}>${Number(it.price).toLocaleString()}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: "#666", fontStyle: "italic" }}>No items</Text>
                )}

                <View style={s.sep} />

                <View style={s.rowJustify}>
                  <Text style={s.muted}>Subtotal</Text>
                  <Text style={s.bold}>${subtotal.toLocaleString()}</Text>
                </View>
                <View style={s.rowJustify}>
                  <Text style={s.muted}>Delivery</Text>
                  <Text style={s.bold}>${delivery.toLocaleString()}</Text>
                </View>
                <View style={[s.rowJustify, { marginTop: 6 }]}>
                  <Text style={s.totalLabel}>Total</Text>
                  <Text style={s.totalValue}>${total.toLocaleString()}</Text>
                </View>
              </View>

              {/* Methods */}
              <View style={s.card}>
                <Text style={s.section}>Payment Method</Text>

                <View style={s.pmRow}>
                  <TouchableOpacity
                    style={[s.pmBtn, method === "card" && s.pmBtnActive]}
                    onPress={() => handleMethodChange("card")}
                  >
                    <Text style={[s.pmText, method === "card" && s.pmTextActive]}>Card (Stripe)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.pmBtn, method === "cod" && s.pmBtnActive]}
                    onPress={() => handleMethodChange("cod")}
                  >
                    <Text style={[s.pmText, method === "cod" && s.pmTextActive]}>Cash on Delivery</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={place}
                  disabled={loading || !data.items?.length}
                  style={[s.payBtn, (loading || !data.items?.length) && { opacity: 0.6 }]}
                >
                  {loading ? (
                    <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                      <ActivityIndicator color="#fff" />
                      <Text style={s.payBtnText}>PROCESSING...</Text>
                    </View>
                  ) : (
                    <Text style={s.payBtnText}>CONFIRM PAYMENT</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {cardModalVisible ? (
            <View style={s.cardModalPortal}>
              <View style={s.cardModalBox}>
                <View style={s.header}>
                  <Text style={s.section}>Card Information</Text>
                  <TouchableOpacity onPress={closeCardModal} accessibilityLabel="Close card modal">
                    <Text style={s.close}>x</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ padding: 16 }}>
                  <TextInput
                    style={s.input}
                    placeholder="Name on Card"
                    placeholderTextColor={"#bebbbbff"}
                    value={cardName}
                    onChangeText={(text) => {
                      setCardName(text);
                      if (cardError) setCardError(null);
                    }}
                    autoCapitalize="words"
                  />
                  <TextInput
                    style={s.input}
                    placeholder="Card Number (at least 12 numbers)"
                    placeholderTextColor={"#bebbbbff"}
                    keyboardType="number-pad"
                    value={cardNumber}
                    onChangeText={(text) => {
                      setCardNumber(text);
                      if (cardError) setCardError(null);
                    }}
                  />

                  <View style={s.cardFormRow}>
                    <TextInput
                      style={[s.input, { flex: 1, marginRight: 10 }]}
                      placeholder="MM/YY"
                      placeholderTextColor={"#bebbbbff"}
                      keyboardType="number-pad"
                      value={cardExpiry}
                      onChangeText={handleExpiryChange}
                    />
                    <TextInput
                      style={[s.input, { flex: 1 }]}
                      placeholder="CVV ( >=3 digits )"
                      placeholderTextColor={"#bebbbbff"}
                      keyboardType="number-pad"
                      value={cardCvv}
                      secureTextEntry
                      onChangeText={(text) => {
                        setCardCvv(text);
                        if (cardError) setCardError(null);
                      }}
                    />
                  </View>

                  {cardError ? <Text style={s.errorText}>{cardError}</Text> : null}

                  <TouchableOpacity
                    onPress={handleMockCardPayment}
                    disabled={cardProcessing}
                    style={[s.payBtn, cardProcessing && { opacity: 0.6 }]}
                  >
                    {cardProcessing ? (
                      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                        <ActivityIndicator color="#fff" />
                        <Text style={s.payBtnText}>PROCESSING...</Text>
                      </View>
                    ) : (
                      <Text style={s.payBtnText}>PAY NOW</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={closeCardModal} style={s.cancelBtn}>
                    <Text style={s.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  box: { width: "100%", maxWidth: 520, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden" },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "900" },
  close: { color: "#e90303",fontSize: 24, fontWeight: "900" },
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, marginTop: 12 },
  section: { fontWeight: "900", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  rowJustify: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  sep: { height: 1, backgroundColor: "#eee", marginTop: 8 },
  itemName: { flex: 1 },
  itemQty: { width: 36, textAlign: "right" },
  itemPrice: { minWidth: 60, textAlign: "right", fontWeight: "700" },
  muted: { color: "#666", fontStyle: "italic" },
  bold: { fontWeight: "800", fontStyle: "italic" },
  totalLabel: { color: "#e90303", fontSize: 16, fontWeight: "900" },
  totalValue: { color: "#e90303", fontSize: 16, fontWeight: "900" },

  pmRow: { flexDirection: "row", gap: 10 },
  pmBtn: { flex: 1, backgroundColor: "#f4f4f5", borderRadius: 10, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb" },
  pmBtnActive: { backgroundColor: "#111", borderColor: "#111" },
  pmText: { color: "#111", fontWeight: "900", fontStyle: "italic" },
  pmTextActive: { color: "#fff" },

  payBtn: { backgroundColor: "#111", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 12 },
  payBtnText: { color: "#fff", fontWeight: "900" },
  cancelBtn: { backgroundColor: "#f3f4f6", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  cancelText: { color: "#111", fontWeight: "900", fontStyle: "italic" },
  cardModalPortal: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 15,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cardModalBox: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  input: {
    borderWidth: 1,
    borderColor: "#c2c3c5ff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  cardFormRow: { flexDirection: "row", marginTop: 12 },
  errorText: { color: "#dc2626", marginTop: 8, fontStyle: "italic" },
});
