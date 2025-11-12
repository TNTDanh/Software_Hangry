// mobile/src/until/localImages.ts
// Map tên file (đến từ DB) -> require local asset
export const FOOD_LOCAL_MAP: Record<string, any> = {
  "1727126978673food_1.png":  require("../../assets/images/1727126978673food_1.png"),
  "1727127509822food_2.png":  require("../../assets/images/1727127509822food_2.png"),
  "1727127544604food_3.png":  require("../../assets/images/1727127544604food_3.png"),
  "1727127590415food_4.png":  require("../../assets/images/1727127590415food_4.png"),
  "1727127618294food_5.png":  require("../../assets/images/1727127618294food_5.png"),
  "1727127642374food_6.png":  require("../../assets/images/1727127642374food_6.png"),
  "1727127661470food_7.png":  require("../../assets/images/1727127661470food_7.png"),
  "1727127695985food_8.png":  require("../../assets/images/1727127695985food_8.png"),
  "1727127730519food_9.png":  require("../../assets/images/1727127730519food_9.png"),
  "1727127750882food_10.png": require("../../assets/images/1727127750882food_10.png"),
  "1727127773554food_11.png": require("../../assets/images/1727127773554food_11.png"),
  "1727127794307food_12.png": require("../../assets/images/1727127794307food_12.png"),
  "1727127837323food_13.png": require("../../assets/images/1727127837323food_13.png"),
  "1727127988392food_14.png": require("../../assets/images/1727127988392food_14.png"),
  "1727128017975food_15.png": require("../../assets/images/1727128017975food_15.png"),
  "1727128045565food_16.png": require("../../assets/images/1727128045565food_16.png"),
  "1727128078923food_17.png": require("../../assets/images/1727128078923food_17.png"),
  "1727128102874food_18.png": require("../../assets/images/1727128102874food_18.png"),
  "1727128122765food_19.png": require("../../assets/images/1727128122765food_19.png"),
  "1727128219303food_20.png": require("../../assets/images/1727128219303food_20.png"),
  "1727128312994food_21.png": require("../../assets/images/1727128312994food_21.png"),
  "1727128347200food_22.png": require("../../assets/images/1727128347200food_22.png"),
  "1727128392133food_23.png": require("../../assets/images/1727128392133food_23.png"),
  "1727128445234food_24.png": require("../../assets/images/1727128445234food_24.png"),
  "1727128584690food_25.png": require("../../assets/images/1727128584690food_25.png"),
  "1727128540374food_26.png": require("../../assets/images/1727128540374food_26.png"),
};

// helper: lấy source cho <Image>
export function getLocalImageSource(fileName?: string | null) {
  if (!fileName) return null;
  return FOOD_LOCAL_MAP[fileName] ?? null;
}
