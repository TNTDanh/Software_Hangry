import React, { useMemo, useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { resolveImageSource } from "../src/until/image";
import { useCartStore } from "../lib/store/cart";
import { useUI } from "../hooks/useUI";
import { BrandColors, Colors, FontFamilyBold } from "../constants/theme";
import { FoodDto } from "../src/api/client";

export default function FoodCardLarge({ item }: { item: FoodDto }) {
  const addItem = useCartStore((s) => s.addItem);
  const [failed, setFailed] = useState(false);
  const { formatMoney, theme, t, lang } = useUI();
  const palette = Colors[theme as keyof typeof Colors];
  const isDark = theme === "dark";

  const imgSrc = resolveImageSource(item.image);

  const name = useMemo(
    () => (lang === "vi" ? item?.name || item?.nameEn : item?.nameEn || item?.name || "Unnamed"),
    [item?.name, item?.nameEn, lang]
  );
  const desc = useMemo(
    () =>
      lang === "vi"
        ? item?.descriptionVi || item?.description || item?.descriptionEn || ""
        : item?.descriptionEn || item?.description || item?.descriptionVi || "",
    [item?.description, item?.descriptionEn, item?.descriptionVi, lang]
  );
  const restaurantName = useMemo(
    () =>
      lang === "vi"
        ? item?.restaurantName || item?.restaurantNameEn || ""
        : item?.restaurantNameEn || item?.restaurantName || "",
    [item?.restaurantName, item?.restaurantNameEn, lang]
  );
  const address = useMemo(
    () => (lang === "vi" ? item?.address || item?.addressEn || "" : item?.addressEn || item?.address || ""),
    [item?.address, item?.addressEn, lang]
  );
  const eta = item?.etaMinutes ? `${item.etaMinutes}’` : undefined;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: isDark ? "#2e3444" : "#e5e7eb",
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: isDark ? "#171c27" : "#fff",
        minHeight: 330,
        shadowColor: "rgba(0,0,0,0.12)",
        shadowOpacity: 0.8,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {imgSrc ? (
        <Image
          source={failed ? require("../assets/images/food_item_2.png") : imgSrc}
          style={{ width: "100%", aspectRatio: 16 / 9 }}
          resizeMode="cover"
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#f3f3f3" }} />
      )}

      <View style={{ padding: 14, gap: 8, minHeight: 160 }}>
        <Text numberOfLines={1} style={{ fontFamily: FontFamilyBold, fontSize: 16, color: palette.text }}>
          {name}
        </Text>
        <Text numberOfLines={2} style={{ color: palette.textSecondary, minHeight: 36 }}>
          {desc}
        </Text>

        <View style={{ gap: 4 }}>
          {!!restaurantName && (
            <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
              {t("restaurant")}: {restaurantName}
            </Text>
          )}
          {!!address && (
            <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
              {t("addressTitle")}: {address}
            </Text>
          )}
          {!!eta && (
            <Text style={{ color: palette.textSecondary, fontSize: 12 }}>
              {t("eta")}: {eta}
            </Text>
          )}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontFamily: FontFamilyBold, color: BrandColors.primary }}>
                {formatMoney(Number(item?.price || 0))}
              </Text>
              {item.ratingAvg ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="star" size={14} color={BrandColors.primary} />
                  <Text style={{ color: BrandColors.primary }}>{item.ratingAvg.toFixed(1)}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <TouchableOpacity
            onPress={() =>
              addItem({
                id: item._id,
                name: item.name || item.nameEn || name,
                nameEn: item.nameEn,
                price: item.price,
                image: item.image,
                qty: 1,
                restaurantId: item.restaurantId as any,
                deliveryModes: (item as any)?.deliveryModes,
              })
            }
            style={{
              paddingVertical: 10,
              paddingHorizontal: 18,
              borderRadius: 999,
              backgroundColor: BrandColors.primaryStrong,
            }}
          >
            <Text style={{ color: "#fff", fontFamily: FontFamilyBold }}>{t("add")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
