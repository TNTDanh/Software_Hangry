import { useState } from "react";
import { Image } from "react-native";
import { getImageUrl } from "../../src/until/image"; // hàm của bạn

function FoodImage({ image }: { image?: string }) {
  const [failed, setFailed] = useState(false);
  const uri = getImageUrl(image); // sẽ trả URL Cloudinary hoặc /images/<file>

  return failed ? (
    <Image
      source={require("../../assets/images/icon.png")} // placeholder local
      style={{ width: "100%", height: 130, borderRadius: 12 }}
      resizeMode="cover"
    />
  ) : (
    <Image
      source={{ uri }}
      style={{ width: "100%", height: 130, borderRadius: 12 }}
      resizeMode="cover"
      onError={() => setFailed(true)}
      // @ts-ignore (RNW)
      referrerPolicy="no-referrer"
    />
  );
}
