import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: "left" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ title: "LOG IN" }} />
      <Stack.Screen name="auth/register" options={{ title: "CREATE ACCOUNT" }} />
    </Stack>
  );
}
