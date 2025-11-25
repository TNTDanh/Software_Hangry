import { View, Image, Text, StyleSheet, ImageBackground } from "react-native";
import { BrandColors, FontFamilyBold } from "../constants/theme";
import { useUI } from "../hooks/useUI";

export default function HeaderHero() {
  const { t, lang } = useUI();

  return (
    <View>
      <View style={s.top}>
        <View style={s.brandRow}>
          <Image source={require("../assets/images/logo.png")} style={s.logo} resizeMode="contain" />
          <Text style={s.brand}>DANHPHUOCXFOODFAST</Text>
        </View>
        <Text style={s.brandSub}>{lang === "vi" ? "ẨM THỰC NHANH" : "FAST FOOD EXPERIENCE"}</Text>
      </View>
      <ImageBackground
        source={require("../assets/images/header_img.png")}
        style={s.banner}
        imageStyle={{ borderRadius: 18 }}
        resizeMode="cover"
      >
        <View style={s.overlayBox}>
          <Text style={s.overlayTitle}>{t("heroHeadline")}</Text>
          <Text style={s.overlayBody}>{t("heroBody")}</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const s = StyleSheet.create({
  top: { paddingHorizontal: 16, paddingVertical: 12, alignItems: "center", gap: 4 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 32, height: 32, borderRadius: 8 },
  brand: { color: BrandColors.primaryStrong, fontSize: 18, fontFamily: FontFamilyBold, letterSpacing: 0.8 },
  brandSub: { alignSelf: "center", color: "#9ca3af", fontSize: 12, fontFamily: FontFamilyBold, letterSpacing: 0.6 },
  banner: { alignSelf: "center", width: "100%", height: 180, borderRadius: 18, overflow: "hidden", marginHorizontal: 12 },

  overlayBox: {
    position: "absolute",
    left: 14,
    right: 14,
    top: 14,
    bottom: 14,
    backgroundColor: "rgba(255, 255, 255, 0.86)",
    borderRadius: 14,
    padding: 14,
    shadowColor: "rgba(0,0,0,0.12)",
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  overlayTitle: { color: BrandColors.primaryStrong, fontSize: 17, fontFamily: FontFamilyBold, marginBottom: 6 },
  overlayBody: { color: "#202020", lineHeight: 20, textAlign: "justify" },
});
