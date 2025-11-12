import { View, Image, Text, StyleSheet, ImageBackground  } from "react-native";

export default function HeaderHero() {
  return (
    <View>
      <View style={s.top}>
        <Image
          source={require("../assets/images/logo.png")}
          style={s.logo}
          resizeMode="contain"
        />
        <Text style={s.brand}>DANH PHUOC RESTAURANT</Text>
      </View>
      <ImageBackground
        source={require("../assets/images/header_img.png")}
        style={s.banner}
        imageStyle={{ borderRadius: 16 }}
        resizeMode="cover"
      >
        <View style={s.overlayBox}>
          <Text style={s.overlayTitle}>WHAT TO EAT TODAY !???</Text>
          <Text style={s.overlayBody}>
            Enjoy a varied menu with dishes made from premium ingredients,
            awakening the taste buds and bringing a classy culinary experience —
            every meal is a new pleasure.
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const s = StyleSheet.create({
  top: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 28, height: 28, borderRadius: 6 },
  brand: { color: "#f15000ff",fontSize: 20, fontWeight: "900" },
  banner: { width: "100%", height: 160, borderRadius: 16, overflow: "hidden" },

  overlayBox: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(244, 244, 244, 0.55)",
    borderRadius: 12,
    padding: 12,
    // đổ bóng nhẹ
    shadowColor: "#f5efefff",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  overlayTitle: { color: "#fd7600ff",fontSize: 16, fontWeight: "900", marginBottom: 6 },
  overlayBody: { color: "#202020ff", lineHeight: 18, textAlign: "justify", fontStyle: "italic"},
});
