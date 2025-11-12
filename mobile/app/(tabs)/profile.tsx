import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
  ImageBackground,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../lib/store/auth";

export default function ProfileScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const clearToken = useAuthStore((s) => s.clearToken);

  const onSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", onPress: () => clearToken() },
    ]);
  };

  return (
    <ScrollView
      style={s.wrap}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <View style={s.headerRow}>
        <Image
          source={require("../../assets/images/eat.png")}
          style={s.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={s.title}>My Account</Text>
          <Text style={s.subtitle}>
            {token
              ? "Welcome back! Enjoy your perks below."
              : "Sign in to sync your orders & rewards."}
          </Text>
        </View>
        {!token ? (
          <TouchableOpacity
            style={[s.btn, { paddingVertical: 8, paddingHorizontal: 14 }]}
            onPress={() =>
              router.push({
                pathname: "/auth/login",
                params: { returnTo: "/(tabs)/profile" },
              })
            }
          >
            <Text style={s.btnText}>Sign In</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.btnOutline]} onPress={onSignOut}>
            <Text style={[s.btnTextOutline]}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>A note from DP RESTAURANT 🍽️</Text>
        <Text style={[s.cardBody, { textAlign: "justify", lineHeight: 18 }]}>
          Thank you for supporting our partner restaurants! Your orders help
          local kitchens thrive. We’re cooking up new dishes and promotions just
          for you.
        </Text>
      </View>

      <ImageBackground
        source={require("../../assets/images/header_img.png")}
        style={s.banner}
        imageStyle={{ borderRadius: 16 }}
      >
        <View style={s.bannerOverlay} />
        <View style={{ padding: 16 }}>
          <Text style={s.bannerTitle}>Free Delivery This Week</Text>
          <Text style={s.bannerText}>Enjoy unique and delicious dishes</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: "#111" }]}
              onPress={() => router.push("/")}
            >
              <Text style={s.btnText}>Buy Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.btn,
                {
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#111",
                },
              ]}
              onPress={() => router.push("/cart")}
            >
              <Text style={[s.btnText, { color: "#111" }]}>View Your Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      <View style={s.card}>
        <Text style={s.cardTitle}>CONTACT</Text>

        <Text style={s.cardBody}>DPxFoodFast Co., Ltd.</Text>
        <Text style={s.cardBody}>
          Address: 273 An Duong Vuong, Cho Quan ward
        </Text>
        <Text style={s.cardBody}>Hotline: +84-862-853-345</Text>
        <Text style={s.cardBody}>Email: contact@danhpuoc.com</Text>
        <Text style={s.cardBody}>Website: https://danhphuocxfoodfast.vn</Text>
        <Text style={s.cardBody}>Open: 7AM – 10PM (Monday – Sunday)</Text>
        <Text style={s.muted}>This app is just for my learning portfolio</Text>
        <Text style={s.muted}>THIS IS NOT A REAL APP</Text>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 24, marginBottom: 14 }}>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: "#111" }]}
            onPress={() => Linking.openURL("tel:0862853345")}
          >
            <Text style={s.btnText}>Hotline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              s.btn,
              { backgroundColor: "#cdcdcdff", borderWidth: 1, borderColor: "#111" },
            ]}
            onPress={() =>
              Linking.openURL("mailto:thainguyenthanhdanhmh@gmail.com")
            }
          >
            <Text style={[s.btnText, { color: "#111" }]}>Send Mail</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              s.btn,
              { backgroundColor: "#425ff0ff", borderWidth: 1, borderColor: "#111" },
            ]}
            onPress={() =>
              Linking.openURL("https://www.facebook.com/tnt.danh.2004")
            }
          >
            <Text style={[s.btnText, { color: "#f9f9f9ff" }]}>Facebook</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#f8f8f8" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  avatar: { width: 56, height: 56, borderRadius: 12 },
  title: { fontSize: 22, fontWeight: "900" },
  subtitle: { color: "#666", marginTop: 2 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "900", marginBottom: 6 },
  cardBody: { lineHeight: 20, color: "#444" },

  banner: { height: 140, borderRadius: 16, overflow: "hidden", marginTop: 12 },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  bannerTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  bannerText: { color: "#eee", marginTop: 2 },

  stampRow: { flexDirection: "row", gap: 8, marginTop: 12, marginBottom: 6 },
  stamp: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  stampFilled: { backgroundColor: "#111", borderColor: "#111" },
  muted: { fontStyle: "italic", color: "#888", marginTop: 4 },

  btn: {
    backgroundColor: "#111",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  btnText: { color: "#fff", fontWeight: "800", textAlign: "center" },

  btnOutline: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#111",
    backgroundColor: "#fff",
  },
  btnTextOutline: { color: "#111", fontWeight: "800" },
});
