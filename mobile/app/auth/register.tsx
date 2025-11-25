import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import client from "../../src/api/client";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Missing info", "Please fill all fields.");
      return;
    }
    try {
      setLoading(true);
      const res = await client.post("/api/user/register", { name, email, password });
      if (!res.data?.success) throw new Error(res.data?.message || "Unknown error.");
      Alert.alert("Success", "Account created! Please sign in.");
      router.replace("/auth/login");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.wrap}>
      <View style={s.box}>
        <Text style={s.title}>CREATE ACCOUNT</Text>
        <TextInput style={s.input} placeholder="Full name" placeholderTextColor="#dcd7d7ff" value={name} onChangeText={setName} />
        <TextInput style={s.input} placeholder="Email" placeholderTextColor="#dcd7d7ff" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={s.input} placeholder="Password" placeholderTextColor="#dcd7d7ff" secureTextEntry value={password} onChangeText={setPassword} />
        <TouchableOpacity disabled={loading} style={[s.btn, loading && { opacity: 0.6 }]} onPress={onRegister}>
          <Text style={s.btnText}>{loading ? "Creating..." : "Sign Up"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/auth/login")} style={{ marginTop: 14 }}>
          <Text style={s.linkText}>Already have an Account? SIGN IN</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: "#f8f8f8" },
  box: { width: "90%", backgroundColor: "#fff", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  title: { fontSize: 22, fontWeight: "900", marginBottom: 16, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 12, backgroundColor: "#fff" },
  btn: { backgroundColor: "#111", padding: 14, borderRadius: 10, marginTop: 6 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "800" },
  linkText: { textAlign: "center", textDecorationLine: "underline", fontWeight: "700" },
});
