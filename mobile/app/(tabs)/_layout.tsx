import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useCartStore } from "../../lib/store/cart";

export default function TabsLayout() {
  const cartQty = useCartStore((s) =>
    s.items.reduce((sum, it) => sum + it.quantity, 0)
  );
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
          headerTitleAlign: "left",
          tabBarActiveTintColor: "#111",
          tabBarInactiveTintColor: "#9ca3af",
          tabBarStyle: { height: 72, paddingBottom: 6, paddingTop: 6 },
          tabBarLabelStyle: { fontSize: 13, marginBottom: 2 },
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 34,
                height: 28,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={iconName(focused) as any}
                size={26}
                color={color}
              />
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
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="cart" options={{ title: "Cart" }} />
      <Tabs.Screen name="orders" options={{ title: "Payment" }} />
      <Tabs.Screen name="myorders" options={{ title: "Orders" }} />
      <Tabs.Screen name="profile" options={{ title: "Account" }} />
    </Tabs>
  );
}
