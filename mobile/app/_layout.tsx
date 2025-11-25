import { Stack } from "expo-router";
import { UIProvider } from "../hooks/useUI";
import { useFonts, BeVietnamPro_400Regular, BeVietnamPro_600SemiBold, BeVietnamPro_700Bold } from "@expo-google-fonts/be-vietnam-pro";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const [loaded] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <UIProvider>
      <Stack screenOptions={{ headerTitleAlign: "left" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: "LOG IN", headerBackTitle: "Back" }} />
        <Stack.Screen name="auth/register" options={{ title: "CREATE ACCOUNT", headerBackTitle: "Back" }} />
      </Stack>
    </UIProvider>
  );
}
