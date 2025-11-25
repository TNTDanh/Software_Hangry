import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useCartStore } from "../../lib/store/cart";
import { useUI } from "../../hooks/useUI";
import { Colors } from "../../constants/theme";

export default function TabsLayout() {
  const { theme, t } = useUI();
  const palette = Colors[theme as keyof typeof Colors];
  const cartQty = useCartStore((s) => s.items.reduce((sum, it) => sum + it.quantity, 0));
  const hasCart = cartQty > 0;

  return (
    <Tabs
      screenOptions={({ route }) => {
        const iconName = (focused: boolean) => {
          switch (route.name) {
            case "index":
              return focused ? "home" : "home-outline";
            case "cart":
              return focused ? "cart" : "cart-outline";
            case "orders":
              return focused ? "cash" : "cash-outline";
            case "myorders":
              return focused ? "time" : "time-outline";
            case "profile":
              return focused ? "person" : "person-outline";
            default:
              return focused ? "ellipse" : "ellipse-outline";
          }
        };
        return {
          headerShown: false,
          headerTitleAlign: "left",
          tabBarActiveTintColor: palette.tint,
          tabBarInactiveTintColor: palette.textSecondary,
          tabBarStyle: {
            height: 72,
            paddingBottom: 6,
            paddingTop: 6,
            backgroundColor: palette.background,
            borderTopWidth: 0,
            borderTopColor: "transparent",
            elevation: 0,
          },
          tabBarLabelStyle: { fontSize: 13, marginBottom: 2, fontFamily: "BeVietnamPro_600SemiBold" },
          tabBarIcon: ({ color, focused }) => (
            <View style={{ width: 34, height: 28, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={iconName(focused) as any} size={26} color={color} />
              {route.name === "cart" && hasCart ? (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 2,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#ef4444",
                  }}
                />
              ) : null}
            </View>
          ),
        };
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("home") }} />
      <Tabs.Screen name="cart" options={{ title: t("cartTab") }} />
      <Tabs.Screen name="orders" options={{ title: t("paymentTab") }} />
      <Tabs.Screen name="myorders" options={{ title: t("ordersTab") }} />
      <Tabs.Screen name="profile" options={{ title: t("account") }} />
      {/* Hide error helper route from tab bar */}
      <Tabs.Screen name="onError" options={{ href: null }} />
    </Tabs>
  );
}
