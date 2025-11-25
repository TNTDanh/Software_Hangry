import { useState } from "react";
import { Buffer } from "buffer";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams, type Href } from "expo-router";
import client from "../../src/api/client";
import { useAuthStore } from "../../lib/store/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const safeDecode = (v?: string) => {
    if (!v) return undefined;
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };

  // Only allow known routes to satisfy Href typing safely
  const allowed = new Set<string>([
    "/",
    "/(tabs)",
    "/(tabs)/index",
    "/(tabs)/cart",
    "/(tabs)/orders",
    "/(tabs)/myorders",
    "/(tabs)/profile",
    "/auth/register",
  ]);

  const onLogin = async () => {
    try {
      setLoading(true);
      const res = await client.post("/api/user/login", {
        email: email.trim(),
        password: password.trim(),
      });
      console.log("[LOGIN] response:", res.data);

      const token =
        res.data?.token ??
        res.data?.data?.token ??
        res.data?.jwt ??
        res.data?.accessToken ??
        null;
      const role = res.data?.role || res.data?.data?.role;
      const restaurantIds = res.data?.restaurantIds || res.data?.data?.restaurantIds || [];

      const userId =
        typeof token === "string"
          ? (() => {
              try {
                const payload = JSON.parse(
                  Buffer.from(token.split(".")[1], "base64").toString("utf8")
                );
                return payload.id || payload.userId || null;
              } catch {
                return null;
              }
            })()
          : null;

      if (!token) {
        throw new Error(res.data?.message || "Account does not exist or Password is incorrect.");
      }

      setUser({ token, userId, role, restaurantIds });
      Alert.alert("Success", "Login Successful !!!");

      const toRaw = typeof returnTo === "string" ? safeDecode(returnTo) : undefined;
      if (toRaw && allowed.has(toRaw)) {
        router.replace(toRaw as Href);
      } else {
        router.back();
      }
    } catch (e: any) {
      Alert.alert("Lỗi", e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.wrap}>
        <Text style={[styles.title, { textAlign: "center" }]}>LOG IN</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: danh@example.com"
          placeholderTextColor="#dcd7d7ff"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Pass word</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          placeholderTextColor="#dcd7d7ff"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          disabled={loading}
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={onLogin}
        >
          <Text style={styles.btnText}>{loading ? "LOGGING IN..." : "COMPLETE"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/auth/register")} style={{ marginTop: 14 }}>
          <Text style={styles.linkText}>Don{"'"}t have an Account? SIGN UP</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Container giống register: canh giữa + nền xám nhạt
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f8f8",
  },
  // Box trắng bo góc, đổ bóng, rộng 90% như register
  wrap: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: { fontSize: 24, fontWeight: "900", marginBottom: 16 },
  label: { fontWeight: "700", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  btn: { backgroundColor: "#111", padding: 14, borderRadius: 10, marginTop: 6 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "800" },
  linkText: { textAlign: "center", textDecorationLine: "underline", fontWeight: "700" },
});
